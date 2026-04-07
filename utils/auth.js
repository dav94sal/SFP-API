import crypto from "crypto";

const USERNAME = process.env.VTIGER_USERNAME;
const ACCESS_KEY = process.env.VTIGER_ACCESS_KEY;

export async function authorizeRequest(URL) {

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


export function injectToken() {
    const token = process.env.JOOMLA_API_TOKEN;

    if (!token) {
        throw new Error("Missing JOOMLA_API_TOKEN");
    }

    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
    };
}
