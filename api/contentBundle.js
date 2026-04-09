import { authorizeRequest, injectToken } from "../utils/auth.js";
import { setHeader } from "../utils/header.js";
// import { getAllContent } from "../utils/getAllContent.js";
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
    console.log("New fetch at: ", now)

    if (cache && now - lastFetch < TTL) {
        return res.status(200).json(cache);
    }

    try {
        if (!setHeader(req, res, "GET")) return;

        // 🔹 Fetch everything in parallel
        // const raw = await getAllContent();

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

        const content = { sections, reels };

        // console.log("CONTENT: ", content)
        // cache = content;
        // lastFetch = now;

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

        // 🔹 Extract form field names
        // const formFieldNames = extractFieldNames(formConfig);

        // 🔹 Build leadColumns (validated)
        const leadColumns = fields.map(f => f.name);
        // console.log("<-----LEAD COLUMNS: ", leadColumns)

        formConfig.leadColumns = leadColumns;
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
        console.warn(err)
        res.status(500).json({ error: err.message });
    }
}

// helper
// function extractFieldNames(config) {
//     const names = [];

//     config.sections?.forEach(section => {
//         section.fields?.forEach(f => names.push(f.name));

//         section.groups?.forEach(group => {
//             group.fields?.forEach(f => names.push(f.name));
//         });
//     });

//     return names;
// }
