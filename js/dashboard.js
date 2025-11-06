(function () {
  document.addEventListener('supabase:ready', async () => {
    const { data: { session } } = await window.sb.auth.getSession()
    if (!session) {
      location.replace('login.html')
      return
    }

    const user = session.user
    const emailEl = document.getElementById('userEmail')
    if (emailEl) emailEl.textContent = user.email

    // Enforce email verification for actions
    const startBtn = document.getElementById('startExamBtn')
    const verifyWarn = document.getElementById('verifyEmailWarn')
    if (!user.email_confirmed_at) {
      startBtn?.setAttribute('aria-disabled', 'true')
      startBtn?.setAttribute('tabindex', '-1')
      startBtn?.classList.add('disabled')
      startBtn?.addEventListener('click', (e) => { e.preventDefault() })
      if (verifyWarn) verifyWarn.hidden = false
    }

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await window.sb.auth.signOut()
      location.replace('login.html')
    })
  })
})()


