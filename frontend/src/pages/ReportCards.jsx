import React, { useEffect, useState, useCallback } from 'react';
import { getStudents, getStudentReportCards, getFullReportCard, publishReportCard, unpublishReportCard } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FileText, Eye, CheckCircle, XCircle, GraduationCap } from 'lucide-react';

const GRADE_CLASS = { A: 'badge-a', B: 'badge-b', C: 'badge-c', D: 'badge-d', F: 'badge-f' };
const display = (value, fallback = '-') => value ?? fallback;
const shortId = (value) => {
  if (!value) return '-';
  if (typeof value === 'string') return value.substring(0, 8);
  return value?._id ? String(value._id).substring(0, 8) : '-';
};

function FullReportCard({ data }) {
  if (!data) return null;
  const { student } = data;
  const marks = Array.isArray(data.marks) ? data.marks : [];
  const summary = data.summary || { totalObtained: 0, totalMaximum: 0, percentage: 0, result: 'N/A' };
  const pct = summary.percentage;
  const barColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--danger)';

  return (
    <div className="report-card-view">
      <div className="report-card-header">
        <h2>{student.name}</h2>
        <p>Academic Report Card</p>
        <div className="report-meta">
          <div className="report-meta-item"><div className="label">Roll No</div><div className="value">{student.rollNo}</div></div>
          <div className="report-meta-item"><div className="label">Department</div><div className="value">{student.department}</div></div>
          <div className="report-meta-item"><div className="label">Semester</div><div className="value">{student.semester}</div></div>
          <div className="report-meta-item"><div className="label">Result</div><div className="value" style={{ color: summary.result === 'PASS' ? 'var(--success)' : 'var(--danger)' }}>{summary.result}</div></div>
        </div>
      </div>
      <div style={{ padding: 24 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Subject Code</th><th>Subject</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th><th>Progress</th></tr>
            </thead>
            <tbody>
              {marks.length ? marks.map((m, index) => (
                <tr key={m.subjectId ?? index}>
                  <td><span className="mono" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>{m.subjectCode || shortId(m.subjectId)}</span></td>
                  <td style={{ fontWeight: 500 }}>{m.subjectName || 'Unknown Subject'}</td>
                  <td>{display(m.internalMarks, 0)}</td>
                  <td>{display(m.externalMarks, 0)}</td>
                  <td style={{ fontWeight: 600 }}>{display(m.total, 0)}</td>
                  <td><span className={`badge ${GRADE_CLASS[m.grade] || ''}`}>{display(m.grade, 'N/A')}</span></td>
                  <td style={{ width: 120 }}>
                    <div className="marks-bar">
                      <div className="marks-bar-fill" style={{ width: `${Math.min(100, m.total)}%`, background: m.grade === 'F' ? 'var(--danger)' : 'var(--success)' }} />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                    No mark details available for this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
          <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Obtained</div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{summary.totalObtained}</div></div>
          <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maximum</div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{summary.totalMaximum}</div></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Percentage</div>
            <div className="marks-bar" style={{ height: 8 }}>
              <div className="marks-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: barColor }}>{pct}%</div>
        </div>
      </div>
    </div>
  );
}

export default function ReportCards() {
  const { isAdmin, isStudent, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportCards, setReportCards] = useState([]);
  const [fullCard, setFullCard] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isStudent) {
        const res = await getStudents();
        setStudents(res.data);
      }
    } catch { }
    finally { setLoading(false); }
  }, [isStudent]);

  useEffect(() => { load(); }, [load]);

  const loadStudentCards = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await getStudentReportCards(student._id);
      setReportCards(res.data);
    } catch { toast.error('Failed to load report cards'); }
  };

  const viewFull = async (studentId, semester) => {
    try {
      const res = await getFullReportCard(studentId, semester);
      setFullCard(res.data);
      setViewModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    }
  };

  const togglePublish = async (studentId, semester, isPublished) => {
    try {
      if (isPublished) { await unpublishReportCard(studentId, semester); toast.success('Unpublished'); }
      else { await publishReportCard(studentId, semester); toast.success('Published'); }
      loadStudentCards(selectedStudent);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const publishAll = async (student) => {
    for (let sem = 1; sem <= (student.semester || 1); sem++) {
      try { await publishReportCard(student._id, sem); } catch { }
    }
    toast.success(`Published semesters 1–${student.semester}`);
    loadStudentCards(student);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (isStudent) {
    return (
      <div>
        <div className="page-header"><h1>My Report Cards</h1><p>View your published academic report cards</p></div>
        <div className="alert alert-info">Select a semester from the list below to view your report card.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <button key={sem} className="card card-sm" style={{ cursor: 'pointer', border: '1px solid var(--border)', textAlign: 'center', background: 'none', color: 'var(--text)', width: '100%' }}
              onClick={() => {
                if (user?.studentId) {
                  viewFull(user.studentId, sem);
                } else {
                  toast.error('Student profile not found');
                }
              }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>📋</div>
              <div style={{ fontWeight: 600 }}>Semester {sem}</div>
            </button>
          ))}
        </div>
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Report Card" size="lg">
          <div className="modal-body">{fullCard && <FullReportCard data={fullCard} />}</div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>Report Cards</h1><p>Publish and manage student report cards</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Student
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {students.map((s) => (
                <button key={s._id} onClick={() => loadStudentCards(s)}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: selectedStudent?._id === s._id ? 'var(--primary-glow)' : 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', color: selectedStudent?._id === s._id ? 'var(--primary)' : 'var(--text)', transition: 'all 0.1s' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.rollNo} · Sem {s.semester}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {!selectedStudent ? (
            <div className="card">
              <div className="empty-state"><GraduationCap /><h3>Select a student</h3><p>Choose a student from the list to manage their report cards</p></div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: 'DM Sans', fontWeight: 600 }}>{selectedStudent.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{selectedStudent.rollNo} · {selectedStudent.departmentId?.name}</div>
                </div>
                {isAdmin && <button className="btn btn-success btn-sm" onClick={() => publishAll(selectedStudent)}><CheckCircle size={14} />Publish All Sems</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                  const rc = reportCards.find((r) => r.semester === sem);
                  return (
                    <div key={sem} className="card card-sm">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontWeight: 600 }}>Semester {sem}</span>
                        <span className={`badge ${rc?.isPublished ? 'badge-published' : 'badge-draft'}`}>{rc?.isPublished ? 'Published' : 'Draft'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => viewFull(selectedStudent._id, sem)}>
                          <Eye size={12} />View
                        </button>
                        {isAdmin && (
                          <button className={`btn btn-xs ${rc?.isPublished ? 'btn-danger' : 'btn-success'}`} onClick={() => togglePublish(selectedStudent._id, sem, rc?.isPublished)}>
                            {rc?.isPublished ? <><XCircle size={12} />Unpublish</> : <><CheckCircle size={12} />Publish</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Full Report Card" size="lg">
        <div className="modal-body">{fullCard && <FullReportCard data={fullCard} />}</div>
      </Modal>
    </div>
  );
}
