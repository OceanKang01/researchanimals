import React from 'react';
import mockDatabase from '../mockDatabase.json';

function EarningsCalendar({ watchList }) {
  // Get earnings data
  const earningsData = mockDatabase.earningsCalendar || [];
  
  // Filter by watchList
  const watchedTickers = watchList.map(item => item.ticker);
  const filteredEarnings = earningsData.filter(item => watchedTickers.includes(item.ticker));

  // Sort by date (closest first)
  const sortedEarnings = [...filteredEarnings].sort((a, b) => {
    if (a.earningsDate === 'TBD') return 1;
    if (b.earningsDate === 'TBD') return -1;
    return new Date(a.earningsDate) - new Date(b.earningsDate);
  });

  const calculateDDay = (dateString) => {
    if (dateString === 'TBD') return '미정';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  return (
    <div className="earnings-container">
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>다가오는 실적발표 일정</h2>
      
      {sortedEarnings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          관심 기업의 실적발표 일정이 없습니다.
        </div>
      ) : (
        <div className="earnings-list">
          {sortedEarnings.map((item) => {
            const dday = calculateDDay(item.earningsDate);
            const isNear = dday.startsWith('D-') && parseInt(dday.replace('D-', '')) <= 7;
            
            return (
              <div key={item.ticker} className="earnings-card" style={{
                background: 'var(--card-bg)',
                border: isNear ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--accent-color)' }}>{item.ticker}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{item.name}</span>
                  </h3>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '500' }}>
                    {item.earningsDate === 'TBD' ? '일정 미정' : item.earningsDate}
                  </div>
                </div>
                
                <div style={{
                  background: isNear ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isNear ? 'var(--accent-hover)' : 'var(--text-primary)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {dday}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        * 실적발표 일정은 yfinance(Yahoo Finance) 데이터를 기반으로 하며, 실제 기업의 사정에 따라 변동될 수 있습니다.
      </p>
    </div>
  );
}

export default EarningsCalendar;
