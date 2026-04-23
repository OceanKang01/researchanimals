import React, { useState } from 'react';

function NewsSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);
    setResults([]);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const json = await response.json();
      
      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error || '뉴스를 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-search-container">
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>실시간 뉴스 검색</h2>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="기업명이나 키워드를 입력하세요 (예: Tesla, AI...)"
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            borderRadius: '30px',
            border: '1px solid var(--border-color)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '0 2rem',
            borderRadius: '30px',
            border: 'none',
            background: 'var(--accent-color)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !query.trim() ? 0.7 : 1,
            transition: 'background 0.2s ease'
          }}
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'var(--danger-color)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          구글 뉴스에서 최신 기사를 가져오고 있습니다...
        </div>
      ) : hasSearched && results.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="search-results" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((item, index) => (
            <a 
              key={index} 
              href={item.link} 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '1.1rem', lineHeight: '1.4' }}>
                {item.title}
              </h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {item.snippet}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--accent-color)' }}>{item.source}</span>
                <span>{new Date(item.pubDate).toLocaleString('ko-KR')}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default NewsSearch;
