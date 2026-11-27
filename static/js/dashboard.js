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
