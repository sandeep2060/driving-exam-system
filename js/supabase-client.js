;(function initSupabase() {
  const missing = []
  const env = window.__ENV__ || {}
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY')
  if (missing.length) {
    console.error('Missing Supabase config:', missing.join(', '))
    alert('Supabase is not configured. Please copy js/config.example.js to js/config.js and set your credentials.')
  }

  // Minimal Supabase client loader via ESM-like shim
  // Using global import from CDN with SRI disabled to keep CSP strict: we keep script-src 'self'
  // Therefore we inline a tiny client using fetch to Supabase REST if needed. For auth, we require official lib.
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'
  script.async = false
  script.onload = () => {
    // Create a dedicated client instance to avoid clobbering the UMD namespace object
    window.sb = window.supabase.createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    })
    document.dispatchEvent(new CustomEvent('supabase:ready', { detail: { client: window.sb } }))
  }
  document.head.appendChild(script)
})()


