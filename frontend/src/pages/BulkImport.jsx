import React, { useState, useRef } from 'react';
import { bulkImportCSV } from '../api/services';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Download } from 'lucide-react';

const STATUS_BADGE = {
  created: 'badge-created',
  updated: 'badge-updated',
  skipped: 'badge-skipped',
  failed: 'badge-failed',
};

export default function BulkImport() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) { setFile(f); setResult(null); }
    else toast.error('Please select a CSV file');
  };

  const upload = async () => {
    if (!file) return toast.error('No file selected');
    setLoading(true);
    try {
      const res = await bulkImportCSV(file);
      setResult(res.data);
      toast.success(`Import done: ${res.data.created} created, ${res.data.updated} updated`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setLoading(false); }
  };

  const downloadSample = () => {
    const csv = `roll_no,subject_code,internal_marks,external_marks
CS2024001,CS101,35,55
CS2024001,CS102,30,48
CS2024002,CS101,28,52
CS2024002,CS102,32,49`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sample_marks.csv'; a.click();
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Bulk CSV Import</h1>
          <p>Import marks for a class from a CSV file. Import is idempotent — uploading the same file twice won't create duplicates.</p>
        </div>
        <button className="btn btn-outline" onClick={downloadSample}><Download size={16} />Sample CSV</button>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontFamily:'DM Sans', fontWeight:600, marginBottom:12 }}>CSV Format Requirements</h3>
        <div className="alert alert-info" style={{ marginBottom:12 }}>
          Required columns: <code style={{ background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4 }}>roll_no</code>, <code style={{ background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4 }}>subject_code</code>, <code style={{ background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4 }}>internal_marks</code>, <code style={{ background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4 }}>external_marks</code>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>roll_no</th><th>subject_code</th><th>internal_marks</th><th>external_marks</th></tr></thead>
            <tbody>
              <tr><td className="mono">CS2024001</td><td className="mono">CS101</td><td>35</td><td>55</td></tr>
              <tr><td className="mono">CS2024002</td><td className="mono">CS101</td><td>28</td><td>52</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current.click()}
        style={{ marginBottom:20 }}
      >
        <Upload size={40} style={{ margin:'0 auto 12px', color: dragOver ? 'var(--primary)' : 'var(--text-muted)' }} />
        <p style={{ fontWeight:600, marginBottom:4 }}>{file ? file.name : 'Drop CSV here or click to browse'}</p>
        <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{file ? `${(file.size/1024).toFixed(1)} KB` : 'Supports .csv files up to 5MB'}</p>
        <input ref={inputRef} type="file" accept=".csv" style={{ display:'none' }} onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {file && (
        <div style={{ display:'flex', gap:10, marginBottom:24 }}>
          <button className="btn btn-primary" onClick={upload} disabled={loading}>
            {loading ? <><RefreshCw size={16} style={{ animation:'spin 0.7s linear infinite' }} />Importing…</> : <><Upload size={16} />Import CSV</>}
          </button>
          <button className="btn btn-outline" onClick={() => { setFile(null); setResult(null); }}>Clear</button>
        </div>
      )}

      {result && (
        <div>
          <div className="stat-grid" style={{ marginBottom:20 }}>
            <div className="stat-card green"><div className="stat-label">Created</div><div className="stat-value">{result.created}</div></div>
            <div className="stat-card blue"><div className="stat-label">Updated</div><div className="stat-value">{result.updated}</div></div>
            <div className="stat-card amber"><div className="stat-label">Skipped</div><div className="stat-value">{result.skipped}</div><div className="stat-sub">Already identical</div></div>
            <div className="stat-card red"><div className="stat-label">Failed</div><div className="stat-value">{result.failed}</div></div>
          </div>

          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:'0.85rem', color:'var(--text-muted)', display:'flex', justifyContent:'space-between' }}>
              <span>Row-by-Row Results</span>
              <span>{result.total} total rows</span>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Row</th><th>Roll No</th><th>Subject Code</th><th>Status</th><th>Detail</th></tr></thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ fontSize:'0.8rem', color:'var(--text-dim)' }}>{r.row}</td>
                      <td className="mono" style={{ fontSize:'0.82rem' }}>{r.rollNo}</td>
                      <td className="mono" style={{ fontSize:'0.82rem' }}>{r.subjectCode}</td>
                      <td><span className={`badge ${STATUS_BADGE[r.status] || ''}`}>{r.status}</span></td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{r.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
