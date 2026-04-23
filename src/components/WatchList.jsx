import React, { useState, useRef, useEffect } from 'react';

const KOREAN_DICTIONARY = [
  { ticker: 'AAPL', name: 'Apple Inc.', ko: ['애플'] },
  { ticker: 'MSFT', name: 'Microsoft Corporation', ko: ['마이크로소프트', '마소'] },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', ko: ['엔비디아', '엔비'] },
  { ticker: 'TSLA', name: 'Tesla, Inc.', ko: ['테슬라'] },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', ko: ['아마존'] },
  { ticker: 'META', name: 'Meta Platforms, Inc.', ko: ['메타', '페이스북'] },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', ko: ['구글', '알파벳'] },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', ko: ['TSMC', '티에스엠씨'] },
  { ticker: 'AVGO', name: 'Broadcom Inc.', ko: ['브로드컴'] },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', ko: ['제이피모건'] },
  { ticker: 'WMT', name: 'Walmart Inc.', ko: ['월마트'] },
  { ticker: 'V', name: 'Visa Inc.', ko: ['비자'] },
  { ticker: 'MA', name: 'Mastercard Inc.', ko: ['마스터카드'] },
  { ticker: 'ASML', name: 'ASML Holding', ko: ['ASML', '에이에스엠엘'] },
  { ticker: 'AMD', name: 'Advanced Micro Devices', ko: ['AMD', '에이엠디'] },
  { ticker: 'NFLX', name: 'Netflix, Inc.', ko: ['넷플릭스'] },
  { ticker: 'INTC', name: 'Intel Corporation', ko: ['인텔'] },
  { ticker: 'MU', name: 'Micron Technology', ko: ['마이크론'] },
  { ticker: 'LITE', name: 'Lumentum Holdings', ko: ['루멘텀'] },
  { ticker: 'PLTR', name: 'Palantir Technologies', ko: ['팔란티어'] },
  { ticker: 'ARM', name: 'Arm Holdings', ko: ['암'] },
  { ticker: 'QCOM', name: 'QUALCOMM', ko: ['퀄컴'] },
  { ticker: 'COST', name: 'Costco Wholesale', ko: ['코스트코'] },
  { ticker: 'DIS', name: 'Walt Disney', ko: ['디즈니'] },
  { ticker: 'SMCI', name: 'Super Micro Computer', ko: ['슈퍼마이크로', '슈마컴'] }
];

function WatchList({ watchList, setWatchList }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.trim() === '') {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const lowerVal = val.toLowerCase();
    const matches = KOREAN_DICTIONARY.filter(item => 
      item.ticker.toLowerCase().includes(lowerVal) ||
      item.name.toLowerCase().includes(lowerVal) ||
      item.ko.some(k => k.includes(lowerVal))
    ).slice(0, 5);

    setSuggestions(matches);
    setShowDropdown(true);
  };

  const addCompany = (company) => {
    if (watchList.some(item => item.ticker === company.ticker)) {
      alert('이미 추가된 기업입니다.');
      return;
    }
    setWatchList([...watchList, company]);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if query exactly matches a suggestion
    const exactMatch = suggestions.find(s => 
      s.ticker.toLowerCase() === query.toLowerCase() || 
      s.ko.includes(query)
    );

    if (exactMatch) {
      addCompany({ ticker: exactMatch.ticker, name: exactMatch.name });
      return;
    }

    // Assume query is a ticker, lookup via API
    setIsSearching(true);
    try {
      const response = await fetch(`/api/company?ticker=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        addCompany({ ticker: data.ticker, name: data.name });
      } else {
        alert(`기업 정보를 찾을 수 없습니다: ${query}\n올바른 티커(심볼)를 입력해주세요.`);
      }
    } catch (error) {
      console.error(error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = (tickerToRemove) => {
    setWatchList(watchList.filter(item => item.ticker !== tickerToRemove));
  };

  return (
    <div className="watch-list-container">
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>관심 기업 설정 (Watch List)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        한국어 기업명(예: 애플, 엔비디아)이나 영문 티커(예: TSLA)를 입력하세요.
      </p>

      <form className="add-company-form" onSubmit={handleAddSubmit} ref={wrapperRef} style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="기업명 또는 티커 검색..."
          value={query}
          onChange={handleQueryChange}
          onFocus={() => { if(suggestions.length > 0) setShowDropdown(true); }}
          disabled={isSearching}
          style={{ width: '100%', marginBottom: 0 }}
        />
        
        {showDropdown && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            listStyle: 'none',
            padding: '0.5rem 0',
            margin: '0.5rem 0 0 0',
            zIndex: 10,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            {suggestions.map(s => (
              <li 
                key={s.ticker}
                style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                onClick={() => addCompany({ ticker: s.ticker, name: s.name })}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--accent-color)' }}>{s.ticker}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.ko.join(', ')}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {s.name}
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <button type="submit" className="btn-add" disabled={isSearching || !query.trim()} style={{ whiteSpace: 'nowrap' }}>
          {isSearching ? '검색 중...' : '추가하기'}
        </button>
      </form>

      {watchList.length > 0 ? (
        <ul className="company-list" style={{ marginTop: '2rem' }}>
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
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px', marginTop: '2rem' }}>
          현재 등록된 관심 기업이 없습니다.
        </div>
      )}
    </div>
  );
}

export default WatchList;
