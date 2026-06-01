import { MapPin, Search } from 'lucide-react';

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${tab === 'home' ? 'nav-item--active' : ''}`}
        onClick={() => setTab('home')}>
        <MapPin size={22} />
        <span>Omat pysäkit</span>
      </button>
      <button className={`nav-item ${tab === 'search' ? 'nav-item--active' : ''}`}
        onClick={() => setTab('search')}>
        <Search size={22} />
        <span>Haku</span>
      </button>
    </nav>
  );
}
