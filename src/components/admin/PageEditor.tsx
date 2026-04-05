import { useState } from 'react';
import Editor from './Editor';

interface Props {
  slug: string;
  title: string;
  content: string;
}

export default function PageEditor({ slug, title, content }: Props) {
  const [currentContent, setCurrentContent] = useState(content);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentTitle, content: currentContent }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            outline: 'none',
            background: 'transparent',
          }}
          placeholder="Page Title"
        />
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
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
      <Editor content={currentContent} onChange={setCurrentContent} placeholder="Start writing page content..." />
    </div>
  );
}
