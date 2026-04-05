import { useState, useEffect } from 'react';
import Editor from './Editor';

interface Photo {
  id: number;
  tournament_id: number;
  url: string;
  caption: string;
  sort_order: number;
}

interface Document {
  id: number;
  tournament_id: number;
  title: string;
  url: string;
  file_type: string;
  sort_order: number;
}

interface Props {
  id: string;
  title: string;
  year: number;
  annual_number: string;
  date: string;
  content: string;
  visible: boolean;
  results_url: string;
  roster: string;
}

export default function TournamentEditor({ id, title, year, annual_number, date, content, visible, results_url, roster }: Props) {
  const isNew = id === 'new';

  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentYear, setCurrentYear] = useState(year);
  const [currentAnnualNumber, setCurrentAnnualNumber] = useState(annual_number);
  const [currentDate, setCurrentDate] = useState(date);
  const [currentContent, setCurrentContent] = useState(content);
  const [currentVisible, setCurrentVisible] = useState(visible);
  const [currentResultsUrl, setCurrentResultsUrl] = useState(results_url);
  const [currentRoster, setCurrentRoster] = useState(roster);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocFileType, setNewDocFileType] = useState('pdf');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchDocuments = () => {
    fetch(`/api/tournament-documents/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/tournament-photos/${id}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setPhotos(Array.isArray(data) ? data : []))
        .catch(() => {});
      fetchDocuments();
    }
  }, [id, isNew]);

  const handleAddDocument = async () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) {
      alert('Title and URL are required.');
      return;
    }
    try {
      const res = await fetch(`/api/tournament-documents/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDocTitle, url: newDocUrl, file_type: newDocFileType }),
      });
      if (res.ok) {
        setNewDocTitle('');
        setNewDocUrl('');
        setNewDocFileType('pdf');
        setShowAddDoc(false);
        fetchDocuments();
      } else {
        alert('Failed to add document.');
      }
    } catch {
      alert('Failed to add document.');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(`/api/tournament-documents/${id}?docId=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDocuments();
      } else {
        alert('Failed to delete document.');
      }
    } catch {
      alert('Failed to delete document.');
    }
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setNewDocUrl(data.url);
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf' || ext === 'docx' || ext === 'xlsx') {
          setNewDocFileType(ext);
        }
        if (!newDocTitle) {
          setNewDocTitle(file.name.replace(/\.[^.]+$/, ''));
        }
      } else {
        alert('Upload failed.');
      }
    } catch {
      alert('Upload failed.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSave = async () => {
    if (!currentTitle.trim()) {
      alert('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: currentTitle,
        year: currentYear,
        annual_number: currentAnnualNumber || null,
        date: currentDate || null,
        content: currentContent,
        visible: currentVisible,
        results_url: currentResultsUrl || null,
        roster: currentRoster || null,
      };

      let res: Response;
      if (isNew) {
        res = await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/tournaments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        if (isNew) {
          const data = await res.json();
          window.location.href = `/admin/tournaments/${data.id}`;
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tournament? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/admin/tournaments';
      } else {
        alert('Failed to delete. Please try again.');
      }
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
  };

  return (
    <div>
      {/* Header row */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: '"Zilla Slab", serif',
            border: 'none',
            borderBottom: '2px solid #e5e7eb',
            padding: '4px 0',
            width: '60%',
            minWidth: 200,
            outline: 'none',
            background: 'transparent',
          }}
          placeholder="Tournament Title"
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                background: deleting ? '#9ca3af' : '#dc2626',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#9ca3af' : saved ? '#16a34a' : '#3D7A68',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Visible toggle */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={currentVisible}
            onChange={(e) => setCurrentVisible(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#3D7A68' }}
          />
          <span style={{ fontWeight: 500 }}>Visible on website</span>
        </label>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Year</label>
          <input
            type="number"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Annual Number</label>
          <input
            type="text"
            value={currentAnnualNumber}
            onChange={(e) => setCurrentAnnualNumber(e.target.value)}
            placeholder='e.g. "46th"'
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Results URL */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Results URL</label>
        <input
          type="text"
          value={currentResultsUrl}
          onChange={(e) => setCurrentResultsUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/..."
          style={inputStyle}
        />
      </div>

      {/* Roster */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Roster (plain text, one entry per line)</label>
        <textarea
          value={currentRoster}
          onChange={(e) => setCurrentRoster(e.target.value)}
          placeholder="Team 1 - Name & Name&#10;Team 2 - Name & Name&#10;..."
          rows={8}
          style={{
            ...inputStyle,
            resize: 'vertical' as const,
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Documents section */}
      {!isNew && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Tournament Documents</label>
          {documents.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 6, background: '#fafafa' }}>
                  <span style={{ background: doc.file_type === 'pdf' ? '#fef2f2' : doc.file_type === 'docx' ? '#eff6ff' : '#f0fdf4', color: doc.file_type === 'pdf' ? '#dc2626' : doc.file_type === 'docx' ? '#2563eb' : '#16a34a', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const }}>{doc.file_type}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{doc.title}</span>
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3D7A68', textDecoration: 'none' }}>View</a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '2px 6px' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 12 }}>No documents yet.</p>
          )}

          {showAddDoc ? (
            <div style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 16, marginBottom: 8, background: '#fff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Title</label>
                  <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="e.g. Tournament Rules" style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Type</label>
                  <select value={newDocFileType} onChange={(e) => setNewDocFileType(e.target.value)} style={{ ...inputStyle, width: 100 }}>
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="xlsx">XLSX</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 4 }}>URL</label>
                <input type="text" value={newDocUrl} onChange={(e) => setNewDocUrl(e.target.value)} placeholder="https://... or upload a file below" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 4 }}>Or upload a file</label>
                <input type="file" accept=".pdf,.docx,.xlsx,.doc,.xls" onChange={handleDocFileUpload} disabled={uploadingDoc} style={{ fontSize: 13 }} />
                {uploadingDoc && <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>Uploading...</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddDocument} style={{ background: '#3D7A68', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Add Document
                </button>
                <button onClick={() => { setShowAddDoc(false); setNewDocTitle(''); setNewDocUrl(''); setNewDocFileType('pdf'); }} style={{ background: '#f3f4f6', color: '#374151', padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddDoc(true)} style={{ background: '#f3f4f6', color: '#374151', padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
              + Add Document
            </button>
          )}
        </div>
      )}

      {/* Photos section */}
      {!isNew && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Tournament Photos</label>
          {photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #d1d5db' }}>
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Tournament photo'}
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                  {photo.caption && (
                    <div style={{ padding: '4px 8px', fontSize: 12, color: '#6b7280' }}>{photo.caption}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 12 }}>No photos yet.</p>
          )}
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Photos are managed via the database. Place image files in <code>public/images/tournaments/</code> and add records to the <code>tournament_photos</code> table.
          </p>
        </div>
      )}

      {/* Content editor (rich text) */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Content</label>
        <Editor content={currentContent} onChange={setCurrentContent} placeholder="Tournament recap, details, results, download links..." />
      </div>
    </div>
  );
}
