import { marked } from 'marked';

/**
 * Process scraped markdown content from lqplake.org for display.
 * - Replaces old image URLs with local paths
 * - Strips nav sidebar content
 * - Converts Week headers to proper h3 headings
 * - Converts numbered roster entries to a clean list
 * - Renders markdown to HTML
 */
export async function processMarkdown(raw: string): Promise<string> {
  if (!raw) return '';

  let md = raw
    // Replace old image URLs with local paths
    .replace(/http:\/\/www\.lqplake\.org\/uploads\/1\/8\/0\/2\/18024505\//g, '/images/tournaments/')
    // Strip image query params
    .replace(/(\/images\/tournaments\/[^\s\)]+)\?\d+/g, '$1')
    // Remove linked image wrappers [![](thumb)](full) -> ![](full)
    .replace(/\[!\[[^\]]*\]\([^\)]+\)\]\(([^\)]+)\)/g, '![]($1)')
    // Strip /published/ and /editor/ subdirs from image paths
    .replace(/\/images\/tournaments\/published\//g, '/images/tournaments/')
    .replace(/\/images\/tournaments\/editor\//g, '/images/tournaments/');

  // Strip nav lines (sidebar content from weebly)
  const navPatterns = [
    /^- \[Our Mission\]/,
    /^- \[LQP (Fishing )?League/,
    /^- \[\d{2}(st|nd|rd|th) Annual/,
    /^- \[Lake Association/,
    /^- \[Lac Qui Parle Walleye/,
    /^- \[LQPLA/,
    /^- \[Photo Gallery\]/,
    /^- \[Home\]/,
    /^- \[LQP Lake "Dam/,
    /^- \[Youth Activities/,
    /^\[Powered by/,
  ];

  const lines = md.split('\n').filter(line => {
    const trimmed = line.trim();
    return !navPatterns.some(p => p.test(trimmed));
  });

  md = lines.join('\n');

  // Convert **Week #N date** patterns to proper headings
  md = md.replace(/\*\*(Week\s*#?\s*\d+[^*]*)\*\*/g, '\n\n### $1\n\n');

  // Convert **Final Results** or **Roster** headers
  md = md.replace(/\*\*(\d{4}\s+LQP[^*]+Final\s+Results[^*]*)\*\*/g, '\n\n### $1\n\n');
  md = md.replace(/\*\*(League\s+Roster[^*]*)\*\*/g, '\n\n### $1\n\n');
  md = md.replace(/\*\*(Roster[^*]*)\*\*/g, '\n\n### $1\n\n');

  // Split numbered entries that are on one line separated by lots of spaces
  // e.g., "1.  Name & Name                    2.  Name & Name" -> separate lines
  md = md.replace(/(\d+\.)\s{4,}/g, '\n$1 ');

  // Strip leading whitespace from lines (prevents markdown code blocks)
  md = md.split('\n').map(line => {
    // If line starts with 4+ spaces and has numbered list content, strip the spaces
    if (/^\s{4,}\d+\./.test(line)) {
      return line.trim();
    }
    // Strip any leading spaces that would trigger code blocks (but keep 1-3 for nesting)
    if (/^\s{4,}/.test(line) && !/^\s{4,}$/.test(line)) {
      return line.trimStart();
    }
    return line;
  }).join('\n');

  // Convert numbered roster entries - normalize spacing after number
  md = md.replace(/(\d+)\.\s{2,}([^\n]+)/g, '$1. $2');

  // Clean up excessive whitespace
  md = md.replace(/\n{4,}/g, '\n\n\n');
  // Clean up unicode zero-width chars
  md = md.replace(/\u200B/g, '').replace(/\u00A0/g, ' ');
  // Clean up excessive inline spaces
  md = md.replace(/ {3,}/g, ' ');

  const html = await marked.parse(md);
  return html;
}
