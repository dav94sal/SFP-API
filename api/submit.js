import authorizeRequest from "../utils/auth.js";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  console.log("origin", origin)

  if (ALLOWED_ORIGINS.split(',').includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

    if (!formData.assigned_user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: assigned_user_id"
      });
    }

    const sessionName = await authorizeRequest(VTIGER_URL)
    // console.log("Session Name:", sessionName);

    // Create Lead
    const createRes = await fetch(VTIGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        operation: "create",
        sessionName,
        elementType: "Leads",
        element: JSON.stringify(formData)
      })
    });


    const raw = await createRes.text();

    // console.log("VTIGER RAW RESPONSE:", raw);

    let createData;
    try {
      createData = JSON.parse(raw);
    } catch (err) {
      throw new Error("Invalid JSON from Vtiger: " + raw);
    }

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
