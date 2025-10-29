import React, { useEffect, useMemo, useRef, useState } from "react";

const TMDB_API_KEY = "264fcd3be965ce2562b7980ae4702deb";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const FALLBACK_POSTER = "";
const PAGE_LIMIT = 500;

function formatDate(s) {
  return s ? new Date(s).toISOString().slice(0, 10) : "Unknown";
}
function formatRating(n) {
  return (n || n === 0) ? Number(n).toFixed(1) : "N/A";
}

export default function App() {
  const [page, setPage] = useState(1);
  const [totalPages, setTP] = useState(1);
  const [mode, setMode] = useState("discover");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [movies, setMovies] = useState([]);
  const [appwPx, setAppwPx] = useState(null);

  const stageRef = useRef(null);
  const splitterRef = useRef(null);
  const draggingRef = useRef(false);
  const debounceRef = useRef(0);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    p.set("api_key", TMDB_API_KEY);
    p.set("language", "en-US");
    p.set("page", String(page));

    if (mode === "discover") {
      p.set("include_adult", "false");
      p.set("include_video", "false");
      if (sortBy) p.set("sort_by", sortBy);
      return `${TMDB_BASE}/discover/movie?${p}`;
    } else {
      p.set("include_adult", "false");
      p.set("query", query);
      return `${TMDB_BASE}/search/movie?${p}`;
    }
  }, [page, sortBy, mode, query]);

  async function fetchNow() {
    const res = await fetch(url);
    const data = await res.json();
    setTP(Math.min(PAGE_LIMIT, data.total_pages || 1));
    setMovies(data.results || []);
  }

  useEffect(() => {
    if (query.trim()) {
      setMode("search");
      setPage(1);
    } else {
      setMode("discover");
      setPage(1);
    }
  }, [query]);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    const delay = mode === "search" ? 350 : 0;
    debounceRef.current = window.setTimeout(fetchNow, delay);
    return () => window.clearTimeout(debounceRef.current);
  }, [url, mode]);

  useEffect(() => {
    const stageEl = stageRef.current;
    const handle = splitterRef.current;
    if (!stageEl || !handle) return;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    function onDown(e) {
      draggingRef.current = true;
      handle.setPointerCapture(e.pointerId);
    }
    function onUp() {
      draggingRef.current = false;
    }
    function onMove(e) {
      if (!draggingRef.current) return;
      const rect = stageEl.getBoundingClientRect();
      let x = e.clientX - rect.left;
      const min = rect.width * 0.5;
      const max = rect.width;
      x = clamp(x, min, max);
      setAppwPx(x);
    }

    handle.addEventListener("pointerdown", onDown);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    handle.addEventListener("pointermove", onMove);

    return () => {
      handle.removeEventListener("pointerdown", onDown);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      handle.removeEventListener("pointermove", onMove);
    };
  }, []);

  function Card({ m }) {
    const src = m.poster_path ? `${IMG_BASE}${m.poster_path}` : FALLBACK_POSTER;
    return (
      <article className="card">
        <div className="poster-wrap">
          <img className="poster" src={src} alt={`${m.title} poster`} loading="lazy" />
        </div>
        <div className="card-body">
          <h3 className="title">{m.title}</h3>
          <p className="meta"><strong>Release Date:</strong> {formatDate(m.release_date)}</p>
          <p className="meta"><strong>Rating:</strong> {formatRating(m.vote_average)}</p>
        </div>
      </article>
    );
  }

  const stageStyle = appwPx == null ? undefined : { "--appw": `${appwPx}px` };

  return (
    <div className="stage" ref={stageRef} style={stageStyle}>
      <div className="app-wrap">
        <header className="site-header">
          <div className="container">
            <h1 className="app-title">Movie Explorer</h1>
            <div className="controls">
              <input
                className="search"
                type="search"
                placeholder="Search for a movie..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="sort"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="">Sort By</option>
                <option value="release_date.asc">Release Date (Asc)</option>
                <option value="release_date.desc">Release Date (Desc)</option>
                <option value="vote_average.asc">Rating (Asc)</option>
                <option value="vote_average.desc">Rating (Desc)</option>
              </select>
            </div>
          </div>
        </header>

        <main className="container">
          <section id="results" className="grid">
            {movies.length === 0 ? (
              <p className="empty">No movies found.</p>
            ) : (
              movies.map((m) => <Card key={m.id} m={m} />)
            )}
          </section>

          <nav className="pagination">
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ◀ Previous
            </button>
            <span className="page-label">Page {page} of {totalPages}</span>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next ▶
            </button>
          </nav>
        </main>

        <footer className="site-footer">
          <div className="container">
            <p>Built for Homework 3 — Movie Explorer</p>
          </div>
        </footer>
      </div>

      <div id="splitter" className="splitter" ref={splitterRef} />
    </div>
  );
}
