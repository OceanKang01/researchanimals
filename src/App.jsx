import React, { useState, useEffect } from 'react';
import mockDatabase from './mockDatabase.json';
import './index.css';
import Dashboard from './components/Dashboard';
import WatchList from './components/WatchList';
import PastNews from './components/PastNews';
import EarningsCalendar from './components/EarningsCalendar';
import NewsSearch from './components/NewsSearch';

// Initial default watch list
const DEFAULT_WATCH_LIST = [
  { ticker: 'LITE', name: 'Lumentum' },
  { ticker: 'INTC', name: 'Intel' },
  { ticker: 'AMD', name: 'AMD' },
  { ticker: 'MU', name: 'Micron' }
];

function App() {
  // Use today's data from mockDatabase for the main dashboard
  const dateKeys = Object.keys(mockDatabase).filter(k => k !== 'earningsCalendar');
  const todayDate = dateKeys.sort((a, b) => new Date(b) - new Date(a))[0];
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Two-level Tab State
  const [primaryTab, setPrimaryTab] = useState('news'); // 'news' | 'other'
  const [secondaryTab, setSecondaryTab] = useState('dashboard'); // 'dashboard' | 'pastnews' | 'watchlist'
  
  // WatchList State with localStorage
  const [watchList, setWatchList] = useState(() => {
    const saved = localStorage.getItem('usStockWatchList');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse watch list from local storage", e);
      }
    }
    return DEFAULT_WATCH_LIST;
  });

  // Save to localStorage whenever watchList changes
  useEffect(() => {
    localStorage.setItem('usStockWatchList', JSON.stringify(watchList));
  }, [watchList]);

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setNewsData(mockDatabase[todayDate]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h2>뉴스를 불러오는 중입니다...</h2>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div>
          <h1>주식 및 업무 대시보드</h1>
        </div>
        <div className="date-info">
          <span className="date">{newsData.date} 기준</span>
          <span className="last-updated">최종 업데이트: {newsData.lastUpdated}</span>
        </div>
      </header>

      {/* Primary Navigation */}
      <nav className="nav-primary">
        <button 
          className={`nav-primary-tab ${primaryTab === 'news' ? 'active' : ''}`}
          onClick={() => setPrimaryTab('news')}
        >
          뉴스 관련 업무
        </button>
        <button 
          className={`nav-primary-tab ${primaryTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setPrimaryTab('earnings')}
        >
          실적발표 일정
        </button>
        <button 
          className={`nav-primary-tab ${primaryTab === 'search' ? 'active' : ''}`}
          onClick={() => setPrimaryTab('search')}
        >
          뉴스 검색
        </button>
      </nav>

      <main>
        {primaryTab === 'news' && (
          <div>
            {/* Secondary Navigation (only visible when 'news' is active) */}
            <nav className="nav-secondary">
              <button 
                className={`nav-secondary-tab ${secondaryTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setSecondaryTab('dashboard')}
              >
                오늘의 뉴스
              </button>
              <button 
                className={`nav-secondary-tab ${secondaryTab === 'pastnews' ? 'active' : ''}`}
                onClick={() => setSecondaryTab('pastnews')}
              >
                지난 뉴스
              </button>
              <button 
                className={`nav-secondary-tab ${secondaryTab === 'watchlist' ? 'active' : ''}`}
                onClick={() => setSecondaryTab('watchlist')}
              >
                관심 기업 설정
              </button>
            </nav>

            {/* News Sub-views */}
            {secondaryTab === 'dashboard' && <Dashboard newsData={newsData} watchList={watchList} />}
            {secondaryTab === 'pastnews' && <PastNews watchList={watchList} />}
            {secondaryTab === 'watchlist' && <WatchList watchList={watchList} setWatchList={setWatchList} />}
          </div>
        )}

        {primaryTab === 'earnings' && (
          <div style={{ marginTop: '1rem' }}>
            <EarningsCalendar watchList={watchList} />
          </div>
        )}

        {primaryTab === 'search' && (
          <div style={{ marginTop: '1rem' }}>
            <NewsSearch />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
