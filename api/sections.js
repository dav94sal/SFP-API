import authorizeRequest from "../utils/vAuth.js";
import { setHeader } from "../utils/header.js";

const baseUrl = 'https://sitefactorproductions.com/crm';

export default async function getSections(req, res) {
  setHeader(req, res, "GET")
  try {
    // const sessionName = await authorizeRequest(VTIGER_URL)

    const response = await fetch(
      `${baseUrl}/api/index.php/v1/content/articles`
    );

    const json = await response.json();

    const sections = json.data
      .map(a => normalizeArticle(a, baseUrl))
      .filter(a => a.type && a.page);

    res.status(200).json({
      sections: sections
        .filter(s => s.page === 'home' && s.published !== false)
        .sort((a, b) => a.order - b.order)
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
