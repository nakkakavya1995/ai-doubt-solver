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
