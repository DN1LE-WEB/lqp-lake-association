import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useRef } from 'react';

interface EditorProps {
  content: string;
  onChange: (json: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active = false,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm rounded font-medium transition-colors ${
        active
          ? 'bg-[#3D7A68] text-white'
          : 'bg-white text-[#0F1B2D] hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-6 bg-gray-300 mx-1 inline-block align-middle" />;
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Image upload failed. The upload endpoint may not be available yet.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmbed = () => {
    const url = prompt('Enter embed URL (YouTube, Google Sheets, etc.):');
    if (url) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`
        )
        .run();
    }
  };

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('Enter URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 flex flex-col gap-1">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={handleLink} active={editor.isActive('link')} title="Link">
          Link
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          &bull; List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          1. List
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          &ldquo; Quote
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          &mdash;
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          Redo
        </ToolbarButton>
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
        >
          Image
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <ToolbarButton onClick={handleEmbed} title="Embed iframe">
          Embed
        </ToolbarButton>
      </div>
    </div>
  );
}

function parseContent(content: string): string | Record<string, unknown> | undefined {
  if (!content || content === '{}') return undefined;
  try {
    const parsed = JSON.parse(content);
    // TipTap doc format - pass through directly
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
      return parsed;
    }
    // Our seed format {"type":"text","content":"the text"} - extract as HTML
    if (parsed && parsed.type === 'text' && typeof parsed.content === 'string') {
      return parsed.content.split('\n').filter((l: string) => l.trim()).map((l: string) => `<p>${l}</p>`).join('');
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function Editor({ content, onChange, placeholder = 'Start writing...' }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: parseContent(content) || `<p>${content || ''}</p>`,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <div className="p-4 prose prose-sm max-w-none min-h-[300px] focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[300px] [&_.is-editor-empty:first-child::before]:text-gray-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default Editor;
