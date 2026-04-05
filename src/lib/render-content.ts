import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

export function renderContent(json: string): string {
  if (!json || json === '{}' || json === '') return '';

  try {
    const parsed = JSON.parse(json);

    // Handle our simple seed format: {"type":"text","content":"the text"}
    if (parsed.type === 'text' && typeof parsed.content === 'string') {
      // Split by newlines and wrap each in <p>
      return parsed.content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => `<p>${line}</p>`)
        .join('');
    }

    // Handle TipTap doc format: {"type":"doc","content":[...]}
    if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
      return generateHTML(parsed, [StarterKit, Image, Link]);
    }

    // Handle object with content string (fallback)
    if (typeof parsed.content === 'string') {
      return `<p>${parsed.content}</p>`;
    }

    return '';
  } catch {
    // Not JSON - treat as plain text
    if (typeof json === 'string' && json.length > 0) {
      return json
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => `<p>${line}</p>`)
        .join('');
    }
    return '';
  }
}
