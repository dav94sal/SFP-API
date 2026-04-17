import { authorizeRequest, injectToken } from "../utils/auth.js";
import { setHeader } from "../utils/header.js";
import { normalizeArticle } from "../utils/normalize.js";

const baseUrl = 'https://sitefactorproductions.com';
const VTIGER_URL = `${baseUrl}/vtiger/webservice.php`;
const JOOMLA_FORM_URL = `${baseUrl}/cms/api/getFormConfig.php`;
const JOOMLA_CONTENT_URL = `${baseUrl}/cms/api/index.php/v1/content/articles`

let cache = null;
let lastFetch = 0;
const TTL = 1000 * 60 * 10; // 10 minutes

export default async function handler(req, res) {
    const now = Date.now();
    const nowString = new Date(now).toLocaleTimeString()
    // console.log("New fetch at: ", nowString, '\n')

    if (cache && now - lastFetch < TTL) {
        return res.status(200).json(cache);
    }

    try {
        if (!setHeader(req, res, "GET")) return;

        // 🔹 Fetch everything in parallel
        const [formConfigRes, rawContentRes] = await Promise.all([
            fetch(JOOMLA_FORM_URL),
            fetch(JOOMLA_CONTENT_URL, { headers: injectToken() })
        ]);

        const formConfig = await formConfigRes.json();
        const fetchedContent = await rawContentRes.json();

        // console.log("<-----FORM CONFIG", formConfig, "\n")
        // console.log("<-----CONTENT", fetchedContent, "\n")

        const normalized = fetchedContent.data.map(normalizeArticle);
        // console.log("<-----NORMALIZED", normalized, "\n")

        // 🏠 SECTIONS (category 11)
        const sections = normalized
            .filter(a => a.sectionTitle && a.published)
            .sort((a, b) => a.order - b.order)
            .map(r => ({
                id: r.id,
                title: r.sectionTitle,
                order: r.order,
                content: r.content,
                image: r.image,
                featured: r.featured,
                published: r.published,
                categoryId: r.categoryId,
            }));

        // 🎬 REELS (category 12)
        const reels = normalized
            .filter(a => (a.reelVideo || a.video))
            .map(r => ({
                id: r.id,
                title: r.title,
                video: r.reelVideo,
                thumbnail: r.thumbnail,
                category: r.categoryTag,
                featured: r.featured,
                published: r.published,
                categoryId: r.categoryId,
            }));

        const categorySet = new Set();
        reels.forEach(r => categorySet.add(r.category));
        const categories = Array.from(categorySet)

        const cta = normalized
            .filter(a => a.title === 'Call To Action')
            .map(r => ({
                id: r.id,
                title: r.cta.title,
                content: r.cta.content,
                buttText: r.cta.buttText,
                buttLink: r.cta.buttLink,
                featured: r.featured,
                published: r.published,
                categoryId: r.categoryId,
            }));

        const content = { sections, cta, reels };

        // console.log("CONTENT: ", content)

        // 🔹 Fetch vtiger schema
        const sessionName = await authorizeRequest(VTIGER_URL);

        const vtigerRes = await fetch(
            `${VTIGER_URL}?operation=describe&sessionName=${sessionName}&elementType=Leads`
        );

        const vtigerData = await vtigerRes.json();
        // console.log("VTIGER DATA: ", vtigerData)

        // 🔹 Build lookup
        // 🔧 normalize ONLY what you need
        const fields = vtigerData.result.fields
            .filter(f => f.editable)
            .map(f => ({
                name: f.name,
                label: f.label,
                type: f.type.name,
                required: f.mandatory,
                options: f.type.picklistValues || []
            }));
        // console.log("FIELDS: ", fields)

        // 🔹 Build leadColumns (validated)
        const leadColumns = fields.map(f => f.name);
        // console.log("<-----LEAD COLUMNS: ", leadColumns)

        formConfig.leadColumns = leadColumns;
        formConfig.categories = categories;
        // console.log("<-----FORM CONFIG: ", formConfig)

        // 🔹 Final bundle
        const bundle = {
            ...content,
            formConfig
        };

        // console.log("FINAL BUNDLE:", bundle, "\n")

        cache = bundle;
        lastFetch = now;

        res.json(bundle);

    } catch (err) {
        console.error("🔥 SERVER ERROR:", err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}
