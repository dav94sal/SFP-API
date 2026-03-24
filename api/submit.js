import crypto from "crypto";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";
const USERNAME = process.env.VTIGER_USERNAME;
const ACCESS_KEY = process.env.VTIGER_ACCESS_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "sitefactorproductions.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Step 1: Get challenge
    const challengeRes = await fetch(
      `${VTIGER_URL}?operation=getchallenge&username=${USERNAME}`
    );
    const challengeData = await challengeRes.json();
    const token = challengeData.result.token;

    // Step 2: Generate MD5
    const hash = crypto
      .createHash("md5")
      .update(token + ACCESS_KEY)
      .digest("hex");

    // Step 3: Login
    const loginRes = await fetch(VTIGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        operation: "login",
        username: USERNAME,
        accessKey: hash
      })
    });

    const loginData = await loginRes.json();
    const sessionName = loginData.result.sessionName;

    // Step 4: Describe Leads
    const describeRes = await fetch(
      `${VTIGER_URL}?operation=describe&sessionName=${sessionName}&elementType=Leads`
    );

    const describeData = await describeRes.json();

    res.status(200).json(describeData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
