import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import './styles.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Marks from './pages/Marks';
import ReportCards from './pages/ReportCards';
import Departments from './pages/Departments';
import FacultyAssignments from './pages/FacultyAssignments';
import BulkImport from './pages/BulkImport';
import Metrics from './pages/Metrics';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Layout><Students /></Layout></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><Layout><Subjects /></Layout></ProtectedRoute>} />
      <Route path="/marks" element={<ProtectedRoute roles={['admin', 'faculty']}><Layout><Marks /></Layout></ProtectedRoute>} />
      <Route path="/report-cards" element={<ProtectedRoute><Layout><ReportCards /></Layout></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute roles={['admin']}><Layout><Departments /></Layout></ProtectedRoute>} />
      <Route path="/faculty-assignments" element={<ProtectedRoute roles={['admin']}><Layout><FacultyAssignments /></Layout></ProtectedRoute>} />
      <Route path="/bulk-import" element={<ProtectedRoute roles={['admin', 'faculty']}><Layout><BulkImport /></Layout></ProtectedRoute>} />
      <Route path="/metrics" element={<ProtectedRoute roles={['admin']}><Layout><Metrics /></Layout></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              minWidth: '320px',
              maxWidth: '420px',
              fontSize: '1rem',
              textAlign: 'center',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
