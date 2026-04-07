import { authorizeRequest } from "../../utils/auth.js";
import { setHeader } from "../../utils/header.js";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";

export default async function getFields(req, res) {

    try {
        if (!setHeader(req, res, "GET")) return;

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
