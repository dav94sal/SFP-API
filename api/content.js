import { setHeader } from "../utils/header.js";
import { getAllContent } from "../utils/getAllContent.js";
import { normalizeArticle } from "../utils/normalize.js";

let cache = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export default async function handler(req, res) {
    try {
        if (!setHeader(req, res, "GET")) return;

        const now = Date.now();

        if (cache && now - lastFetch < CACHE_TTL) {
            return res.status(200).json(cache);
        }

        const raw = await getAllContent();

        const normalized = raw.map(normalizeArticle);

        // 🏠 SECTIONS (category 11)
        const sections = normalized
        .filter(a => a.type && a.page)
        .sort((a, b) => a.order - b.order);

        // 🎬 REELS (category 12)
        const reels = normalized
            .filter(a => (a.reelVideo || a.video))
            .map(r => ({
                id: r.id,
                title: r.title,
                video: r.reelVideo || r.video,
                thumbnail: r.thumbnail,
                category: r.categoryTag,
                featured: r.featured
            }));

        // 📩 FORMS (future-proof)
        const forms = normalized
            .filter(a => a.categoryId === "13") // if you add forms later
            .map(f => ({
                id: f.id,
                name: f.title,
                fields: f.content // or JSON field later
            }));

        const data = { sections, reels, forms };

        cache = data;
        lastFetch = now;

        res.status(200).json(data);

    } catch (error) {
        console.error("🔥 CONTENT API ERROR:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
