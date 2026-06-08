import React, { useEffect, useState } from 'react';
import { getMetrics } from '../api/services';
import toast from 'react-hot-toast';
import { RefreshCw, BarChart2 } from 'lucide-react';

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMetrics();
      setMetrics(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load metrics';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1>System Metrics</h1><p>Operation counts and latency statistics</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={load}><RefreshCw size={16} />Refresh</button>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 12 }} className="alert alert-danger">{error}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={load}>Retry</button>
          </div>
        </div>
      ) : (
        <div className="metrics-grid">
          <div className="card">
            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              <BarChart2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--primary)' }} />
              Operation Counts
            </h3>
            {Object.entries(metrics?.operationCounts || {}).length > 0 ? (
              Object.entries(metrics.operationCounts).map(([k, v]) => (
                <div key={k} className="metric-row">
                  <span className="metric-label">{k}</span>
                  <span className="metric-value">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                </div>
              ))
            ) : (
              <div className="metric-row">
                <span className="metric-label">No data recorded yet</span>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              <BarChart2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--primary)' }} />
              Average Latency
            </h3>
            {Object.entries(metrics?.averageLatencyMs || {}).length > 0 ? (
              Object.entries(metrics.averageLatencyMs).map(([k, v]) => (
                <div key={k} className="metric-row">
                  <span className="metric-label">{k}</span>
                  <span className="metric-value">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                </div>
              ))
            ) : (
              <div className="metric-row">
                <span className="metric-label">No data recorded yet</span>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              <BarChart2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--primary)' }} />
              P95 Latency
            </h3>
            {Object.entries(metrics?.p95LatencyMs || {}).length > 0 ? (
              Object.entries(metrics.p95LatencyMs).map(([k, v]) => (
                <div key={k} className="metric-row">
                  <span className="metric-label">{k}</span>
                  <span className="metric-value">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                </div>
              ))
            ) : (
              <div className="metric-row">
                <span className="metric-label">No data recorded yet</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
