var state = window.state = window.state || {
  user: {
    id: "u-student-1",
    name: "Alex Rivera",
    email: "student@doubtsolver.com",
    role: "student",
    grade: "12th Grade"
  },
  theme: localStorage.getItem("theme") || "light",
  currentView: "dashboard",
  currentDoubt: null,
  activeInputType: "text",
  activeExplanationLevel: "intermediate",
  selectedFile: null,
  quizData: null,
  quizIndex: 0,
  quizAnswers: {},
  quizTopicMode: "solved",
  feedbackRating: 5
};

function initTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const btn = document.getElementById("btnThemeToggle");
  if (btn) btn.textContent = state.theme === "dark" ? "☼" : "☾";
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  initTheme();
}

function toggleSidebar() {
  const sidebar = document.getElementById("appSidebar");
  if (sidebar) sidebar.classList.toggle("open");
}

function navigateTo(viewName, params = {}) {
  if (viewName === "dashboard") window.location.href = (state.user && state.user.role === "teacher") ? "/teacher" : "/";
  else if (viewName === "ask") window.location.href = "/ask";
  else if (viewName === "doubt-detail" && params.id) window.location.href = `/doubt/${params.id}`;
  else if (viewName === "history") window.location.href = "/history";
  else if (viewName === "bookmarks") window.location.href = "/bookmarks";
  else if (viewName === "quiz") window.location.href = "/quiz";
  else if (viewName === "recommendations") window.location.href = "/recommendations";
  else if (viewName === "teacher") window.location.href = "/teacher";
  else if (viewName === "admin") window.location.href = "/admin";
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

function setRating(r) {
  state.feedbackRating = r;
  const group = document.getElementById("starRatingGroup");
  const stars = (group && group.children) ? group.children : [];
  for (let i = 0; i < stars.length; i++) {
    stars[i].style.color = (i < r) ? "#fbbf24" : "var(--border)";
  }
}

async function handleSubmitFeedback(e) {
  e.preventDefault();
  if (!state.currentDoubt) return;

  const comment = document.getElementById("feedbackComment").value.trim();
  const reportIssue = document.getElementById("checkReportIssue").checked;

  try {
    const res = await fetch(`/api/doubts/${state.currentDoubt.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: state.feedbackRating,
        comment,
        helpful: state.feedbackRating >= 4,
        report_issue: reportIssue
      })
    });
    alert("Feedback submitted successfully. Thank you!");
    setTimeout(loadNotifications, 300);
  } catch (err) {
    alert("Failed to submit feedback");
  }
}

function renderMath(text) {
  if (!text) return "";
  let out = text;

  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    try {
      if (typeof katex !== "undefined") {
        return `<div class="katex-display my-2">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
      }
    } catch (e) { }
    return match;
  });

  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    try {
      if (typeof katex !== "undefined") {
        return `<span class="katex-inline">${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })}</span>`;
      }
    } catch (e) { }
    return match;
  });

  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      if (typeof katex !== "undefined") {
        return `<div class="katex-display my-2">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
      }
    } catch (e) { }
    return match;
  });

  out = out.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    try {
      if (typeof katex !== "undefined") {
        return `<span class="katex-inline">${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })}</span>`;
      }
    } catch (e) { }
    return match;
  });

  out = out.replace(/\n/g, "<br>");
  return out;
}

function copyCode(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent);
  alert("Code copied to clipboard!");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseUtcDate(ts) {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  const str = String(ts).trim();
  if (!str) return new Date();
  const isoStr = (str.endsWith("Z") || str.includes("+") || (str.length > 10 && str.lastIndexOf("-") > 10)) ? str : str + "Z";
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date(ts) : d;
}

function formatLocalTime(ts) {
  if (!ts) return "";
  return parseUtcDate(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLocalDate(ts) {
  if (!ts) return "";
  return parseUtcDate(ts).toLocaleDateString();
}

function formatLocalDateTime(ts) {
  if (!ts) return "";
  return parseUtcDate(ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}


window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.navigateTo = navigateTo;
window.openModal = openModal;
window.closeModal = closeModal;
window.setRating = setRating;
window.handleSubmitFeedback = handleSubmitFeedback;
window.renderMath = renderMath;
window.copyCode = copyCode;
window.escapeHtml = escapeHtml;
window.parseUtcDate = parseUtcDate;
window.formatLocalTime = formatLocalTime;
window.formatLocalDate = formatLocalDate;
window.formatLocalDateTime = formatLocalDateTime;

document.addEventListener("mouseover", (e) => {
  const a = e.target.closest("a");
  if (a && a.href && a.origin === window.location.origin && !a.getAttribute("data-prefetched")) {
    a.setAttribute("data-prefetched", "true");
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = a.href;
    document.head.appendChild(link);
  }
});

document.addEventListener("touchstart", (e) => {
  const a = e.target.closest("a");
  if (a && a.href && a.origin === window.location.origin && !a.getAttribute("data-prefetched")) {
    a.setAttribute("data-prefetched", "true");
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = a.href;
    document.head.appendChild(link);
  }
}, { passive: true });

var state = window.state = window.state || {};

function switchRole(role) {
  const demoUsers = {
    student: {
      id: "u-student-1",
      name: "Alex Rivera",
      email: "student@doubtsolver.com",
      role: "student",
      grade: "12th Grade"
    },
    teacher: {
      id: "u-teacher-1",
      name: "Prof. Sarah Jenkins",
      email: "teacher@doubtsolver.com",
      role: "teacher",
      subject: "Mathematics"
    },
    admin: {
      id: "u-admin-1",
      name: "System Administrator",
      email: "admin@doubtsolver.com",
      role: "admin"
    }
  };

  if (demoUsers[role]) {
    state.user = demoUsers[role];
    localStorage.setItem("user", JSON.stringify(state.user));
    updateUserUI();
    if (role === "teacher") {
      window.location.href = "/teacher";
    } else if (role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  }
}

function updateUserUI() {
  const avatar = document.getElementById("userAvatar");
  const nameHeader = document.getElementById("userNameHeader");
  const roleHeader = document.getElementById("userRoleHeader");
  const heroName = document.getElementById("heroUserName");
  const modalName = document.getElementById("modalCurrentUserName");
  const modalRole = document.getElementById("modalCurrentUserRole");

  const initial = state.user && state.user.name ? state.user.name[0].toUpperCase() : "U";
  if (avatar) avatar.textContent = initial;
  if (nameHeader && state.user) nameHeader.textContent = state.user.name;
  if (roleHeader && state.user) roleHeader.textContent = state.user.role;
  if (heroName && state.user && state.user.name) heroName.textContent = state.user.name.split(" ")[0];
  if (modalName && state.user) modalName.textContent = state.user.name;
  if (modalRole && state.user) modalRole.textContent = state.user.role;

  document.querySelectorAll(".role-pill").forEach(pill => {
    pill.classList.toggle("active", state.user && pill.getAttribute("data-role") === state.user.role);
  });

  const isTeacher = Boolean(state.user && state.user.role === "teacher");
  const isTeacherPage = window.location.pathname.startsWith("/teacher");
  const isAdminPage = window.location.pathname.startsWith("/admin");
  const hideStudentSections = isTeacher || isTeacherPage || isAdminPage;

  const studentGroup = document.getElementById("studentNavGroup");
  const dashItem = document.getElementById("navItemDashboard");
  const askItem = document.getElementById("navItemAskDoubt");
  const histItem = document.getElementById("navItemHistory");
  const bookmarksItem = document.getElementById("navItemBookmarks");
  const quizItem = document.getElementById("navItemQuiz");
  const recsItem = document.getElementById("navItemRecommendations");

  if (studentGroup) studentGroup.style.display = hideStudentSections ? "none" : "";
  if (dashItem) dashItem.style.display = hideStudentSections ? "none" : "";
  if (askItem) askItem.style.display = hideStudentSections ? "none" : "";
  if (histItem) histItem.style.display = hideStudentSections ? "none" : "";
  if (bookmarksItem) bookmarksItem.style.display = hideStudentSections ? "none" : "";
  if (quizItem) quizItem.style.display = hideStudentSections ? "none" : "";
  if (recsItem) recsItem.style.display = hideStudentSections ? "none" : "";

  const logoBrand = document.querySelector(".logo-brand");
  if (logoBrand) {
    if (isAdminPage) {
      logoBrand.href = "/admin";
    } else if (isTeacher) {
      logoBrand.href = "/teacher";
    }
  }

  const teacherGroup = document.getElementById("teacherNavGroup");
  const adminGroup = document.getElementById("adminNavGroup");

  if (teacherGroup) {
    teacherGroup.style.display = isAdminPage ? "none" : ((hideStudentSections || (state.user && state.user.role === "admin")) ? "block" : "none");
  }
  if (adminGroup) {
    adminGroup.style.display = (isAdminPage || (state.user && state.user.role === "admin")) ? "block" : "none";
  }

  const settingsBtn = document.getElementById("btnSettingsModal");
  if (settingsBtn) {
    const isStudent = !state.user || state.user.role === "student";
    const isStudentDashboard = window.location.pathname === "/" || window.location.pathname === "/dashboard";
    if (isStudent || isStudentDashboard || (state.user && state.user.role !== "admin")) {
      if (isAdminPage || (state.user && state.user.role === "admin") || isStudent || isStudentDashboard || isTeacher || isTeacherPage) {
        settingsBtn.style.display = "none";
      } else {
        settingsBtn.style.display = "inline-flex";
      }
    }
  }
}

function openForgotPassword() {
  closeModal("loginModal");
  openModal("forgotModal");
}

async function handleUserLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    state.user = data.user;
    localStorage.setItem("user", JSON.stringify(data.user));
    updateUserUI();
    const modal = document.getElementById("loginModal");
    if (modal) closeModal("loginModal");
    window.location.href = data.user.role === "teacher" ? "/teacher" : (data.user.role === "admin" ? "/admin" : "/");
  } catch (err) {
    alert(err.message || "Invalid credentials");
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();
  const new_password = document.getElementById("forgotNewPassword").value;

  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, new_password })
    });
    const data = await res.json();
    alert(data.message);
    closeModal("forgotModal");
    openModal("loginModal");
  } catch (err) {
    alert(err.message || "Failed to reset password");
  }
}

function handleLogout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

function fillCredentials(role) {
  const creds = {
    student: { email: "student@doubtsolver.com", pass: "StudentPass@123" },
    teacher: { email: "teacher@doubtsolver.com", pass: "TeacherPass@123" },
    admin: { email: "admin@doubtsolver.com", pass: "AdminPass@123" }
  };
  const target = creds[role];
  if (target) {
    const emailInput = document.getElementById("loginEmail");
    const passInput = document.getElementById("loginPassword");
    if (emailInput) emailInput.value = target.email;
    if (passInput) passInput.value = target.pass;
    const tabLogin = document.getElementById("tabBtnLogin");
    if (tabLogin && typeof showAuthTab === "function") showAuthTab("login");
  }
}

function showAuthTab(tab) {
  const loginForm = document.getElementById("authLoginForm");
  const regForm = document.getElementById("authRegisterForm");
  const tabLogin = document.getElementById("tabBtnLogin");
  const tabReg = document.getElementById("tabBtnRegister");
  const heading = document.getElementById("authMainHeading");
  const subtitle = document.getElementById("authMainSubtitle");
  const switchText = document.getElementById("authSwitchPromptText");
  const switchLink = document.getElementById("authSwitchLink");

  if (tab === "register") {
    if (loginForm) { loginForm.classList.add("hidden"); loginForm.style.display = "none"; }
    if (regForm) { regForm.classList.remove("hidden"); regForm.style.display = "block"; }
    if (tabLogin) tabLogin.classList.remove("active");
    if (tabReg) tabReg.classList.add("active");
    if (heading) heading.textContent = "Sign Up";
    if (subtitle) subtitle.textContent = "Create an account to start solving doubts and practicing quizzes.";
    if (switchText) switchText.textContent = "Already have an account?";
    if (switchLink) {
      switchLink.textContent = "Sign in";
      switchLink.onclick = () => showAuthTab("login");
    }
  } else {
    if (loginForm) { loginForm.classList.remove("hidden"); loginForm.style.display = "block"; }
    if (regForm) { regForm.classList.add("hidden"); regForm.style.display = "none"; }
    if (tabLogin) tabLogin.classList.add("active");
    if (tabReg) tabReg.classList.remove("active");
    if (heading) heading.textContent = "Login";
    if (subtitle) subtitle.textContent = "Welcome! Login to access your personalized learning dashboard.";
    if (switchText) switchText.textContent = "New User?";
    if (switchLink) {
      switchLink.textContent = "Signup";
      switchLink.onclick = () => showAuthTab("register");
    }
  }
}

async function handleUserRegister(e) {
  if (e) e.preventDefault();
  const name = document.getElementById("regName") ? document.getElementById("regName").value.trim() : "";
  const email = document.getElementById("regEmail") ? document.getElementById("regEmail").value.trim() : "";
  const password = document.getElementById("regPassword") ? document.getElementById("regPassword").value : "";
  const role = document.getElementById("regRole") ? document.getElementById("regRole").value : "student";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Registration failed");
    }
    const data = await res.json();
    if (typeof state !== "undefined" && state) {
      state.user = data.user;
    } else if (typeof window !== "undefined" && window.state) {
      window.state.user = data.user;
    }
    localStorage.setItem("user", JSON.stringify(data.user));
    alert("Account created successfully!");
    window.location.href = role === "teacher" ? "/teacher" : (role === "admin" ? "/admin" : "/");
  } catch (err) {
    alert(err.message || "Failed to register");
  }
}

const defaultFirebaseConfig = {
  apiKey: "AIzaSyDbmYlDvjIHtrHBovHq4pKmMY93tFrh4Xg",
  authDomain: "ai-doubt-solver-9798f.firebaseapp.com",
  projectId: "ai-doubt-solver-9798f",
  storageBucket: "ai-doubt-solver-9798f.firebasestorage.app",
  messagingSenderId: "465922307559",
  appId: "1:465922307559:web:78830d128d1389646cb942",
  measurementId: "G-Q36EW23QWS"
};

function getFirebaseAuth() {
  try {
    if (typeof firebase !== "undefined" && firebase.apps) {
      if (!firebase.apps.length) {
        firebase.initializeApp(defaultFirebaseConfig);
      }
      return firebase.auth();
    }
  } catch (e) { }
  return null;
}

async function completeGoogleLogin(googleUser) {
  const selectedRole = document.getElementById("regRole") ? document.getElementById("regRole").value : "student";
  const userRole = (selectedRole === "teacher" || selectedRole === "admin") ? selectedRole : (googleUser.role || "student");
  googleUser.role = userRole;

  const localUser = {
    id: "u-" + btoa(googleUser.email).replace(/=/g, "").slice(0, 8),
    name: googleUser.name,
    email: googleUser.email,
    role: userRole,
    grade: "12th Grade",
    photo_url: googleUser.photo_url || ""
  };
  if (typeof state !== "undefined" && state) {
    state.user = localUser;
  } else if (typeof window !== "undefined" && window.state) {
    window.state.user = localUser;
  }
  localStorage.setItem("user", JSON.stringify(localUser));

  try {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(googleUser)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        if (typeof state !== "undefined" && state) {
          state.user = data.user;
        } else if (typeof window !== "undefined" && window.state) {
          window.state.user = data.user;
        }
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) localStorage.setItem("token", data.token);
      }
    }
  } catch (err) { }

  window.location.href = userRole === "teacher" ? "/teacher" : (userRole === "admin" ? "/admin" : "/");
}

async function handleGoogleSignIn() {
  const btn = document.getElementById("btnGoogleSignIn");
  const origHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>Connecting to Firebase Google...</span>";
  }

  const auth = getFirebaseAuth();
  if (auth) {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await auth.signInWithPopup(provider);
      if (result && result.user) {
        const u = result.user;
        const googleUser = {
          email: u.email,
          name: u.displayName || u.email.split("@")[0],
          photo_url: u.photoURL || ("https:/" + "/lh3.googleusercontent.com/a/default-user"),
          firebase_uid: u.uid
        };
        await completeGoogleLogin(googleUser);
        return;
      }
    } catch (popupErr) {
      if (popupErr.code === "auth/popup-closed-by-user" || popupErr.code === "auth/cancelled-popup-request") {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
        return;
      }
      if (popupErr.code === "auth/popup-blocked") {
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope("profile");
          provider.addScope("email");
          provider.setCustomParameters({ prompt: "select_account" });
          await auth.signInWithRedirect(provider);
          return;
        } catch (redirErr) { }
      }
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
  const emailInput = document.getElementById("loginEmail");
  const modalInput = document.getElementById("googleAccountEmail");
  if (modalInput) {
    if (emailInput && emailInput.value && emailInput.value.includes("@")) {
      modalInput.value = emailInput.value.trim();
    } else {
      modalInput.value = "";
    }
  }
  openModal("googleAuthModal");
  if (modalInput) setTimeout(() => modalInput.focus(), 150);
}

async function handleGoogleModalSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("googleAccountEmail");
  const email = input ? input.value.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    alert("Please enter a valid Google mail id");
    return;
  }

  const btn = document.getElementById("btnGoogleModalSubmit");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Signing in...";
  }

  const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const selectedRole = document.getElementById("regRole") ? document.getElementById("regRole").value : "student";
  const userRole = (selectedRole === "teacher" || selectedRole === "admin") ? selectedRole : "student";

  const googleUser = {
    email: email,
    name: name,
    photo_url: "https:/" + "/lh3.googleusercontent.com/a/default-user",
    role: userRole,
    firebase_uid: "firebase-" + btoa(email).replace(/=/g, "").slice(0, 12)
  };

  closeModal("googleAuthModal");
  await completeGoogleLogin(googleUser);
}

window.switchRole = switchRole;
window.updateUserUI = updateUserUI;
window.openForgotPassword = openForgotPassword;
window.handleUserLogin = handleUserLogin;
window.handleForgotPassword = handleForgotPassword;
window.handleLogout = handleLogout;
window.fillCredentials = fillCredentials;
window.showAuthTab = showAuthTab;
window.handleUserRegister = handleUserRegister;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleGoogleModalSubmit = handleGoogleModalSubmit;

var state = window.state = window.state || {};
let seenToastNotifs = new Set();
try {
  const stored = sessionStorage.getItem("seen_notif_ids");
  if (stored) {
    JSON.parse(stored).forEach(id => seenToastNotifs.add(id));
  }
} catch (e) { }
let isInitialNotifLoad = true;
let notifEventSource = null;

function markNotifSeen(id) {
  if (!id) return;
  seenToastNotifs.add(id);
  try {
    sessionStorage.setItem("seen_notif_ids", JSON.stringify([...seenToastNotifs].slice(-100)));
  } catch (e) { }
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) { }
}

function getOrCreateToastContainer() {
  let c = document.getElementById("toastContainer");
  if (!c) {
    c = document.createElement("div");
    c.id = "toastContainer";
    c.className = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

function showInAppToast(title, message, link, id) {
  playNotificationChime();
  const container = getOrCreateToastContainer();
  const banner = document.createElement("div");
  banner.className = "toast-banner";

  let icon = "🔔";
  const t = (title || "").toLowerCase();
  if (t.includes("solution") || t.includes("ready") || t.includes("ai")) {
    icon = "✨";
  } else if (t.includes("teacher") || t.includes("verified") || t.includes("review")) {
    icon = "🎓";
  } else if (t.includes("quiz") || t.includes("score")) {
    icon = "🎯";
  } else if (t.includes("clarification") || t.includes("flagged") || t.includes("issue")) {
    icon = "⚠️";
  } else if (t.includes("subject")) {
    icon = "📚";
  }

  banner.innerHTML = `
    <div class="toast-banner-icon">${icon}</div>
    <div class="toast-banner-content">
      <div class="toast-banner-header">
        <div class="toast-banner-title">${escapeHtml(title || "Notification")}</div>
        <button class="toast-banner-close" title="Dismiss">✕</button>
      </div>
      <div class="toast-banner-body">${escapeHtml(message || "")}</div>
    </div>
  `;

  const closeBtn = banner.querySelector(".toast-banner-close");
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeToast(banner);
  });

  banner.addEventListener("click", () => {
    removeToast(banner);
    if (id) {
      fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => { });
    }
    if (link) {
      if (link.startsWith("http") || link.startsWith("/")) {
        window.location.href = link;
      } else {
        window.location.href = `/history?id=${link}`;
      }
    }
  });

  container.appendChild(banner);
  requestAnimationFrame(() => {
    banner.classList.add("show");
  });

  setTimeout(() => {
    removeToast(banner);
  }, 6500);
}

function removeToast(banner) {
  if (!banner || !banner.parentNode) return;
  banner.classList.remove("show");
  banner.classList.add("hide");
  setTimeout(() => {
    if (banner.parentNode) banner.parentNode.removeChild(banner);
  }, 400);
}

async function requestDesktopNotificationPermission(interactive = false) {
  if (!("Notification" in window)) return false;
  try {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      updateDesktopNotifUI();
      if (permission === "granted") {
        if (interactive) {
          dispatchDesktopNotification("AI Doubt Solver", "Desktop notifications enabled for learning activities and teacher responses!", "perm-granted", "/");
        }
        return true;
      }
      return false;
    } else if (Notification.permission === "granted") {
      updateDesktopNotifUI();
      if (interactive) {
        dispatchDesktopNotification("AI Doubt Solver", "Desktop notifications enabled for learning activities and teacher responses!", "perm-granted", "/");
      }
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

function updateDesktopNotifUI() {
  const btn = document.getElementById("btnEnableDesktopNotif");
  const banner = document.getElementById("desktopNotifBanner");
  const bannerText = document.getElementById("desktopNotifBannerText");
  if (!("Notification" in window)) {
    if (btn) btn.textContent = "Desktop Alerts Unsupported";
    if (banner) banner.style.display = "none";
    return;
  }
  if (Notification.permission === "granted") {
    if (btn) btn.textContent = "✓ Desktop Alerts On";
    if (banner) {
      banner.classList.add("active");
      if (bannerText) bannerText.textContent = "✓ Real-time desktop alerts active";
    }
  } else if (Notification.permission === "denied") {
    if (btn) btn.textContent = "Alerts Blocked";
    if (banner) {
      banner.classList.remove("active");
      if (bannerText) bannerText.textContent = "⚠️ Desktop alerts blocked in browser settings";
    }
  } else {
    if (btn) btn.textContent = "🔔 Enable Desktop Alerts";
    if (banner) {
      banner.classList.remove("active");
      if (bannerText) bannerText.textContent = "🔔 Click to enable real-time desktop alerts";
    }
  }
}

function dispatchDesktopNotification(title, message, id, link) {
  playNotificationChime();
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title || "AI Doubt Solver Alert", {
        body: message || "You have a new real-time learning notification.",
        icon: "/static/favicon.ico",
        badge: "/static/favicon.ico",
        tag: id || ("notif-" + Date.now()),
        renotify: true,
        silent: false
      });
      notif.onclick = function () {
        try { window.focus(); } catch (e) { }
        if (id) {
          fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => { });
        }
        if (link) {
          if (link.startsWith("http") || link.startsWith("/")) {
            window.location.href = link;
          } else {
            window.location.href = `/history?id=${link}`;
          }
        }
        try { notif.close(); } catch (e) { }
      };
    } catch (e) {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title || "AI Doubt Solver Alert", {
              body: message,
              icon: "/static/favicon.ico",
              tag: id || ("notif-" + Date.now())
            });
          });
        }
      } catch (swErr) { }
    }
  }
}

async function testDesktopNotification() {
  const granted = await requestDesktopNotificationPermission(true);
  showInAppToast("Real-Time Desktop Alert", "Testing desktop notification and real-time delivery.", "/");
  if (granted || (window.Notification && Notification.permission === "granted")) {
    dispatchDesktopNotification("AI Doubt Solver", "Real-time desktop notification active! Instant alerts enabled.", "test-" + Date.now(), "/");
  }
  try {
    await fetch("/api/notifications/test-desktop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: state.user ? state.user.id : null,
        role: state.user ? state.user.role : null,
        title: "Real-Time Desktop Alert",
        message: "Instant notifications active across student, teacher, and admin sessions."
      })
    });
    loadNotifications();
  } catch (e) { }
}

function initNotificationStream() {
  if (!window.EventSource || !state.user || !state.user.id) return;
  if (notifEventSource) {
    try { notifEventSource.close(); } catch (e) { }
  }
  const streamUrl = `/api/notifications/stream?user_id=${encodeURIComponent(state.user.id)}&role=${encodeURIComponent(state.user.role || "")}`;
  try {
    notifEventSource = new EventSource(streamUrl);
    notifEventSource.addEventListener("notification", (e) => {
      try {
        const n = JSON.parse(e.data);
        if (n && n.id && !seenToastNotifs.has(n.id)) {
          markNotifSeen(n.id);
          showInAppToast(n.title, n.message, n.link, n.id);
          dispatchDesktopNotification(n.title, n.message, n.id, n.link);
          loadNotifications();
        }
      } catch (err) { }
    });
    notifEventSource.onerror = () => {
      if (notifEventSource) {
        try { notifEventSource.close(); } catch (e) { }
        notifEventSource = null;
        setTimeout(initNotificationStream, 2000);
      }
    };
  } catch (err) { }
}

function startNotificationPolling() {
  loadNotifications();
  updateDesktopNotifUI();
  setInterval(loadNotifications, 6000);

  if ("Notification" in window && Notification.permission === "default") {
    function handleInitialPermissionGesture() {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(p => {
          updateDesktopNotifUI();
          if (p === "granted") {
            dispatchDesktopNotification("AI Doubt Solver", "Real-time desktop alerts active! You will receive instant notifications for answers and reviews.", "perm-welcome", "/");
          }
        }).catch(() => {});
      }
      document.removeEventListener("click", handleInitialPermissionGesture);
    }
    document.addEventListener("click", handleInitialPermissionGesture, { once: true });
  }
}

async function loadNotifications() {
  try {
    if (!state.user) return;
    const res = await fetch(`/api/notifications?user_id=${encodeURIComponent(state.user.id)}&role=${encodeURIComponent(state.user.role || "")}`);
    if (!res.ok) return;
    const rawNotifs = await res.json();
    const notifs = Array.isArray(rawNotifs) ? rawNotifs : [];
    const dot = document.getElementById("notifDot");
    const unread = notifs.filter(n => !n.read).length;

    if (dot) dot.style.display = unread > 0 ? "block" : "none";

    const now = Date.now();
    notifs.forEach(n => {
      if (!n.read && !seenToastNotifs.has(n.id)) {
        markNotifSeen(n.id);
        const notifTime = n.timestamp ? new Date(n.timestamp).getTime() : 0;
        const isRecent = (now - notifTime) < 90000;
        if (isRecent || !isInitialNotifLoad) {
          showInAppToast(n.title, n.message, n.link, n.id);
          dispatchDesktopNotification(n.title, n.message, n.id, n.link);
        }
      }
    });
    isInitialNotifLoad = false;

    const container = document.getElementById("notifListContainer");
    if (!container) return;

    if (!notifs.length) {
      container.innerHTML = `<div class="notif-empty-message">No notifications yet</div>`;
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="notif-item-row ${n.read ? 'notif-item-read' : 'notif-item-unread'}" onclick="handleNotificationClick('${escapeHtml(n.id)}', '${escapeHtml(n.link || '')}')">
        <div class="notif-item-title">
          <span>${escapeHtml(n.title)}</span>
          ${!n.read ? '<span class="badge-dot"></span>' : ''}
        </div>
        <div class="notif-item-desc">${escapeHtml(n.message)}</div>
        <div class="notif-item-time">${formatLocalTime(n.timestamp)}</div>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
  }
}

async function handleNotificationClick(id, link) {
  if (id) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch (e) { }
  }
  loadNotifications();
  if (link) {
    if (link.startsWith("http") || link.startsWith("/")) {
      window.location.href = link;
    } else {
      window.location.href = `/history?id=${link}`;
    }
  }
}

function toggleNotifications() {
  const drawer = document.getElementById("notifDrawer");
  if (!drawer) return;
  const willShow = drawer.style.display !== "flex";
  drawer.style.display = willShow ? "flex" : "none";
  if (willShow) updateDesktopNotifUI();
}

async function clearAllNotifications() {
  try {
    await fetch("/api/notifications/clear-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: state.user ? state.user.id : null,
        role: state.user ? state.user.role : null
      })
    });
    loadNotifications();
  } catch (err) {
    console.error(err);
  }
}


window.markNotifSeen = markNotifSeen;
window.playNotificationChime = playNotificationChime;
window.getOrCreateToastContainer = getOrCreateToastContainer;
window.showInAppToast = showInAppToast;
window.removeToast = removeToast;
window.requestDesktopNotificationPermission = requestDesktopNotificationPermission;
window.updateDesktopNotifUI = updateDesktopNotifUI;
window.dispatchDesktopNotification = dispatchDesktopNotification;
window.testDesktopNotification = testDesktopNotification;
window.initNotificationStream = initNotificationStream;
window.startNotificationPolling = startNotificationPolling;
window.loadNotifications = loadNotifications;
window.handleNotificationClick = handleNotificationClick;
window.toggleNotifications = toggleNotifications;
window.clearAllNotifications = clearAllNotifications;

var state = window.state = window.state || {};

function setDoubtInputType(type) {
  state.activeInputType = type;
  document.querySelectorAll(".input-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-type") === type);
  });

  const codeSec = document.getElementById("codeSection");
  const attachSec = document.getElementById("attachmentSection");
  const attachLabel = document.getElementById("attachmentLabel");
  const hint = document.getElementById("fileTypeHint");
  const fileInput = document.getElementById("doubtAttachment");
  const subj = document.getElementById("doubtSubject");
  const qInput = document.getElementById("doubtQuestion");

  if (type === "code") {
    if (codeSec) {
      codeSec.classList.remove("hidden");
      codeSec.style.display = "block";
    }
    if (attachSec) {
      attachSec.classList.add("hidden");
      attachSec.style.display = "none";
    }
    if (subj) subj.value = "Computer Science";
    if (qInput) qInput.placeholder = "Describe the bug, error message, or what output you expect...";
  } else if (type === "image") {
    if (codeSec) {
      codeSec.classList.add("hidden");
      codeSec.style.display = "none";
    }
    if (attachSec) {
      attachSec.classList.remove("hidden");
      attachSec.style.display = "block";
    }
    if (attachLabel) attachLabel.textContent = "Upload Problem Image / Photo";
    if (hint) hint.textContent = "PNG, JPG, JPEG, WEBP up to 25MB";
    if (fileInput) fileInput.accept = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
    if (qInput) qInput.placeholder = "State any additional notes or specific questions about the image...";
  } else if (type === "document") {
    if (codeSec) {
      codeSec.classList.add("hidden");
      codeSec.style.display = "none";
    }
    if (attachSec) {
      attachSec.classList.remove("hidden");
      attachSec.style.display = "block";
    }
    if (attachLabel) attachLabel.textContent = "Upload PDF / Academic Document";
    if (hint) hint.textContent = "PDF, DOCX, TXT up to 25MB";
    if (fileInput) fileInput.accept = ".pdf,.docx,.doc,.txt,application/pdf";
    if (qInput) qInput.placeholder = "State which question, problem number, or page from the document to solve...";
  } else {
    if (codeSec) {
      codeSec.classList.add("hidden");
      codeSec.style.display = "none";
    }
    if (attachSec) {
      attachSec.classList.add("hidden");
      attachSec.style.display = "none";
    }
    if (qInput) qInput.placeholder = "State your doubt clearly. What have you attempted and where are you getting stuck?";
  }
}

function selectExplanationLevel(level) {
  state.activeExplanationLevel = level;
  document.querySelectorAll(".level-card").forEach(c => {
    c.classList.toggle("active", c.getAttribute("data-level") === level);
  });
}

function openCodeSolver() {
  window.location.href = "/ask?type=code";
}

function handleFileSelected(e) {
  const file = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
  if (!file) return;

  state.selectedFile = file;
  const bar = document.getElementById("filePreviewBar");
  const nameLabel = document.getElementById("fileNameLabel");
  const thumb = document.getElementById("imageThumbnail");
  const docIcon = document.getElementById("docFileIcon");

  if (bar) bar.style.display = "flex";
  if (nameLabel) nameLabel.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (thumb) {
        thumb.src = event.target.result;
        thumb.style.display = "block";
      }
      if (docIcon) docIcon.style.display = "none";
    };
    reader.readAsDataURL(file);
  } else {
    if (thumb) thumb.style.display = "none";
    if (docIcon) {
      docIcon.style.display = "inline-flex";
      docIcon.textContent = file.name.toLowerCase().endsWith(".pdf") ? "📕 PDF" : "📄 DOC";
    }
  }
}

function removeSelectedFile() {
  state.selectedFile = null;
  const fileInput = document.getElementById("doubtAttachment");
  if (fileInput) fileInput.value = "";
  const bar = document.getElementById("filePreviewBar");
  if (bar) bar.style.display = "none";
  const thumb = document.getElementById("imageThumbnail");
  if (thumb) {
    thumb.src = "";
    thumb.style.display = "none";
  }
  const docIcon = document.getElementById("docFileIcon");
  if (docIcon) docIcon.style.display = "none";
}

async function handleAskDoubt(e) {
  e.preventDefault();
  const title = document.getElementById("doubtTitle").value.trim();
  const question = document.getElementById("doubtQuestion").value.trim();
  const subject = document.getElementById("doubtSubject").value;
  const codeSnippet = document.getElementById("codeSnippet").value.trim();
  const codeLanguage = document.getElementById("codeLanguage").value;

  if (!question && !state.selectedFile && !codeSnippet) {
    alert("Please provide a question statement, code snippet, or upload a problem sheet.");
    return;
  }

  const btn = document.getElementById("btnSubmitDoubt");
  const origText = btn.innerHTML;
  btn.innerHTML = `<span>⏳ Reasoning with AI...</span>`;
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("question", question);
    formData.append("subject", subject);
    formData.append("explanation_level", state.activeExplanationLevel);
    formData.append("type", state.activeInputType);
    formData.append("user_id", state.user.id);
    formData.append("user_name", state.user.name);

    if (codeSnippet) {
      formData.append("code_snippet", codeSnippet);
      formData.append("code_language", codeLanguage);
    }

    if (state.selectedFile) {
      formData.append("attachment", state.selectedFile);
    }

    const res = await fetch("/api/doubts", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit doubt");
    }

    const createdDoubt = await res.json();
    document.getElementById("formAskDoubt").reset();
    removeSelectedFile();
    navigateTo("doubt-detail", { id: createdDoubt.id });
  } catch (err) {
    alert(err.message || "Failed to generate AI solution");
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

async function loadDoubtDetail(id) {
  try {
    const res = await fetch(`/api/doubts/${id}`);
    if (!res.ok) throw new Error("Doubt not found");
    const doubt = await res.json();
    state.currentDoubt = doubt;

    const subBadge = document.getElementById("detailSubjectBadge");
    if (subBadge) subBadge.textContent = doubt.subject || "General";
    const lvlBadge = document.getElementById("detailLevelBadge");
    if (lvlBadge) lvlBadge.textContent = (doubt.explanation_level || "Intermediate").toUpperCase();
    const dateEl = document.getElementById("detailDate");
    if (dateEl) dateEl.textContent = formatLocalDate(doubt.created_at);
    const titleEl = document.getElementById("detailTitle");
    if (titleEl) titleEl.textContent = doubt.title || doubt.question || "Academic Doubt";
    const qEl = document.getElementById("detailQuestion");
    if (qEl) qEl.innerHTML = renderMath(escapeHtml(doubt.question || ""));

    const verifiedBadge = document.getElementById("detailVerifiedBadge");
    if (verifiedBadge) {
      if (doubt.teacher_review && doubt.teacher_review.reviewed) {
        verifiedBadge.classList.remove("hidden");
        verifiedBadge.style.display = "inline-flex";
      } else {
        verifiedBadge.classList.add("hidden");
        verifiedBadge.style.display = "none";
      }
    }

    const bookmarkBtn = document.getElementById("btnDetailBookmark");
    if (bookmarkBtn) {
      bookmarkBtn.textContent = doubt.bookmarked ? "Saved" : "Save Bookmark";
      bookmarkBtn.style.color = doubt.bookmarked ? "var(--accent-amber)" : "var(--text-main)";
    }

    const imgWrapper = document.getElementById("detailImageWrapper");
    const imgEl = document.getElementById("detailImage");
    if (doubt.attachment && (doubt.attachment.preview_url || doubt.attachment.type === "image")) {
      if (imgEl && doubt.attachment.preview_url) imgEl.src = doubt.attachment.preview_url;
      if (imgWrapper) {
        imgWrapper.classList.remove("hidden");
        imgWrapper.style.display = "block";
      }
    } else {
      if (imgWrapper) {
        imgWrapper.classList.add("hidden");
        imgWrapper.style.display = "none";
      }
    }

    const docWrapper = document.getElementById("detailDocWrapper");
    const docName = document.getElementById("detailDocName");
    if (doubt.attachment && doubt.attachment.type === "document") {
      if (docWrapper) {
        docWrapper.classList.remove("hidden");
        docWrapper.style.display = "block";
      }
      if (docName) docName.textContent = doubt.attachment.name || "Academic Document.pdf";
    } else {
      if (docWrapper) {
        docWrapper.classList.add("hidden");
        docWrapper.style.display = "none";
      }
    }

    const codeWrapper = document.getElementById("detailCodeWrapper");
    if (doubt.code_snippet) {
      const langEl = document.getElementById("detailCodeLang");
      const blockEl = document.getElementById("detailCodeBlock");
      if (langEl) langEl.textContent = (doubt.code_language || "CODE").toUpperCase();
      if (blockEl) blockEl.textContent = doubt.code_snippet;
      if (codeWrapper) {
        codeWrapper.classList.remove("hidden");
        codeWrapper.style.display = "block";
      }
    } else {
      if (codeWrapper) {
        codeWrapper.classList.add("hidden");
        codeWrapper.style.display = "none";
      }
    }

    const sol = doubt.solution || {};
    const solSum = document.getElementById("solutionSummary");
    if (solSum) solSum.textContent = sol.summary || "";
    const solFin = document.getElementById("solutionFinal");
    if (solFin) solFin.innerHTML = renderMath(sol.final_answer || "");
    const solTak = document.getElementById("solutionTakeaway");
    if (solTak) solTak.textContent = sol.key_takeaway || "";

    const solCodeBox = document.getElementById("solutionCodeBox");
    if (sol.code_correction) {
      const codeBlk = document.getElementById("solutionCodeBlock");
      if (codeBlk) codeBlk.textContent = sol.code_correction;
      if (solCodeBox) {
        solCodeBox.classList.remove("hidden");
        solCodeBox.style.display = "block";
      }
    } else {
      if (solCodeBox) {
        solCodeBox.classList.add("hidden");
        solCodeBox.style.display = "none";
      }
    }

    const stepsContainer = document.getElementById("solutionStepsContainer");
    stepsContainer.innerHTML = (sol.steps || []).map(s => `
      <div class="step-card">
        <div class="step-indicator">${s.step_number}</div>
        <div class="step-body">
          <div class="step-title">${escapeHtml(s.title)}</div>
          <div class="step-content">${renderMath(s.content)}</div>
        </div>
      </div>
    `).join("");

    const teacherReviewBox = document.getElementById("teacherReviewBox");
    const teacherActionForm = document.getElementById("teacherActionForm");

    if (doubt.teacher_review && doubt.teacher_review.reviewed) {
      if (teacherReviewBox) teacherReviewBox.style.display = "block";
      const hEl = document.getElementById("teacherReviewHeading");
      if (hEl) hEl.textContent = `Teacher Verification: ${doubt.teacher_review.teacher_name}`;
      const tEl = document.getElementById("teacherReviewText");
      if (tEl) tEl.textContent = doubt.teacher_review.note;
      if (teacherActionForm) teacherActionForm.style.display = "none";
    } else if (state.user && (state.user.role === "teacher" || state.user.role === "admin")) {
      if (teacherReviewBox) teacherReviewBox.style.display = "none";
      if (teacherActionForm) teacherActionForm.style.display = "block";
    } else {
      if (teacherReviewBox) teacherReviewBox.style.display = "none";
      if (teacherActionForm) teacherActionForm.style.display = "none";
    }

    renderFollowUps(doubt.follow_ups || []);
    const practicePanel = document.getElementById("practiceQuestionsPanel");
    if (practicePanel) practicePanel.style.display = "none";
  } catch (err) {
    alert(err.message || "Failed to load doubt solution");
    navigateTo("history");
  }
}

function renderFollowUps(followUps) {
  const container = document.getElementById("followUpsList");
  if (!container) return;

  if (followUps.length === 0) {
    container.innerHTML = `<div class="followup-empty-prompt">Have questions about a step or need clarification? Ask below!</div>`;
    return;
  }

  container.innerHTML = followUps.map(f => `
    <div class="chat-bubble ${f.sender}">
      <div class="chat-bubble-meta">
        ${f.sender === 'student' ? 'You' : 'AI Academic Assistant'} • ${formatLocalTime(f.timestamp)}
      </div>
      <div>${renderMath(escapeHtml(f.text))}</div>
    </div>
  `).join("");

  container.scrollTop = container.scrollHeight;
}

async function handleSendFollowUp(e) {
  e.preventDefault();
  if (!state.currentDoubt) return;

  const input = document.getElementById("followUpInput");
  const msg = input.value.trim();
  if (!msg) return;

  const btn = document.getElementById("btnSendFollowUp");
  btn.disabled = true;
  btn.textContent = "Thinking...";

  try {
    const res = await fetch(`/api/doubts/${state.currentDoubt.id}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    state.currentDoubt = data.doubt;
    renderFollowUps(data.doubt.follow_ups || []);
    input.value = "";
  } catch (err) {
    alert("Failed to send follow up");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Question";
  }
}

async function toggleDetailBookmark() {
  if (!state.currentDoubt) return;
  try {
    const res = await fetch(`/api/doubts/${state.currentDoubt.id}/bookmark`, { method: "POST" });
    const data = await res.json();
    state.currentDoubt.bookmarked = data.bookmarked;
    const btn = document.getElementById("btnDetailBookmark");
    btn.textContent = data.bookmarked ? "★ Saved" : "☆ Save Bookmark";
    btn.textContent = data.bookmarked ? "Saved" : "Save Bookmark";
    btn.style.color = data.bookmarked ? "var(--accent-amber)" : "var(--text-main)";
  } catch (err) {
    console.error(err);
  }
}

async function submitTeacherAnnotation() {
  if (!state.currentDoubt) return;
  const note = document.getElementById("teacherAnnotationInput").value.trim();

  try {
    await fetch(`/api/teacher/review/${state.currentDoubt.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_name: state.user.name,
        note: note || "Verified by instructor."
      })
    });
    alert("Solution approved and verified.");
    loadDoubtDetail(state.currentDoubt.id);
  } catch (err) {
    alert("Failed to save review");
  }
}

async function loadHistory() {
  const q = document.getElementById("historySearchInput")?.value.trim() || "";
  const subject = document.getElementById("filterSubject")?.value || "All";
  const level = document.getElementById("filterLevel")?.value || "All";
  const status = document.getElementById("filterStatus")?.value || "All";

  try {
    const url = `/api/doubts?search=${encodeURIComponent(q)}&subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}&status=${encodeURIComponent(status)}&role=${state.user.role}&user_id=${state.user.id}`;
    const res = await fetch(url);
    const doubts = await res.json();
    state.doubts = doubts;
    renderDoubtsList("historyDoubtsList", doubts);
  } catch (err) {
    console.error(err);
  }
}

function applyHistoryFilters() {
  loadHistory();
}

function resetHistoryFilters() {
  document.getElementById("historySearchInput").value = "";
  document.getElementById("filterSubject").value = "All";
  document.getElementById("filterLevel").value = "All";
  document.getElementById("filterStatus").value = "All";
  loadHistory();
}

async function loadBookmarks() {
  try {
    const res = await fetch(`/api/doubts?bookmarked=true&user_id=${state.user.id}`);
    const doubts = await res.json();
    state.doubts = doubts;
    renderDoubtsList("bookmarksList", doubts);
  } catch (err) {
    console.error(err);
  }
}


window.setDoubtInputType = setDoubtInputType;
window.selectExplanationLevel = selectExplanationLevel;
window.openCodeSolver = openCodeSolver;
window.handleFileSelected = handleFileSelected;
window.removeSelectedFile = removeSelectedFile;
window.handleAskDoubt = handleAskDoubt;
window.loadDoubtDetail = loadDoubtDetail;
window.renderFollowUps = renderFollowUps;
window.handleSendFollowUp = handleSendFollowUp;
window.toggleDetailBookmark = toggleDetailBookmark;
window.submitTeacherAnnotation = submitTeacherAnnotation;
window.loadHistory = loadHistory;
window.applyHistoryFilters = applyHistoryFilters;
window.resetHistoryFilters = resetHistoryFilters;
window.loadBookmarks = loadBookmarks;

var state = window.state = window.state || {};

async function loadDashboardData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let pendingDoubtId = urlParams.get("practice_doubt_id");
    let pendingTopic = urlParams.get("practice_topic");
    let pendingSubject = urlParams.get("subject");

    if (!pendingDoubtId && sessionStorage.getItem("pending_practice")) {
      try {
        const stored = JSON.parse(sessionStorage.getItem("pending_practice"));
        pendingDoubtId = stored.doubtId;
        pendingTopic = stored.topic;
        pendingSubject = stored.subject;
        sessionStorage.removeItem("pending_practice");
      } catch (e) { }
    }

    try {
      const cachedDoubts = sessionStorage.getItem("cached_dash_doubts");
      if (cachedDoubts) {
        const doubts = JSON.parse(cachedDoubts);
        if (Array.isArray(doubts)) {
          state.doubts = doubts;
          const totalEl = document.getElementById("statTotalDoubts");
          const solvedEl = document.getElementById("statSolvedDoubts");
          const bookmarkedEl = document.getElementById("statBookmarkedDoubts");
          if (totalEl) totalEl.textContent = doubts.length;
          if (solvedEl) solvedEl.textContent = doubts.filter(d => d.status === "solved" || d.status === "verified").length;
          if (bookmarkedEl) bookmarkedEl.textContent = doubts.filter(d => d.bookmarked).length;
          renderDoubtsList("dashboardDoubtsList", doubts.slice(0, 5));
        }
      }
      const cachedRecs = sessionStorage.getItem("cached_dash_recs");
      if (cachedRecs) {
        const recData = JSON.parse(cachedRecs);
        if (recData && recData.recommendations) {
          renderDashboardRecommendations(recData.recommendations || []);
        }
      }
    } catch (e) { }

    const doubtsPromise = fetch(`/api/doubts?user_id=${state.user.id}&role=${state.user.role}`)
      .then(r => r.json())
      .then(doubts => {
        if (Array.isArray(doubts)) {
          state.doubts = doubts;
          sessionStorage.setItem("cached_dash_doubts", JSON.stringify(doubts));
          const totalEl = document.getElementById("statTotalDoubts");
          const solvedEl = document.getElementById("statSolvedDoubts");
          const bookmarkedEl = document.getElementById("statBookmarkedDoubts");
          if (totalEl) totalEl.textContent = doubts.length;
          if (solvedEl) solvedEl.textContent = doubts.filter(d => d.status === "solved" || d.status === "verified").length;
          if (bookmarkedEl) bookmarkedEl.textContent = doubts.filter(d => d.bookmarked).length;
          renderDoubtsList("dashboardDoubtsList", doubts.slice(0, 5));
        }
      })
      .catch(e => { });

    const recsPromise = fetch(`/api/quiz/recommendations?user_id=${state.user.id}`)
      .then(r => r.json())
      .then(recData => {
        if (recData && recData.recommendations) {
          sessionStorage.setItem("cached_dash_recs", JSON.stringify(recData));
          renderDashboardRecommendations(recData.recommendations || []);
        }
      })
      .catch(e => { });

    const topicsPromise = loadLearnedTopicsForPractice(pendingDoubtId || pendingTopic);

    await Promise.allSettled([doubtsPromise, recsPromise, topicsPromise]);

    if (pendingDoubtId || pendingTopic) {
      setTimeout(() => {
        practiceTopicFromDoubt(pendingDoubtId, pendingTopic || "Learned Topic", pendingSubject || "Mathematics");
      }, 150);
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadLearnedTopicsForPractice(preferredTopicOrId) {
  const select = document.getElementById("selectLearnedTopic");
  if (!select) return;

  try {
    const res = await fetch(`/api/doubts/learned-topics?user_id=${state.user.id}`);
    const topics = await res.json();

    if (!topics || topics.length === 0) {
      select.innerHTML = `<option value="General Academic Foundations" data-subject="Mathematics">General Academic Foundations</option>`;
      return;
    }

    state.learnedTopics = topics;
    select.innerHTML = topics.map(t => `
      <option value="${escapeHtml(t.topic)}" data-subject="${escapeHtml(t.subject)}" data-doubt-id="${t.doubt_id}">
        [${escapeHtml(t.subject)}] ${escapeHtml(t.topic)}
      </option>
    `).join("");

    if (preferredTopicOrId) {
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value === preferredTopicOrId || opt.getAttribute("data-doubt-id") === preferredTopicOrId) {
          select.selectedIndex = i;
          break;
        }
      }
    }
  } catch (err) {
    select.innerHTML = `<option value="General Academic Practice" data-subject="Mathematics">General Academic Practice</option>`;
  }
}

async function handlePracticeTopicClick(doubtId) {
  let doubt = window.allDoubtsMap ? window.allDoubtsMap[doubtId] : null;
  if (!doubt && state.doubts && state.doubts.length) {
    doubt = state.doubts.find(x => x.id === doubtId);
  }
  if (!doubt) {
    try {
      const res = await fetch(`/api/doubts/${doubtId}`);
      if (res.ok) {
        doubt = await res.json();
        window.allDoubtsMap = window.allDoubtsMap || {};
        window.allDoubtsMap[doubtId] = doubt;
      }
    } catch (e) { }
  }

  const topic = (doubt && doubt.solution && (doubt.solution.key_takeaway || doubt.solution.summary)) || (doubt && doubt.title) || "General Topic Practice";
  const subject = (doubt && doubt.subject) || "Mathematics";

  const container = document.getElementById("dashboardPracticeContainer");
  if (container) {
    await practiceTopicFromDoubt(doubtId, topic, subject);
  } else {
    sessionStorage.setItem("pending_practice", JSON.stringify({ doubtId, topic, subject }));
    window.location.href = `/?practice_doubt_id=${encodeURIComponent(doubtId)}&practice_topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}#learnedTopicsPracticeSection`;
  }
}

async function practiceTopicFromDoubt(doubtId, topicTitle, subject) {
  const section = document.getElementById("learnedTopicsPracticeSection") || document.getElementById("dashboardPracticeContainer");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const select = document.getElementById("selectLearnedTopic");
  if (select) {
    let matched = false;
    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      if ((doubtId && opt.getAttribute("data-doubt-id") === doubtId) ||
        (topicTitle && opt.value.toLowerCase() === topicTitle.toLowerCase()) ||
        (topicTitle && opt.textContent.toLowerCase().includes(topicTitle.toLowerCase()))) {
        select.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched && topicTitle) {
      const newOpt = document.createElement("option");
      newOpt.value = topicTitle;
      newOpt.setAttribute("data-subject", subject || "Mathematics");
      if (doubtId) newOpt.setAttribute("data-doubt-id", doubtId);
      newOpt.textContent = `[${subject || "General"}] ${topicTitle}`;
      newOpt.selected = true;
      select.prepend(newOpt);
    }
  }

  await generateDashboardPracticeQuestions(true);
}

async function generateDashboardPracticeQuestions(isUserClick) {
  const selectTopic = document.getElementById("selectLearnedTopic");
  const selectDiff = document.getElementById("selectPracticeDifficulty");
  const container = document.getElementById("dashboardPracticeContainer");
  const btn = document.getElementById("btnGenerateDashboardPractice");

  if (!container) return;

  const selectedOpt = selectTopic && selectTopic.selectedOptions ? selectTopic.selectedOptions[0] : null;
  const topic = selectedOpt ? selectedOpt.value : (selectTopic ? selectTopic.value : "Core Academic Principles");
  const subject = selectedOpt ? (selectedOpt.getAttribute("data-subject") || "Mathematics") : "Mathematics";
  const doubtId = selectedOpt ? selectedOpt.getAttribute("data-doubt-id") : null;
  const difficulty = selectDiff ? selectDiff.value : "intermediate";

  if (!topic) {
    alert("Please select a learned topic to practice.");
    return;
  }

  const origBtnContent = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Reasoning with AI...</span>`;
  }

  container.innerHTML = `
    <div style="padding: 3rem 1.5rem; text-align: center; background: var(--surface-hover); border-radius: var(--radius-md); border: 1px solid var(--border);">
      <div style="font-size: 2.5rem; margin-bottom: 1rem;">🧠</div>
      <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">
        Synthesizing Practice Problems on "${escapeHtml(topic)}"
      </div>
      <div style="font-size: 1.12rem; color: var(--text-muted); max-width: 600px; margin: 0 auto; line-height: 1.6;">
        AI is tailoring questions based on your solved doubt principles, constructing hints, and computing verified step-by-step solutions...
      </div>
    </div>
  `;

  try {
    const res = await fetch("/api/practice/generate-topic-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic,
        subject: subject,
        difficulty: difficulty,
        doubt_id: doubtId
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to generate practice problems");
    }

    const data = await res.json();
    const problems = data.problems || [];

    if (problems.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--accent-red); font-size: 1.2rem;">
          No practice problems could be generated at this time. Please try again.
        </div>
      `;
      return;
    }

    let html = `
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding: 1.25rem 1.5rem; background: var(--surface-hover); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
          <span style="font-size: 1.2rem; font-weight: 800; color: var(--text-main);">${escapeHtml(data.topic)}</span>
          <span class="badge badge-subject" style="font-size: 0.95rem;">${escapeHtml(data.subject)}</span>
          <span class="badge badge-level" style="font-size: 0.95rem;">${escapeHtml(data.difficulty)}</span>
          <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">(${problems.length} Practice Problems)</span>
        </div>
        <button type="button" class="btn btn-outline" onclick="generateDashboardPracticeQuestions(true)" style="font-size: 1.02rem; padding: 0.5rem 1.2rem; font-weight: 700;">
          <span>🔄</span>
          <span>Regenerate Fresh Questions</span>
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1.75rem;">
    `;

    problems.forEach((p, idx) => {
      html += `
        <div class="practice-problem-card" style="background: var(--surface-hover); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="font-size: 1.18rem; font-weight: 800; color: var(--brand); display: flex; align-items: center; gap: 0.5rem;">
              <span>Question ${idx + 1}</span>
            </div>
            <span style="font-size: 0.95rem; color: var(--text-light); font-weight: 600;">Self-Paced Practice</span>
          </div>

          <div style="font-size: 1.28rem; font-weight: 700; line-height: 1.65; color: var(--text-main); margin-bottom: 1.25rem;">
            ${renderMath(escapeHtml(p.question))}
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 1.02rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">
              Student Working & Scratchpad:
            </label>
            <textarea class="form-input" rows="3" placeholder="Type your calculations, thought steps, or final answer here to test yourself..." style="width: 100%; font-size: 1.08rem; line-height: 1.55; resize: vertical;"></textarea>
          </div>

          <details style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem 1.25rem;">
            <summary style="cursor: pointer; font-size: 1.15rem; font-weight: 800; color: var(--brand); display: flex; align-items: center; gap: 0.5rem;">
              <span>✓</span> Reveal Step-by-Step Solution & Answer
            </summary>
            <div style="margin-top: 1.2rem; padding-top: 1.2rem; border-top: 1px solid var(--border); font-size: 1.12rem; line-height: 1.75; color: var(--text-main);">
              <div style="font-weight: 800; color: var(--brand); margin-bottom: 0.5rem; font-size: 1.15rem;">Complete Derivation:</div>
              <div style="line-height: 1.8; margin-bottom: 1.25rem; white-space: pre-line;">${renderMath(escapeHtml(p.solution))}</div>
              <div style="padding: 1rem 1.4rem; background: var(--accent-green-bg); border-left: 5px solid var(--accent-green); border-radius: 4px; font-size: 1.2rem; font-weight: 800; color: var(--accent-green);">
                Verified Answer: ${renderMath(escapeHtml(p.answer))}
              </div>
            </div>
          </details>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--accent-red); font-size: 1.2rem; background: var(--surface-hover); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠</div>
        <div style="font-weight: 800; margin-bottom: 0.5rem;">Unable to generate practice questions</div>
        <div style="font-size: 1.05rem; color: var(--text-muted); margin-bottom: 1rem;">${escapeHtml(err.message || 'AI service did not respond.')}</div>
        <button type="button" class="btn btn-primary" onclick="generateDashboardPracticeQuestions(true)">Try Again</button>
      </div>
    `;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnContent;
    }
  }
}

function renderDoubtsList(containerId, doubts) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!doubts || doubts.length === 0) {
    container.innerHTML = `<div class="doubt-empty-message">No doubts found. Click "Ask AI Doubt" to start!</div>`;
    return;
  }

  window.allDoubtsMap = window.allDoubtsMap || {};
  doubts.forEach(d => {
    window.allDoubtsMap[d.id] = d;
  });

  container.innerHTML = doubts.map(d => `
    <div class="doubt-item" onclick="navigateTo('doubt-detail', { id: '${d.id}' })">
      <div class="doubt-item-main">
        <div class="doubt-meta-row">
          <span class="badge badge-subject">${d.subject}</span>
          <span class="badge badge-level">${d.explanation_level}</span>
          ${d.teacher_review && d.teacher_review.reviewed ? '<span class="badge badge-verified">Verified</span>' : ''}
          ${d.status === 'flagged' ? '<span class="badge badge-flagged">Under Review</span>' : ''}
          ${d.bookmarked ? '<span class="doubt-bookmark-icon">★</span>' : ''}
        </div>
        <div class="doubt-item-title">${escapeHtml(d.title)}</div>
        <div class="doubt-item-desc">${escapeHtml(d.solution && d.solution.summary ? d.solution.summary : d.question)}</div>
        <div class="doubt-item-footer">
          <span>${formatLocalDate(d.created_at)}</span>
          <button type="button" class="btn btn-outline doubt-btn-practice" onclick="event.stopPropagation(); handlePracticeTopicClick('${d.id}')">
            🎯 Practice This Topic
          </button>
        </div>
      </div>
      <div class="doubt-arrow-icon">›</div>
    </div>
  `).join("");
}

function renderDashboardRecommendations(recs) {
  const container = document.getElementById("dashboardRecommendationsList");
  if (!container) return;

  if (!recs || recs.length === 0) {
    container.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 1.15rem;">
        No study recommendations available yet. Ask a doubt to receive personalized learning paths!
      </div>
    `;
    return;
  }

  container.innerHTML = recs.slice(0, 3).map((r, idx) => {
    const exercisesHtml = (r.exercises && r.exercises.length) ? r.exercises.map(ex => `
      <div style="padding: 1.25rem 1.5rem; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; gap: 0.5rem; flex-wrap: wrap;">
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-main);">${escapeHtml(ex.title)}</div>
            <div style="display: flex; gap: 0.4rem;">
              <span class="badge badge-level" style="font-size: 0.82rem;">${escapeHtml(ex.difficulty)}</span>
              <span class="badge badge-subject" style="font-size: 0.82rem;">${escapeHtml(ex.count)}</span>
            </div>
          </div>
          <div style="font-size: 1.02rem; color: var(--text-muted); line-height: 1.55;">
            ${escapeHtml(ex.description)}
          </div>
        </div>
        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; margin-top: 0.35rem;">
          <button type="button" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.95rem; font-weight: 700;" onclick="practiceRecommendedTopic('${escapeHtml(r.recommended_topic || r.topic)}', '${escapeHtml(r.subject)}')">
            <span>⚡</span> Practice Problems
          </button>
          <button type="button" class="btn btn-outline" style="padding: 0.45rem 1rem; font-size: 0.95rem; font-weight: 700;" onclick="launchQuizForTopic('${escapeHtml(r.subject)}', '${escapeHtml(r.recommended_topic || r.topic)}')">
            <span>✓</span> Take Quiz Drill
          </button>
        </div>
      </div>
    `).join("") : "";

    const resourcesHtml = (r.learning_resources && r.learning_resources.length) ? r.learning_resources.map((resItem, resIdx) => `
      <div style="padding: 1.25rem 1.5rem; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; gap: 0.5rem; flex-wrap: wrap;">
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-main);">${escapeHtml(resItem.title)}</div>
            <span class="badge badge-subject" style="font-size: 0.82rem;">${escapeHtml(resItem.type)}</span>
          </div>
          <div style="font-size: 1.02rem; color: var(--text-muted); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(resItem.summary)}
          </div>
        </div>
        <button type="button" class="btn btn-outline" style="align-self: flex-start; padding: 0.45rem 1rem; font-size: 0.95rem; font-weight: 700; color: var(--brand); border-color: var(--brand-border); background: var(--brand-light);" onclick="openResourceSummaryByIndex(${idx}, ${resIdx})">
          <span>📖</span> View Resource Summary
        </button>
      </div>
    `).join("") : "";

    return `
      <div class="recommendation-card" style="padding: 2.25rem; border-radius: var(--radius-lg); background: var(--surface-hover); border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <span class="badge badge-subject" style="font-size: 0.95rem; font-weight: 800; padding: 0.35rem 0.85rem;">${escapeHtml(r.subject)}</span>
            <span style="font-size: 0.98rem; color: var(--text-muted); font-weight: 600;">
              Derived from Doubt: <strong>${escapeHtml(r.doubt_title || 'Recent Inquiry')}</strong>
            </span>
          </div>
          <span style="font-size: 0.95rem; color: var(--text-light); font-weight: 700;">${r.estimated_minutes || 10} min module</span>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.55rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">
            ${escapeHtml(r.recommended_topic || r.topic)}
          </h3>
          <p style="font-size: 1.12rem; color: var(--text-muted); line-height: 1.65; margin: 0;">
            ${escapeHtml(r.reason)}
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <div>
            <div style="font-size: 1.05rem; font-weight: 800; text-transform: uppercase; color: var(--brand); letter-spacing: 0.04em; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>🎯</span>
              <span>Recommended Exercises & Drills</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${exercisesHtml}
            </div>
          </div>

          <div>
            <div style="font-size: 1.05rem; font-weight: 800; text-transform: uppercase; color: var(--accent-purple); letter-spacing: 0.04em; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>📚</span>
              <span>Learning Resources & Formula Sheets</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${resourcesHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  state.activeRecommendations = recs;
}

function openResourceSummaryByIndex(recIdx, resIdx) {
  if (!state.activeRecommendations || !state.activeRecommendations[recIdx]) return;
  const item = state.activeRecommendations[recIdx].learning_resources[resIdx];
  if (!item) return;

  openResourceSummary(item.title, item.type, item.summary);
}

function openResourceSummary(title, type, summary) {
  const badgeEl = document.getElementById("modalResourceBadge");
  const titleEl = document.getElementById("modalResourceTitle");
  const contentEl = document.getElementById("modalResourceContent");

  if (badgeEl) badgeEl.textContent = type || "Learning Resource";
  if (titleEl) titleEl.textContent = title;
  if (contentEl) contentEl.innerHTML = renderMath(escapeHtml(summary));

  openModal("recommendationResourceModal");
}

function practiceRecommendedTopic(topic, subject) {
  const container = document.getElementById("dashboardPracticeContainer");
  if (container) {
    practiceTopicFromDoubt(null, topic, subject);
  } else {
    sessionStorage.setItem("pending_practice", JSON.stringify({ doubtId: "", topic, subject }));
    window.location.href = `/?practice_topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}#learnedTopicsPracticeSection`;
  }
}

async function generatePracticeForCurrentDoubt() {
  if (!state.currentDoubt) return;
  const panel = document.getElementById("practiceQuestionsPanel");
  const list = document.getElementById("practiceQuestionsList");

  panel.style.display = "block";
  list.innerHTML = `<div style="font-size: 1.15rem; color: var(--text-muted); padding: 1.25rem 0;">Generating tailored practice problems via AI...</div>`;

  try {
    const res = await fetch(`/api/doubts/${state.currentDoubt.id}/practice`, { method: "POST" });
    const data = await res.json();
    const problems = data.problems || [];

    list.innerHTML = problems.map((p, i) => `
      <div style="padding: 1.35rem; border-radius: var(--radius-md); background: var(--surface-hover); border: 1px solid var(--border);">
        <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">${i + 1}. ${escapeHtml(p.question)}</div>
        <details style="font-size: 1.1rem;">
          <summary style="cursor: pointer; color: var(--brand); font-weight: 700;">Show Solution & Answer</summary>
          <div style="margin-top: 0.65rem; padding: 1rem; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border);">
            <div style="white-space: pre-line; line-height: 1.65;">${escapeHtml(p.solution)}</div>
            <div style="font-weight: 800; color: var(--accent-green); margin-top: 0.65rem;">Answer: ${escapeHtml(p.answer)}</div>
          </div>
        </details>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div style="color: var(--accent-red); font-size: 1.1rem;">Failed to generate practice problems.</div>`;
  }
}

function hidePracticePanel() {
  document.getElementById("practiceQuestionsPanel").style.display = "none";
}

async function loadRecommendations() {
  try {
    const res = await fetch(`/api/quiz/recommendations?user_id=${state.user.id}`);
    const data = await res.json();
    const container = document.getElementById("recommendationsGrid");
    if (!container) return;

    container.innerHTML = (data.recommendations || []).map(r => `
      <div class="card-panel" style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: var(--brand); margin-bottom: 0.5rem;">
            <span>${r.subject}</span>
            <span style="color: var(--text-muted);">${r.estimated_minutes} min drill</span>
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${r.topic}</div>
          <div style="font-size: 1.05rem; color: var(--text-muted); line-height: 1.55; margin-bottom: 1.25rem;">${r.reason}</div>
        </div>
        <button class="btn btn-outline" style="font-size: 1.05rem; align-self: flex-start; padding: 0.65rem 1.25rem;" onclick="launchQuizForTopic('${r.subject}', '${r.topic}')">
          ${r.recommended_action} →
        </button>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
  }
}


window.loadDashboardData = loadDashboardData;
window.loadLearnedTopicsForPractice = loadLearnedTopicsForPractice;
window.handlePracticeTopicClick = handlePracticeTopicClick;
window.practiceTopicFromDoubt = practiceTopicFromDoubt;
window.generateDashboardPracticeQuestions = generateDashboardPracticeQuestions;
window.renderDoubtsList = renderDoubtsList;
window.renderDashboardRecommendations = renderDashboardRecommendations;
window.openResourceSummaryByIndex = openResourceSummaryByIndex;
window.openResourceSummary = openResourceSummary;
window.practiceRecommendedTopic = practiceRecommendedTopic;
window.generatePracticeForCurrentDoubt = generatePracticeForCurrentDoubt;
window.hidePracticePanel = hidePracticePanel;
window.loadRecommendations = loadRecommendations;

var state = window.state = window.state || {};

function launchQuizForTopic(subject, topic) {
  window.location.href = `/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;
}

function showQuizTab(tabName) {
  const newSec = document.getElementById("newPracticeTabSection") || document.getElementById("newQuizTabSection");
  const prevSec = document.getElementById("previousPracticeTabSection") || document.getElementById("previousQuizTabSection");
  const btnNew = document.getElementById("tabBtnNewPractice") || document.getElementById("tabBtnNewQuiz");
  const btnPrev = document.getElementById("tabBtnPrevPractice") || document.getElementById("tabBtnPrevQuiz");

  if (!newSec || !prevSec) return;

  if (tabName === "previous") {
    newSec.style.display = "none";
    newSec.classList.add("hidden");
    prevSec.style.display = "block";
    prevSec.classList.remove("hidden");
    if (btnNew) {
      btnNew.classList.remove("btn-primary");
      btnNew.classList.add("btn-outline");
    }
    if (btnPrev) {
      btnPrev.classList.remove("btn-outline");
      btnPrev.classList.add("btn-primary");
    }
    loadPreviousQuizzes();
  } else {
    newSec.style.display = "block";
    newSec.classList.remove("hidden");
    prevSec.style.display = "none";
    prevSec.classList.add("hidden");
    if (btnNew) {
      btnNew.classList.remove("btn-outline");
      btnNew.classList.add("btn-primary");
    }
    if (btnPrev) {
      btnPrev.classList.remove("btn-primary");
      btnPrev.classList.add("btn-outline");
    }
  }
}

async function initQuizPage() {
  await Promise.allSettled([loadQuizLearnedTopics(), loadPreviousQuizzes()]);

  const params = new URLSearchParams(window.location.search);
  const topicParam = params.get("topic");
  const subjectParam = params.get("subject");

  if (topicParam) {
    const select = document.getElementById("quizTopicSelect");
    let matched = false;
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === topicParam.toLowerCase()) {
          select.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const opt = document.createElement("option");
        opt.value = topicParam;
        opt.textContent = topicParam;
        opt.selected = true;
        select.prepend(opt);
      }
    }
  }
  if (subjectParam) {
    const subjEl = document.getElementById("quizSubject");
    if (subjEl) subjEl.value = subjectParam;
  }
}

async function loadQuizLearnedTopics() {
  const select = document.getElementById("quizTopicSelect");
  if (!select) return;

  try {
    const res = await fetch(`/api/doubts/learned-topics?user_id=${state.user.id}`);
    const topics = await res.json();

    let optionsHtml = "";
    if (topics && topics.length > 0) {
      optionsHtml = topics.map(t => `
        <option value="${escapeHtml(t.topic)}" data-subject="${escapeHtml(t.subject)}">
          [${escapeHtml(t.subject)}] ${escapeHtml(t.topic)}
        </option>
      `).join("");
    } else {
      optionsHtml = `
        <option value="Work Energy Theorem" data-subject="Physics">[Physics] Work Energy Theorem</option>
        <option value="Limits and Continuity" data-subject="Mathematics">[Mathematics] Limits and Continuity</option>
        <option value="Loops in Computer Science" data-subject="Computer Science">[Computer Science] Loops in Computer Science</option>
      `;
    }
    optionsHtml += `<option value="__custom__">✏️ Enter Custom Topic...</option>`;
    select.innerHTML = optionsHtml;
  } catch (err) {
    select.innerHTML = `
      <option value="Work Energy Theorem" data-subject="Physics">[Physics] Work Energy Theorem</option>
      <option value="__custom__">✏️ Enter Custom Topic...</option>
    `;
  }
}

function setQuizTopicMode(mode) {
  state.quizTopicMode = mode;
  const btnSolved = document.getElementById("btnQuizModeSolved");
  const btnNew = document.getElementById("btnQuizModeNew");
  const solvedBox = document.getElementById("quizSolvedTopicContainer");
  const newBox = document.getElementById("quizNewTopicContainer");
  const newInp = document.getElementById("quizNewTopicInput");

  if (mode === "new") {
    if (btnSolved) {
      btnSolved.classList.remove("btn-primary");
      btnSolved.classList.add("btn-outline");
    }
    if (btnNew) {
      btnNew.classList.remove("btn-outline");
      btnNew.classList.add("btn-primary");
    }
    if (solvedBox) solvedBox.classList.add("hidden");
    if (newBox) newBox.classList.remove("hidden");
    if (newInp) newInp.focus();
  } else {
    if (btnSolved) {
      btnSolved.classList.remove("btn-outline");
      btnSolved.classList.add("btn-primary");
    }
    if (btnNew) {
      btnNew.classList.remove("btn-primary");
      btnNew.classList.add("btn-outline");
    }
    if (solvedBox) solvedBox.classList.remove("hidden");
    if (newBox) newBox.classList.add("hidden");
  }
}

function handleTopicSelectChange() {
  const select = document.getElementById("quizTopicSelect");
  const subjSelect = document.getElementById("quizSubject");

  if (!select) return;

  if (select.value === "__custom__") {
    setQuizTopicMode("new");
    return;
  }

  const selectedOpt = select.selectedOptions ? select.selectedOptions[0] : null;
  const detectedSubj = selectedOpt ? selectedOpt.getAttribute("data-subject") : null;
  if (detectedSubj && subjSelect) {
    subjSelect.value = detectedSubj;
  }
}

async function loadPreviousQuizzes() {
  const tbody = document.getElementById("previousPracticeTableBody") || document.getElementById("previousQuizzesTableBody");
  if (!tbody) return;

  try {
    const res = await fetch(`/api/quizzes?user_id=${state.user.id}`);
    const quizzes = await res.json();

    if (!quizzes || quizzes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); font-size: 1.15rem;">
            No practice quizzes generated yet. Click "New Practice" to test your knowledge!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = quizzes.map(q => {
      const isCompleted = q.status === "Completed";
      const statusBadge = isCompleted
        ? `<span class="badge badge-verified">✓ Completed</span>`
        : `<span class="badge badge-flagged" style="background: var(--accent-amber-bg); color: var(--accent-amber); border-color: var(--accent-amber-border);">⏳ In Progress</span>`;

      const scoreDisplay = (q.score && q.score.display)
        ? `<strong style="color: var(--accent-green); font-size: 1.15rem;">${q.score.display}</strong>`
        : `<span style="color: var(--text-light);">-</span>`;

      const formattedDate = q.created_at ? formatLocalDate(q.created_at) : "Recent";

      return `
        <tr>
          <td>
            <div style="font-weight: 700; font-size: 1.18rem; color: var(--text-main); margin-bottom: 0.25rem;">
              ${escapeHtml(q.topic)}
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span class="badge badge-subject" style="font-size: 0.85rem; padding: 0.2rem 0.6rem;">${escapeHtml(q.subject || 'General')}</span>
              <span class="badge badge-level" style="font-size: 0.85rem; padding: 0.2rem 0.6rem;">${escapeHtml(q.difficulty || 'Medium')}</span>
            </div>
          </td>
          <td style="font-size: 1.1rem; font-weight: 600;">${q.question_count || (q.questions ? q.questions.length : 0)} Questions</td>
          <td style="font-size: 1.05rem; color: var(--text-muted);">${formattedDate}</td>
          <td>${scoreDisplay}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.65rem; justify-content: flex-end;">
              ${isCompleted ? `
                <button type="button" class="btn btn-outline" style="padding: 0.45rem 1rem; font-size: 0.98rem; font-weight: 700;" onclick="viewQuizResults('${q.id}')">
                  👁 View Results
                </button>
              ` : ''}
              <button type="button" class="btn btn-primary" style="padding: 0.45rem 1.1rem; font-size: 0.98rem; font-weight: 700;" onclick="retakeQuizById('${q.id}')">
                ${isCompleted ? '🔄 Retake Quiz' : '▶ Continue Quiz'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--accent-red);">
          Failed to load practice history.
        </td>
      </tr>
    `;
  }
}

async function handleGeneratePracticeQuiz(e) {
  if (e) e.preventDefault();

  let topic = "";
  if (state.quizTopicMode === "new") {
    const newTopicEl = document.getElementById("quizNewTopicInput") || document.getElementById("quizCustomTopic") || document.getElementById("quizTopicCustom");
    topic = newTopicEl ? newTopicEl.value.trim() : "";
  } else {
    const select = document.getElementById("quizTopicSelect");
    if (select && select.value === "__custom__") {
      const newTopicEl = document.getElementById("quizNewTopicInput") || document.getElementById("quizCustomTopic") || document.getElementById("quizTopicCustom");
      topic = newTopicEl ? newTopicEl.value.trim() : "";
    } else if (select) {
      topic = select.value.trim();
    }
  }

  if (!topic) {
    alert("Please select or enter a topic to practice.");
    return;
  }

  const subject = document.getElementById("quizSubject").value;
  const difficulty = document.getElementById("quizDifficulty").value;
  const count = Number(document.getElementById("quizCount").value);

  const btn = document.getElementById("btnGenerateQuizSubmit") || document.getElementById("btnStartPracticeQuiz");
  const origBtnContent = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Reasoning with AI...</span>`;
  }

  try {
    const res = await fetch("/api/quizzes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        subject,
        difficulty,
        count,
        user_id: state.user.id,
        user_name: state.user.name
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to generate quiz");
    }

    const quizDoc = await res.json();
    state.currentQuizId = quizDoc.id;
    state.quizData = quizDoc;
    state.quizIndex = 0;
    state.quizAnswers = {};

    const configPanel = document.getElementById("quizConfigPanel");
    if (configPanel) configPanel.style.display = "none";
    const resultPanel = document.getElementById("quizResultPanel");
    if (resultPanel) resultPanel.style.display = "none";
    const runnerPanel = document.getElementById("quizRunnerPanel");
    if (runnerPanel) runnerPanel.style.display = "block";

    renderQuizQuestion();
  } catch (err) {
    alert(err.message || "Failed to generate practice quiz");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnContent || `<span>✦</span><span>Generate Topic Quiz with AI</span>`;
    }
  }
}

async function handleGenerateQuiz(e) {
  await handleGeneratePracticeQuiz(e);
}

function renderQuizQuestion() {
  const questions = state.quizData?.questions || [];
  if (!questions.length) return;

  const currentQ = questions[state.quizIndex];
  if (!currentQ) return;
  const qId = currentQ.id;

  const metaEl = document.getElementById("quizMetaLabel") || document.getElementById("quizBadgeTopic");
  if (metaEl) {
    metaEl.textContent = `${state.quizData.subject || 'General'} • ${state.quizData.topic || 'Practice'} • ${state.quizData.difficulty || 'Medium'}`;
  }

  const qNumEl = document.getElementById("quizQuestionNumber");
  if (qNumEl) {
    qNumEl.textContent = `Question ${state.quizIndex + 1} of ${questions.length}`;
  }

  const progEl = document.getElementById("quizProgressFraction");
  if (progEl) {
    progEl.textContent = `Answered: ${Object.keys(state.quizAnswers).length} / ${questions.length}`;
  }

  const stmtEl = document.getElementById("quizQuestionStatement");
  if (stmtEl) {
    stmtEl.innerHTML = renderMath(escapeHtml(currentQ.question));
  }

  const container = document.getElementById("quizOptionsList");
  if (container && currentQ.options) {
    container.innerHTML = currentQ.options.map((opt, i) => {
      const isSelected = state.quizAnswers[qId] === i;
      return `
        <div class="quiz-option ${isSelected ? 'selected' : ''}" onclick="selectQuizOption('${qId}', ${i})">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <span style="width: 28px; height: 28px; border-radius: 8px; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; border: 1px solid var(--border);">
              ${String.fromCharCode(65 + i)}
            </span>
            <span style="font-size: 1.15rem;">${renderMath(escapeHtml(opt))}</span>
          </div>
          ${isSelected ? '<span style="font-size: 1.25rem; font-weight: 800; color: var(--brand);">✓</span>' : ''}
        </div>
      `;
    }).join("");
  }

  const prevBtn = document.getElementById("btnQuizPrev");
  if (prevBtn) {
    prevBtn.disabled = state.quizIndex === 0;
  }
  const nextBtn = document.getElementById("btnQuizNext");
  if (nextBtn) {
    if (state.quizIndex === questions.length - 1) {
      nextBtn.textContent = "Submit Practice Quiz";
      nextBtn.style.background = "var(--accent-green)";
    } else {
      nextBtn.textContent = "Next Question →";
      nextBtn.style.background = "var(--brand)";
    }
  }
}

function selectQuizOption(qId, optionIdx) {
  state.quizAnswers[qId] = optionIdx;
  renderQuizQuestion();
}

function quizPrevQuestion() {
  if (state.quizIndex > 0) {
    state.quizIndex--;
    renderQuizQuestion();
  }
}

function quizNextQuestion() {
  const questions = state.quizData?.questions || [];
  if (state.quizIndex < questions.length - 1) {
    state.quizIndex++;
    renderQuizQuestion();
  } else {
    submitCurrentQuiz();
  }
}

function navQuizQuestion(dir) {
  if (dir < 0) {
    quizPrevQuestion();
  } else {
    quizNextQuestion();
  }
}

async function submitCurrentQuiz() {
  const quizId = state.currentQuizId || state.quizData?.id;
  const questions = state.quizData?.questions || [];

  let correctCount = 0;
  questions.forEach(q => {
    const qIdStr = String(q.id);
    const chosen = state.quizAnswers[qIdStr] !== undefined ? state.quizAnswers[qIdStr] : state.quizAnswers[q.id];
    if (chosen !== undefined && Number(chosen) === Number(q.correct_index)) {
      correctCount++;
    }
  });

  const percent = Math.round((correctCount / questions.length) * 100);

  if (quizId) {
    try {
      await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: state.quizAnswers })
      });
      loadPreviousQuizzes();
      setTimeout(loadNotifications, 400);
    } catch (err) {
      console.error(err);
    }
  }

  const runnerPanel = document.getElementById("quizRunnerPanel");
  if (runnerPanel) runnerPanel.style.display = "none";
  const resultPanel = document.getElementById("quizResultPanel");
  if (resultPanel) resultPanel.style.display = "block";
  const topicEl = document.getElementById("quizResultTopic");
  if (topicEl && state.quizData) {
    topicEl.textContent = `${state.quizData.topic} (${state.quizData.subject} • ${state.quizData.difficulty || 'Medium'})`;
  }
  const scoreNum = document.getElementById("quizScoreNumber");
  if (scoreNum) scoreNum.textContent = `${correctCount} / ${questions.length}`;
  const scorePct = document.getElementById("quizScorePercent");
  if (scorePct) scorePct.textContent = `${percent}% Accuracy Score`;

  if (percent >= 70 && typeof confetti === "function") {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }

  const expList = document.getElementById("quizExplanationsList");
  if (expList) {
    expList.innerHTML = questions.map((q, idx) => {
      const qIdStr = String(q.id);
      const userAns = state.quizAnswers[qIdStr] !== undefined ? state.quizAnswers[qIdStr] : state.quizAnswers[q.id];
      const isCorrect = userAns !== undefined && Number(userAns) === Number(q.correct_index);
      const userAnsText = userAns !== undefined ? q.options[userAns] : "Not answered";

      return `
      <div style="padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--surface-hover);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; gap: 1rem;">
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">
            ${idx + 1}. ${renderMath(escapeHtml(q.question))}
          </div>
          <span style="color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1.05rem; font-weight: 800; white-space: nowrap;">
            ${isCorrect ? '✓ Correct' : '✕ Incorrect'}
          </span>
        </div>
        <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 0.5rem; color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'};">
          Your Answer: <strong>${renderMath(escapeHtml(userAnsText))}</strong>
        </div>
        <div style="font-size: 1.1rem; line-height: 1.6; color: var(--text-main); margin-bottom: 0.85rem;">
          Correct Answer: <strong>${renderMath(escapeHtml(q.options[q.correct_index]))}</strong>
        </div>
        <div style="font-size: 1.08rem; padding: 1rem 1.35rem; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); line-height: 1.65;">
          <strong style="color: var(--brand);">AI Explanation:</strong> ${renderMath(escapeHtml(q.explanation))}
        </div>
      </div>
    `;
    }).join("");
  }
}

function submitQuiz() {
  submitCurrentQuiz();
}

function resetQuizRunner() {
  const resultPanel = document.getElementById("quizResultPanel");
  if (resultPanel) resultPanel.style.display = "none";
  const runnerPanel = document.getElementById("quizRunnerPanel");
  if (runnerPanel) runnerPanel.style.display = "none";
  const configPanel = document.getElementById("quizConfigPanel");
  if (configPanel) configPanel.style.display = "block";
}

async function retakeCurrentQuiz() {
  if (!state.quizData) return;
  state.quizIndex = 0;
  state.quizAnswers = {};
  const resultPanel = document.getElementById("quizResultPanel");
  if (resultPanel) resultPanel.style.display = "none";
  const runnerPanel = document.getElementById("quizRunnerPanel");
  if (runnerPanel) runnerPanel.style.display = "block";
  renderQuizQuestion();

  if (state.currentQuizId) {
    try {
      await fetch(`/api/quizzes/${state.currentQuizId}/retake`, { method: "POST" });
      loadPreviousQuizzes();
      setTimeout(loadNotifications, 400);
    } catch (e) { }
  }
}

async function retakeQuizById(quizId) {
  try {
    const res = await fetch(`/api/quizzes/${quizId}`);
    if (!res.ok) throw new Error("Quiz not found");
    const quizDoc = await res.json();

    state.currentQuizId = quizDoc.id;
    state.quizData = quizDoc;
    state.quizIndex = 0;
    state.quizAnswers = {};

    showQuizTab("new");
    const configPanel = document.getElementById("quizConfigPanel");
    if (configPanel) configPanel.style.display = "none";
    const resultPanel = document.getElementById("quizResultPanel");
    if (resultPanel) resultPanel.style.display = "none";
    const runnerPanel = document.getElementById("quizRunnerPanel");
    if (runnerPanel) runnerPanel.style.display = "block";

    renderQuizQuestion();
  } catch (err) {
    alert("Failed to load quiz for retake");
  }
}

async function viewQuizResults(quizId) {
  try {
    const res = await fetch(`/api/quizzes/${quizId}`);
    if (!res.ok) throw new Error("Quiz not found");
    const quizDoc = await res.json();

    const metaEl = document.getElementById("modalReviewMeta") || document.getElementById("modalReviewBadge");
    if (metaEl) {
      metaEl.textContent = `${quizDoc.subject || 'General'} • ${quizDoc.difficulty || 'Medium'}`;
    }
    const titleEl = document.getElementById("modalReviewTitle");
    if (titleEl) {
      titleEl.textContent = quizDoc.topic || "Practice Quiz";
    }
    const scoreEl = document.getElementById("modalReviewScore");
    if (scoreEl) {
      scoreEl.textContent = quizDoc.score ? `Score: ${quizDoc.score.display}` : "In Progress";
    }

    const modalBody = document.getElementById("modalReviewBody");
    const questions = quizDoc.questions || [];
    const answers = quizDoc.user_answers || {};

    modalBody.innerHTML = questions.map((q, idx) => {
      const qIdStr = String(q.id);
      const userAns = answers[qIdStr] !== undefined ? answers[qIdStr] : answers[q.id];
      const isCorrect = userAns !== undefined && Number(userAns) === Number(q.correct_index);
      const userAnsText = userAns !== undefined ? q.options[userAns] : "Not answered";

      return `
        <div style="padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface-hover);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 1rem;">
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-main);">
              ${idx + 1}. ${renderMath(escapeHtml(q.question))}
            </div>
            <span style="color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1rem; font-weight: 800; white-space: nowrap;">
              ${isCorrect ? '✓ Correct' : '✕ Incorrect'}
            </span>
          </div>
          <div style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 0.35rem; color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'};">
            Your Choice: <strong>${renderMath(escapeHtml(userAnsText))}</strong>
          </div>
          <div style="font-size: 1.05rem; line-height: 1.6; color: var(--text-main); margin-bottom: 0.75rem;">
            Correct Answer: <strong>${renderMath(escapeHtml(q.options[q.correct_index]))}</strong>
          </div>
          <div style="font-size: 1.02rem; padding: 0.85rem 1.15rem; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); line-height: 1.6;">
            <strong style="color: var(--brand);">AI Explanation:</strong> ${renderMath(escapeHtml(q.explanation))}
          </div>
        </div>
      `;
    }).join("");

    const retakeBtn = document.getElementById("btnModalRetake");
    if (retakeBtn) {
      retakeBtn.onclick = () => {
        closeModal("quizReviewModal");
        retakeQuizById(quizId);
      };
    }

    openModal("quizReviewModal");
  } catch (err) {
    alert("Failed to load quiz results");
  }
}


window.launchQuizForTopic = launchQuizForTopic;
window.showQuizTab = showQuizTab;
window.initQuizPage = initQuizPage;
window.loadQuizLearnedTopics = loadQuizLearnedTopics;
window.setQuizTopicMode = setQuizTopicMode;
window.handleTopicSelectChange = handleTopicSelectChange;
window.loadPreviousQuizzes = loadPreviousQuizzes;
window.handleGeneratePracticeQuiz = handleGeneratePracticeQuiz;
window.handleGenerateQuiz = handleGenerateQuiz;
window.renderQuizQuestion = renderQuizQuestion;
window.selectQuizOption = selectQuizOption;
window.quizPrevQuestion = quizPrevQuestion;
window.quizNextQuestion = quizNextQuestion;
window.navQuizQuestion = navQuizQuestion;
window.submitCurrentQuiz = submitCurrentQuiz;
window.submitQuiz = submitQuiz;
window.resetQuizRunner = resetQuizRunner;
window.retakeCurrentQuiz = retakeCurrentQuiz;
window.retakeQuizById = retakeQuizById;
window.viewQuizResults = viewQuizResults;

var state = window.state = window.state || {};

function showTeacherDashboardTab(tab) {
  const monTab = document.getElementById("teacherMonitorTab");
  const actTab = document.getElementById("teacherActivityTab");
  const expTab = document.getElementById("teacherExplainTab");

  const btnMon = document.getElementById("tabBtnTeacherMonitor");
  const btnAct = document.getElementById("tabBtnTeacherActivity");
  const btnExp = document.getElementById("tabBtnTeacherExplain");

  if (!monTab || !actTab || !expTab) return;

  monTab.style.display = tab === "monitor" ? "block" : "none";
  actTab.style.display = tab === "activity" ? "block" : "none";
  expTab.style.display = tab === "explain" ? "block" : "none";

  if (btnMon) btnMon.className = tab === "monitor" ? "btn btn-primary" : "btn btn-outline";
  if (btnAct) btnAct.className = tab === "activity" ? "btn btn-primary" : "btn btn-outline";
  if (btnExp) btnExp.className = tab === "explain" ? "btn btn-primary" : "btn btn-outline";

  if (tab === "monitor") loadTeacherDoubtsMonitor();
  if (tab === "activity") loadTeacherActivity();
  if (tab === "explain") loadTeacherExplainOptions();
}

async function initTeacherDashboard() {
  await loadTeacherDoubtsMonitor();
  await loadTeacherActivity();
  await loadTeacherExplainOptions();
}

async function loadTeacherQueue() {
  await initTeacherDashboard();
}

async function loadTeacherDoubtsMonitor() {
  const tbody = document.getElementById("teacherMonitorTableBody");
  if (!tbody) return;

  const subject = document.getElementById("teacherMonitorSubject")?.value || "All";
  const status = document.getElementById("teacherMonitorStatus")?.value || "All";
  const search = document.getElementById("teacherSearchDoubtInput")?.value.trim() || "";

  try {
    const res = await fetch(`/api/teacher/doubts?subject=${encodeURIComponent(subject)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
    const doubts = await res.json();
    state.teacherDoubts = doubts;

    if (!doubts || doubts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); font-size: 1.15rem;">
            No student inquiries found matching the specified filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = doubts.map(d => {
      const isVerified = d.teacher_review && d.teacher_review.reviewed;
      const isFlagged = d.status === "flagged";
      let statusBadge = `<span class="badge" style="background: var(--surface-hover); color: var(--text-muted);">Pending Review</span>`;
      if (isVerified) {
        statusBadge = `<span class="badge badge-verified">Verified</span>`;
      } else if (isFlagged) {
        statusBadge = `<span class="badge badge-flagged">Needs Clarification</span>`;
      }

      const initial = (d.user_name && d.user_name.length > 0) ? d.user_name[0].toUpperCase() : "S";
      const dateStr = d.created_at ? formatLocalDate(d.created_at) : "Recent";
      const timeStr = d.created_at ? formatLocalTime(d.created_at) : "";

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand-light); color: var(--brand); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">
                ${initial}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-main);">${escapeHtml(d.user_name || 'Student')}</div>
                <div style="font-size: 0.88rem; color: var(--text-light);">${escapeHtml(d.explanation_level || 'standard')}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; font-size: 1.12rem; color: var(--text-main); margin-bottom: 0.25rem;">
              ${escapeHtml(d.title)}
            </div>
            <div style="font-size: 0.98rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHtml(getRealQuestionText(d))}
            </div>
          </td>
          <td>
            <span class="badge badge-subject" style="font-size: 0.92rem;">${escapeHtml(d.subject)}</span>
          </td>
          <td>
            <div style="font-size: 1.02rem; font-weight: 600;">${dateStr}</div>
            <div style="font-size: 0.88rem; color: var(--text-light);">${timeStr}</div>
          </td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" style="padding: 0.45rem 0.9rem; font-size: 0.95rem; font-weight: 700;" onclick="inspectTeacherDoubt('${d.id}')">
                Inspect
              </button>
              <button type="button" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.95rem; font-weight: 700;" onclick="openProvideExplanationForDoubt('${d.id}')">
                Explain
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--accent-red);">
          Failed to load student inquiries.
        </td>
      </tr>
    `;
  }
}

function filterTeacherDoubts() {
  loadTeacherDoubtsMonitor();
}

function resetTeacherFilters() {
  const searchInput = document.getElementById("teacherSearchDoubtInput");
  const subjSelect = document.getElementById("teacherMonitorSubject");
  const statusSelect = document.getElementById("teacherMonitorStatus");

  if (searchInput) searchInput.value = "";
  if (subjSelect) subjSelect.value = "All";
  if (statusSelect) statusSelect.value = "All";

  loadTeacherDoubtsMonitor();
}

function getRealQuestionText(d) {
  if (!d) return "";
  let q = d.question || "";
  if (q.startsWith("Problem submitted via attachment") || q.startsWith("Problem submitted via") || !q.trim()) {
    if (d.solution && d.solution.summary) return d.solution.summary;
    if (d.code_snippet) return d.code_snippet;
    return d.title || "Academic question";
  }
  return q;
}

function formatDoubtQuestionStatement(d) {
  if (!d) return "No question statement provided.";
  let parts = [];
  let mainQ = d.question || "";
  if (mainQ.startsWith("Problem submitted via attachment") || mainQ.startsWith("Problem submitted via") || !mainQ.trim()) {
    if (d.solution && d.solution.summary) {
      mainQ = d.solution.summary;
    } else if (d.title && !d.title.startsWith("Doubt in")) {
      mainQ = d.title;
    } else {
      mainQ = "Problem inquiry in " + (d.subject || "General");
    }
  }

  parts.push(`<div>${renderMath(escapeHtml(mainQ))}</div>`);

  if (d.code_snippet) {
    const lang = d.code_language || "python";
    parts.push(`
      <div style="margin-top: 0.85rem; border-radius: var(--radius-sm); background: #0f172a; border: 1px solid var(--border); overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.9rem; background: #1e293b; color: #94a3b8; font-size: 0.82rem; font-weight: 700; text-transform: uppercase;">
          <span>${escapeHtml(lang)}</span>
        </div>
        <pre style="margin: 0; padding: 1rem; color: #f8fafc; font-family: monospace; font-size: 0.95rem; line-height: 1.5; overflow-x: auto; white-space: pre;">${escapeHtml(d.code_snippet)}</pre>
      </div>
    `);
  }

  if (d.attachment && d.attachment.image_data) {
    parts.push(`
      <div style="margin-top: 0.85rem;">
        <img src="${d.attachment.image_data}" alt="Doubt Problem Image" style="max-height: 320px; max-width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border);">
      </div>
    `);
  }

  return parts.join("");
}

async function inspectTeacherDoubt(doubtId) {
  try {
    const res = await fetch(`/api/doubts/${doubtId}`);
    if (!res.ok) throw new Error("Doubt not found");
    const d = await res.json();

    document.getElementById("modalInspectSubject").textContent = d.subject;
    document.getElementById("modalInspectTitle").textContent = d.title;
    document.getElementById("modalInspectStudent").textContent = `Asked by ${d.user_name || 'Student'} on ${formatLocalDate(d.created_at)}`;
    document.getElementById("modalInspectQuestion").innerHTML = formatDoubtQuestionStatement(d);

    const solSummary = (d.solution && d.solution.summary) ? d.solution.summary : (d.solution && d.solution.key_takeaway ? d.solution.key_takeaway : "AI generated step-by-step resolution.");
    document.getElementById("modalInspectSolution").innerHTML = renderMath(escapeHtml(solSummary));

    const noteBox = document.getElementById("modalExistingTeacherNoteBox");
    const noteEl = document.getElementById("modalExistingTeacherNote");
    if (d.teacher_review && d.teacher_review.reviewed) {
      noteBox.style.display = "block";
      noteEl.innerHTML = `<strong>${escapeHtml(d.teacher_review.teacher_name)}:</strong> ${renderMath(escapeHtml(d.teacher_review.note))}`;
    } else {
      noteBox.style.display = "none";
    }

    const btnGo = document.getElementById("btnModalGoExplain");
    if (btnGo) {
      btnGo.onclick = () => {
        closeModal("teacherInspectModal");
        openProvideExplanationForDoubt(doubtId);
      };
    }

    openModal("teacherInspectModal");
  } catch (err) {
    alert("Failed to load doubt details");
  }
}

async function loadTeacherActivity() {
  try {
    const res = await fetch("/api/teacher/learning-activity");
    const data = await res.json();

    const m = data.metrics || {};
    const totalEl = document.getElementById("actStatTotalDoubts");
    const verEl = document.getElementById("actStatVerified");
    const pendingEl = document.getElementById("actStatPending");
    const flaggedEl = document.getElementById("actStatFlagged");

    if (totalEl) totalEl.textContent = m.total_doubts || 0;
    if (verEl) verEl.textContent = m.verified_doubts || 0;
    if (pendingEl) pendingEl.textContent = m.pending_doubts || 0;
    if (flaggedEl) flaggedEl.textContent = m.flagged_doubts || 0;

    const streamContainer = document.getElementById("teacherActivityStreamList");
    if (streamContainer) {
      const logs = data.activity_log || [];
      if (logs.length === 0) {
        streamContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No activity recorded yet.</div>`;
      } else {
        streamContainer.innerHTML = logs.map(item => {
          let typeLabel = "Inquiry";
          let badgeClass = "badge-subject";
          let actionText = "";

          if (item.type === "doubt_submitted") {
            typeLabel = "Inquiry";
            badgeClass = "badge-subject";
            actionText = `submitted an inquiry in <strong>${escapeHtml(item.subject)}</strong>: "${escapeHtml(item.title)}"`;
          } else if (item.type === "teacher_explanation_added") {
            typeLabel = "Verified";
            badgeClass = "badge-verified";
            actionText = `verified solution & added teaching notes for "${escapeHtml(item.title)}"`;
          }

          const timeStr = item.timestamp ? formatLocalDateTime(item.timestamp) : "Recent";

          return `
            <div style="padding: 1.25rem 1.4rem; border-radius: var(--radius-md); background: var(--surface-hover); border: 1px solid var(--border); display: flex; align-items: flex-start; gap: 1rem;">
              <div style="flex-shrink: 0; padding-top: 0.15rem;">
                <span class="badge ${badgeClass}" style="font-size: 0.88rem; font-weight: 700;">${typeLabel}</span>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                  <span style="font-weight: 800; font-size: 1.05rem; color: var(--text-main);">${escapeHtml(item.student_name)}</span>
                  <span style="font-size: 0.88rem; color: var(--text-light);">${timeStr}</span>
                </div>
                <div style="font-size: 1.02rem; color: var(--text-muted); line-height: 1.55;">
                  ${actionText}
                </div>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    const breakContainer = document.getElementById("teacherSubjectBreakdownList");
    if (breakContainer) {
      const breakdown = data.subject_breakdown || [];
      if (breakdown.length === 0) {
        breakContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No subject engagement recorded yet.</div>`;
      } else {
        breakContainer.innerHTML = breakdown.map(s => `
          <div style="padding: 1rem 1.25rem; border-radius: var(--radius-md); background: var(--surface-hover); border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; font-size: 1.02rem; font-weight: 700; margin-bottom: 0.5rem;">
              <span>${escapeHtml(s.subject)}</span>
              <span style="color: var(--brand); font-weight: 800;">${s.count} inquiries (${s.percentage}%)</span>
            </div>
            <div style="width: 100%; height: 8px; background: var(--border); border-radius: 9999px; overflow: hidden;">
              <div style="width: ${s.percentage}%; height: 100%; background: var(--brand);"></div>
            </div>
          </div>
        `).join("");
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadTeacherExplainOptions(selectedDoubtId) {
  const select = document.getElementById("selectDoubtForTeacherExplanation") || document.getElementById("teacherExplainDoubtSelect");
  if (!select) return;

  try {
    const res = await fetch("/api/teacher/doubts");
    const doubts = await res.json();
    state.allTeacherDoubts = doubts;

    if (!doubts || doubts.length === 0) {
      select.innerHTML = `<option value="">No student questions found</option>`;
      return;
    }

    select.innerHTML = `<option value="">-- Choose a student doubt to provide explanation --</option>` + doubts.map(d => {
      const isVerified = d.teacher_review && d.teacher_review.reviewed;
      const prefix = isVerified ? "[✓ Verified]" : "[⏳ Pending]";
      const studentName = d.user_name || 'Student';
      const questionTitle = d.title || d.question || 'Student Doubt';
      return `<option value="${d.id}"> ${prefix} [${escapeHtml(d.subject || 'General')}] ${escapeHtml(studentName)}: ${escapeHtml(questionTitle)}</option>`;
    }).join("");

    if (selectedDoubtId) {
      select.value = selectedDoubtId;
      handleSelectDoubtForExplanation(selectedDoubtId);
    }
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load doubts</option>`;
  }
}

function handleSelectDoubtForExplanation(preferredId) {
  const select = document.getElementById("selectDoubtForTeacherExplanation") || document.getElementById("teacherExplainDoubtSelect");
  const doubtId = preferredId || (select ? select.value : null);
  const card = document.getElementById("teacherExplainDoubtPreview") || document.getElementById("teacherDoubtPreviewCard");

  if (!doubtId) {
    if (card) {
      card.classList.add("hidden");
      card.style.display = "none";
    }
    return;
  }

  const doubt = (state.allTeacherDoubts || []).find(d => d.id === doubtId);
  if (!doubt) {
    if (card) {
      card.classList.add("hidden");
      card.style.display = "none";
    }
    return;
  }

  state.activeExplainDoubt = doubt;

  const subjEl = document.getElementById("previewDoubtSubject");
  if (subjEl) subjEl.textContent = doubt.subject || "General";

  const studentEl = document.getElementById("previewDoubtStudent");
  if (studentEl) studentEl.textContent = `Submitted by ${doubt.user_name || 'Student'}`;

  const statusEl = document.getElementById("previewDoubtStatus");
  if (statusEl) {
    if (doubt.teacher_review && doubt.teacher_review.reviewed) {
      statusEl.className = "badge badge-verified";
      statusEl.textContent = "Verified";
    } else {
      statusEl.className = "badge badge-level";
      statusEl.textContent = "Pending Review";
    }
  }

  const titleEl = document.getElementById("previewDoubtTitle");
  if (titleEl) titleEl.textContent = doubt.title || doubt.question || "Student Question";

  const questionEl = document.getElementById("previewDoubtQuestion");
  if (questionEl) questionEl.innerHTML = formatDoubtQuestionStatement(doubt);

  const sol = doubt.solution ? (doubt.solution.summary || doubt.solution.key_takeaway || "AI step-by-step resolution.") : "No solution available.";
  const aiSolEl = document.getElementById("previewDoubtAiSolution");
  if (aiSolEl) aiSolEl.innerHTML = renderMath(escapeHtml(sol));

  const textarea = document.getElementById("teacherAdditionalExplanationText");
  if (textarea && doubt.teacher_review && doubt.teacher_review.note) {
    textarea.value = doubt.teacher_review.note;
  } else if (textarea) {
    textarea.value = "";
  }

  if (card) {
    card.classList.remove("hidden");
    card.style.display = "block";
  }
}

function openProvideExplanationForDoubt(doubtId) {
  showTeacherDashboardTab("explain");
  loadTeacherExplainOptions(doubtId);
}

async function handlePostTeacherExplanation(e) {
  if (e) e.preventDefault();

  const select = document.getElementById("selectDoubtForTeacherExplanation") || document.getElementById("teacherExplainDoubtSelect");
  const doubtId = select ? select.value : null;
  const textarea = document.getElementById("teacherAdditionalExplanationText");
  const note = textarea ? textarea.value.trim() : "";
  const btn = document.getElementById("btnSubmitTeacherExplanation");

  if (!doubtId) {
    alert("Please select a student doubt from the dropdown.");
    return;
  }
  if (!note) {
    alert("Please write your additional explanation or guidance note.");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Saving Explanation...";
  }

  try {
    const res = await fetch(`/api/teacher/review/${doubtId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_name: state.user.name || "Prof. Sarah Jenkins",
        note: note
      })
    });

    if (!res.ok) throw new Error("Failed to post explanation");

    alert("Instructor explanation published successfully and student notified!");
    textarea.value = "";
    loadNotifications();
    loadTeacherDoubtsMonitor();
    loadTeacherActivity();
    loadTeacherExplainOptions(doubtId);
  } catch (err) {
    alert(err.message || "Failed to submit explanation");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Submit Teacher Explanation</span>`;
    }
  }
}


window.showTeacherDashboardTab = showTeacherDashboardTab;
window.initTeacherDashboard = initTeacherDashboard;
window.loadTeacherQueue = loadTeacherQueue;
window.loadTeacherDoubtsMonitor = loadTeacherDoubtsMonitor;
window.filterTeacherDoubts = filterTeacherDoubts;
window.resetTeacherFilters = resetTeacherFilters;
window.getRealQuestionText = getRealQuestionText;
window.formatDoubtQuestionStatement = formatDoubtQuestionStatement;
window.inspectTeacherDoubt = inspectTeacherDoubt;
window.loadTeacherActivity = loadTeacherActivity;
window.loadTeacherExplainOptions = loadTeacherExplainOptions;
window.handleSelectDoubtForExplanation = handleSelectDoubtForExplanation;
window.openProvideExplanationForDoubt = openProvideExplanationForDoubt;
window.handlePostTeacherExplanation = handlePostTeacherExplanation;

var state = window.state = window.state || {};
let adminCachedUsers = [];
let adminCachedTeachers = [];

function showAdminTab(tabName) {
  const tabs = ["users", "teachers", "subjects", "activity", "feedback"];
  tabs.forEach(t => {
    const btn = document.getElementById("adminTab" + t.charAt(0).toUpperCase() + t.slice(1));
    const sideBtn = document.getElementById("adminSidebarTab" + t.charAt(0).toUpperCase() + t.slice(1));
    const sec = document.getElementById("adminSection" + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle("active", t === tabName);
    if (sideBtn) sideBtn.classList.toggle("active", t === tabName);
    if (sec) {
      if (t === tabName) {
        sec.classList.remove("hidden");
        sec.style.display = "block";
      } else {
        sec.classList.add("hidden");
        sec.style.display = "none";
      }
    }
  });
  if (tabName === "teachers") loadAdminTeachers();
  if (tabName === "activity") loadAdminActivity();
  if (tabName === "feedback") loadAdminFeedback();
}

function toggleAdminAddTeacherForm() {
  const card = document.getElementById("adminAddTeacherCard");
  if (!card) return;
  const isHidden = card.classList.contains("hidden") || card.style.display === "none";
  if (isHidden) {
    card.classList.remove("hidden");
    card.style.display = "block";
  } else {
    card.classList.add("hidden");
    card.style.display = "none";
  }
}

async function loadAdminTeachers() {
  const tbody = document.getElementById("adminTeachersTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Loading teacher accounts...</td></tr>`;

  try {
    const res = await fetch("/api/admin/teachers");
    const data = await res.json();
    adminCachedTeachers = data || [];

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No teacher accounts found. Use + Add Teacher to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(t => `
      <tr>
        <td style="font-weight: 700;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.85rem;">${escapeHtml(t.name ? t.name[0].toUpperCase() : 'T')}</div>
            <span>${escapeHtml(t.name)}</span>
          </div>
        </td>
        <td style="color: var(--text-muted);">${escapeHtml(t.email)}</td>
        <td>
          <span class="badge badge-subject">${escapeHtml(t.subject || 'General')}</span>
        </td>
        <td style="font-weight: 600;">${t.explanations_count || 0} explanations</td>
        <td>
          <span class="badge ${t.status === 'suspended' ? 'badge-level' : 'badge-verified'}">
            ${escapeHtml(t.status || 'active')}
          </span>
        </td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">${t.created_at ? escapeHtml(t.created_at.slice(0, 10)) : '—'}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.4rem;">
            <button type="button" class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;" onclick="openEditTeacherModal('${t.id}')">Manage</button>
            <button type="button" class="btn-icon" style="width: 30px; height: 30px; border: none;" onclick="handleAdminDeleteTeacher('${t.id}')" title="Remove Teacher">&times;</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-red); padding: 1.5rem;">Failed to load teachers.</td></tr>`;
  }
}

async function handleAdminCreateTeacher(e) {
  e.preventDefault();
  const name = document.getElementById("adminNewTeacherName").value.trim();
  const email = document.getElementById("adminNewTeacherEmail").value.trim();
  const password = document.getElementById("adminNewTeacherPassword").value;
  const subject = document.getElementById("adminNewTeacherSubject").value;

  try {
    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, subject })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create teacher");
    }
    alert("Teacher account registered successfully.");
    document.getElementById("adminNewTeacherName").value = "";
    document.getElementById("adminNewTeacherEmail").value = "";
    document.getElementById("adminNewTeacherPassword").value = "";
    toggleAdminAddTeacherForm();
    loadAdminTeachers();
    loadAdminData();
  } catch (err) {
    alert(err.message || "Failed to create teacher");
  }
}

function openEditTeacherModal(teacherId) {
  const teacher = adminCachedTeachers.find(t => t.id === teacherId);
  if (!teacher) return;

  document.getElementById("editTeacherId").value = teacher.id;
  document.getElementById("editTeacherName").value = teacher.name || "";
  document.getElementById("editTeacherEmail").value = teacher.email || "";
  document.getElementById("editTeacherSubject").value = teacher.subject || "";
  document.getElementById("editTeacherNewPassword").value = "";
  openModal("manageTeacherModal");
}

async function handleAdminUpdateTeacher(e) {
  e.preventDefault();
  const teacherId = document.getElementById("editTeacherId").value;
  const name = document.getElementById("editTeacherName").value.trim();
  const email = document.getElementById("editTeacherEmail").value.trim();
  const subject = document.getElementById("editTeacherSubject").value;
  const newPassword = document.getElementById("editTeacherNewPassword").value;

  const payload = { name, email, subject };
  if (newPassword) payload.password = newPassword;

  try {
    const res = await fetch(`/api/admin/teachers/${teacherId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update teacher");
    }
    alert("Teacher account updated successfully.");
    closeModal("manageTeacherModal");
    loadAdminTeachers();
    loadAdminData();
  } catch (err) {
    alert(err.message || "Failed to update teacher");
  }
}

async function handleAdminDeleteTeacher(teacherId) {
  if (!confirm("Are you sure you want to remove this teacher account?")) return;
  try {
    const res = await fetch(`/api/admin/teachers/${teacherId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete teacher");
    }
    alert("Teacher account removed successfully.");
    loadAdminTeachers();
    loadAdminData();
  } catch (err) {
    alert(err.message || "Failed to remove teacher");
  }
}

function toggleAdminAddUserForm() {
  const card = document.getElementById("adminAddUserCard");
  if (!card) return;
  const isHidden = card.classList.contains("hidden") || card.style.display === "none";
  if (isHidden) {
    card.classList.remove("hidden");
    card.style.display = "block";
  } else {
    card.classList.add("hidden");
    card.style.display = "none";
  }
}

async function handleAdminCreateUser(e) {
  e.preventDefault();
  const name = document.getElementById("adminNewUserName").value.trim();
  const email = document.getElementById("adminNewUserEmail").value.trim();
  const password = document.getElementById("adminNewUserPassword").value;
  const role = document.getElementById("adminNewUserRole").value;
  const aff = document.getElementById("adminNewUserAffiliation").value.trim();

  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        subject: role === "teacher" ? aff : null,
        grade: role === "student" ? aff : null
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create user");
    }
    alert("User account created successfully.");
    document.getElementById("adminNewUserName").value = "";
    document.getElementById("adminNewUserEmail").value = "";
    document.getElementById("adminNewUserPassword").value = "";
    document.getElementById("adminNewUserAffiliation").value = "";
    toggleAdminAddUserForm();
    loadAdminData();
  } catch (err) {
    alert(err.message || "Failed to create user");
  }
}

function filterAdminUsers() {
  const q = (document.getElementById("adminUserSearchInput")?.value || "").toLowerCase().trim();
  const role = document.getElementById("adminUserRoleFilter")?.value || "";

  const filtered = adminCachedUsers.filter(u => {
    const matchesQ = !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
    const matchesRole = !role || u.role === role;
    return matchesQ && matchesRole;
  });

  const countLabel = document.getElementById("adminUserCountLabel");
  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${adminCachedUsers.length} users`;
  }
  renderAdminUsersTable(filtered);
}

function renderAdminUsersTable(users) {
  const userTbody = document.getElementById("adminUsersTableBody");
  if (!userTbody) return;

  if (!users || users.length === 0) {
    userTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No user accounts found matching criteria.</td></tr>`;
    return;
  }

  userTbody.innerHTML = users.map(u => `
    <tr>
      <td style="font-weight: 700;">${escapeHtml(u.name)}</td>
      <td style="color: var(--text-muted);">${escapeHtml(u.email)}</td>
      <td>
        <select class="form-control" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.88rem;" onchange="handleAdminRoleChange('${u.id}', this.value)">
          <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
          <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Teacher</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td style="color: var(--text-muted);">${escapeHtml(u.subject || u.grade || '—')}</td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${u.created_at ? escapeHtml(u.created_at.slice(0, 10)) : '—'}</td>
      <td style="text-align: right;">
        ${u.id !== 'u-admin-1' ? `<button class="btn-icon" style="display: inline-flex; width: 32px; height: 32px;" onclick="handleAdminDeleteUser('${u.id}')" title="Delete User">&times;</button>` : '<span style="font-size: 0.8rem; color: var(--text-muted);">Root</span>'}
      </td>
    </tr>
  `).join("");
}

async function loadAdminActivity() {
  const tbody = document.getElementById("adminActivityTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="table-status-cell">Loading activity logs...</td></tr>`;

  try {
    const res = await fetch("/api/admin/activity");
    if (!res.ok) throw new Error("Failed to load activity");
    const data = await res.json();
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-status-cell">No recorded activity yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(act => `
      <tr>
        <td class="activity-time-cell">${formatLocalDateTime(act.timestamp) || '—'}</td>
        <td>
          <span class="badge ${act.status === 'verified' || act.status === 'completed' || act.status === 'active' ? 'badge-verified' : 'badge-level'}">
            ${escapeHtml(act.action)}
          </span>
        </td>
        <td class="font-bold">${escapeHtml((!act.user_name || act.user_name === "Alex Rivera") ? "Student" : act.user_name)}</td>
        <td><span class="badge badge-level">${escapeHtml(act.type || 'student')}</span></td>
        <td class="text-muted">${escapeHtml(act.subject || '—')}</td>
        <td class="activity-details-cell">${escapeHtml(act.target || act.subject || '—')}</td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-status-error">Failed to load activity logs.</td></tr>`;
  }
}

async function loadAdminFeedback() {
  const tbody = document.getElementById("adminFeedbackTableBody");
  const container = document.getElementById("adminFeedbackList");
  if (!tbody && !container) return;

  if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Loading student feedback...</td></tr>`;
  if (container) container.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Loading student feedback...</div>`;

  try {
    const res = await fetch("/api/admin/feedback");
    const data = await res.json();

    if (!data || data.length === 0) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No student feedback submitted yet.</td></tr>`;
      if (container) container.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No student feedback submitted yet.</div>`;
      return;
    }

    const badge = document.getElementById("adminFeedbackAvgBadge");
    if (badge && data.length > 0) {
      const avg = (data.reduce((sum, item) => sum + (item.rating || 5), 0) / data.length).toFixed(1);
      badge.textContent = `${avg} / 5 Average (${data.length} reviews)`;
    }

    if (tbody) {
      tbody.innerHTML = data.map(fb => `
        <tr>
          <td style="font-weight: 700;">${escapeHtml((!fb.user_name || fb.user_name === "Alex Rivera") ? "Student" : fb.user_name)}</td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(fb.subject || 'General')}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(fb.title || 'Doubt')}</div>
          </td>
          <td style="color: var(--accent-amber); font-weight: 700;">${'★'.repeat(fb.rating || 5)}${'☆'.repeat(Math.max(0, 5 - (fb.rating || 5)))}</td>
          <td style="color: var(--accent-amber); font-weight: 700;">${fb.rating || 5} / 5</td>
          <td>
            <span class="badge ${fb.helpful ? 'badge-verified' : 'badge-level'}">
              ${fb.helpful ? 'Helpful' : 'Needs Work'}
            </span>
          </td>
          <td style="max-width: 320px; color: var(--text-main); font-size: 0.9rem;">${escapeHtml(fb.comment || '—')}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">${fb.created_at ? escapeHtml(fb.created_at.slice(0, 10)) : '—'}</td>
        </tr>
      `).join("");
    }

    if (container) {
      container.innerHTML = data.map(fb => `
        <div class="card-panel mb-md" style="padding: 1.25rem; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <strong>${escapeHtml((!fb.user_name || fb.user_name === "Alex Rivera") ? "Student" : fb.user_name)}</strong>
              <span class="badge ${fb.helpful ? 'badge-verified' : 'badge-level'}">${fb.helpful ? 'Helpful' : 'Needs Work'}</span>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">${fb.created_at ? escapeHtml(fb.created_at.slice(0, 10)) : '—'}</span>
          </div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--brand); margin-bottom: 0.25rem;">
            ${escapeHtml(fb.subject || 'General')} - ${escapeHtml(fb.title || 'Doubt')}
          </div>
          <div style="color: var(--accent-amber); font-weight: 700; margin-bottom: 0.5rem;">
            ${'★'.repeat(fb.rating || 5)}${'☆'.repeat(Math.max(0, 5 - (fb.rating || 5)))} (${fb.rating || 5}/5)
          </div>
          <div style="font-size: 0.95rem; color: var(--text-main);">${escapeHtml(fb.comment || 'No comment provided.')}</div>
        </div>
      `).join("");
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-red); padding: 1.5rem;">Failed to load feedback.</td></tr>`;
    if (container) container.innerHTML = `<div style="text-align: center; color: var(--accent-red); padding: 1.5rem;">Failed to load feedback.</div>`;
  }
}

async function loadAdminSubjects() {
  try {
    const res = await fetch("/api/admin/subjects");
    const subjects = await res.json();
    const subGrid = document.getElementById("adminSubjectsGrid");
    if (subGrid && subjects) {
      subGrid.innerHTML = subjects.map(s => `
        <div class="admin-subject-card">
          <div>
            <div class="admin-subject-name">${escapeHtml(s.name)}</div>
            <div class="admin-subject-desc">${escapeHtml(s.description || 'Active Subject')}</div>
          </div>
          <button class="btn-icon admin-subject-del-btn" onclick="handleAdminDeleteSubject('${s.id}')" title="Delete Subject">&times;</button>
        </div>
      `).join("");
    }
    const teacherSubSelect = document.getElementById("adminNewTeacherSubject");
    const editTeacherSubSelect = document.getElementById("editTeacherSubject");
    if (subjects && subjects.length > 0) {
      const opts = subjects.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
      if (teacherSubSelect) teacherSubSelect.innerHTML = opts;
      if (editTeacherSubSelect) editTeacherSubSelect.innerHTML = opts;
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadAdminData() {
  try {
    const [statsRes, usersRes, subjectsRes, settsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/users"),
      fetch("/api/admin/subjects"),
      fetch("/api/admin/settings")
    ]);

    const stats = await statsRes.json();
    const users = await usersRes.json();
    const subjects = await subjectsRes.json();
    const setts = await settsRes.json();

    adminCachedUsers = users || [];

    document.getElementById("statAdminUsers").textContent = stats.total_users;
    document.getElementById("statAdminUserRoles").textContent = `${stats.students_count} Students • ${stats.teachers_count} Teachers`;
    document.getElementById("statAdminDoubts").textContent = stats.total_doubts;
    document.getElementById("statAdminRating").textContent = `${stats.avg_rating} ★`;
    document.getElementById("statAdminRating").textContent = `${stats.avg_rating} / 5`;
    const fCount = document.getElementById("statAdminFeedbackCount");
    if (fCount) fCount.textContent = `${stats.total_feedback || 0} student reviews`;
    document.getElementById("statAdminSubjects").textContent = stats.subjects_count;

    const apiKeyEl = document.getElementById("adminGrokApiKey");
    if (apiKeyEl) apiKeyEl.value = setts.grok_api_key || "";
    const modelEl = document.getElementById("adminGrokModel");
    if (modelEl) modelEl.value = setts.grok_model || "grok-2-latest";
    const levelEl = document.getElementById("adminDefaultLevel");
    if (levelEl) levelEl.value = setts.default_explanation_level || "intermediate";
    const promptEl = document.getElementById("adminSystemPrompt");
    if (promptEl) promptEl.value = setts.system_prompt || "";

    filterAdminUsers();
    loadAdminTeachers();

    const teacherSubSelect = document.getElementById("adminNewTeacherSubject");
    const editTeacherSubSelect = document.getElementById("editTeacherSubject");
    if (subjects && subjects.length > 0) {
      const opts = subjects.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
      if (teacherSubSelect) teacherSubSelect.innerHTML = opts;
      if (editTeacherSubSelect) editTeacherSubSelect.innerHTML = opts;
    }

    const subGrid = document.getElementById("adminSubjectsGrid");
    if (subGrid) {
      subGrid.innerHTML = subjects.map(s => `
        <div class="admin-subject-card">
          <div>
            <div class="admin-subject-name">${escapeHtml(s.name)}</div>
            <div class="admin-subject-desc">${escapeHtml(s.description || 'Active Subject')}</div>
          </div>
          <button class="btn-icon admin-subject-del-btn" onclick="handleAdminDeleteSubject('${s.id}')" title="Delete Subject">&times;</button>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleAdminRoleChange(userId, newRole) {
  try {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole })
    });
  } catch (err) {
    alert("Failed to update user role");
  }
}

async function handleAdminDeleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    loadAdminData();
  } catch (err) {
    alert("Failed to delete user");
  }
}

function toggleAdminAddSubjectForm() {
  const card = document.getElementById("adminAddSubjectCard");
  if (!card) return;
  const isHidden = card.classList.contains("hidden") || card.style.display === "none";
  if (isHidden) {
    card.classList.remove("hidden");
    card.style.display = "block";
  } else {
    card.classList.add("hidden");
    card.style.display = "none";
  }
}

async function handleAddSubject(e) {
  e.preventDefault();
  const nameInput = document.getElementById("newSubjectName");
  const descInput = document.getElementById("newSubjectDesc");
  const name = nameInput ? nameInput.value.trim() : "";
  const desc = descInput ? descInput.value.trim() : "";
  if (!name) return;

  try {
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to add subject");
      return;
    }
    if (nameInput) nameInput.value = "";
    if (descInput) descInput.value = "";
    toggleAdminAddSubjectForm();
    await loadAdminSubjects();
    await loadAdminData();
    await loadSubjectsForSelects();
  } catch (err) {
    alert("Failed to add subject");
  }
}

async function handleAdminDeleteSubject(subId) {
  if (!confirm("Delete this curriculum subject?")) return;
  try {
    await fetch(`/api/admin/subjects/${subId}`, { method: "DELETE" });
    await loadAdminSubjects();
    await loadAdminData();
    await loadSubjectsForSelects();
  } catch (err) {
    alert("Failed to remove subject");
  }
}

async function loadSubjectsForSelects() {
  const doubtSub = document.getElementById("doubtSubject");
  const quizSub = document.getElementById("quizSubject");
  const filterSub = document.getElementById("filterSubject");
  if (!doubtSub && !quizSub && !filterSub) return;

  function populate(subjects) {
    const opts = subjects.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
    if (doubtSub) {
      const cur = doubtSub.value;
      doubtSub.innerHTML = opts;
      if (cur && subjects.some(s => s.name === cur)) doubtSub.value = cur;
    }
    if (quizSub) {
      const cur = quizSub.value;
      quizSub.innerHTML = opts;
      if (cur && subjects.some(s => s.name === cur)) quizSub.value = cur;
    }
    if (filterSub) {
      const cur = filterSub.value;
      filterSub.innerHTML = `<option value="All">All Subjects</option>` + opts;
      if (cur) filterSub.value = cur;
    }
  }

  const cached = sessionStorage.getItem("cached_subjects");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        populate(parsed);
        return;
      }
    } catch (e) { }
  }

  try {
    const res = await fetch("/api/admin/subjects");
    if (!res.ok) return;
    const subjects = await res.json();
    if (!subjects || subjects.length === 0) return;
    sessionStorage.setItem("cached_subjects", JSON.stringify(subjects));
    populate(subjects);
  } catch (e) { }
}

async function handleSaveAdminSettings(e) {
  e.preventDefault();
  const grok_api_key = document.getElementById("adminGrokApiKey").value.trim();
  const grok_model = document.getElementById("adminGrokModel").value;
  const default_explanation_level = document.getElementById("adminDefaultLevel").value;
  const system_prompt = document.getElementById("adminSystemPrompt").value.trim();

  try {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grok_api_key,
        grok_model,
        default_explanation_level,
        system_prompt
      })
    });
    alert("Grok Engine settings saved successfully.");
    loadAdminData();
  } catch (err) {
    alert("Failed to save settings");
  }
}

async function handleQuickSaveSettings(e) {
  e.preventDefault();
  const key = document.getElementById("modalGrokKey").value.trim();
  const model = document.getElementById("modalGrokModel").value;

  try {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grok_api_key: key, grok_model: model })
    });
    alert("Settings updated.");
    closeModal("settingsModal");
  } catch (err) {
    alert("Failed to update settings");
  }
}


window.showAdminTab = showAdminTab;
window.toggleAdminAddTeacherForm = toggleAdminAddTeacherForm;
window.loadAdminTeachers = loadAdminTeachers;
window.handleAdminCreateTeacher = handleAdminCreateTeacher;
window.openEditTeacherModal = openEditTeacherModal;
window.handleAdminUpdateTeacher = handleAdminUpdateTeacher;
window.handleAdminDeleteTeacher = handleAdminDeleteTeacher;
window.toggleAdminAddUserForm = toggleAdminAddUserForm;
window.handleAdminCreateUser = handleAdminCreateUser;
window.filterAdminUsers = filterAdminUsers;
window.renderAdminUsersTable = renderAdminUsersTable;
window.loadAdminActivity = loadAdminActivity;
window.loadAdminFeedback = loadAdminFeedback;
window.loadAdminSubjects = loadAdminSubjects;
window.loadAdminData = loadAdminData;
window.handleAdminRoleChange = handleAdminRoleChange;
window.handleAdminDeleteUser = handleAdminDeleteUser;
window.toggleAdminAddSubjectForm = toggleAdminAddSubjectForm;
window.handleAddSubject = handleAddSubject;
window.handleAdminDeleteSubject = handleAdminDeleteSubject;
window.loadSubjectsForSelects = loadSubjectsForSelects;
window.handleSaveAdminSettings = handleSaveAdminSettings;
window.handleQuickSaveSettings = handleQuickSaveSettings;

document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      state.user = JSON.parse(savedUser);
    } catch (e) { }
  }
  if (typeof initTheme === "function") initTheme();
  if (typeof updateUserUI === "function") updateUserUI();
  if (typeof startNotificationPolling === "function") startNotificationPolling();
  if (typeof updateDesktopNotifUI === "function") updateDesktopNotifUI();
  if (typeof loadSubjectsForSelects === "function") loadSubjectsForSelects();
});