import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogIn } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8 }}>
            <BookOpen size={28} color="var(--primary)" />
            <h1>ReportCard Portal</h1>
          </div>
          <p>Student Academic Management System</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" required placeholder="you@college.edu" value={form.email} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" required placeholder="••••••••" value={form.password} onChange={handle} />
          </div>
          <button className="btn btn-primary" style={{ width:'100%', marginTop:8 }} disabled={loading} type="submit">
            <LogIn size={16} />
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:'0.85rem', color:'var(--text-muted)' }}>
          No account? <Link to="/register">Register here</Link>
        </p>
        <div style={{ marginTop:24, padding:16, background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'var(--text-muted)' }}>
          <strong style={{ color:'var(--text-dim)' }}>Demo accounts:</strong><br />
          admin@college.edu · faculty@college.edu · student@college.edu<br />
          <span style={{ color:'var(--text-dim)' }}>Password: password123</span>
        </div>
      </div>
    </div>
  );
}
