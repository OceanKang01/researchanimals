import React, { useState } from 'react';
import EarningsCalendar from './EarningsCalendar';
import NewsSearch from './NewsSearch';

function OtherTasks({ watchList }) {
  const [secondaryTab, setSecondaryTab] = useState('earnings'); // 'earnings' | 'search'

  return (
    <div>
      <nav className="nav-secondary">
        <button 
          className={`nav-secondary-tab ${secondaryTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setSecondaryTab('earnings')}
        >
          실적발표 일정
        </button>
        <button 
          className={`nav-secondary-tab ${secondaryTab === 'search' ? 'active' : ''}`}
          onClick={() => setSecondaryTab('search')}
        >
          뉴스 검색
        </button>
      </nav>

      {secondaryTab === 'earnings' && <EarningsCalendar watchList={watchList} />}
      {secondaryTab === 'search' && <NewsSearch />}
    </div>
  );
}

export default OtherTasks;
