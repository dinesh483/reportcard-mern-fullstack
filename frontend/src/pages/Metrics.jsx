import React, { useEffect, useState } from 'react';
import { getMetrics } from '../api/services';
import toast from 'react-hot-toast';
import { RefreshCw, BarChart2 } from 'lucide-react';

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const res = await getMetrics(); setMetrics(res.data); }
    catch { toast.error('Failed to load metrics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1>System Metrics</h1><p>Operation counts and latency statistics</p></div>
        <button className="btn btn-outline" onClick={load}><RefreshCw size={16} />Refresh</button>
      </div>

      {!metrics ? (
        <div className="alert alert-warning">No metrics data available yet.</div>
      ) : (
        <div className="metrics-grid">
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} className="card">
              <h3 style={{ fontFamily:'DM Sans', fontWeight:600, fontSize:'0.9rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
                <BarChart2 size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle', color:'var(--primary)' }} />
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
                <div className="metric-value" style={{ fontSize:'1.6rem', fontFamily:'DM Serif Display' }}>{typeof val === 'number' ? val.toFixed(2) : val}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
