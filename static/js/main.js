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

(function() {
  const scripts = [
    "/static/js/utils.js?v=26",
    "/static/js/auth.js?v=26",
    "/static/js/notifications.js?v=26",
    "/static/js/doubts.js?v=26",
    "/static/js/dashboard.js?v=26",
    "/static/js/quiz.js?v=26",
    "/static/js/teacher.js?v=26",
    "/static/js/admin.js?v=26"
  ];
  for (let i = 0; i < scripts.length; i++) {
    document.write('<script src="' + scripts[i] + '"><\/script>');
  }
})();

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
