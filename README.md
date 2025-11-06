# Nepal Online Driving License Written Exam System (Frontend)

This is a static frontend (HTML/CSS/JS) powered by Supabase (Auth, Postgres, Storage).

## Quick Start

1) Create a Supabase project at https://supabase.com
2) Open SQL editor and run `supabase-schema.sql` from this repo
3) In `driving-exam-system/js/`, copy `config.example.js` to `config.js` and fill:

```js
window.__ENV__ = {
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
}
```

4) Open `index.html` with a local server (e.g. VSCode Live Server).

## Phase 1 Completed
- Authentication: registration, email verification flow, login, reset password, logout
- Session management and route protection on `dashboard.html`
- Basic dashboard shell

## Next Phases
- Phase 2 Profile form and document uploads
- Phase 3 Admin verification dashboard
- Phase 4 Exam engine with security features
- Phase 5 Results, certificates, retake logic

## Security Notes
- Keep `script-src 'self'` and only allow Supabase domain in `connect-src` in CSP.
- Never commit service_role keys or private keys.
- Use Supabase Storage with RLS for documents.


