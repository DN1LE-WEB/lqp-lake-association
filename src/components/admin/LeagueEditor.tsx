import { useState, useRef } from 'react';

interface Week {
  id: number | null;
  week_number: number;
  title: string;
  date: string;
  content: string;
}

interface Photo {
  id: number;
  league_id: number;
  week_id: number | null;
  url: string;
  caption: string;
  sort_order: number;
}

interface Props {
  id: string;
  title: string;
  year: number;
  results_url: string;
  content: string;
  visible: boolean;
  roster: string;
  show_gallery: boolean;
  end_of_year_results: string;
  weeks: Week[];
  photos: Photo[];
}

// Collapsible section component
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f8fafc',
          border: 'none',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: '#0F1B2D',
          fontFamily: '"Zilla Slab", serif',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 12, color: '#6b7280', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>&#9660;</span>
      </button>
      {open && (
        <div style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function LeagueEditor({ id, title, year, results_url, content, visible, roster, show_gallery, end_of_year_results, weeks: initialWeeks, photos: initialPhotos }: Props) {
  const isNew = id === 'new';

  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentYear, setCurrentYear] = useState(year);
  const [currentResultsUrl, setCurrentResultsUrl] = useState(results_url);
  const [currentContent, setCurrentContent] = useState(content);
  const [currentVisible, setCurrentVisible] = useState(visible);
  const [currentRoster, setCurrentRoster] = useState(roster);
  const [currentShowGallery, setCurrentShowGallery] = useState(show_gallery);
  const [currentEndOfYear, setCurrentEndOfYear] = useState(end_of_year_results);
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks || []);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null); // tracks which section is uploading
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({});

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    fontFamily: '"DM Sans", sans-serif',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 120,
    resize: 'vertical' as const,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 1.6,
  };

  const btnPrimary: React.CSSProperties = {
    background: '#3D7A68',
    color: 'white',
    padding: '10px 24px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
  };

  const btnDanger: React.CSSProperties = {
    background: '#dc2626',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  };

  const btnSecondary: React.CSSProperties = {
    background: 'white',
    color: '#0F1B2D',
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
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
        results_url: currentResultsUrl || null,
        content: currentContent,
        visible: currentVisible,
        roster: currentRoster,
        show_gallery: currentShowGallery,
        end_of_year_results: currentEndOfYear,
        weeks: weeks.map((w, i) => ({
          id: w.id,
          week_number: i + 1,
          title: w.title,
          date: w.date,
          content: w.content,
        })),
      };

      let res: Response;
      if (isNew) {
        res = await fetch('/api/league', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/league/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        if (isNew) {
          const data = await res.json();
          window.location.href = `/admin/league/${data.id}`;
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
    if (!confirm('Are you sure you want to delete this season? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/league/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/admin/league';
      } else {
        alert('Failed to delete. Please try again.');
      }
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Week management
  const addWeek = () => {
    const nextNum = weeks.length + 1;
    setWeeks([...weeks, { id: null, week_number: nextNum, title: `Week ${nextNum}`, date: '', content: '' }]);
    setOpenWeeks({ ...openWeeks, [weeks.length]: true });
  };

  const updateWeek = (index: number, field: keyof Week, value: string | number) => {
    const updated = [...weeks];
    (updated[index] as any)[field] = value;
    setWeeks(updated);
  };

  const deleteWeek = (index: number) => {
    if (!confirm('Delete this week?')) return;
    const updated = weeks.filter((_, i) => i !== index);
    setWeeks(updated);
  };

  const toggleWeek = (index: number) => {
    setOpenWeeks({ ...openWeeks, [index]: !openWeeks[index] });
  };

  // Photo upload
  const uploadFile = async (file: File): Promise<{ url: string } | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return null;
  };

  const handlePhotoUpload = async (files: FileList | null, weekId: number | null, sectionKey: string) => {
    if (!files || files.length === 0 || isNew) return;
    setUploadingPhoto(sectionKey);
    for (const file of Array.from(files)) {
      const result = await uploadFile(file);
      if (result) {
        const res = await fetch(`/api/league/${id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.url, caption: '', week_id: weekId }),
        });
        if (res.ok) {
          const data = await res.json();
          setPhotos(prev => [...prev, { id: data.id, league_id: Number(id), week_id: weekId, url: result.url, caption: '', sort_order: prev.length }]);
        }
      }
    }
    setUploadingPhoto(null);
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`/api/league/${id}/photos?photoId=${photoId}`, { method: 'DELETE' });
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    }
  };

  // Photo grid component
  const PhotoGrid = ({ weekId, sectionKey }: { weekId: number | null; sectionKey: string }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const sectionPhotos = photos.filter(p => weekId === null ? p.week_id === null : p.week_id === weekId);
    const isUploading = uploadingPhoto === sectionKey;

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {sectionPhotos.map(photo => (
            <div key={photo.id} style={{ position: 'relative', width: 100, height: 100, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <img src={photo.url} alt={photo.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => deletePhoto(photo.id)}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(220,38,38,0.85)', color: 'white',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
                title="Delete photo"
              >
                x
              </button>
            </div>
          ))}
        </div>
        {!isNew && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handlePhotoUpload(e.target.files, weekId, sectionKey)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              style={{ ...btnSecondary, opacity: isUploading ? 0.6 : 1 }}
            >
              {isUploading ? 'Uploading...' : 'Upload Photos'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header row with save/delete */}
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
          placeholder="Season Title"
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ ...btnDanger, opacity: deleting ? 0.6 : 1, cursor: deleting ? 'not-allowed' : 'pointer' }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...btnPrimary,
              background: saving ? '#9ca3af' : saved ? '#16a34a' : '#3D7A68',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Header fields */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
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
          <label style={labelStyle}>Results URL</label>
          <input
            type="text"
            value={currentResultsUrl}
            onChange={(e) => setCurrentResultsUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/..."
            style={inputStyle}
          />
        </div>
      </div>

      {/* Roster section */}
      <Section title="Roster">
        <label style={labelStyle}>Roster entries (one per line)</label>
        <textarea
          value={currentRoster}
          onChange={(e) => setCurrentRoster(e.target.value)}
          style={textareaStyle}
          placeholder={"1. Name - Name\n2. Name - Name\n..."}
        />
      </Section>

      {/* Weekly Results section */}
      <Section title={`Weekly Results (${weeks.length} weeks)`} defaultOpen={true}>
        {weeks.map((week, index) => (
          <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => toggleWeek(index)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: '#0F1B2D',
              }}
            >
              <span>{week.title || `Week ${index + 1}`}{week.date ? ` - ${week.date}` : ''}</span>
              <span style={{ fontSize: 11, color: '#6b7280', transform: openWeeks[index] ? 'rotate(180deg)' : 'rotate(0deg)' }}>&#9660;</span>
            </button>
            {openWeeks[index] && (
              <div style={{ padding: 14, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input
                      type="text"
                      value={week.title}
                      onChange={(e) => updateWeek(index, 'title', e.target.value)}
                      style={inputStyle}
                      placeholder={`Week ${index + 1}`}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input
                      type="text"
                      value={week.date}
                      onChange={(e) => updateWeek(index, 'date', e.target.value)}
                      style={inputStyle}
                      placeholder="5/21/13"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Content</label>
                  <textarea
                    value={week.content}
                    onChange={(e) => updateWeek(index, 'content', e.target.value)}
                    style={{ ...textareaStyle, minHeight: 150 }}
                    placeholder="Weekly recap..."
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Photos</label>
                  <PhotoGrid weekId={week.id} sectionKey={`week-${index}`} />
                </div>
                <button
                  type="button"
                  onClick={() => deleteWeek(index)}
                  style={{ ...btnDanger, fontSize: 12, padding: '6px 12px' }}
                >
                  Delete Week
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addWeek}
          style={{ ...btnSecondary, marginTop: 4 }}
        >
          + Add Week
        </button>
      </Section>

      {/* End of Year Results section */}
      <Section title="End of Year Results">
        <label style={labelStyle}>End of year summary</label>
        <textarea
          value={currentEndOfYear}
          onChange={(e) => setCurrentEndOfYear(e.target.value)}
          style={{ ...textareaStyle, minHeight: 150 }}
          placeholder="Final standings, awards, etc..."
        />
      </Section>

      {/* Photo Gallery section */}
      <Section title="Photo Gallery">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={currentShowGallery}
            onChange={(e) => setCurrentShowGallery(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#3D7A68' }}
          />
          <span style={{ fontWeight: 500 }}>Show Photo Gallery on public page</span>
        </label>
        {currentShowGallery && (
          <div>
            <label style={labelStyle}>Season Photos (not tied to a specific week)</label>
            <PhotoGrid weekId={null} sectionKey="gallery" />
          </div>
        )}
      </Section>
    </div>
  );
}
