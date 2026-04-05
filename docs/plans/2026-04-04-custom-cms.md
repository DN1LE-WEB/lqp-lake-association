# LQP Lake Custom CMS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Keystatic with a lightweight custom CMS admin panel at `/admin` with WYSIWYG editing, image uploads, news management, and content section toggles.

**Architecture:** Server-rendered Astro pages use Cloudflare D1 (SQLite) for content storage and R2 for image/file uploads. Admin panel at `/admin` uses React + TipTap editor with simple password auth via session cookies. Public pages read from D1 at render time. All content editable via rich text with iframe/embed support.

**Tech Stack:** Astro 5, Cloudflare D1 + R2, TipTap (ProseMirror), React, Tailwind CSS

---

## Database Schema (D1)

```sql
-- Site pages (about, membership, projects, etc.)
CREATE TABLE pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}', -- TipTap JSON
  updated_at TEXT DEFAULT (datetime('now'))
);

-- News/announcements on homepage
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}', -- TipTap JSON
  image_url TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Homepage content sections with on/off toggles
CREATE TABLE sections (
  slug TEXT PRIMARY KEY, -- 'welcome', 'projects', 'stocking', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}', -- TipTap JSON
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Photo gallery albums
CREATE TABLE gallery_albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Gallery photos
CREATE TABLE gallery_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- Tournament entries
CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  annual_number TEXT,
  date TEXT,
  content TEXT NOT NULL DEFAULT '{}',
  visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Fishing league seasons
CREATE TABLE fishing_league (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  results_url TEXT,
  content TEXT NOT NULL DEFAULT '{}',
  visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Admin settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Session storage
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
```

## R2 Bucket

- Bucket name: `lqp-lake-uploads`
- Stores: images, PDFs, DOCX files
- Public access via custom domain or R2 public URL
- Upload endpoint: `/api/upload`

---

### Task 1: Remove Keystatic, Set Up D1 + R2 Bindings

**Files:**
- Remove: `keystatic.config.tsx`
- Remove: `src/content/` (all JSON files - content moves to D1)
- Modify: `astro.config.mjs` - remove keystatic integration
- Modify: `package.json` - remove keystatic deps, add tiptap
- Modify: `wrangler.toml` - add D1 + R2 bindings
- Create: `db/schema.sql`
- Create: `db/seed.sql` - seed with existing content

**Step 1:** Remove Keystatic from astro config and package.json. Remove `@keystatic/core`, `@keystatic/astro`, `@astrojs/markdoc`, `@astrojs/react` can stay (needed for admin). Remove the Vite keystatic_oauth_fix plugin.

**Step 2:** Add D1 and R2 bindings to wrangler.toml:
```toml
[[d1_databases]]
binding = "DB"
database_name = "lqp-lake-cms"
database_id = "" # filled after creation

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "lqp-lake-uploads"
```

**Step 3:** Create D1 database and R2 bucket via wrangler CLI:
```bash
npx wrangler d1 create lqp-lake-cms
npx wrangler r2 bucket create lqp-lake-uploads
```
Copy the database_id into wrangler.toml.

**Step 4:** Create `db/schema.sql` with the schema above.

**Step 5:** Create `db/seed.sql` that inserts all existing content (pages, news, sections, tournaments, fishing league, gallery) from the current site data.

**Step 6:** Apply schema and seed:
```bash
npx wrangler d1 execute lqp-lake-cms --local --file=db/schema.sql
npx wrangler d1 execute lqp-lake-cms --local --file=db/seed.sql
```

**Step 7:** Install TipTap and deps:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-iframe @tiptap/extension-placeholder @tiptap/html
```

**Step 8:** Commit: `feat: remove keystatic, add D1 + R2 bindings and schema`

---

### Task 2: Admin Auth System

**Files:**
- Create: `src/pages/admin/login.astro`
- Create: `src/pages/api/auth/login.ts`
- Create: `src/pages/api/auth/logout.ts`
- Create: `src/lib/auth.ts` - session helpers
- Create: `src/lib/db.ts` - D1 helper to get bindings

**Step 1:** Create `src/lib/db.ts` - helper to access D1 and R2 from Astro context:
```typescript
export function getDB(context: any) {
  return (context.locals as any).runtime.env.DB;
}
export function getUploads(context: any) {
  return (context.locals as any).runtime.env.UPLOADS;
}
```

**Step 2:** Create `src/lib/auth.ts` - password hashing, session create/verify:
```typescript
// Hash password with Web Crypto API (available on CF Workers)
// Create session token, store in D1 sessions table
// Verify session from cookie
// Admin password stored in settings table (hashed)
```

**Step 3:** Create login page at `/admin/login.astro` - simple form, password field, dark navy styling matching the site.

**Step 4:** Create `/api/auth/login.ts` - POST handler that verifies password, creates session, sets cookie.

**Step 5:** Create `/api/auth/logout.ts` - clears session cookie and deletes from D1.

**Step 6:** Add a seed for the default admin password in settings table (hashed).

**Step 7:** Commit: `feat: admin auth with password login and session cookies`

---

### Task 3: Admin Layout and Dashboard

**Files:**
- Create: `src/layouts/AdminLayout.astro` - admin shell with sidebar nav
- Create: `src/pages/admin/index.astro` - dashboard
- Create: `src/components/admin/Sidebar.astro`

**Step 1:** Create `AdminLayout.astro` - checks session cookie, redirects to login if invalid. Dark sidebar with nav links: Dashboard, Pages, News, Sections, Gallery, Tournaments, League, Settings.

**Step 2:** Create dashboard page showing content counts and quick links to edit sections.

**Step 3:** Style admin with the navy/teal palette to match the site.

**Step 4:** Commit: `feat: admin layout with sidebar navigation and dashboard`

---

### Task 4: TipTap WYSIWYG Editor Component

**Files:**
- Create: `src/components/admin/Editor.tsx` - React TipTap editor
- Create: `src/components/admin/ImageUpload.tsx` - drag-drop image upload
- Create: `src/components/admin/EditorToolbar.tsx` - formatting toolbar

**Step 1:** Create the TipTap editor React component with extensions:
- StarterKit (bold, italic, headings, lists, blockquote, code)
- Image (with upload integration)
- Link (with URL input)
- Iframe (custom extension for embeds)
- Placeholder

**Step 2:** Create toolbar with buttons for: H1-H3, bold, italic, link, image upload, iframe/embed, bullet list, ordered list, blockquote, undo/redo.

**Step 3:** Create ImageUpload component - drag-and-drop zone that uploads to `/api/upload`, returns URL, inserts into editor.

**Step 4:** Create custom Iframe extension for TipTap:
```typescript
// Allows inserting <iframe> with src, width, height
// Rendered as resizable block in editor
// Prompted via modal: paste URL, set dimensions
```

**Step 5:** Create a render function that converts TipTap JSON to HTML for the public pages.

**Step 6:** Commit: `feat: TipTap WYSIWYG editor with image upload and iframe support`

---

### Task 5: Image/File Upload API

**Files:**
- Create: `src/pages/api/upload.ts` - handles file uploads to R2
- Create: `src/pages/api/media.ts` - lists uploaded files
- Create: `src/pages/api/media/[key].ts` - delete uploaded file

**Step 1:** Create `/api/upload.ts`:
- POST: accepts multipart form data
- Generates unique filename (timestamp + original name)
- Uploads to R2 bucket
- Returns JSON with public URL
- Validates file type (images, PDFs, DOCX)
- Max file size check

**Step 2:** Create `/api/media.ts`:
- GET: lists all files in R2 bucket
- Returns JSON array with key, url, size, uploaded date

**Step 3:** Create `/api/media/[key].ts`:
- DELETE: removes file from R2

**Step 4:** Commit: `feat: file upload API with R2 storage`

---

### Task 6: Page Editor (CRUD)

**Files:**
- Create: `src/pages/admin/pages/index.astro` - list all pages
- Create: `src/pages/admin/pages/[slug].astro` - edit page with WYSIWYG
- Create: `src/pages/api/pages/[slug].ts` - GET/PUT API

**Step 1:** Create page list showing all editable pages (about, membership, projects, tournament, fishing-league).

**Step 2:** Create page editor with TipTap, title field, save button.

**Step 3:** Create API endpoint for reading/updating page content in D1.

**Step 4:** Update public page templates to read content from D1 instead of hardcoded HTML.

**Step 5:** Commit: `feat: page editor with WYSIWYG for all site pages`

---

### Task 7: News/Announcements Manager

**Files:**
- Create: `src/pages/admin/news/index.astro` - list news items
- Create: `src/pages/admin/news/[id].astro` - edit/create news
- Create: `src/pages/api/news/index.ts` - GET (list), POST (create)
- Create: `src/pages/api/news/[id].ts` - GET, PUT, DELETE

**Step 1:** Create news list page with visible/hidden toggle, reorder, add new.

**Step 2:** Create news editor with TipTap, title, image upload, visible toggle.

**Step 3:** Create API endpoints for CRUD.

**Step 4:** Update homepage to render news from D1.

**Step 5:** Commit: `feat: news/announcements manager with visibility toggle`

---

### Task 8: Homepage Sections Manager

**Files:**
- Create: `src/pages/admin/sections/index.astro` - list homepage sections
- Create: `src/pages/admin/sections/[slug].astro` - edit section
- Create: `src/pages/api/sections/[slug].ts` - GET/PUT

**Step 1:** Create sections list with on/off toggles per section. Sections: welcome, projects-events, stocking-membership.

**Step 2:** Create section editor with TipTap.

**Step 3:** Create API endpoints.

**Step 4:** Update homepage to conditionally render sections based on visible flag.

**Step 5:** Commit: `feat: homepage section manager with on/off toggles`

---

### Task 9: Gallery Manager

**Files:**
- Create: `src/pages/admin/gallery/index.astro` - album list
- Create: `src/pages/admin/gallery/[id].astro` - edit album, upload photos
- Create: `src/pages/api/gallery/index.ts` - albums CRUD
- Create: `src/pages/api/gallery/[id]/photos.ts` - photo upload/delete

**Step 1:** Create album list page with add/edit/delete/reorder.

**Step 2:** Create album editor with multi-image drag-and-drop upload, caption editing, photo reordering, delete.

**Step 3:** Create API endpoints for album and photo CRUD.

**Step 4:** Update public gallery page to read from D1.

**Step 5:** Commit: `feat: gallery manager with drag-drop multi-upload`

---

### Task 10: Tournament & League Managers

**Files:**
- Create: `src/pages/admin/tournaments/index.astro`
- Create: `src/pages/admin/tournaments/[id].astro`
- Create: `src/pages/admin/league/index.astro`
- Create: `src/pages/admin/league/[id].astro`
- Create: corresponding API routes

**Step 1:** Tournament manager - list, add, edit with year, date, annual number, TipTap content, file uploads (rules, waiver, cover letter).

**Step 2:** League manager - list seasons, edit with year, results URL, TipTap content for weekly results.

**Step 3:** Update public pages to read from D1.

**Step 4:** Commit: `feat: tournament and fishing league managers`

---

### Task 11: Settings Page

**Files:**
- Create: `src/pages/admin/settings.astro`
- Create: `src/pages/api/settings.ts`

**Step 1:** Settings page with fields for: site name, contact email, mailing address, Facebook URL, change admin password.

**Step 2:** API endpoint for reading/updating settings in D1.

**Step 3:** Commit: `feat: admin settings page with password change`

---

### Task 12: Deploy and Seed Production

**Step 1:** Apply schema to production D1:
```bash
npx wrangler d1 execute lqp-lake-cms --remote --file=db/schema.sql
npx wrangler d1 execute lqp-lake-cms --remote --file=db/seed.sql
```

**Step 2:** Configure R2 bucket public access.

**Step 3:** Build and deploy:
```bash
npx astro build && npx wrangler pages deploy dist
```

**Step 4:** Test admin login, page editing, image upload, news management on production.

**Step 5:** Commit: `feat: production deployment with seeded content`

---

## Summary

12 tasks total. The critical path is:
1. Infrastructure (D1/R2 setup) → 2. Auth → 3. Admin shell → 4. Editor component → 5. Upload API → 6-10. Content managers → 11. Settings → 12. Deploy

Each content manager (tasks 6-10) follows the same pattern: list page, edit page with TipTap, API endpoints, update public page to read from D1.
