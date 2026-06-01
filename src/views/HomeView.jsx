import { MapPin } from 'lucide-react';
import StopCard from '../components/StopCard.jsx';

export default function HomeView({ favorites, onOpenStop, onToggleFav, isFav }) {
  return (
    <div className="view">
      <div className="header">
        <div className="header__title">Omat pysäkit</div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <MapPin size={48} className="empty-state__icon" />
          <div className="empty-state__title">Ei suosikkipysäkkejä</div>
          <div className="empty-state__desc">
            Hae pysäkkejä hakuvälilehdeltä ja lisää ne tähän tähden avulla.
          </div>
        </div>
      ) : (
        <div>
          <div className="section-label">Tallennetut pysäkit</div>
          {favorites.map(stop => (
            <StopCard
              key={stop.gtfsId}
              stop={stop}
              onOpen={onOpenStop}
              onToggleFav={onToggleFav}
              isFav={isFav(stop.gtfsId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
