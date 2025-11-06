(function () {
  function showToast(msg, isError) {
    const toast = document.getElementById('toast')
    if (!toast) return
    toast.textContent = msg
    toast.style.color = isError ? '#dc3545' : '#198754'
  }

  function setLoading(btn, loading) {
    if (!btn) return
    btn.disabled = loading
    btn.textContent = loading ? 'Please wait…' : btn.getAttribute('data-label') || btn.textContent
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function populateDobIfPresent() {
    const yearSel = document.getElementById('dobYear')
    const monthSel = document.getElementById('dobMonth')
    const daySel = document.getElementById('dobDay')
    if (!(yearSel && monthSel && daySel)) return
    if (yearSel.options.length > 0 && monthSel.options.length > 0 && daySel.options.length > 0) return
    const now = new Date()
    const startYear = now.getFullYear() - 100
    for (let y = now.getFullYear(); y >= startYear; y--) {
      const opt = document.createElement('option'); opt.value = String(y); opt.textContent = String(y); yearSel.appendChild(opt)
    }
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement('option'); opt.value = String(m).padStart(2, '0'); opt.textContent = String(m); monthSel.appendChild(opt)
    }
    function refreshDays() {
      daySel.innerHTML = ''
      const y = parseInt(yearSel.value, 10)
      const m = parseInt(monthSel.value, 10)
      const daysInMonth = new Date(y, m, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const opt = document.createElement('option'); opt.value = String(d).padStart(2, '0'); opt.textContent = String(d); daySel.appendChild(opt)
      }
    }
    yearSel.addEventListener('change', refreshDays)
    monthSel.addEventListener('change', refreshDays)
    yearSel.value = String(now.getFullYear() - 18)
    monthSel.value = String(now.getMonth() + 1).padStart(2, '0')
    refreshDays()
    daySel.value = String(now.getDate()).padStart(2, '0')
  }

  document.addEventListener('supabase:ready', () => {
    const page = location.pathname.split('/').pop()

    if (page === 'register.html') initRegister()
    if (page === 'login.html') initLogin()
    if (page === 'register.html') populateDobIfPresent()
  })

  document.addEventListener('DOMContentLoaded', () => {
    const page = location.pathname.split('/').pop()
    if (page === 'register.html') populateDobIfPresent()
  })

  // Immediate invocation in case this script loads after DOMContentLoaded
  ;(function ensureDobPopulated() {
    const page = location.pathname.split('/').pop()
    if (page === 'register.html') populateDobIfPresent()
  })()

  async function initRegister() {
    const form = document.getElementById('registerForm')
    const btn = document.getElementById('registerBtn')
    if (!form) return
    btn && btn.setAttribute('data-label', 'Register')
    // DOB dropdowns are populated separately

    // password toggles on registration
    const togglePw = document.getElementById('toggleRegPw')
    const toggleConfirm = document.getElementById('toggleRegConfirm')
    if (togglePw) togglePw.addEventListener('click', () => togglePassword('password', togglePw))
    if (toggleConfirm) toggleConfirm.addEventListener('click', () => togglePassword('confirm', toggleConfirm))

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const firstName = (form.firstName?.value || '').trim()
      const middleName = (form.middleName?.value || '').trim()
      const lastName = (form.lastName?.value || '').trim()
      const phoneDigits = (form.phone?.value || '').trim()
      const dob = buildDob()
      const email = form.email.value.trim()
      const password = form.password.value
      const confirm = form.confirm.value
      clearErrors()

      let hasError = false
      if (!firstName) { setError('firstNameError', 'First name is required'); hasError = true }
      if (!lastName) { setError('lastNameError', 'Last name is required'); hasError = true }
      if (!/^\d{10}$/.test(phoneDigits)) { setError('phoneError', 'Enter 10 digits'); hasError = true }
      if (!dob) { setError('dobYearError', 'Date of birth is required'); hasError = true }
      else if (!isAdult(dob)) { setError('dobYearError', 'You must be at least 18 years old'); hasError = true }
      if (!validateEmail(email)) { setError('emailError', 'Enter a valid email'); hasError = true }
      if (password.length < 8) { setError('passwordError', 'Minimum 8 characters'); hasError = true }
      if (password !== confirm) { setError('confirmError', 'Passwords do not match'); hasError = true }
      if (hasError) return

      const phone = `+977${phoneDigits}`
      setLoading(btn, true)
      try {
        const { error } = await window.sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
              full_name: [firstName, middleName, lastName].filter(Boolean).join(' '),
              phone,
              date_of_birth: dob
            }
          }
        })
        if (error) throw error
        document.getElementById('verifyNotice')?.removeAttribute('hidden')
        showToast('Verification email sent. Check your inbox.')
      } catch (err) {
        showToast((err && err.message) || 'Registration failed', true)
      } finally {
        setLoading(btn, false)
      }
    })
  }

  async function initLogin() {
    const form = document.getElementById('loginForm')
    const btn = document.getElementById('loginBtn')
    const resetBtn = document.getElementById('resetBtn')
    if (!form) return
    btn && btn.setAttribute('data-label', 'Login')

    // password toggle on login
    const toggle = document.getElementById('toggleLoginPw')
    if (toggle) toggle.addEventListener('click', () => togglePassword('password', toggle))

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = form.email.value.trim()
      const password = form.password.value
      clearErrors()
      let hasError = false
      if (!validateEmail(email)) { setError('emailError', 'Enter a valid email'); hasError = true }
      if (password.length < 8) { setError('passwordError', 'Minimum 8 characters'); hasError = true }
      if (hasError) return

      setLoading(btn, true)
      try {
        const { data, error } = await window.sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user && !data.user.email_confirmed_at) {
          showToast('Please verify your email before continuing.', true)
          return
        }
        location.href = 'dashboard.html'
      } catch (err) {
        showToast(err.message || 'Login failed', true)
      } finally {
        setLoading(btn, false)
      }
    })

    resetBtn?.addEventListener('click', async () => {
      const email = (document.getElementById('email') || {}).value || ''
      if (!validateEmail(email)) { showToast('Enter your email to receive reset link', true); return }
      try {
        const { error } = await window.sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login.html'
        })
        if (error) throw error
        showToast('Password reset email sent.')
      } catch (err) {
        showToast(err.message || 'Failed to send reset email', true)
      }
    })
  }

  function setError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg }
  function clearErrors() { document.querySelectorAll('.error').forEach(e => e.textContent = '') }
  function isAdult(dateStr) {
    const dob = new Date(dateStr)
    if (Number.isNaN(dob.getTime())) return false
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age >= 18
  }
  function buildDob() {
    const y = document.getElementById('dobYear')?.value
    const m = document.getElementById('dobMonth')?.value
    const d = document.getElementById('dobDay')?.value
    if (!y || !m || !d) return ''
    return `${y}-${m}-${d}`
  }

  function togglePassword(inputId, btnEl) {
    const input = document.getElementById(inputId)
    if (!input) return
    const isHidden = input.type === 'password'
    input.type = isHidden ? 'text' : 'password'
    if (btnEl) btnEl.textContent = isHidden ? 'Hide' : 'Show'
    btnEl?.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password')
  }
})()


