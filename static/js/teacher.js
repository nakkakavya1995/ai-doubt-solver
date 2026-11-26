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
