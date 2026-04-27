import React, { useState } from 'react';

function Dashboard({ newsData, watchList }) {
  const [selectedTicker, setSelectedTicker] = useState('ALL');

  // Filter news data based on watch list, then sort alphabetically
  const filteredSummaries = newsData.summaries
    .filter(item => watchList.some(company => company.ticker.toUpperCase() === item.ticker.toUpperCase()))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  // Further filter by selected company
  const displaySummaries = selectedTicker === 'ALL'
    ? filteredSummaries
    : filteredSummaries.filter(item => item.ticker.toUpperCase() === selectedTicker);

  // Sort watchList alphabetically for filter chips
  const sortedWatchList = [...watchList].sort((a, b) => a.ticker.localeCompare(b.ticker));

  if (filteredSummaries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
        <p>관심 기업 목록에 해당하는 뉴스가 없습니다.</p>
        <p>관심기업 설정 탭에서 기업을 추가해 주세요.</p>
      </div>
    );
  }

  const isSingleView = selectedTicker !== 'ALL' && displaySummaries.length > 0;
  const singleItem = isSingleView ? displaySummaries[0] : null;

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
        {sortedWatchList.map(company => {
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

      {/* Single Company Expanded View */}
      {isSingleView && singleItem ? (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '2rem',
          boxShadow: 'var(--card-shadow)'
        }}>
          {/* Header */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-color)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1.1rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                {singleItem.ticker}
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{singleItem.name}</h2>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${(singleItem.price || 0).toFixed(2)}
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: (singleItem.changePercent || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
              }}>
                {(singleItem.changePercent || 0) >= 0 ? '▲' : '▼'} {(singleItem.changePercent || 0) >= 0 ? '+' : ''}{singleItem.changePercent || 0}%
              </div>
            </div>
          </header>

          {/* AI Summary */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
              📋 AI 뉴스 요약
            </h3>
            <p style={{
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              lineHeight: '1.7',
              background: 'rgba(0,0,0,0.02)',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              margin: 0
            }}>
              {singleItem.summary}
            </p>
          </div>

          {/* Sources */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
              📰 뉴스 출처 ({(singleItem.sources || []).length}건)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(singleItem.sources || []).map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--accent-color)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {source.provider}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {source.title}
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.75rem', flexShrink: 0 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Grid View - All companies horizontal cards */
        <div className="dashboard-grid">
          {displaySummaries.map((item, index) => (
            <article
              key={index}
              className="news-card"
              onClick={() => setSelectedTicker(item.ticker.toUpperCase())}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
            >
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
                      <a href={source.url} className="source-link" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}

      {displaySummaries.length === 0 && selectedTicker !== 'ALL' && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          {selectedTicker}에 대한 뉴스가 없습니다.
        </div>
      )}
    </div>
  );
}

export default Dashboard;
