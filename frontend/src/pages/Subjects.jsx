import React, { useEffect, useState, useCallback } from 'react';
import { getSubjects, getMySubjects, createSubject, updateSubject, deleteSubject, getDepartments } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';

const EMPTY = { name: '', code: '', departmentId: '', semester: '', maxInternal: 40, maxExternal: 60 };

export default function Subjects() {
  const { isAdmin, isFaculty } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        isFaculty ? getMySubjects() : getSubjects(),
        getDepartments()
      ]);
      setSubjects(sRes.data);
      setDepts(dRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [isFaculty]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true, editing: null }); };
  const openEdit = (s) => {
    setForm({ name: s.name, code: s.code, departmentId: s.departmentId?._id || '', semester: s.semester, maxInternal: s.maxInternal, maxExternal: s.maxExternal });
    setModal({ open: true, editing: s });
  };
  const closeModal = () => setModal({ open: false, editing: null });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.editing) { await updateSubject(modal.editing._id, form); toast.success('Subject updated'); }
      else { await createSubject(form); toast.success('Subject created'); }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await deleteSubject(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const h = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Subjects</h1>
          <p>{isFaculty ? 'Your assigned subjects' : 'Manage all subjects across departments'}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Add Subject</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading"><div className="spinner" /></div> :
          subjects.length === 0 ? (
            <div className="empty-state"><BookOpen /><h3>No subjects found</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code</th><th>Name</th><th>Department</th><th>Semester</th><th>Max Internal</th><th>Max External</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s._id}>
                      <td><span className="mono" style={{ color:'var(--primary)', fontSize:'0.82rem' }}>{s.code}</span></td>
                      <td style={{ fontWeight:500 }}>{s.name}</td>
                      <td>{s.departmentId?.name || '—'}</td>
                      <td>Sem {s.semester}</td>
                      <td>{s.maxInternal}</td>
                      <td>{s.maxExternal}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button className="btn btn-outline btn-xs" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                            <button className="btn btn-danger btn-xs" onClick={() => remove(s._id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      <Modal open={modal.open} onClose={closeModal} title={modal.editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={save}>
          <div className="modal-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input className="form-control" required value={form.name} onChange={h('name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input className="form-control" required value={form.code} onChange={h('code')} placeholder="CS101" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" required value={form.departmentId} onChange={h('departmentId')}>
                <option value="">Select…</option>
                {depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="form-control" required value={form.semester} onChange={h('semester')}>
                <option value="">Select…</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Max Internal</label>
                <input className="form-control" type="number" value={form.maxInternal} onChange={h('maxInternal')} />
              </div>
              <div className="form-group">
                <label className="form-label">Max External</label>
                <input className="form-control" type="number" value={form.maxExternal} onChange={h('maxExternal')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
