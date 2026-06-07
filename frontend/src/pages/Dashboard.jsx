import React, { useEffect, useState } from 'react';
import { getDashboard } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, TrendingUp, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user, isAdmin, isFaculty } = useAuth();
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin || isFaculty) {
      getDashboard()
        .then((r) => setKpi(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAdmin, isFaculty]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const chartData = kpi ? [
    { name: 'Total Students', value: kpi.totalStudents },
    { name: 'Avg Score', value: kpi.averageScore },
    { name: 'Pass %', value: kpi.passPercentage },
    { name: 'Fail Count', value: kpi.failCount },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}. Here's an overview of the academic portal.</p>
      </div>

      {(isAdmin || isFaculty) && kpi && (
        <>
          <div className="stat-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Students</div>
              <div className="stat-value">{kpi.totalStudents}</div>
              <div className="stat-sub">Enrolled students</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">{kpi.averageScore}</div>
              <div className="stat-sub">Across all subjects</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-label">Pass Percentage</div>
              <div className="stat-value">{kpi.passPercentage}%</div>
              <div className="stat-sub">{kpi.totalMarkEntries} mark entries</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Fail Count</div>
              <div className="stat-value">{kpi.failCount}</div>
              <div className="stat-sub">Students with F grade</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontFamily: 'DM Sans', fontWeight: 600 }}>
              <BarChart2 size={18} style={{ display:'inline', marginRight:8, color:'var(--primary)', verticalAlign:'middle' }} />
              KPI Overview
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 16, fontFamily: 'DM Sans', fontWeight: 600 }}>Quick Access</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { icon: <GraduationCap size={20} />, label: 'Students', link: '/students', color: 'var(--primary)' },
            { icon: <TrendingUp size={20} />, label: 'Report Cards', link: '/report-cards', color: 'var(--success)' },
            ...(isAdmin || isFaculty ? [{ icon: <CheckCircle size={20} />, label: 'Marks Entry', link: '/marks', color: 'var(--accent)' }] : []),
          ].map((item) => (
            <a key={item.label} href={item.link} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = item.color}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {user?.role === 'student' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <GraduationCap size={48} color="var(--primary)" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Student Portal</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>View your published report cards and academic performance.</p>
            <a href="/report-cards" className="btn btn-primary">View My Report Cards</a>
          </div>
        </div>
      )}
    </div>
  );
}
