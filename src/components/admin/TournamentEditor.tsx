import { useState, useEffect } from 'react';
import Editor from './Editor';

interface Photo {
  id: number;
  tournament_id: number;
  url: string;
  caption: string;
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
  writeup: string;
}

export default function TournamentEditor({ id, title, year, annual_number, date, content, visible, results_url, roster, writeup }: Props) {
  const isNew = id === 'new';

  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentYear, setCurrentYear] = useState(year);
  const [currentAnnualNumber, setCurrentAnnualNumber] = useState(annual_number);
  const [currentDate, setCurrentDate] = useState(date);
  const [currentContent, setCurrentContent] = useState(content);
  const [currentVisible, setCurrentVisible] = useState(visible);
  const [currentResultsUrl, setCurrentResultsUrl] = useState(results_url);
  const [currentRoster, setCurrentRoster] = useState(roster);
  const [currentWriteup, setCurrentWriteup] = useState(writeup);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/tournament-photos/${id}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setPhotos(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [id, isNew]);

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
        writeup: currentWriteup || null,
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

      {/* Writeup */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Writeup (plain text)</label>
        <textarea
          value={currentWriteup}
          onChange={(e) => setCurrentWriteup(e.target.value)}
          placeholder="Tournament recap or description..."
          rows={6}
          style={{
            ...inputStyle,
            resize: 'vertical' as const,
            fontFamily: 'inherit',
          }}
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
        <label style={labelStyle}>Rich Content (optional)</label>
        <Editor content={currentContent} onChange={setCurrentContent} placeholder="Tournament details, results, download links..." />
      </div>
    </div>
  );
}
