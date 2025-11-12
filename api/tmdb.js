// /api/tmdb.js — Vercel serverless proxy for TMDB
export default async function handler(req, res) {
  try {
    // Example: /api/tmdb?path=discover/movie&sort_by=popularity.desc&page=1
    const { path = "discover/movie", ...rest } = req.query;
    const qs = new URLSearchParams(rest).toString();
    const url = `https://api.themoviedb.org/3/${path}?${qs}`;

    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`
      }
    });

    if (!r.ok) return res.status(r.status).json({ error: `TMDB ${r.status}` });
    res.status(200).json(await r.json());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
