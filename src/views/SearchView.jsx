import { useState, useCallback, useRef } from 'react';
import { Search, X, Navigation } from 'lucide-react';
import StopCard from '../components/StopCard.jsx';
import { searchStops, fetchNearbyStops } from '../api.js';

export default function SearchView({ onOpenStop, onToggleFav, isFav }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setError('');

    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStops(val.trim());
        setResults(data);
      } catch (err) {
        setError('Haku epäonnistui. Tarkista API-avain.');
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleGps = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Selain ei tue paikannusta.');
      return;
    }
    setLocLoading(true);
    setError('');
    setQuery('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchNearbyStops(pos.coords.latitude, pos.coords.longitude);
          setResults(data);
        } catch {
          setError('Läheisten pysäkkien haku epäonnistui.');
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        setError('Sijainnin haku epäonnistui.');
        setLocLoading(false);
      }
    );
  }, []);

  return (
    <div className="view">
      <div className="header">
        <div className="header__title">Haku</div>
      </div>

      <div className="search-wrap">
        <div className="search-bar">
          <Search size={18} className="icon" />
          <input
            value={query}
            onChange={handleChange}
            placeholder="Pysäkin nimi tai tunnus…"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button className="search-bar__clear" onClick={() => { setQuery(''); setResults([]); }}>
              <X size={16} />
            </button>
          )}
          <button
            className="search-bar__clear"
            onClick={handleGps}
            title="Lähimmät pysäkit"
            style={{ marginLeft: 2 }}>
            {locLoading
              ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : <Navigation size={16} />}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

      {!loading && results.length > 0 && (
        <div>
          <div className="section-label">
            {query ? `Tulokset — "${query}"` : 'Lähimmät pysäkit'}
          </div>
          {results.map(stop => (
            <StopCard
              key={stop.gtfsId}
              stop={stop}
              onOpen={onOpenStop}
              onToggleFav={onToggleFav}
              isFav={isFav(stop.gtfsId)}
              showDist={!query}
            />
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state__title">Ei tuloksia</div>
          <div className="empty-state__desc">Kokeile eri hakusanaa tai pysäkin tunnusta.</div>
        </div>
      )}

      {!query && results.length === 0 && !loading && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <Navigation size={40} className="empty-state__icon" />
          <div className="empty-state__title">Etsi pysäkki</div>
          <div className="empty-state__desc">
            Kirjoita pysäkin nimi tai tunnus, tai paina navigaatiokuvaketta nähdäksesi lähimmät pysäkit.
          </div>
        </div>
      )}
    </div>
  );
}
