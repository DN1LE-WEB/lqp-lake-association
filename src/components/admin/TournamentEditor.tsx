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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [editingCaptionId, setEditingCaptionId] = useState<number | null>(null);
  const [editingCaptionValue, setEditingCaptionValue] = useState('');
  const [dragPhotoId, setDragPhotoId] = useState<number | null>(null);
  const [dragOverPhotoId, setDragOverPhotoId] = useState<number | null>(null);

  const fetchDocuments = () => {
    fetch(`/api/tournament-documents/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const fetchPhotos = () => {
    fetch(`/api/tournament-photos/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPhotos(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isNew) {
      fetchPhotos();
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!upRes.ok) {
          alert(`Upload failed for ${file.name}.`);
          continue;
        }
        const upData = await upRes.json();
        const captionForThis = files.length === 1 ? newPhotoCaption : '';
        const addRes = await fetch(`/api/tournament-photos/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: upData.url, caption: captionForThis }),
        });
        if (!addRes.ok) {
          alert(`Failed to attach ${file.name}.`);
        }
      }
      setNewPhotoCaption('');
      fetchPhotos();
    } catch {
      alert('Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;
    try {
      const res = await fetch(`/api/tournament-photos/${id}?photoId=${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPhotos();
      } else {
        alert('Failed to delete photo.');
      }
    } catch {
      alert('Failed to delete photo.');
    }
  };

  const handleSaveCaption = async (photoId: number) => {
    try {
      const res = await fetch(`/api/tournament-photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photoId, caption: editingCaptionValue }),
      });
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption: editingCaptionValue } : p));
        setEditingCaptionId(null);
        setEditingCaptionValue('');
      } else {
        alert('Failed to save caption.');
      }
    } catch {
      alert('Failed to save caption.');
    }
  };

  const persistOrder = async (ordered: Photo[]) => {
    try {
      await fetch(`/api/tournament-photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: ordered.map(p => p.id) }),
      });
    } catch {
      alert('Failed to save new order.');
      fetchPhotos();
    }
  };

  const handlePhotoDrop = (targetId: number) => {
    if (dragPhotoId == null || dragPhotoId === targetId) return;
    setPhotos(prev => {
      const fromIdx = prev.findIndex(p => p.id === dragPhotoId);
      const toIdx = prev.findIndex(p => p.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      persistOrder(next);
      return next;
    });
    setDragPhotoId(null);
    setDragOverPhotoId(null);
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
              {photos.map((photo) => {
                const isDragging = dragPhotoId === photo.id;
                const isOver = dragOverPhotoId === photo.id && dragPhotoId !== photo.id;
                const isEditing = editingCaptionId === photo.id;
                return (
                  <div
                    key={photo.id}
                    draggable={!isEditing}
                    onDragStart={() => setDragPhotoId(photo.id)}
                    onDragOver={(e) => { e.preventDefault(); if (dragOverPhotoId !== photo.id) setDragOverPhotoId(photo.id); }}
                    onDragLeave={() => { if (dragOverPhotoId === photo.id) setDragOverPhotoId(null); }}
                    onDrop={(e) => { e.preventDefault(); handlePhotoDrop(photo.id); }}
                    onDragEnd={() => { setDragPhotoId(null); setDragOverPhotoId(null); }}
                    style={{
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: isOver ? '2px solid #3D7A68' : '1px solid #d1d5db',
                      background: '#fff',
                      opacity: isDragging ? 0.4 : 1,
                      cursor: isEditing ? 'default' : 'grab',
                      transition: 'border-color 0.15s, opacity 0.15s',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Tournament photo'}
                        style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        title="Delete photo"
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          fontSize: 14,
                          lineHeight: 1,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            type="text"
                            value={editingCaptionValue}
                            onChange={(e) => setEditingCaptionValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCaption(photo.id);
                              if (e.key === 'Escape') { setEditingCaptionId(null); setEditingCaptionValue(''); }
                            }}
                            autoFocus
                            placeholder="Caption"
                            style={{ flex: 1, fontSize: 12, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', minWidth: 0 }}
                          />
                          <button
                            onClick={() => handleSaveCaption(photo.id)}
                            style={{ background: '#3D7A68', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, padding: '0 8px', cursor: 'pointer' }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => { setEditingCaptionId(photo.id); setEditingCaptionValue(photo.caption || ''); }}
                          style={{ fontSize: 12, color: photo.caption ? '#374151' : '#9ca3af', cursor: 'text', minHeight: 18 }}
                        >
                          {photo.caption || 'Add caption…'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 12 }}>No photos yet.</p>
          )}

          <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                style={{ fontSize: 13 }}
              />
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="Caption (single upload only)"
                disabled={uploadingPhoto}
                style={{ ...inputStyle, flex: 1, minWidth: 180, padding: '6px 10px', fontSize: 13 }}
              />
              {uploadingPhoto && <span style={{ fontSize: 12, color: '#6b7280' }}>Uploading…</span>}
            </div>
            {photos.length > 1 && (
              <p style={{ fontSize: 11, color: '#6b7280', margin: '8px 0 0 0' }}>
                Drag photos to reorder. Click a caption to edit it.
              </p>
            )}
          </div>
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
