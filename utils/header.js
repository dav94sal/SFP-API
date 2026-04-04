const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "";
const allowedOrigins = ALLOWED_ORIGINS.split(",");

export function setHeader(req, res, method) {
    const origin = req.headers.origin;
    // console.log("origin", origin)

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", `${method}, OPTIONS`);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return false;
    }

    if (req.method !== method) {
        res.status(405).json({ error: "Method not allowed" });
        return false;
    }

    return true;
}
