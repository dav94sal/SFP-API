import authorizeRequest from "../utils/vAuth.js";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

export default async function getFields(req, res) {
    const origin = req.headers.origin;

    if (ALLOWED_ORIGINS.split(',').includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // console.log("START getFields");

        // ✅ AUTH REQUIRED
        const sessionName = await authorizeRequest(VTIGER_URL);
        // console.log("SESSION:", sessionName);

        const response = await fetch(
            `${VTIGER_URL}?operation=describe&sessionName=${sessionName}&elementType=Leads`
        );

        const raw = await response.text();
        // console.log("RAW RESPONSE:", raw);

        let data;
        try {
            data = JSON.parse(raw);
        } catch (err) {
            throw new Error("Invalid JSON from Vtiger: " + raw);
        }

        return res.status(200).json(data);

    } catch (err) {
        console.error("ERROR:", err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}
