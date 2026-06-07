import React, { useEffect, useState, useCallback } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, getDepartments } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, GraduationCap } from 'lucide-react';

const EMPTY = { name: '', rollNo: '', departmentId: '', semester: '' };

export default function Students() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ departmentId: '', semester: '', passFilter: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      const [sRes, dRes] = await Promise.all([getStudents(params), getDepartments()]);
      setStudents(sRes.data);
      setDepts(dRes.data);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true, editing: null }); };
  const openEdit = (s) => { setForm({ name: s.name, rollNo: s.rollNo, departmentId: s.departmentId?._id || s.departmentId, semester: s.semester }); setModal({ open: true, editing: s }); };
  const closeModal = () => setModal({ open: false, editing: null });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.editing) {
        await updateStudent(modal.editing._id, form);
        toast.success('Student updated');
      } else {
        await createStudent(form);
        toast.success('Student created');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    setDeleting(id);
    try {
      await deleteStudent(id);
      toast.success('Student deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Students</h1>
          <p>Manage enrolled students and their profiles</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Student
          </button>
        )}
      </div>

      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1 }}>
          <Search />
          <input className="form-control" placeholder="Search by name or roll number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 180 }} value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
          <option value="">All Departments</option>
          {depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="form-control" style={{ width: 140 }} value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <select className="form-control" style={{ width: 140 }} value={filters.passFilter} onChange={(e) => setFilters({ ...filters, passFilter: e.target.value })}>
          <option value="">All Results</option>
          <option value="pass">Pass Only</option>
          <option value="fail">Fail Only</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <GraduationCap />
            <h3>No students found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Semester</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td><span className="mono" style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{s.rollNo}</span></td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.departmentId?.name || '—'}</td>
                    <td>Semester {s.semester}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-outline btn-xs" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                          <button className="btn btn-danger btn-xs" onClick={() => remove(s._id)} disabled={deleting === s._id}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal.open} onClose={closeModal} title={modal.editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={save}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input className="form-control" required value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} placeholder="CS2024001" />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">Select department…</option>
                {depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="form-control" required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                <option value="">Select semester…</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
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
