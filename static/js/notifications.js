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
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body: message,
        icon: "/static/favicon.ico",
        tag: id || String(Date.now())
      });
      notif.onclick = function () {
        window.focus();
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
      };
    } catch (e) {
      console.error(e);
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
  } catch (e) {
    console.error(e);
  }
}

function initNotificationStream() {
  if (!window.EventSource || !state.user) return;
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
        setTimeout(initNotificationStream, 4000);
      }
    };
  } catch (err) { }
}

function startNotificationPolling() {
  loadNotifications();
  initNotificationStream();
  setInterval(loadNotifications, 3000);
  requestDesktopNotificationPermission(false);
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
