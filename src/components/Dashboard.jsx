import React, { useState } from 'react';

function Dashboard({ newsData, watchList }) {
  const [selectedTicker, setSelectedTicker] = useState('ALL');

  // Filter news data based on watch list
  const filteredSummaries = newsData.summaries.filter(item =>
    watchList.some(company => company.ticker.toUpperCase() === item.ticker.toUpperCase())
  );

  // Further filter by selected company
  const displaySummaries = selectedTicker === 'ALL'
    ? filteredSummaries
    : filteredSummaries.filter(item => item.ticker.toUpperCase() === selectedTicker);

  if (filteredSummaries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
        <p>관심 기업 목록에 해당하는 뉴스가 없습니다.</p>
        <p>관심기업 설정 탭에서 기업을 추가해 주세요.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Company Filter Chips */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setSelectedTicker('ALL')}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            border: selectedTicker === 'ALL' ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
            background: selectedTicker === 'ALL' ? 'var(--accent-color)' : 'transparent',
            color: selectedTicker === 'ALL' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          전체 ({filteredSummaries.length})
        </button>
        {watchList.map(company => {
          const hasNews = filteredSummaries.some(s => s.ticker.toUpperCase() === company.ticker.toUpperCase());
          const isActive = selectedTicker === company.ticker.toUpperCase();
          return (
            <button
              key={company.ticker}
              onClick={() => setSelectedTicker(isActive ? 'ALL' : company.ticker.toUpperCase())}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: isActive ? 'var(--accent-color)' : hasNews ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: hasNews ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
            >
              {company.ticker}
            </button>
          );
        })}
      </div>

      {/* News Cards */}
      <div className="dashboard-grid">
        {displaySummaries.map((item, index) => (
          <article key={index} className="news-card">
            <header className="card-header">
              <div className="company-info">
                <span className="ticker-badge">{item.ticker}</span>
                <h2 className="company-name">{item.name}</h2>
              </div>
              <div className="price-info">
                <div className="stock-price">${(item.price || 0).toFixed(2)}</div>
                <div className={`stock-change ${(item.changePercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {(item.changePercent || 0) >= 0 ? '+' : ''}{item.changePercent || 0}%
                </div>
              </div>
            </header>

            <p className="card-summary">{item.summary}</p>

            <div className="sources-list">
              <h3 className="sources-title">오늘의 뉴스 출처</h3>
              <ul>
                {(item.sources || []).map((source, idx) => (
                  <li key={idx} className="source-item">
                    <span className="provider-tag">{source.provider}</span>
                    <a href={source.url} className="source-link" target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {displaySummaries.length === 0 && selectedTicker !== 'ALL' && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          {selectedTicker}에 대한 뉴스가 없습니다.
        </div>
      )}
    </div>
  );
}

export default Dashboard;
