import React, { useEffect, useState, useCallback } from 'react';
import { getMarks, createMark, updateMark, deleteMark, getStudents, getSubjects, getMySubjects, getMark } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useDraft } from '../hooks/useDraft';
import { Plus, Pencil, Trash2, FileText, AlertTriangle, Info } from 'lucide-react';

const GRADE_CLASS = { A: 'badge-a', B: 'badge-b', C: 'badge-c', D: 'badge-d', F: 'badge-f' };
const EMPTY = { studentId: '', subjectId: '', internalMarks: '', externalMarks: '' };

function ConflictModal({ open, conflict, onAcceptLatest, onOverwrite, onManualMerge, onClose }) {
  if (!conflict) return null;
  return (
    <Modal open={open} onClose={onClose} title="Concurrency Conflict Detected">
      <div className="modal-body">
        <div className="conflict-box">
          <h4><AlertTriangle size={16} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />Record Updated by Another User</h4>
          <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:12 }}>
            While you were editing, someone else updated this record. Choose how to proceed:
          </p>
          <div className="conflict-compare">
            <div className="conflict-col yours">
              <div className="label">Your Version (v{conflict.yourVersion})</div>
              <div style={{ fontSize:'0.85rem' }}>
                <div>Internal: <strong>{conflict.yourData?.internalMarks}</strong></div>
                <div>External: <strong>{conflict.yourData?.externalMarks}</strong></div>
              </div>
            </div>
            <div className="conflict-col theirs">
              <div className="label">Current (v{conflict.currentVersion})</div>
              <div style={{ fontSize:'0.85rem' }}>
                <div>Internal: <strong>{conflict.currentData?.internalMarks}</strong></div>
                <div>External: <strong>{conflict.currentData?.externalMarks}</strong></div>
                <div>Total: <strong>{conflict.currentData?.total}</strong></div>
                <div>Grade: <strong>{conflict.currentData?.grade}</strong></div>
              </div>
            </div>
          </div>
          <div className="conflict-actions">
            <button className="btn btn-outline btn-sm" onClick={onAcceptLatest}>Accept Latest</button>
            <button className="btn btn-danger btn-sm" onClick={onOverwrite}>Overwrite with Mine</button>
            <button className="btn btn-ghost btn-sm" onClick={onManualMerge}>Edit & Merge</button>
          </div>
        </div>
        <div className="alert alert-info" style={{ marginBottom:0 }}>
          <Info size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />
          <strong>Accept Latest</strong>: Discard your changes. <strong>Overwrite</strong>: Force your version. <strong>Edit & Merge</strong>: Manually reconcile.
        </div>
      </div>
    </Modal>
  );
}

export default function Marks() {
  const { isAdmin, isFaculty } = useAuth();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [conflictCtx, setConflictCtx] = useState(null);

  const { draft, setDraft, clearDraft, hasDraft } = useDraft('mark-entry', EMPTY);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, sRes, subRes] = await Promise.all([
        getMarks(),
        getStudents(),
        isFaculty ? getMySubjects() : getSubjects()
      ]);
      setMarks(mRes.data);
      setStudents(sRes.data);
      setSubjects(subRes.data);
    } catch { toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  }, [isFaculty]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    const initialForm = hasDraft ? draft : EMPTY;
    setForm(initialForm);
    setModal({ open: true, editing: null });
  };

  const openEdit = (m) => {
    const f = {
      studentId: m.studentId?._id || m.studentId,
      subjectId: m.subjectId?._id || m.subjectId,
      internalMarks: m.internalMarks,
      externalMarks: m.externalMarks,
      version: m.version
    };
    setForm(f);
    setModal({ open: true, editing: m });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
    clearDraft();
  };

  const handleFormChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (!modal.editing) setDraft(next);
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      if (modal.editing) {
        await updateMark(modal.editing._id, { internalMarks: Number(form.internalMarks), externalMarks: Number(form.externalMarks), version: form.version });
        toast.success('Marks updated');
        closeModal();
        load();
      } else {
        await createMark({ studentId: form.studentId, subjectId: form.subjectId, internalMarks: Number(form.internalMarks), externalMarks: Number(form.externalMarks) });
        toast.success('Marks saved');
        closeModal();
        load();
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const data = err.response.data;
        setConflictCtx({ id: modal.editing._id, yourData: { internalMarks: form.internalMarks, externalMarks: form.externalMarks } });
        setConflict(data);
        setModal((prev) => ({ ...prev, open: false }));
      } else if (err.response?.status === 403) {
        toast.error('⚠️ Access denied: You are not assigned to this subject');
      } else {
        toast.error(err.response?.data?.message || 'Save failed');
      }
    } finally { setSaving(false); }
  };

  const handleAcceptLatest = () => {
    toast('Accepted latest version');
    setConflict(null);
    setConflictCtx(null);
    load();
  };

  const handleOverwrite = async () => {
    setSaving(true);
    try {
      await updateMark(conflictCtx.id, {
        internalMarks: Number(conflictCtx.yourData.internalMarks),
        externalMarks: Number(conflictCtx.yourData.externalMarks),
        version: conflict.currentVersion
      });
      toast.success('Overwritten with your values');
      setConflict(null);
      setConflictCtx(null);
      load();
    } catch { toast.error('Overwrite failed'); }
    finally { setSaving(false); }
  };

  const handleManualMerge = () => {
    setForm({
      ...form,
      internalMarks: conflictCtx.yourData.internalMarks,
      externalMarks: conflictCtx.yourData.externalMarks,
      version: conflict.currentVersion
    });
    setConflict(null);
    setConflictCtx(null);
    setModal((m) => ({ ...m, open: true }));
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this mark entry?')) return;
    try { await deleteMark(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Marks Entry</h1>
          <p>{isFaculty ? 'Enter marks for your assigned subjects' : 'Manage all mark entries'}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Add Mark Entry</button>
      </div>

      {hasDraft && !modal.open && (
        <div className="alert alert-warning" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>📝 You have an unsaved draft. It will be restored when you open the form.</span>
          <button className="btn btn-ghost btn-xs" onClick={clearDraft}>Clear Draft</button>
        </div>
      )}

      <div className="card" style={{ padding:0 }}>
        {loading ? <div className="loading"><div className="spinner" /></div> :
          marks.length === 0 ? (
            <div className="empty-state"><FileText /><h3>No mark entries</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th><th>Roll No</th><th>Subject</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th><th>Ver</th>
                    {(isAdmin || isFaculty) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m) => (
                    <tr key={m._id}>
                      <td style={{ fontWeight:500 }}>{m.studentId?.name}</td>
                      <td><span className="mono" style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{m.studentId?.rollNo}</span></td>
                      <td>{m.subjectId?.name} <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>({m.subjectId?.code})</span></td>
                      <td>{m.internalMarks}/{m.subjectId?.maxInternal}</td>
                      <td>{m.externalMarks}/{m.subjectId?.maxExternal}</td>
                      <td style={{ fontWeight:600 }}>{m.total}</td>
                      <td><span className={`badge ${GRADE_CLASS[m.grade] || ''}`}>{m.grade}</span></td>
                      <td><span className="mono" style={{ fontSize:'0.78rem', color:'var(--text-dim)' }}>v{m.version}</span></td>
                      {(isAdmin || isFaculty) && (
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button className="btn btn-outline btn-xs" onClick={() => openEdit(m)}><Pencil size={13} /></button>
                            {isAdmin && <button className="btn btn-danger btn-xs" onClick={() => remove(m._id)}><Trash2 size={13} /></button>}
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

      <Modal open={modal.open} onClose={closeModal} title={modal.editing ? 'Edit Mark Entry' : 'Add Mark Entry'}>
        <form onSubmit={save}>
          <div className="modal-body">
            {!modal.editing && (
              <>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-control" required value={form.studentId} onChange={(e) => handleFormChange('studentId', e.target.value)}>
                    <option value="">Select student…</option>
                    {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.rollNo})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-control" required value={form.subjectId} onChange={(e) => handleFormChange('subjectId', e.target.value)}>
                    <option value="">Select subject…</option>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              </>
            )}
            {modal.editing && (
              <div className="alert alert-info" style={{ marginBottom:16 }}>
                <strong>{modal.editing.studentId?.name}</strong> — {modal.editing.subjectId?.name} (v{form.version})
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Internal Marks</label>
                <input className="form-control" type="number" required min={0} value={form.internalMarks} onChange={(e) => handleFormChange('internalMarks', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">External Marks</label>
                <input className="form-control" type="number" required min={0} value={form.externalMarks} onChange={(e) => handleFormChange('externalMarks', e.target.value)} />
              </div>
            </div>
            <div className="alert alert-info" style={{ marginBottom:0 }}>
              <Info size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />
              Grade is calculated server-side. Concurrency conflicts will be detected automatically.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Marks'}</button>
          </div>
        </form>
      </Modal>

      <ConflictModal
        open={!!conflict}
        conflict={conflict}
        onAcceptLatest={handleAcceptLatest}
        onOverwrite={handleOverwrite}
        onManualMerge={handleManualMerge}
        onClose={() => { setConflict(null); setConflictCtx(null); }}
      />
    </div>
  );
}
