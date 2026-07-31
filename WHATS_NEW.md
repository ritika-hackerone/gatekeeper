# What's new in this redesign

- **New theme**: deep navy `#03045e` + ocean blue `#0077b6` throughout (`app/app/globals.css`).
- **Cursor-reactive animated background** (`app/app/components/CursorField.tsx`): a soft glow follows the
  mouse and three blobs drift slowly behind every page. Mounted once in `app/app/layout.tsx`.
- **3D tilt cards** (`app/app/components/Tilt.tsx`): feature cards, auth cards, and admin metric cards
  rotate in 3D toward the cursor on hover. Reusable — wrap anything in `<Tilt>...</Tilt>`.
- **New landing page** (`app/app/page.tsx`): introduces Gatekeeper — what it is, what it does in the
  study-abroad/academics space, how it works, and a "no predictions, ever" trust section — with CTAs
  into the form and sign-up.
- **Intake form moved to `/apply`** (`app/app/apply/page.tsx`, was previously at `/`):
  - Every field now has a one-line description explaining what it's for and why it's asked.
  - "Intended course" is now a dropdown of common majors, with an **"Other — type my own"** option that
    reveals a free-text field.
- **Sign up / sign in**: restyled to the new theme, wrapped in the 3D tilt card, now redirect to `/apply`
  after success instead of `/`.
- **Admin dashboard**: unchanged functionally, inherits the new theme automatically (it already used the
  shared CSS variables) plus tilt on the metric cards.

## Running it

```bash
# backend
cd abr-p3-gatekeeper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn gatekeeper.main:app --reload --app-dir src   # or see README.md for exact command

# frontend
cd abr-p3-gatekeeper/app
npm install
npm run dev
```

The frontend build was verified locally (`npx next build`) — all 10 routes compile cleanly.

## Notes / things you may want to double check

- I assumed the theme code `03049` meant `#03045e` (it's only 5 hex digits as given, and pairs with
  `#0077b6` in a well-known palette). Easy to change: it's the `--brand-dark` variable at the top of
  `globals.css`.
- The course dropdown list is a reasonable starting set of common majors — add/remove entries directly
  in the `COMMON_COURSES` array in `app/app/apply/page.tsx`.
- `next@14.2.5` reports a known security advisory on install (not something I changed) — worth bumping
  to a patched 14.2.x version before going to production.
