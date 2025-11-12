// /api/tmdb.js  — Vercel (Node) serverless proxy for TMDB v3

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TMDB_READ_TOKEN is not configured" });
  }

  try {
    // Accept ?path=discover/movie  (no leading slash needed)
    let { path = "discover/movie", ...rest } = req.query;
    path = String(path).replace(/^\/+/, "");
    if (path.includes("..")) {
      return res.status(400).json({ error: "Invalid path" });
    }

    // Build query string using only defined, non-empty values
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== null && `${v}` !== "") qs.append(k, v);
    }

    const url = `https://api.themoviedb.org/3/${path}${qs.toString() ? `?${qs}` : ""}`;

    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await r.json().catch(() => ({}));

    // Small CDN cache to ease TMDB rate limits
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

    if (!r.ok) {
      return res.status(r.status).json(
        data && typeof data === "object" ? data : { error: `TMDB ${r.status}` }
      );
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
