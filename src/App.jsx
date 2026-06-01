import { useState } from 'react';
import './theme.css';
import BottomNav from './components/BottomNav.jsx';
import HomeView from './views/HomeView.jsx';
import SearchView from './views/SearchView.jsx';
import StopView from './views/StopView.jsx';
import { useFavorites } from './hooks/useFavorites.js';

export default function App() {
  const [tab, setTab] = useState('home');
  const [openStop, setOpenStop] = useState(null);
  const { favorites, toggle, isFavorite } = useFavorites();

  function handleOpenStop(stop) {
    setOpenStop(stop);
  }

  function handleBack() {
    setOpenStop(null);
  }

  return (
    <div className="app">
      {openStop ? (
        <StopView
          stop={openStop}
          onBack={handleBack}
          isFav={isFavorite(openStop.gtfsId)}
          onToggleFav={toggle}
        />
      ) : tab === 'home' ? (
        <HomeView
          favorites={favorites}
          onOpenStop={handleOpenStop}
          onToggleFav={toggle}
          isFav={isFavorite}
        />
      ) : (
        <SearchView
          onOpenStop={handleOpenStop}
          onToggleFav={toggle}
          isFav={isFavorite}
        />
      )}

      {!openStop && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}
