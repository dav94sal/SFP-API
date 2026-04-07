const baseUrl = 'https://sitefactorproductions.com/cms';

// extract Joomla weird field format
function getValue(field) {
  if (!field || typeof field !== "object") return null;
  return Object.keys(field)[0] || null;
}

// parse Joomla media JSON
function parseMedia(field) {
  try {
    const parsed = JSON.parse(field || "{}");
    if (!parsed.imagefile) return null;

    const clean = parsed.imagefile.split("#")[0];
    return `${baseUrl}/${clean}`;
  } catch {
    return null;
  }
}

export function normalizeArticle(article) {
  const attr = article.attributes || {};
  const categoryId = attr.relationships?.category?.data?.id;

  return {
    id: article.id,
    title: attr.title || "",

    // sections
    type: getValue(attr["section-type"]),
    page: getValue(attr["page"]),
    order: Number(attr.order) || 0,
    content: attr.content || "",

    image: parseMedia(attr.image),
    video: attr["video-url"] || parseMedia(attr["video-file"]),

    cta: {
      text: attr["cta-text"] || null,
      link: attr["cta-link"] || null
    },

    // reels
    reelVideo: attr["reel-url"] || parseMedia(attr["reel-file"]),
    thumbnail: parseMedia(attr.thumbnail),
    categoryTag: getValue(attr["category-tag"]),
    featured: getValue(attr.featured) === "1",

    // shared
    published: attr.state === 1,
    categoryId
  };
}
