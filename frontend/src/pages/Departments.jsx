import React, { useEffect, useState } from 'react';
import { getDepartments, createDepartment, deleteDepartment } from '../api/services';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Trash2, Building2 } from 'lucide-react';

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await getDepartments(); setDepts(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createDepartment(form); toast.success('Department created'); setModal(false); setForm({ name: '', code: '' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await deleteDepartment(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1>Departments</h1><p>Manage college departments</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} />Add Department</button>
      </div>
      <div className="card" style={{ padding:0 }}>
        {loading ? <div className="loading"><div className="spinner" /></div> :
          depts.length === 0 ? (
            <div className="empty-state"><Building2 /><h3>No departments</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Actions</th></tr></thead>
                <tbody>
                  {depts.map((d) => (
                    <tr key={d._id}>
                      <td><span className="mono" style={{ color:'var(--primary)', fontSize:'0.82rem' }}>{d.code}</span></td>
                      <td style={{ fontWeight:500 }}>{d.name}</td>
                      <td><button className="btn btn-danger btn-xs" onClick={() => remove(d._id)}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Add Department">
        <form onSubmit={save}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Name</label><input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" /></div>
            <div className="form-group"><label className="form-label">Code</label><input className="form-control" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CS" /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
