import React, { useEffect, useState } from 'react';
import { getMetrics } from '../api/services';
import toast from 'react-hot-toast';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { getDashboard, seedMetrics as seedMetricsApi } from '../api/services';
import { useAuth } from '../contexts/AuthContext';

export default function Metrics() {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMetrics();
      setMetrics(res.data);
      // if metrics are empty, fetch dashboard KPIs as a useful fallback
      const hasCounts = res.data && res.data.operationCounts && Object.keys(res.data.operationCounts).length > 0;
      if (!hasCounts) {
        try {
          const d = await getDashboard();
          setDashboard(d.data);
        } catch (e) {
          // ignore dashboard errors
        }
      } else {
        setDashboard(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load metrics';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const seedMetrics = async () => {
    try {
      await seedMetricsApi();
      toast.success('Seeded sample metrics');
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Seed failed';
      toast.error(msg);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1>System Metrics</h1><p>Operation counts and latency statistics</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={load}><RefreshCw size={16} />Refresh</button>
          {isAdmin && <button className="btn btn-ghost" onClick={seedMetrics}>Seed</button>}
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 12 }} className="alert alert-danger">{error}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={load}>Retry</button>
          </div>
        </div>
      ) : !metrics ? (
        <div className="alert alert-warning">No metrics data available yet.</div>
      ) : (
        (() => {
          const opCounts = metrics.operationCounts || {};
          const avg = metrics.averageLatencyMs || {};
          const p95 = metrics.p95LatencyMs || {};
          const hasAny = Object.keys(opCounts).length > 0 || Object.keys(avg).length > 0 || Object.keys(p95).length > 0;
          if (!hasAny) {
            return <div className="alert alert-warning">No operational metrics recorded yet.</div>;
          }
          return (
            <div className="metrics-grid">
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key} className="card">
                  <h3 style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    <BarChart2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--primary)' }} />
                    {key.replace(/_/g, ' ')}
                  </h3>
                  {typeof val === 'object' ? (
                    Object.entries(val).map(([k, v]) => (
                      <div key={k} className="metric-row">
                        <span className="metric-label">{k}</span>
                        <span className="metric-value">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                      </div>
                    ))
                  ) : (
                    <div className="metric-value" style={{ fontSize: '1.6rem', fontFamily: 'DM Serif Display' }}>{typeof val === 'number' ? val.toFixed(2) : val}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })()
      )}
      {dashboard && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Dashboard KPIs (fallback)</h3>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 160 }}>
                <div className="metric-label">Total Students</div>
                <div className="metric-value" style={{ fontSize: '1.2rem' }}>{dashboard.totalStudents}</div>
              </div>
              <div style={{ minWidth: 160 }}>
                <div className="metric-label">Average Score</div>
                <div className="metric-value" style={{ fontSize: '1.2rem' }}>{dashboard.averageScore}</div>
              </div>
              <div style={{ minWidth: 160 }}>
                <div className="metric-label">Pass Percentage</div>
                <div className="metric-value" style={{ fontSize: '1.2rem' }}>{dashboard.passPercentage}%</div>
              </div>
              <div style={{ minWidth: 160 }}>
                <div className="metric-label">Fail Count</div>
                <div className="metric-value" style={{ fontSize: '1.2rem' }}>{dashboard.failCount}</div>
              </div>
              <div style={{ minWidth: 160 }}>
                <div className="metric-label">Total Mark Entries</div>
                <div className="metric-value" style={{ fontSize: '1.2rem' }}>{dashboard.totalMarkEntries}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
