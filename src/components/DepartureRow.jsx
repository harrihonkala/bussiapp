import { getModeColor, secondsToHHMM, getMinsUntil } from '../api.js';

function DelayTag({ delay, hasRealtime }) {
  if (!hasRealtime) {
    return (
      <span className="delay-tag"
        style={{ color: 'var(--color-no-rt)', background: 'var(--color-surface-2)' }}>
        aikataulu
      </span>
    );
  }
  if (delay <= 0) {
    return (
      <span className="delay-tag"
        style={{ color: 'var(--color-on-time)', background: 'rgba(34,197,94,0.12)' }}>
        ajallaan
      </span>
    );
  }
  const big = delay > 3;
  return (
    <span className="delay-tag"
      style={{
        color: big ? 'var(--color-delay-lg)' : 'var(--color-delay-sm)',
        background: big ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
      }}>
      +{delay} min
    </span>
  );
}

export default function DepartureRow({ dep }) {
  const route = dep.trip?.route;
  const mode = route?.mode || 'BUS';
  const color = route?.color ? `#${route.color}` : getModeColor(mode);
  const line = route?.shortName || '?';

  const delay = Math.round((dep.departureDelay || 0) / 60);
  const mins = getMinsUntil(dep.serviceDay, dep.realtimeDeparture || dep.scheduledDeparture);
  const schedTime = secondsToHHMM(dep.scheduledDeparture);
  const rtTime = dep.realtime
    ? secondsToHHMM(dep.realtimeDeparture)
    : null;

  const minsColor =
    !dep.realtime ? 'var(--color-text-2)'
    : delay > 3  ? 'var(--color-delay-lg)'
    : delay > 0  ? 'var(--color-delay-sm)'
    : 'var(--color-on-time)';

  if (mins < -1) return null; // jo lähtenyt

  return (
    <div className="departure-row">
      <div className="line-badge" style={{ background: color }}>{line}</div>

      <div className="departure-row__info">
        <div className="departure-row__dest">{dep.headsign}</div>
        <div className="departure-row__time">
          <span className="departure-row__sched">
            {rtTime && rtTime !== schedTime
              ? <><s style={{ opacity: 0.5 }}>{schedTime}</s> {rtTime}</>
              : schedTime}
          </span>
          <DelayTag delay={delay} hasRealtime={dep.realtime} />
        </div>
      </div>

      <div className="departure-row__mins">
        <div className="mins-value" style={{ color: minsColor }}>
          {mins <= 0 ? '~0' : mins}
        </div>
        <div className="mins-label">min</div>
      </div>
    </div>
  );
}
