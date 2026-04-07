import sendEmail from "../utils/handleEmail.js";
import { authorizeRequest } from "../utils/auth.js";
import { setHeader } from "../utils/header.js";

const VTIGER_URL = "https://sitefactorproductions.com/vtiger/webservice.php";

export default async function handler(req, res) {

  try {
    if (!setHeader(req, res, "POST")) return;
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

    // console.log("📧 Sending emails...");

    try {
      await sendEmail({
        type: "customer_confirmation",
        to: formData.email,
        data: formData
      });

      await sendEmail({
        type: "internal_notification",
        to: process.env.SENDER_EMAIL,
        data: formData
      });
    } catch (e) {
      console.error("Email failed:", e);
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
