import crypto from "crypto";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";
const USERNAME = process.env.VTIGER_USERNAME;
const ACCESS_KEY = process.env.VTIGER_ACCESS_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.split(',').includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const formData = req.body;
    console.log("Incoming Form Data:", formData);

    // Validate required fields
    if (!formData.lastname) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: lastname"
      });
    }

    // Get challenge
    const challengeRes = await fetch(
      `${VTIGER_URL}?operation=getchallenge&username=${USERNAME}`
    );
    const challengeData = await challengeRes.json();
    const token = challengeData.result.token;

    // Hash
    const hash = crypto
      .createHash("md5")
      .update(token + ACCESS_KEY)
      .digest("hex");

    // Login
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

    if (!loginData.success) {
      throw new Error("Login failed: " + JSON.stringify(loginData));
    }

    const sessionName = loginData.result.sessionName;

    console.log("Session:", sessionName)

    // Create Lead
    const row = req.body.row;

    const createRes = await fetch(VTIGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        operation: "create",
        sessionName,
        elementType: "Leads",
        element: JSON.stringify(row)
      })
    });

    const createData = await createRes.json();

    console.log("VTIGER CREATE RESPONSE:", createData);

    // Handle Failure
    if (!createData.success) {
      console.error("❌ VTIGER FAILED:", createData);

      // 🚨 Prevent silent data loss
      console.error("FAILED SUBMISSION DATA:", formData);

      return res.status(500).json({
        success: false,
        error: createData.error || "Unknown Vtiger error",
        debug: createData
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      message: "Lead created successfully",
      id: createData.result.id
    });

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
