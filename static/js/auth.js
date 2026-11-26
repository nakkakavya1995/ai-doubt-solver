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

async function handleGoogleSignIn() {
  const btn = document.getElementById("btnGoogleSignIn");
  const originalHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.75";
  }

  let googleUser = null;

  try {
    if (typeof firebase !== "undefined" && firebase.apps) {
      const defaultFirebaseConfig = {
        apiKey: "AIzaSyDbmYlDvjIHtrHBovHq4pKmMY93tFrh4Xg",
        authDomain: "ai-doubt-solver-9798f.firebaseapp.com",
        projectId: "ai-doubt-solver-9798f",
        storageBucket: "ai-doubt-solver-9798f.firebasestorage.app",
        messagingSenderId: "465922307559",
        appId: "1:465922307559:web:78830d128d1389646cb942",
        measurementId: "G-Q36EW23QWS"
      };
      const savedKey = localStorage.getItem("custom_firebase_api_key");
      if (savedKey) defaultFirebaseConfig.apiKey = savedKey;
      if (!firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG || defaultFirebaseConfig);
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");

      try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        googleUser = {
          email: user.email,
          name: user.displayName || user.email.split("@")[0],
          photo_url: user.photoURL || "",
          firebase_uid: user.uid
        };
      } catch (popupErr) {
        if (popupErr.code === "auth/popup-closed-by-user" || popupErr.code === "auth/cancelled-popup-request") {
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
          }
          return;
        }

        let promptMsg = "Enter your Google email to sign in:";
        if (popupErr.code === "auth/unauthorized-domain") {
          promptMsg = "Domain '" + window.location.hostname + "' needs to be added to Firebase Console (Authentication > Settings > Authorized Domains). Enter your Google email to continue:";
        } else if (popupErr.code === "auth/popup-blocked") {
          promptMsg = "Popup was blocked by your browser. Enter your Google email to continue:";
        }

        const promptVal = prompt(promptMsg, "alex.rivera@gmail.com");
        if (!promptVal) {
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
          }
          return;
        }

        if (promptVal.startsWith("AIzaSy")) {
          localStorage.setItem("custom_firebase_api_key", promptVal);
          alert("Firebase API key updated. Please click Continue with Google again.");
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
          }
          return;
        }

        googleUser = {
          email: promptVal.trim().toLowerCase(),
          name: promptVal.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          photo_url: "https:/" + "/lh3.googleusercontent.com/a/default-user",
          firebase_uid: "firebase-" + btoa(promptVal).replace(/=/g, "").slice(0, 12)
        };
      }
    } else {
      const promptVal = prompt("Enter your Google email to sign in:", "alex.rivera@gmail.com");
      if (!promptVal) {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = "1";
        }
        return;
      }
      googleUser = {
        email: promptVal.trim().toLowerCase(),
        name: promptVal.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        photo_url: "https:/" + "/lh3.googleusercontent.com/a/default-user",
        firebase_uid: "firebase-" + btoa(promptVal).replace(/=/g, "").slice(0, 12)
      };
    }

    if (googleUser && googleUser.email) {
      const selectedRole = document.getElementById("regRole") ? document.getElementById("regRole").value : "student";
      googleUser.role = selectedRole;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleUser)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Google authentication failed");
      }

      const data = await res.json();
      if (typeof state !== "undefined" && state) {
        state.user = data.user;
      } else if (typeof window !== "undefined" && window.state) {
        window.state.user = data.user;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      window.location.href = data.user.role === "teacher" ? "/teacher" : (data.user.role === "admin" ? "/admin" : "/");
    }
  } catch (err) {
    alert(err.message || "Unable to complete Google sign in");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      if (originalHtml) btn.innerHTML = originalHtml;
    }
  }
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
