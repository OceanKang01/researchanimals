import React from 'react';

function Dashboard({ newsData, watchList }) {
  // Filter news data based on watch list (for now, just a mock filter)
  // In reality, the backend would fetch data based on the watch list.
  // Here, we'll display items from mock data only if they are in the watchList (or if watchList is empty for demo purposes, we show all, but let's strictly filter).
  
  const filteredSummaries = newsData.summaries.filter(item => 
    watchList.some(company => company.ticker.toUpperCase() === item.ticker.toUpperCase())
  );

  if (filteredSummaries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
        <p>관심 기업 목록에 해당하는 뉴스가 없습니다.</p>
        <p>Watch List 탭에서 기업을 추가해 주세요. (예: LITE, INTC, AMD, MU)</p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {filteredSummaries.map((item, index) => (
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
  );
}

export default Dashboard;
