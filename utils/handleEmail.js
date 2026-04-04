import templates from "./emailTemplates.js";

const tenantId = process.env.DIRECTORY_ID;
const clientId = process.env.APP_ID;
const clientSecret = process.env.CLIENT_SECRET;
const senderEmail = process.env.SENDER_EMAIL;

async function getAccessToken() {
  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const data = await res.json();
    return data.access_token;

  } catch (error) {
    console.log(error)
  }
}

export default async function sendEmail({ type, to, data }) {
  const template = templates[type];

  if (!template) {
    throw new Error(`Email template "${type}" not found`);
  }

  const { subject, body } = template(data);
  const token = await getAccessToken();

  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: body,
          },
          toRecipients: [
            {
              emailAddress: { address: to },
            },
          ],
        },
      }),
    });

    const text = await response.text();

    console.log("📨 Graph response status:", response.status);
    console.log("📨 Graph response body:", text);

  } catch (error) {
    console.log(error)
  }

}

// sendEmail()
