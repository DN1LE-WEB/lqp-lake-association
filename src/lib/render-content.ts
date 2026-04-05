import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

export function renderContent(json: string): string {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.type) {
      // Handle simple text content (from seed data)
      if (typeof parsed === 'object' && parsed.content) {
        return `<p>${parsed.content}</p>`;
      }
      return '';
    }
    return generateHTML(parsed, [StarterKit, Image, Link]);
  } catch {
    // If it's plain text, wrap in paragraph
    if (typeof json === 'string' && json.length > 0 && !json.startsWith('{')) {
      return `<p>${json}</p>`;
    }
    return '';
  }
}
