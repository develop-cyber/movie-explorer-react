// src/lib/tmdb.js
export async function tmdb(path, params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`/api/tmdb?path=${encodeURIComponent(path)}&${q}`);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}
