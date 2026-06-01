import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Star, RefreshCw, Calendar, Bus } from 'lucide-react';
import DepartureRow from '../components/DepartureRow.jsx';
import {
  fetchDepartures, fetchScheduleForDate,
  getModeColor, getModeLabel, getModeColor as c,
  dateToGTFS, secondsToHHMM
} from '../api.js';

const REFRESH_INTERVAL = 30_000; // 30 s

// Päivämäärä-chipit: tänään + 6 seuraavaa päivää
function buildDays() {
  const days = [];
  const labels = ['Tänään', 'Huomenna'];
  const weekdays = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      label: labels[i] || `${weekdays[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`,
      gtfs: dateToGTFS(d),
    });
  }
  return days;
}

// Ryhmittele aikataulu linjoittain
function groupSchedule(data) {
  const groups = {};
  for (const entry of data) {
    const line = entry.pattern?.route?.shortName || '?';
    const mode = entry.pattern?.route?.mode || 'BUS';
    const color = entry.pattern?.route?.color ? `#${entry.pattern.route.color}` : getModeColor(mode);
    const dest = entry.pattern?.headsign || '';
    const key = `${line}__${dest}`;
    if (!groups[key]) groups[key] = { line, mode, color, dest, times: [] };
    for (const st of entry.stoptimes) {
      groups[key].times.push(secondsToHHMM(st.scheduledDeparture));
    }
  }
  return Object.values(groups).sort((a, b) => a.line.localeCompare(b.line, 'fi', { numeric: true }));
}

export default function StopView({ stop, onBack, isFav, onToggleFav }) {
  const [departures, setDepartures] = useState(null);
  const [stopInfo, setStopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Aikataulu
  const days = buildDays();
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [schedule, setSchedule] = useState(null);
  const [schedLoading, setSchedLoading] = useState(false);

  const timerRef = useRef(null);

  // --- Reaaliaikaiset lähdöt ---
  const loadDepartures = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError('');
    try {
      const data = await fetchDepartures(stop.gtfsId, 20);
      if (data) {
        setStopInfo(data);
        setDepartures(data.stoptimesWithoutPatterns || []);
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError('Tietojen lataus epäonnistui. Tarkista API-avain.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stop.gtfsId]);

  useEffect(() => {
    setLoading(true);
    loadDepartures();
    timerRef.current = setInterval(() => loadDepartures(true), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [loadDepartures]);

  // --- Päivittäinen aikataulu ---
  useEffect(() => {
    setSchedLoading(true);
    setSchedule(null);
    fetchScheduleForDate(stop.gtfsId, selectedDay.gtfs)
      .then(data => setSchedule(groupSchedule(data)))
      .catch(() => setSchedule([]))
      .finally(() => setSchedLoading(false));
  }, [stop.gtfsId, selectedDay.gtfs]);

  const mode = stopInfo?.vehicleMode || stop.vehicleMode || 'BUS';
  const modeColor = getModeColor(mode);
  const name = stopInfo?.name || stop.name;
  const code = stopInfo?.code || stop.code;

  const activeDeps = departures?.filter(d => {
    const mins = Math.round(
      (d.serviceDay + (d.realtimeDeparture || d.scheduledDeparture) - Date.now() / 1000) / 60
    );
    return mins > -2;
  }) || [];

  return (
    <div className="view">
      {/* Header */}
      <div className="header">
        <button className="header__back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="header__title">{name}</div>
        <button
          className={`header__action ${isFav ? 'header__action--active' : ''}`}
          onClick={() => onToggleFav(stop)}
          aria-label="Suosikki">
          <Star size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Hero */}
      <div className="stop-hero">
        <div className="stop-hero__name">{name}</div>
        <div className="stop-hero__meta">
          {code && (
            <span className="mode-badge"
              style={{ background: modeColor + '22', color: modeColor }}>
              {code}
            </span>
          )}
          <span className="mode-badge"
            style={{ background: modeColor + '22', color: modeColor }}>
            {getModeLabel(mode)}
          </span>
          <div className="live-indicator">
            <div className="live-dot" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* ---- REAALIAIKAINEN TILANNE ---- */}
      <div className="update-bar">
        <span className="update-bar__label">
          {lastUpdated
            ? `Päivitetty ${lastUpdated.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'Ladataan…'}
        </span>
        <button
          className={`update-bar__refresh ${refreshing ? 'spinning' : ''}`}
          onClick={() => loadDepartures(true)}>
          <RefreshCw size={13} />
          <span>Päivitä</span>
        </button>
      </div>

      <div className="section-label" style={{ paddingTop: 0 }}>Seuraavat lähdöt</div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : activeDeps.length === 0 ? (
        <div className="empty-state">
          <Bus size={36} className="empty-state__icon" />
          <div className="empty-state__title">Ei tulevia lähtöjä</div>
          <div className="empty-state__desc">Seuraavat vuorot eivät ole enää saatavilla.</div>
        </div>
      ) : (
        <div className="departures-list">
          {activeDeps.map((dep, i) => (
            <DepartureRow key={i} dep={dep} />
          ))}
        </div>
      )}

      {/* ---- AIKATAULU ---- */}
      <div className="section-label" style={{ marginTop: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={13} /> Päivittäinen aikataulu
        </span>
      </div>

      {/* Päivä-valinta */}
      <div className="date-bar">
        {days.map(d => (
          <button
            key={d.gtfs}
            className={`date-chip ${selectedDay.gtfs === d.gtfs ? 'date-chip--active' : ''}`}
            onClick={() => setSelectedDay(d)}>
            {d.label}
          </button>
        ))}
      </div>

      {schedLoading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : schedule?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Ei vuoroja</div>
          <div className="empty-state__desc">Tälle päivälle ei löydy aikatauluja.</div>
        </div>
      ) : (
        schedule?.map((group) => (
          <div className="schedule-group" key={`${group.line}__${group.dest}`}>
            <div className="schedule-group__header">
              <span className="line-badge" style={{
                background: group.color, fontSize: 'var(--text-xs)',
                height: 28, minWidth: 44, borderRadius: 'var(--radius-sm)'
              }}>
                {group.line}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                {group.dest}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 var(--space-5) var(--space-3)' }}>
              {group.times.map((t, i) => (
                <span key={i} style={{
                  fontsize: 'var(--text-sm)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-text-2)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
