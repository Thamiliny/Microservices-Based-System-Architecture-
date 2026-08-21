import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Alert, EmptyState, Spinner, money } from '../components/Common.jsx';

export default function RestaurantsPage() {
  const [data, setData] = useState(null);
  const [cuisines, setCuisines] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cuisines().then(setCuisines).catch(() => setCuisines([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      api.listRestaurants({ search, cuisine, openOnly: openOnly ? 'true' : undefined })
        .then((result) => { if (!cancelled) { setData(result); setError(''); } })
        .catch((err) => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250); // debounce the search box

    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, cuisine, openOnly]);

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="container">
      <section className="hero">
        <h1>Order from your favourite restaurants</h1>
        <p>
          Browse {data ? data.total : '…'} partner restaurants, build a cart and track your
          delivery from the kitchen to your door.
        </p>
      </section>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search restaurants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search restaurants"
          data-testid="search-input"
        />
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} aria-label="Cuisine">
          <option value="">All cuisines</option>
          {cuisines.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
          Open now only
        </label>
      </div>

      <Alert type="error">{error}</Alert>

      {loading && !data ? <Spinner label="Loading restaurants…" /> : (
        items.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No restaurants match your filters"
            message="Try a different search term or clear the cuisine filter."
          />
        ) : (
          <div className="grid" data-testid="restaurant-grid">
            {items.map((r) => (
              <Link to={`/restaurants/${r.id}`} key={r.id} className="card restaurant-card">
                <div className="card-banner" data-cuisine={r.cuisine}>
                  <span className="cuisine-tag">{r.cuisine}</span>
                  <span className={`open-tag ${r.is_open ? 'open' : 'closed'}`}>
                    {r.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-title-row">
                    <h3>{r.name}</h3>
                    <span className="rating">★ {Number(r.rating).toFixed(1)}</span>
                  </div>
                  <p className="muted">{r.description}</p>
                  <div className="card-meta">
                    <span>📍 {r.address}</span>
                    <span>🛵 {money(r.delivery_fee)} delivery</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
