import React, { useState } from 'react';
import Dashboard from './Dashboard';
import mockDatabase from '../mockDatabase.json';

function PastNews({ watchList }) {
  // Available dates in our mock database (sorted descending)
  const availableDates = Object.keys(mockDatabase).sort((a, b) => new Date(b) - new Date(a));
  const today = availableDates[0]; // Assuming the latest is today for demo purposes

  // Default to yesterday if available, else today
  const [selectedDate, setSelectedDate] = useState(availableDates.length > 1 ? availableDates[1] : today);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleCustomDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const currentNewsData = mockDatabase[selectedDate];

  return (
    <div>
      <div className="date-selector-container">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          과거의 뉴스 날짜를 선택하세요
        </h3>
        
        <div className="date-controls">
          <div className="date-chips">
            {availableDates.map(date => {
              // Format date nicely
              const dateObj = new Date(date);
              const label = date === today ? '오늘' : `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
              
              return (
                <button
                  key={date}
                  className={`date-chip ${selectedDate === date ? 'active' : ''}`}
                  onClick={() => handleDateChange(date)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="custom-date-picker">
            <label htmlFor="calendar-input" className="calendar-icon">📅</label>
            <input
              id="calendar-input"
              type="date"
              className="calendar-input"
              value={selectedDate}
              onChange={handleCustomDateChange}
              max={today}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-hover)' }}>
          {selectedDate} 뉴스 요약
        </h2>
        
        {currentNewsData ? (
          <Dashboard newsData={currentNewsData} watchList={watchList} />
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3>해당 날짜({selectedDate})의 데이터가 없습니다.</h3>
            <p style={{ marginTop: '0.5rem' }}>데이터베이스에 수집된 뉴스가 존재하지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PastNews;
