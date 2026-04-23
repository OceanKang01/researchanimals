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
  
  const [liveData, setLiveData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
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

  const handleLiveUpdate = async () => {
    if (watchList.length === 0) {
      alert("관심기업을 먼저 설정해주세요!");
      return;
    }
    
    setIsUpdating(true);
    const tickers = watchList.map(w => w.ticker).join(',');
    try {
      const res = await fetch(`/api/liveUpdate?tickers=${encodeURIComponent(tickers)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLiveData(data.data);
      } else {
        alert("업데이트 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h2>뉴스를 불러오는 중입니다...</h2>
      </div>
    );
  }

  // Use live data if available
  const displayData = liveData || newsData;

  return (
    <div>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>주식 및 업무 대시보드</h1>
          <button 
            onClick={handleLiveUpdate} 
            disabled={isUpdating}
            style={{
              background: isUpdating ? 'var(--card-bg)' : 'var(--accent-color)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.3s',
              fontSize: '0.9rem'
            }}
          >
            {isUpdating ? '업데이트 중...' : '⟳ 실시간 업데이트'}
          </button>
        </div>
        <div className="date-info">
          <span className="date">{displayData.date} 기준</span>
          <span className="last-updated" style={{ color: liveData ? '#34d399' : 'inherit' }}>
            최종 업데이트: {displayData.lastUpdated}
          </span>
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
          className={`nav-primary-tab ${primaryTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setPrimaryTab('watchlist')}
        >
          관심기업 설정
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
                className={`nav-secondary-tab ${secondaryTab === 'search' ? 'active' : ''}`}
                onClick={() => setSecondaryTab('search')}
              >
                뉴스 검색
              </button>
            </nav>

            {/* News Sub-views */}
            {secondaryTab === 'dashboard' && <Dashboard newsData={displayData} watchList={watchList} />}
            {secondaryTab === 'pastnews' && <PastNews watchList={watchList} />}
            {secondaryTab === 'search' && <NewsSearch />}
          </div>
        )}

        {primaryTab === 'watchlist' && (
          <div style={{ marginTop: '1rem' }}>
            <WatchList watchList={watchList} setWatchList={setWatchList} />
          </div>
        )}

        {primaryTab === 'earnings' && (
          <div style={{ marginTop: '1rem' }}>
            <EarningsCalendar watchList={watchList} liveEarningsData={liveData?.earnings} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
