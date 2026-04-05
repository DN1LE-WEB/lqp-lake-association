import { useState, useRef, useCallback } from 'react';

interface Photo {
  id?: number;
  url: string;
  caption: string;
  sort_order: number;
  _uploading?: boolean;
  _progress?: number;
  _tempId?: string;
}

interface Props {
  id: string;
  title: string;
  description: string;
  visible: boolean;
  photos: Photo[];
}

export default function GalleryEditor({ id, title, description, visible, photos: initialPhotos }: Props) {
  const isNew = id === 'new';

  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentDescription, setCurrentDescription] = useState(description);
  const [currentVisible, setCurrentVisible] = useState(visible);
  const [photos, setPhotos] = useState<Photo[]>(
    initialPhotos.map((p, i) => ({ ...p, sort_order: p.sort_order ?? i }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<{ url: string } | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Add placeholder entries
    const tempPhotos: Photo[] = imageFiles.map((file, i) => ({
      url: '',
      caption: '',
      sort_order: photos.length + i,
      _uploading: true,
      _progress: 0,
      _tempId: `temp-${Date.now()}-${i}`,
    }));

    setPhotos(prev => [...prev, ...tempPhotos]);

    // Upload all in parallel
    const results = await Promise.all(
      imageFiles.map(async (file, i) => {
        const tempId = tempPhotos[i]._tempId!;
        // Simulate progress: set to 50% when starting
        setPhotos(prev =>
          prev.map(p => p._tempId === tempId ? { ...p, _progress: 50 } : p)
        );

        const result = await uploadFile(file);

        if (result) {
          // Upload succeeded - update the photo entry
          setPhotos(prev =>
            prev.map(p =>
              p._tempId === tempId
                ? { ...p, url: result.url, _uploading: false, _progress: 100 }
                : p
            )
          );

          // If editing existing album, also add the photo to the DB
          if (!isNew) {
            try {
              const res = await fetch(`/api/gallery/${id}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: result.url,
                  caption: '',
                  sort_order: photos.length + i,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                // Update the photo with the server-assigned ID
                setPhotos(prev =>
                  prev.map(p =>
                    p._tempId === tempId
                      ? { ...p, id: data.id, _tempId: undefined }
                      : p
                  )
                );
              }
            } catch {
              // Photo was uploaded but DB insert failed - will be saved on next Save
            }
          }
          return { tempId, url: result.url };
        } else {
          // Upload failed - remove the placeholder
          setPhotos(prev => prev.filter(p => p._tempId !== tempId));
          return null;
        }
      })
    );
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFiles(Array.from(files));
  }, [photos.length, id, isNew]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const updateCaption = (index: number, caption: string) => {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, caption } : p));
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (photo.id && !isNew) {
      // Delete from server
      try {
        await fetch(`/api/gallery/${id}/photos?photoId=${photo.id}`, { method: 'DELETE' });
      } catch {
        alert('Failed to delete photo.');
        return;
      }
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentTitle.trim()) {
      alert('Album title is required.');
      return;
    }

    setSaving(true);
    try {
      const albumBody = {
        title: currentTitle,
        description: currentDescription,
        visible: currentVisible,
      };

      let albumId = id;

      if (isNew) {
        // Create album
        const res = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(albumBody),
        });
        if (!res.ok) throw new Error('Failed to create album');
        const data = await res.json();
        albumId = String(data.id);

        // Add all photos to the new album
        const validPhotos = photos.filter(p => p.url && !p._uploading);
        for (const photo of validPhotos) {
          await fetch(`/api/gallery/${albumId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: photo.url,
              caption: photo.caption,
              sort_order: photo.sort_order,
            }),
          });
        }

        window.location.href = `/admin/gallery/${albumId}`;
      } else {
        // Update album
        const res = await fetch(`/api/gallery/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(albumBody),
        });
        if (!res.ok) throw new Error('Failed to update album');

        // Save photo captions and sort orders
        const existingPhotos = photos.filter(p => p.id && !p._uploading);
        if (existingPhotos.length > 0) {
          await fetch(`/api/gallery/${id}/photos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photos: existingPhotos.map((p, i) => ({
                id: p.id,
                caption: p.caption,
                sort_order: i,
              })),
            }),
          });
        }

        // Add any new photos that don't have IDs yet
        const newPhotos = photos.filter(p => !p.id && p.url && !p._uploading);
        for (const photo of newPhotos) {
          await fetch(`/api/gallery/${id}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: photo.url,
              caption: photo.caption,
              sort_order: photo.sort_order,
            }),
          });
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this album and all its photos? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/admin/gallery';
      } else {
        alert('Failed to delete. Please try again.');
      }
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const uploadingCount = photos.filter(p => p._uploading).length;

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
          placeholder="Album Title"
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
              {deleting ? 'Deleting...' : 'Delete Album'}
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
            {saving ? 'Saving...' : saved ? 'Saved!' : isNew ? 'Create Album' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Description
        </label>
        <textarea
          value={currentDescription}
          onChange={(e) => setCurrentDescription(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: '"DM Sans", sans-serif',
            resize: 'vertical',
            outline: 'none',
          }}
          placeholder="Optional album description..."
        />
      </div>

      {/* Visible toggle */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {/* Photo upload zone */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Photos {photos.filter(p => !p._uploading).length > 0 && (
            <span style={{ fontWeight: 400, color: '#6b7280' }}>
              ({photos.filter(p => !p._uploading).length} photo{photos.filter(p => !p._uploading).length !== 1 ? 's' : ''})
            </span>
          )}
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#3D7A68' : '#d1d5db'}`,
            borderRadius: 8,
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            color: dragOver ? '#3D7A68' : '#9ca3af',
            fontSize: 14,
            transition: 'all 0.2s',
            background: dragOver ? '#f0fdf4' : 'transparent',
          }}
        >
          {uploadingCount > 0
            ? `Uploading ${uploadingCount} file${uploadingCount !== 1 ? 's' : ''}...`
            : 'Click or drag images here to upload (multiple files supported)'
          }
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}>
          {photos.map((photo, index) => (
            <div
              key={photo.id ?? photo._tempId ?? index}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'white',
                opacity: photo._uploading ? 0.6 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', paddingTop: '75%', background: '#f3f4f6' }}>
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: 12,
                  }}>
                    Uploading...
                  </div>
                )}
                {/* Upload progress bar */}
                {photo._uploading && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: '#e5e7eb',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${photo._progress ?? 0}%`,
                      background: '#3D7A68',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                )}
                {/* Delete button */}
                {!photo._uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove photo"
                  >
                    &times;
                  </button>
                )}
              </div>
              {/* Caption input */}
              <div style={{ padding: 8 }}>
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateCaption(index, e.target.value)}
                  placeholder="Caption..."
                  disabled={photo._uploading}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 4,
                    fontSize: 12,
                    outline: 'none',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
