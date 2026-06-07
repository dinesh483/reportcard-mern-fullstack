import React, { useEffect, useState } from 'react';
import { getSubjects, assignFacultySubject, getFacultyAssignments, removeAssignment } from '../api/services';
import api from '../api/client';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Trash2, UserCheck } from 'lucide-react';

export default function FacultyAssignments() {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subjectId: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me').catch(() => {}),
      getSubjects(),
      api.get('/students').catch(() => ({})),
    ])
      .then(async ([, subRes]) => {
        setSubjects(subRes.data);
        // Get all users — workaround: use register endpoint info isn't direct, get from db via a workaround
        // We'll list faculty by fetching users with role=faculty — no direct endpoint, so we'll manage via subject assignments
        const res = await api.get('/subjects/assignments/faculty/all').catch(() => ({ data: [] }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load faculty users list — backend has no /users endpoint, use a creative approach
    // We fetch from a custom endpoint or store locally
    const storedFaculty = JSON.parse(localStorage.getItem('known_faculty') || '[]');
    setFaculty(storedFaculty);
  }, []);

  const loadAssignments = async (f) => {
    setSelected(f);
    try {
      const res = await getFacultyAssignments(f._id);
      setAssignments(res.data);
    } catch { toast.error('Failed to load assignments'); }
  };

  const assign = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await assignFacultySubject({ facultyId: selected._id, subjectId: form.subjectId });
      toast.success('Subject assigned');
      setModal(false);
      loadAssignments(selected);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const unassign = async (assignmentId) => {
    try { await removeAssignment(assignmentId); toast.success('Unassigned'); loadAssignments(selected); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addFacultyManually = () => {
    const id = prompt('Enter Faculty User ID:');
    const name = prompt('Enter Faculty Name:');
    if (id && name) {
      const newF = { _id: id, name };
      const updated = [...faculty, newF];
      localStorage.setItem('known_faculty', JSON.stringify(updated));
      setFaculty(updated);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1>Faculty Assignments</h1><p>Assign subjects to faculty members</p></div>
        <button className="btn btn-outline" onClick={addFacultyManually}><Plus size={16} />Add Faculty Entry</button>
      </div>

      {faculty.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <UserCheck />
            <h3>No faculty added</h3>
            <p>Add faculty members using their user ID from the system.<br />Faculty users register with role "faculty" to get a user ID.</p>
            <button className="btn btn-primary" style={{ marginTop:12 }} onClick={addFacultyManually}><Plus size={16} />Add Faculty</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20 }}>
          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:'0.82rem', color:'var(--text-muted)', textTransform:'uppercase' }}>Faculty</div>
            {faculty.map((f) => (
              <button key={f._id} onClick={() => loadAssignments(f)} style={{ display:'block', width:'100%', padding:'12px 16px', textAlign:'left', background: selected?._id === f._id ? 'var(--primary-glow)' : 'none', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', color: selected?._id === f._id ? 'var(--primary)' : 'var(--text)' }}>
                <div style={{ fontWeight:500 }}>{f.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', fontFamily:'monospace' }}>{f._id}</div>
              </button>
            ))}
          </div>

          <div>
            {!selected ? (
              <div className="card"><div className="empty-state"><UserCheck /><h3>Select a faculty member</h3></div></div>
            ) : (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={{ fontFamily:'DM Sans', fontWeight:600 }}>Assignments for {selected.name}</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14} />Assign Subject</button>
                </div>
                <div className="card" style={{ padding:0 }}>
                  {assignments.length === 0 ? (
                    <div className="empty-state" style={{ padding:32 }}><h3>No subjects assigned</h3></div>
                  ) : (
                    <table>
                      <thead><tr><th>Code</th><th>Subject</th><th>Semester</th><th>Actions</th></tr></thead>
                      <tbody>
                        {assignments.map((a) => (
                          <tr key={a._id}>
                            <td><span className="mono" style={{ color:'var(--primary)', fontSize:'0.82rem' }}>{a.subjectId?.code}</span></td>
                            <td style={{ fontWeight:500 }}>{a.subjectId?.name}</td>
                            <td>Sem {a.subjectId?.semester}</td>
                            <td><button className="btn btn-danger btn-xs" onClick={() => unassign(a._id)}><Trash2 size={12} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Assign Subject">
        <form onSubmit={assign}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-control" required value={form.subjectId} onChange={(e) => setForm({ subjectId: e.target.value })}>
                <option value="">Select subject…</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Assigning…' : 'Assign'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
