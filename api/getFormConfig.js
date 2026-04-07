import { setHeader } from '../utils/header.js';

const baseUrl = 'https://sitefactorproductions.com/cms';

export default async function handler(req, res) {
    try {
        if (!setHeader(req, res, "GET")) return;

        const response = await fetch(`${baseUrl}/api/getFormConfig.php`);
        const data = await response.json();
        // console.log("DATA: ", data, "\n")

        return res.status(200).json(data);
    } catch (err) {
        console.warn("SERVER ERROR: ", err, "\n")
        res.status(500).json({ error: err.message });
    }
}
