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
