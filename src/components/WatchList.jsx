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
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [apiSuggestions, setApiSuggestions] = useState([]);
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

  // Debounced API search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      // Only fetch if query doesn't contain Korean characters (to save API calls since Yahoo doesn't support Korean)
      const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed);
      if (!hasKorean) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/company?ticker=${encodeURIComponent(trimmed)}`);
          const data = await res.json();
          if (data.success && data.results) {
            setApiSuggestions(data.results);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setApiSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.trim() === '') {
      setLocalSuggestions([]);
      setApiSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const lowerVal = val.toLowerCase();
    const matches = KOREAN_DICTIONARY.filter(item => 
      item.ticker.toLowerCase().includes(lowerVal) ||
      item.name.toLowerCase().includes(lowerVal) ||
      item.ko.some(k => k.includes(lowerVal))
    ).slice(0, 5);

    setLocalSuggestions(matches);
    setShowDropdown(true);
  };

  const addCompany = (company) => {
    if (watchList.some(item => item.ticker === company.ticker)) {
      alert('이미 추가된 기업입니다.');
      return;
    }
    const newList = [...watchList, company];
    setWatchList(newList);
    try { localStorage.setItem('usStockWatchList', JSON.stringify(newList)); } catch(e){}
    setQuery('');
    setLocalSuggestions([]);
    setApiSuggestions([]);
    setShowDropdown(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if query exactly matches a local suggestion
    const exactLocalMatch = localSuggestions.find(s => 
      s.ticker.toLowerCase() === query.toLowerCase() || 
      s.ko.includes(query)
    );

    if (exactLocalMatch) {
      addCompany({ ticker: exactLocalMatch.ticker, name: exactLocalMatch.name });
      return;
    }

    // Check if exactly matches API suggestion
    const exactApiMatch = apiSuggestions.find(s => s.ticker.toLowerCase() === query.toLowerCase());
    if (exactApiMatch) {
      addCompany({ ticker: exactApiMatch.ticker, name: exactApiMatch.name });
      return;
    }

    // Fallback: Use the top suggestion if available, else just add as typed
    const topSuggestion = localSuggestions[0] || apiSuggestions[0];
    if (topSuggestion) {
      addCompany({ ticker: topSuggestion.ticker, name: topSuggestion.name });
    } else {
      addCompany({ ticker: query.toUpperCase(), name: query.toUpperCase() });
    }
  };

  const handleDelete = (tickerToRemove) => {
    const newList = watchList.filter(item => item.ticker !== tickerToRemove);
    setWatchList(newList);
    try { localStorage.setItem('usStockWatchList', JSON.stringify(newList)); } catch(e){}
  };

  // Combine and deduplicate suggestions
  const combinedSuggestions = [...localSuggestions];
  apiSuggestions.forEach(apiItem => {
    if (!combinedSuggestions.some(localItem => localItem.ticker === apiItem.ticker)) {
      combinedSuggestions.push({ ...apiItem, ko: [] }); // API items don't have Korean names
    }
  });

  return (
    <div className="watch-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Left Column: Search & Add */}
      <div style={{ flex: '1 1 400px' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>관심 기업 설정 (Watch List)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          한국어 기업명(예: 애플)이나 영문/티커(예: TSLA, apple)를 입력하세요.
        </p>

        <form className="add-company-form" onSubmit={handleAddSubmit} ref={wrapperRef}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <input
              type="text"
              className="form-input"
              placeholder="기업명 또는 티커 검색..."
              value={query}
              onChange={handleQueryChange}
              onFocus={() => { if(combinedSuggestions.length > 0) setShowDropdown(true); }}
              style={{ width: '100%', marginBottom: 0 }}
            />
            
            {showDropdown && combinedSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                listStyle: 'none',
                padding: '0.5rem 0',
                margin: 0,
                zIndex: 999,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 10px -5px rgba(0, 0, 0, 0.1)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {isSearching && (
                  <li style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    야후 파이낸스에서 검색 중...
                  </li>
                )}
                {combinedSuggestions.map(s => (
                  <li 
                    key={s.ticker}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                    onClick={() => addCompany({ ticker: s.ticker, name: s.name })}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }}>{s.ticker}</strong>
                      {s.ko && s.ko.length > 0 && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(0,0,0,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {s.ko.join(', ')}
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
                      {s.name}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button type="submit" className="btn-add" disabled={!query.trim()} style={{ whiteSpace: 'nowrap', height: 'fit-content' }}>
            추가하기
          </button>
        </form>
      </div>

      {/* Company List - Folder Style */}
      <div style={{ 
        width: '100%',
        background: 'var(--card-bg)', 
        borderRadius: '12px', 
        padding: '1.25rem 1.5rem', 
        border: '1px solid var(--border-color)' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📂 내 관심 기업</span>
          <span style={{ background: 'var(--accent-color)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem' }}>
            {watchList.length}
          </span>
        </h3>
        
        {watchList.length > 0 ? (() => {
          // Group by first letter
          const sorted = [...watchList].sort((a, b) => a.ticker.localeCompare(b.ticker));
          const groups = {};
          sorted.forEach(company => {
            const letter = company.ticker[0].toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(company);
          });

          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {Object.entries(groups).map(([letter, companies]) => (
                <div key={letter} style={{
                  flex: '0 0 auto',
                  minWidth: '160px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fafbfc'
                }}>
                  {/* Folder Tab */}
                  <div style={{
                    background: 'linear-gradient(135deg, var(--accent-color), #60a5fa)',
                    color: 'white',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span style={{ fontSize: '0.7rem' }}>📁</span> {letter}
                    <span style={{ marginLeft: 'auto', fontSize: '0.6rem', opacity: 0.8 }}>{companies.length}</span>
                  </div>
                  {/* Files inside folder */}
                  <div style={{ padding: '0.35rem 0' }}>
                    {companies.map((company, idx) => (
                      <div key={company.ticker} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.3rem 0.6rem 0.3rem 0.75rem',
                        fontSize: '0.78rem',
                        borderBottom: idx < companies.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        gap: '0.4rem'
                      }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.6rem', flexShrink: 0 }}>├─</span>
                        <strong style={{ color: 'var(--accent-color)', fontSize: '0.78rem', flexShrink: 0 }}>{company.ticker}</strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {company.name}
                        </span>
                        <button 
                          onClick={() => handleDelete(company.ticker)} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#cbd5e1', 
                            fontSize: '0.65rem', 
                            cursor: 'pointer',
                            padding: '0.1rem 0.25rem',
                            borderRadius: '3px',
                            flexShrink: 0,
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })() : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            등록된 관심 기업이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchList;
