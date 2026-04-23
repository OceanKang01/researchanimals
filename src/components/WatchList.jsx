import React, { useState } from 'react';

function WatchList({ watchList, setWatchList }) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    const newCompany = {
      ticker: ticker.toUpperCase(),
      name: name.trim() || ticker.toUpperCase(),
    };

    // Check if already exists
    if (watchList.some(item => item.ticker === newCompany.ticker)) {
      alert('이미 추가된 기업입니다.');
      return;
    }

    setWatchList([...watchList, newCompany]);
    setTicker('');
    setName('');
  };

  const handleDelete = (tickerToRemove) => {
    setWatchList(watchList.filter(item => item.ticker !== tickerToRemove));
  };

  return (
    <div className="watch-list-container">
      <h2>관심 기업 설정 (Watch List)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        매일 아침 뉴스를 요약받고 싶은 기업의 티커(심볼)를 추가하세요. 
        <br/>현재 데모 버전에서는 LITE, INTC, AMD, MU의 뉴스만 제공됩니다.
      </p>

      <form className="add-company-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="form-input"
          placeholder="티커 입력 (예: AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
        />
        <input
          type="text"
          className="form-input"
          placeholder="기업명 (선택, 예: Apple)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn-add">추가하기</button>
      </form>

      {watchList.length > 0 ? (
        <ul className="company-list">
          {watchList.map((company, index) => (
            <li key={index} className="company-list-item">
              <div>
                <strong style={{ color: 'var(--accent-color)', marginRight: '0.5rem' }}>{company.ticker}</strong>
                <span>{company.name}</span>
              </div>
              <button onClick={() => handleDelete(company.ticker)} className="btn-delete">삭제</button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          현재 등록된 관심 기업이 없습니다.
        </div>
      )}
    </div>
  );
}

export default WatchList;
