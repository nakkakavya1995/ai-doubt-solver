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
