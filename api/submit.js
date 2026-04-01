import authorizeRequest from "../utils/auth";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";

export default async function handler(req, res) {
  try {
    const formData = req.body;
    // console.log("Incoming Form Data:", formData);

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

    const sessionName = authorizeRequest(VTIGER_URL)

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
