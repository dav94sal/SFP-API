import authorizeRequest from "../utils/vAuth.js";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";

let cache = null;
let lastFetch = 0;
const TTL = 1000 * 60 * 10;

export default async function handler(req, res) {
  if (cache && Date.now() - lastFetch < TTL) {
    return res.json(cache);
  }

  const sessionName = await authorizeRequest(VTIGER_URL);

  const response = await fetch(
    `${VTIGER_URL}?operation=describe&sessionName=${sessionName}&elementType=Leads`
  );

  const data = await response.json();

  // 🔧 normalize ONLY what you need
  const fields = data.result.fields
    .filter(f => f.editable)
    .map(f => ({
      name: f.name,
      label: f.label,
      type: f.type.name,
      required: f.mandatory,
      options: f.type.picklistValues || []
    }));

  const result = { fields };

  cache = result;
  lastFetch = Date.now();

  res.json(result);
}
