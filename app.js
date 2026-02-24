
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBl0RrLpU1OB4QaExD7c-Ayq7GZUtyBaTY",
  authDomain: "time-tracker-app-52c13.firebaseapp.com",
  projectId: "time-tracker-app-52c13",
  storageBucket: "time-tracker-app-52c13.firebasestorage.app",
  messagingSenderId: "334523129710",
  appId: "1:334523129710:web:417a35d9a69743b97eab7f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ====== UI Elements ====== */
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const btnGoogle = document.getElementById('btn-google');
const btnLogout = document.getElementById('btn-logout');
const userEmailSpan = document.getElementById('user-email');

const datePicker = document.getElementById('date-picker');
const activityTitle = document.getElementById('activity-title');
const activityCategory = document.getElementById('activity-category');
const activityMinutes = document.getElementById('activity-minutes');
const btnAdd = document.getElementById('btn-add');
const btnAnalyse = document.getElementById('btn-analyse');
const activitiesList = document.getElementById('activities-list');
const remainingEl = document.getElementById('remaining');
const remainingBar = document.getElementById('remaining-bar');
const formError = document.getElementById('form-error');
const ctaLog = document.getElementById('cta-log');
const noDataView = document.getElementById('no-data');
const analysisView = document.getElementById('analysis-view');
const totalHoursEl = document.getElementById('total-hours');
const numActivitiesEl = document.getElementById('num-activities');

let currentUser = null;
let activities = []; // local cache
const MAX_MINUTES = 1440;

let pieChart = null;
let barChart = null;

/* ====== UI Helpers ====== */
function showLogin() {
  loginScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
  btnLogout.classList.add('hidden');
  userEmailSpan.classList.add('hidden');
}

function showApp() {
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  btnLogout.classList.remove('hidden');
  userEmailSpan.classList.remove('hidden');
  userEmailSpan.textContent = currentUser.email;
}

/* ====== Auth ====== */
btnSignup.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value;
  if (!email || !pass) { alert('Provide email and password to sign up.'); return; }
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert('Sign up successful — you are logged in.');
    emailInput.value = '';
    passwordInput.value = '';
  } catch (e) {
    alert(e.message);
  }
});

btnLogin.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value;
  if (!email || !pass) { alert('Provide email and password to sign in.'); return; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    emailInput.value = '';
    passwordInput.value = '';
  } catch (e) {
    alert(e.message);
  }
});

btnGoogle.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});

/* ====== Auth state observer ====== */
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    showApp();
    const today = new Date().toISOString().slice(0,10);
    datePicker.value = today;
    loadActivitiesForDate(today);
  } else {
    showLogin();
  }
});

/* ====== Firestore helpers ====== */
function dayDocRef(uid, dateStr) {
  return doc(db, 'users', uid, 'days', dateStr);
}
function activitiesCollectionRef(uid, dateStr) {
  return collection(db, 'users', uid, 'days', dateStr, 'activities');
}

/* ====== Load activities for a date ====== */
async function loadActivitiesForDate(dateStr) {
  if (!currentUser) return;
  activitiesList.innerHTML = '';
  activities = [];

  try {
    const colRef = activitiesCollectionRef(currentUser.uid, dateStr);
    const q = query(colRef, orderBy('createdAt', 'asc'));
    const qSnap = await getDocs(q);
    qSnap.forEach(docSnap => {
      const data = docSnap.data();
      activities.push({ id: docSnap.id, title: data.title, category: data.category, minutes: data.minutes });
    });
  } catch (e) {
    console.error('Failed to load activities', e);
    showFormError('Failed to load activities');
  }

  renderActivities();
  updateRemainingAndAnalyse();
  renderDashboard();
}

/* ====== Add activity ====== */
btnAdd.addEventListener('click', async () => {
  hideFormError();
  const title = activityTitle.value.trim();
  const category = activityCategory.value;
  const minutes = parseInt(activityMinutes.value, 10);
  const dateStr = datePicker.value;
  if (!title || !dateStr || !minutes || minutes <= 0) {
    showFormError('Please provide title, date and minutes (>0).');
    return;
  }

  const currentTotal = activities.reduce((s, a) => s + (a.minutes||0), 0);
  if (currentTotal + minutes > MAX_MINUTES) {
    showFormError(`Adding ${minutes} min would exceed ${MAX_MINUTES} minutes for this date.`);
    return;
  }

  try {
    const colRef = activitiesCollectionRef(currentUser.uid, dateStr);
    await addDoc(colRef, {
      title,
      category,
      minutes,
      createdAt: serverTimestamp()
    });
    activityTitle.value = '';
    activityMinutes.value = '';
    await loadActivitiesForDate(dateStr);
  } catch (e) {
    showFormError(e.message || 'Failed to add activity');
  }
});

function showFormError(msg) {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

function hideFormError() {
  formError.textContent = '';
  formError.classList.add('hidden');
}

/* ====== Render activities list (with edit/delete) ====== */
function renderActivities() {
  activitiesList.innerHTML = '';
  if (activities.length === 0) {
    activitiesList.innerHTML = `<li class="text-sm text-slate-500">No activities yet for this date.</li>`;
    return;
  }

  activities.forEach(act => {
    const li = document.createElement('li');
    li.className = 'p-3 border rounded flex justify-between items-center';
    li.innerHTML = `
      <div>
        <div class="font-semibold">${escapeHtml(act.title)} <span class="text-xs text-slate-500">(${escapeHtml(act.category)})</span></div>
        <div class="text-sm text-slate-500">${act.minutes} min</div>
      </div>
      <div class="flex gap-2">
        <button data-id="${act.id}" class="btn-edit px-2 py-1 text-sm border rounded">Edit</button>
        <button data-id="${act.id}" class="btn-del px-2 py-1 text-sm border rounded text-rose-600">Delete</button>
      </div>
    `;
    activitiesList.appendChild(li);
  });

  // attach handlers
  document.querySelectorAll('.btn-del').forEach(b => {
    b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm('Delete activity?')) return;
      const dateStr = datePicker.value;
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'days', dateStr, 'activities', id);
        await deleteDoc(docRef);
        await loadActivitiesForDate(dateStr);
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    });
  });

  document.querySelectorAll('.btn-edit').forEach(b => {
    b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const act = activities.find(a => a.id === id);
      if (!act) return;
      // For simplicity: prefill form and delete the existing document so user can re-add (common pattern)
      activityTitle.value = act.title;
      activityCategory.value = act.category || 'Other';
      activityMinutes.value = act.minutes;
      try {
        const dateStr = datePicker.value;
        await deleteDoc(doc(db, 'users', currentUser.uid, 'days', dateStr, 'activities', id));
        await loadActivitiesForDate(dateStr);
      } catch (err) {
        alert('Failed to prepare edit: ' + err.message);
      }
    });
  });
}

/* ====== Remaining logic & Analyse button ====== */
function updateRemainingAndAnalyse() {
  const total = activities.reduce((s,a) => s + (a.minutes||0), 0);
  const remaining = MAX_MINUTES - total;
  remainingEl.textContent = `${remaining} min`;
  const pct = Math.max(0, Math.min(100, (total / MAX_MINUTES) * 100));
  remainingBar.style.width = `${Math.max(0, 100 - pct)}%`;

  // Enable Analyse when there is >0 minutes (you wanted exactly or up to 1440 — enabling when >0 makes UI usable).
  if (total > 0 && total <= MAX_MINUTES) {
    btnAnalyse.disabled = false;
  } else {
    btnAnalyse.disabled = true;
  }
}

btnAnalyse.addEventListener('click', () => {
  // Show dashboard even if not exactly 1440. If you want only exactly 1440, enforce here.
  renderDashboard(true);
});

/* ====== Date change handler ====== */
datePicker.addEventListener('change', async (e) => {
  const dateStr = e.target.value;
  if (!dateStr || !currentUser) return;
  await loadActivitiesForDate(dateStr);
});

/* ====== CTA scroll ====== */
ctaLog.addEventListener('click', () => {
  activityTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ====== Dashboard rendering ====== */
function renderDashboard(forceShow = false) {
  const total = activities.reduce((s,a) => s + (a.minutes||0), 0);
  if (activities.length === 0 && !forceShow) {
    noDataView.classList.remove('hidden');
    analysisView.classList.add('hidden');
    totalHoursEl.textContent = `0h 0m`;
    numActivitiesEl.textContent = '0';
    destroyCharts();
    return;
  }

  noDataView.classList.add('hidden');
  analysisView.classList.remove('hidden');

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  totalHoursEl.textContent = `${hours}h ${mins}m`;
  numActivitiesEl.textContent = activities.length;

  const catMap = {};
  activities.forEach(a => {
    const c = a.category || 'Other';
    catMap[c] = (catMap[c] || 0) + (a.minutes || 0);
  });
  const labels = Object.keys(catMap);
  const data = labels.map(l => catMap[l]);

  renderPieChart(labels, data);
  renderBarChart(activities.map(a => a.title), activities.map(a => a.minutes));
}

/* ====== Charts (Chart.js is loaded globally) ====== */
function renderPieChart(labels, data) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

function renderBarChart(labels, data) {
  const ctx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Minutes', data }] },
    options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
  });
}

function destroyCharts() {
  if (pieChart) { pieChart.destroy(); pieChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
}

/* ====== small utilities ====== */
function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
