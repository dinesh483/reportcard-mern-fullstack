import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, UserPlus } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account created! Welcome, ${user.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <h1>Create Account</h1>
          </div>
          <p>ReportCard Portal</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" name="name" required placeholder="John Smith" value={form.name} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" required placeholder="you@college.edu" value={form.email} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" required placeholder="••••••••" value={form.password} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" name="role" value={form.role} onChange={handle}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width:'100%', marginTop:8 }} disabled={loading} type="submit">
            <UserPlus size={16} />
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:'0.85rem', color:'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
