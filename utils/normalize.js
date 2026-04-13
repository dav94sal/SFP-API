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
  const categoryId = article.relationships?.category?.data?.id;
  // console.log(categoryId)

  return {
    id: article.id,
    title: attr.title || "",
    sectionTitle: attr["section-title"] || "",

    // sections
    order: Number(attr.order) || 0,
    content: attr.content || "",

    image: parseMedia(attr.image),
    landingVideo: attr["landing-video-url"] || parseMedia(attr["landing-video"]),

    cta: {
      title: attr["cta-title"] || null,
      content: attr["cta-content"] || null,
      buttText: attr["cta-butt-l-text"] || null,
      buttLink: attr["cta-butt-l-link"] || null
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
