/* ═══════════ HYPRRIDE admin — email one-time-link sign-in (Firebase Auth) ═══════════
   STATUS: configured for Firebase project "hyprride-website".

   Remaining one-time setup in the Firebase console (console.firebase.google.com):
   1. Build → Authentication → Get started → Sign-in method →
      enable "Email/Password" AND switch ON "Email link (passwordless sign-in)" inside it.
   2. Authentication → Settings → Authorized domains → add the domain the admin runs on
      (e.g. admin.hyprride.com and/or your-admin-site.netlify.app). localhost is allowed by default.
   3. Staff addresses live in ALLOWED_EMAILS below — edit that list to add/remove people.

   If Firebase is unreachable (offline, blocked, misconfigured), the password screen
   comes back automatically so staff are never locked out. */
(function () {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCT5VmQnFY8HL-nT5cXITk617j16TXsTBY',
    authDomain: 'hyprride-website.firebaseapp.com',
    projectId: 'hyprride-website',
    storageBucket: 'hyprride-website.firebasestorage.app',
    messagingSenderId: '610300032788',
    appId: '1:610300032788:web:8c883b2cf3d5c7275af401',
  };

  const ALLOWED_EMAILS = [
    'tech@hyprride.com',
    'hyprride@gmail.com',
  ];

  const $ = id => document.getElementById(id);
  const otpForm = $('otpForm'), loginForm = $('loginForm'), sub = $('loginSub');
  const allowed = email => ALLOWED_EMAILS.includes((email || '').trim().toLowerCase());

  if (!FIREBASE_CONFIG) return; /* email login off — password fallback stays */

  /* switch the login card to email mode */
  if (loginForm) loginForm.hidden = true;
  if (otpForm) otpForm.hidden = false;
  if (sub) sub.textContent = 'Sign in with your staff email — we’ll send a one-time link.';

  /* Firebase is the only authority now: drop any stale session admin.js may have
     restored, so the dashboard is never shown before Firebase confirms the user.
     Runs in the same tick as admin.js, so nothing flashes on screen. */
  sessionStorage.removeItem('hyprride_admin');
  if ($('dashboard')) $('dashboard').hidden = true;
  if ($('loginScreen')) $('loginScreen').hidden = false;

  function showErr(msg) { const el = $('otpErr'); if (el) el.textContent = msg || ''; }

  function passwordFallback(reason) {
    if (otpForm) otpForm.hidden = true;
    if (loginForm) loginForm.hidden = false;
    if (sub) sub.textContent = reason || 'Enter the admin password to access the dashboard.';
  }

  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const load = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  load(SDK + 'firebase-app-compat.js')
    .then(() => load(SDK + 'firebase-auth-compat.js'))
    .then(() => {
      /* global firebase */
      firebase.initializeApp(FIREBASE_CONFIG);
      const auth = firebase.auth();

      /* stay signed in across tabs and browser restarts */
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

      /* returning from the emailed link? finish the sign-in */
      if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('hyprride_admin_email');
        if (!email) email = window.prompt('Confirm your staff email to finish signing in');
        auth.signInWithEmailLink((email || '').trim().toLowerCase(), window.location.href)
          .then(() => {
            window.localStorage.removeItem('hyprride_admin_email');
            history.replaceState(null, '', location.pathname); /* strip the one-time link */
          })
          .catch(err => showErr('That link didn’t work — request a fresh one. (' + err.code + ')'));
      }

      /* single source of truth for who is signed in */
      auth.onAuthStateChanged(user => {
        if (!user) {
          if (window.adminActions) window.adminActions.signedOut();
          return;
        }
        if (!allowed(user.email)) {
          auth.signOut();
          showErr('That email is not on the staff list.');
          return;
        }
        showErr('');
        if (window.adminActions) window.adminActions.signedIn();
      });

      otpForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = ($('loginEmail').value || '').trim().toLowerCase();
        if (!allowed(email)) { showErr('This email is not on the staff list.'); return; }
        showErr('');
        const btn = $('otpSendBtn');
        btn.disabled = true;
        auth.sendSignInLinkToEmail(email, {
          url: location.origin + location.pathname,
          handleCodeInApp: true,
        })
          .then(() => {
            window.localStorage.setItem('hyprride_admin_email', email);
            $('otpSent').hidden = false;
          })
          .catch(err => {
            const hint = err.code === 'auth/operation-not-allowed'
              ? 'Enable "Email link (passwordless sign-in)" in the Firebase console first.'
              : err.code === 'auth/unauthorized-continue-uri'
                ? 'Add this domain under Firebase → Authentication → Settings → Authorized domains.'
                : err.code;
            showErr('Could not send the link — ' + hint);
          })
          .finally(() => { btn.disabled = false; });
      });

      const logout = $('logoutBtn');
      if (logout) logout.addEventListener('click', () => auth.signOut().catch(() => {}));
    })
    .catch(() => passwordFallback());
})();
