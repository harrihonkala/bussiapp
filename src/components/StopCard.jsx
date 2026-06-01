import { Star, Bus, Train, Waves, ChevronRight } from 'lucide-react';
import { getModeColor, getModeLabel } from '../api.js';

function ModeIcon({ mode, size = 18 }) {
  const color = getModeColor(mode);
  if (mode === 'RAIL') return <Train size={size} color={color} />;
  if (mode === 'FERRY') return <Waves size={size} color={color} />;
  return <Bus size={size} color={color} />;
}

export default function StopCard({ stop, onOpen, onToggleFav, isFav, showDist }) {
  const mode = stop.vehicleMode || 'BUS';
  const modeColor = getModeColor(mode);
  const routes = stop.routes?.map(r => r.shortName).slice(0, 5).join(', ');

  function handleFav(e) {
    e.stopPropagation();
    onToggleFav(stop);
  }

  return (
    <div className="stop-card" onClick={() => onOpen(stop)}>
      <div className="stop-icon" style={{ background: modeColor + '22' }}>
        <ModeIcon mode={mode} />
      </div>

      <div className="stop-card__info">
        <div className="stop-card__name">{stop.name}</div>
        <div className="stop-card__meta">
          {stop.code && <span>{stop.code}</span>}
          {stop.code && routes && <span>·</span>}
          {routes && <span>{routes}</span>}
          {showDist && stop.distance != null && (
            <span className="dist-badge">&nbsp;· {stop.distance} m</span>
          )}
        </div>
      </div>

      {onToggleFav && (
        <button className={`stop-card__fav ${isFav ? 'stop-card__fav--active' : ''}`}
          onClick={handleFav} aria-label="Suosikki">
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      )}

      <ChevronRight size={16} color="var(--color-text-3)" />
    </div>
  );
}
