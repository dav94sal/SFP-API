import { injectToken } from "./auth.js";

const baseUrl = 'https://sitefactorproductions.com/cms';

export async function getAllContent() {
  const res = await fetch(
    `${baseUrl}/api/index.php/v1/content/articles`,
    { headers: injectToken() }
  );

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error("❌ Joomla raw response:", text);
    throw new Error("Invalid Joomla API response");
  }

  return json.data || [];
}
