import { setHeader } from "../utils/header.js";
import { injectToken } from "../utils/auth.js";
import { normalizeArticle } from "../utils/normalize.js";

const baseUrl = 'https://sitefactorproductions.com/cms';

export default async function getSections(req, res) {

  try {
    if (!setHeader(req, res, "GET")) return;

    const headers = injectToken();

    const response = await fetch(
      `${baseUrl}/api/index.php/v1/content/articles`,
      { headers }
    );

    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("❌ Non-JSON response:", text);
      throw new Error("Invalid JSON from Joomla API");
    }

    const sections = json.data
    .map(a => normalizeArticle(a, baseUrl))
    .filter(a => a.type && a.page);

    res.status(200).json({
      sections: sections
      .filter(s => s.page === 'home' && s.published !== false)
      .sort((a, b) => a.order - b.order)
    });
    // console.log("<--------SECTIONS---------->", sections)

    return res

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
