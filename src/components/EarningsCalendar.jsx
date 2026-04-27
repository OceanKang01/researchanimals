import React, { useState, useEffect } from 'react';

function EarningsCalendar({ watchList, liveEarningsData }) {
  const [fetchedEarnings, setFetchedEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch earnings when component mounts or watchList changes
  useEffect(() => {
    if (watchList.length === 0) return;

    // If we already have live data from the parent, skip fetching
    if (liveEarningsData && liveEarningsData.length > 0) return;

    const fetchEarnings = async () => {
      setLoading(true);
      setError('');
      const tickers = watchList.map(w => w.ticker).join(',');

      try {
        const res = await fetch(`/api/earnings?tickers=${encodeURIComponent(tickers)}`);
        const data = await res.json();

        if (data.success && data.earnings) {
          setFetchedEarnings(data.earnings);
        } else {
          setError('실적발표 일정을 불러오지 못했습니다.');
        }
      } catch (e) {
        console.error('Earnings fetch error:', e);
        setError('서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [watchList, liveEarningsData]);

  // Priority: liveEarningsData (from 실시간 업데이트) > fetchedEarnings (auto-fetch) > empty
  const earningsData = liveEarningsData || fetchedEarnings || [];

  // Merge with watchList to get company names
  const enrichedEarnings = earningsData.map(item => {
    const watchItem = watchList.find(w => w.ticker === item.ticker);
    return {
      ...item,
      name: item.name || watchItem?.name || item.ticker
    };
  });

  // Filter by watchList
  const watchedTickers = watchList.map(item => item.ticker);
  const filteredEarnings = enrichedEarnings.filter(item => watchedTickers.includes(item.ticker));

  // Sort by date (closest first)
  const sortedEarnings = [...filteredEarnings].sort((a, b) => {
    if (a.earningsDate === 'TBD') return 1;
    if (b.earningsDate === 'TBD') return -1;
    const dateA = a.earningsDate.split(' ')[0];
    const dateB = b.earningsDate.split(' ')[0];
    return new Date(dateA) - new Date(dateB);
  });

  const calculateDDay = (dateString) => {
    if (dateString === 'TBD') return '미정';
    const datePart = dateString.split(' ')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(datePart);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  const formatKoreanTime = (dateString) => {
    if (dateString === 'TBD') return { date: '일정 미정', badge: null };

    const parts = dateString.split(' ');
    const baseDateStr = parts[0];
    const isAMC = dateString.includes('AMC');
    const isBMO = dateString.includes('BMO');

    let kstDate = new Date(baseDateStr);
    let timeLabel = '';

    if (isAMC) {
      kstDate.setDate(kstDate.getDate() + 1);
      timeLabel = '오전';
    } else if (isBMO) {
      timeLabel = '저녁';
    }

    const formattedDate = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;

    return {
      date: formattedDate,
      badge: timeLabel ? `${timeLabel} (한국시간)` : null,
      originalIsNear: isAMC || isBMO
    };
  };

  const handleRefresh = async () => {
    if (watchList.length === 0) return;
    setLoading(true);
    setError('');
    const tickers = watchList.map(w => w.ticker).join(',');

    try {
      const res = await fetch(`/api/earnings?tickers=${encodeURIComponent(tickers)}`);
      const data = await res.json();
      if (data.success && data.earnings) {
        setFetchedEarnings(data.earnings);
      } else {
        setError('실적발표 일정을 불러오지 못했습니다.');
      }
    } catch (e) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="earnings-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>다가오는 실적발표 일정</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            background: loading ? '#94a3b8' : 'var(--accent-color)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            transition: 'background 0.3s'
          }}
        >
          {loading ? '불러오는 중...' : '⟳ 새로고침'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger-color)', padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          Nasdaq에서 실적발표 일정을 가져오고 있습니다...
        </div>
      ) : sortedEarnings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          관심 기업의 실적발표 일정이 없습니다.
        </div>
      ) : (
        <div className="earnings-list" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.75rem'
        }}>
          {sortedEarnings.map((item) => {
            const dday = calculateDDay(item.earningsDate);
            const isNear = dday.startsWith('D-') && parseInt(dday.replace('D-', '')) <= 7;
            const kstInfo = formatKoreanTime(item.earningsDate);

            return (
              <div key={item.ticker} className="earnings-card" style={{
                background: 'var(--card-bg)',
                border: isNear ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{item.ticker}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{item.name}</span>
                  </h3>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {kstInfo.date}
                    {kstInfo.badge && (
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderRadius: '3px' }}>
                        {kstInfo.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                  {item.earningsDate !== 'TBD' && item.confirmed !== null && item.confirmed !== undefined && (
                    <span style={{ fontSize: '0.5rem', color: item.confirmed ? '#10b981' : '#f59e0b', fontWeight: 600, letterSpacing: '0.03em' }}>
                      {item.confirmed ? '✓ confirmed' : '○ expected'}
                    </span>
                  )}
                  <div style={{
                    background: isNear ? 'rgba(59, 130, 246, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    color: isNear ? 'var(--accent-hover)' : 'var(--text-primary)',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '14px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap'
                  }}>
                    {dday}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        * Nasdaq API에서 실시간으로 가져온 데이터입니다. 실제 기업 사정에 따라 변동될 수 있습니다.
      </p>
    </div>
  );
}

export default EarningsCalendar;
