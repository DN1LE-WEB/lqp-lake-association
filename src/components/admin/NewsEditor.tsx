import { useState, useRef, useCallback } from 'react';
import Editor from './Editor';

interface Props {
  id: string;
  title: string;
  content: string;
  image_url: string;
  visible: boolean;
}

export default function NewsEditor({ id, title, content, image_url, visible }: Props) {
  const isNew = id === 'new';

  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentContent, setCurrentContent] = useState(content);
  const [currentImageUrl, setCurrentImageUrl] = useState(image_url);
  const [currentVisible, setCurrentVisible] = useState(visible);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCurrentImageUrl(data.url);
    } catch {
      alert('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleSave = async () => {
    if (!currentTitle.trim()) {
      alert('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: currentTitle,
        content: currentContent,
        image_url: currentImageUrl || null,
        visible: currentVisible,
      };

      let res: Response;
      if (isNew) {
        res = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/news/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        if (isNew) {
          const data = await res.json();
          window.location.href = `/admin/news/${data.id}`;
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
    if (!confirm('Are you sure you want to delete this news item? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/admin/news';
      } else {
        alert('Failed to delete. Please try again.');
      }
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
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
          placeholder="News Title"
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

      {/* Image upload */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Featured Image
        </label>
        {currentImageUrl ? (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
            <img
              src={currentImageUrl}
              alt="Preview"
              style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
            />
            <button
              onClick={() => setCurrentImageUrl('')}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: '24px',
                textAlign: 'center',
              }}
              title="Remove image"
            >
              x
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: 8,
              padding: '32px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#9ca3af',
              fontSize: 14,
              transition: 'border-color 0.2s',
            }}
          >
            {uploading ? 'Uploading...' : 'Click or drag an image here to upload'}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Content editor */}
      <Editor content={currentContent} onChange={setCurrentContent} placeholder="Write news content..." />
    </div>
  );
}
