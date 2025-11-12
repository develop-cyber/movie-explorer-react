
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const token = process.env.TMDB_READ_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Missing TMDB_READ_TOKEN env var" });
    }

    // Pull `path` from the query and forward the rest as query params
    // Example client call: /api/tmdb?path=discover/movie&sort_by=popularity.desc&page=1
    const { path = "discover/movie", ...rest } = req.query;

    // Build a clean query string (supports arrays & plain values)
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(rest)) {
      if (Array.isArray(v)) v.forEach((x) => qs.append(k, String(x)));
      else if (v != null) qs.append(k, String(v));
    }

    const url = `https://api.themoviedb.org/3/${encodePath(path)}${
      qs.toString() ? `?${qs.toString()}` : ""
    }`;

    const resp = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Pass through TMDB status codes (useful for debugging)
    const data = await resp.json().catch(() => ({}));
    return res.status(resp.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}

// Ensure path pieces like "movie/123" remain safe
function encodePath(p) {
  return String(p)
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}
