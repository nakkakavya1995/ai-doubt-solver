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
  await loadQuizLearnedTopics();
  await loadPreviousQuizzes();

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
