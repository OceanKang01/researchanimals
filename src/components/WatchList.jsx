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
    setWatchList([...watchList, company]);
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
    setWatchList(watchList.filter(item => item.ticker !== tickerToRemove));
  };

  // Combine and deduplicate suggestions
  const combinedSuggestions = [...localSuggestions];
  apiSuggestions.forEach(apiItem => {
    if (!combinedSuggestions.some(localItem => localItem.ticker === apiItem.ticker)) {
      combinedSuggestions.push({ ...apiItem, ko: [] }); // API items don't have Korean names
    }
  });

  return (
    <div className="watch-list-container" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
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
                background: '#1e293b', // Solid background instead of transparent var(--card-bg)
                border: '1px solid #334155',
                borderRadius: '8px',
                listStyle: 'none',
                padding: '0.5rem 0',
                margin: 0,
                zIndex: 999,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
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
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }}>{s.ticker}</strong>
                      {s.ko && s.ko.length > 0 && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
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

      {/* Right Column: List of saved companies */}
      <div style={{ 
        flex: '0 0 350px', 
        background: 'var(--card-bg)', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        border: '1px solid var(--border-color)' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>내 관심 기업</span>
          <span style={{ background: 'var(--accent-color)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem' }}>
            {watchList.length}
          </span>
        </h3>
        
        {watchList.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {watchList.map((company, index) => (
              <li key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.75rem', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '0.95rem' }}>{company.ticker}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                    {company.name}
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(company.ticker)} 
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#ef4444', 
                    fontSize: '0.8rem', 
                    cursor: 'pointer',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            현재 등록된 관심 기업이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchList;
