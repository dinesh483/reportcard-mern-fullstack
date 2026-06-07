import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  FileText, Upload, BarChart2, LogOut, Building2, UserCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItem = (to, icon, label) => (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {icon}{label}
    </NavLink>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <BookOpen size={20} color="var(--primary)" />
          <h1 style={{ fontSize:'1rem' }}>ReportCard</h1>
        </div>
        <div className="tagline">Academic Portal</div>
        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Overview</div>
          {navItem('/dashboard', <LayoutDashboard />, 'Dashboard')}
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Academics</div>
          {navItem('/students', <GraduationCap />, 'Students')}
          {navItem('/subjects', <BookOpen />, 'Subjects')}
          {(isAdmin || isFaculty) && navItem('/marks', <FileText />, 'Marks Entry')}
          {navItem('/report-cards', <FileText />, 'Report Cards')}
        </div>

        {isAdmin && (
          <div className="nav-section">
            <div className="nav-section-label">Administration</div>
            {navItem('/departments', <Building2 />, 'Departments')}
            {navItem('/faculty-assignments', <UserCheck />, 'Faculty Assignments')}
            {navItem('/bulk-import', <Upload />, 'Bulk CSV Import')}
            {navItem('/metrics', <BarChart2 />, 'Metrics')}
          </div>
        )}

        {isFaculty && (
          <div className="nav-section">
            <div className="nav-section-label">Tools</div>
            {navItem('/bulk-import', <Upload />, 'Bulk CSV Import')}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="name">{user?.name}</div>
          <div className="email" style={{ textTransform:'capitalize' }}>{user?.role}</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width:'100%' }} onClick={handleLogout}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
