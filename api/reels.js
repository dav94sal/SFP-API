export default async function handler(req, res) {
  const baseUrl = 'https://sitefactorproductions.com/crm';

  const response = await fetch(
    `${baseUrl}/api/index.php/v1/content/articles`
  );

  const json = await response.json();

  const reels = json.data.map(a => {
    const attr = a.attributes;
    const f = attr.field_values || {};

    return {
      id: a.id,
      title: attr.title,
      video: f.video_url || (
        f.video_file ? `${baseUrl}${f.video_file}` : null
      ),
      thumbnail: f.thumbnail ? `${baseUrl}${f.thumbnail}` : null,
      category: f.category_tag,
      featured: f.featured === '1'
    };
  });

  res.status(200).json({ reels });
}
