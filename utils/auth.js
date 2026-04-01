import crypto from "crypto";

const USERNAME = process.env.VTIGER_USERNAME;
const ACCESS_KEY = process.env.VTIGER_ACCESS_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

export default async function authorizeRequest(URL) {
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
    // Get challenge
    const challengeRes = await fetch(
        `${URL}?operation=getchallenge&username=${USERNAME}`
    );
    const challengeData = await challengeRes.json();
    const token = challengeData.result.token;

    // Hash
    const hash = crypto
        .createHash("md5")
        .update(token + ACCESS_KEY)
        .digest("hex");

    // Login
    const loginRes = await fetch(URL, {
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
    return sessionName
}
