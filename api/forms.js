export default async function handler(req, res) {
  const baseUrl = 'https://yourdomain.com';

  const response = await fetch(
    `${baseUrl}/api/index.php/v1/content/articles`
  );

  const json = await response.json();

  const forms = json.data.map(a => {
    const attr = a.attributes;
    const f = attr.field_values || {};

    let parsedFields = [];

    try {
      parsedFields = JSON.parse(f.form_fields || '[]');
    } catch (e) {}

    return {
      id: a.id,
      name: f.form_name,
      endpoint: f.form_endpoint,
      fields: parsedFields
    };
  });

  res.status(200).json({ forms });
}
