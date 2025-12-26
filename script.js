// script.js
// ====================
// GLOBAL STATE & CONFIG
// ====================

const GAMIFICATION_CONFIG = {
  levelThresholds: [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000],
  maxLevel: 10,

  badges: {
    'first-checkin': { name: 'First Check-in', rarity: 'common', icon: 'CheckCircle' },
    'streak-3': { name: '3-Day Streak', rarity: 'common', icon: 'Flame' },
    'streak-7': { name: 'Weekly Warrior', rarity: 'uncommon', icon: 'Flame' },
    'streak-14': { name: 'Fortnight Champion', rarity: 'rare', icon: 'Flame' },
    'streak-30': { name: 'Monthly Master', rarity: 'epic', icon: 'Flame' },
    'task-master': { name: 'Task Master', rarity: 'uncommon', icon: 'ListChecks' },
    'vitals-pro': { name: 'Vitals Pro', rarity: 'uncommon', icon: 'Activity' },
    'medication-adherent': { name: 'Medication Adherent', rarity: 'rare', icon: 'Pill' },
    'level-5': { name: 'Level 5 Achiever', rarity: 'uncommon', icon: 'Award' },
    'level-10': { name: 'Level 10 Master', rarity: 'rare', icon: 'Award' },
    'health-champion': { name: 'Health Champion', rarity: 'legendary', icon: 'Trophy' }
  }
};

// ===================
// API Communication + App State
// ===================

const TODAY_DATE_KEY = new Date().toISOString().split('T')[0];

const API_BASE_URL = "http://localhost:5002"; // Change to your server URL

async function sendAPIRequest(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Send SOS Alert via API (Twilio on server-side)
async function sendSOSAlertAPI() {
  try {
    const data = {
      patient_name: (appState && appState.profile) ? appState.profile.name : 'Unknown',
      location: "Home",
      vitals: (appState && appState.vitals) ? appState.vitals : {},
      conditions: (appState && appState.profile) ? appState.profile.conditions : 'Not specified',
      emergency_contact: (appState && appState.profile) ? appState.profile.emergencyContact : 'Unknown'
    };

    console.log('🚨 Sending SOS Alert:', data);
    const result = await sendAPIRequest("send-sos", data);

    if (result && result.success) {
      console.log("✅ SOS alert sent:", result);
      triggerConfetti();
      return { success: true, message: "SOS alert sent to emergency contacts via WhatsApp!" };
    } else {
      console.warn('SOS API responded with failure', result);
      return { success: false, message: result?.message || "Failed to send SOS alert." };
    }
  } catch (error) {
    console.error("SOS Alert Error:", error);
    return { success: false, message: `Error sending SOS alert: ${error.message}` };
  }
}

// Send Health Report via API
async function sendHealthReport(type) {
  try {
    const score = calculateHealthScore();
    const game = appState.gamification || {};
    const completedTasks = (appState.tasks || []).filter(t => t.isChecked).length;
    const totalTasks = (appState.tasks || []).length;
    const dosesTaken = (appState.tasks || []).filter(t => t.icon === 'Pill' && t.isChecked).length;
    const totalDoses = (appState.tasks || []).filter(t => t.icon === 'Pill').length;

    const recentActivities = (appState.tasks || []).slice(0, 3).map(task =>
      `• ${task.name}: ${task.isChecked ? 'Completed ✅' : 'Pending'}`
    ).join('\n');

    const data = {
      type: type, // 'family' or 'doctor'
      patient_name: appState.profile ? appState.profile.name : 'Unknown',
      report: {
        hr: appState.vitals ? appState.vitals.hr : 72,
        bp: appState.vitals ? appState.vitals.bp : '130/80',
        bg: appState.vitals ? appState.vitals.bg : 105,
        spo2: appState.vitals ? appState.vitals.spo2 : 97,
        score: score,
        streak: game.streak || 0,
        level: game.level || 1,
        tasks_completed: completedTasks,
        tasks_total: totalTasks,
        meds_taken: dosesTaken,
        meds_total: totalDoses,
        recent_activities: recentActivities || 'No recent activities',
        medications: appState.profile && appState.profile.medications ?
          appState.profile.medications.map(med => `• ${med}`).join('\n') : 'No medications listed',
        conditions: appState.profile ? appState.profile.conditions : 'Not specified'
      }
    };

    console.log(`📊 Sending ${type} report:`, data);
    const result = await sendAPIRequest("send-report", data);

    if (result && result.success) {
      console.log(`✅ ${type} report sent:`, result);
      return {
        success: true,
        message: `${type === 'doctor' ? 'Doctor' : 'Family'} report sent via WhatsApp!`
      };
    } else {
      return { success: false, message: result?.message || `Failed to send ${type} report.` };
    }
  } catch (error) {
    console.error("Health Report Error:", error);
    return { success: false, message: `Error sending ${type} report: ${error.message}` };
  }
}

// INITIAL APP STATE
const INITIAL_STATE = {
  profile: {
    name: 'Rohan Choure',
    dob: '1975-05-15',
    conditions: 'Hypertension, Type 2 Diabetes',
    emergencyContact: 'Avinash Hugar - (555) 123-4567',
    medications: ['Aspirin 75mg', 'Metformin 500mg', 'Lisinopril 10mg']
  },
  tasks: [
    { id:1, name:'Take Blood Pressure', icon:'Activity', isChecked:false, timeMM: 8*60, timeLabel:'08:00 AM' },
    { id:2, name:'Check Blood Glucose', icon:'Activity', isChecked:false, timeMM: 8*60+30, timeLabel:'08:30 AM' },
    { id:3, name:'Take Morning Medication', icon:'Pill', isChecked:false, timeMM: 9*60, timeLabel:'09:00 AM' },
    { id:4, name:'30 min Walk/Exercise', icon:'Footprints', isChecked:false, timeMM: 17*60, timeLabel:'05:00 PM' },
    { id:5, name:'Take Evening Medication', icon:'Pill', isChecked:false, timeMM: 20*60, timeLabel:'08:00 PM' }
  ],
  vitals: { hr:72, bp:'130/80', bg:105, spo2:97 },
  medicationHistory: [
    { date: 'Mon', meds: ['Aspirin (AM)', 'Metformin (AM)'], nextDose: 'Aspirin at 8:00 PM', dosesTaken: 2, totalDoses: 3 },
    { date: 'Sun', meds: ['Aspirin (AM)', 'Metformin (AM)', 'Aspirin (PM)'], nextDose: 'Aspirin (AM)', dosesTaken: 3, totalDoses: 3 },
  ],
  gamification: {
    level: 5,
    xp: 150,
    xpToNextLevel: 200,
    streak: 3,
    lastActivityDate: TODAY_DATE_KEY,
    badges: ['first-checkin', 'streak-3'],
    combo: 0,
    lastComboTime: 0,
    leaderboardPosition: 42,
    healthCoins: 25,
    dailyRewardsClaimed: [],
    mysteryBoxesOpened: 0
  },
  healthData: [
    {day:'Mon',score:75,risk:25},
    {day:'Tue',score:80,risk:20},
    {day:'Wed',score:85,risk:15},
    {day:'Thu',score:90,risk:10},
    {day:'Fri',score:50,risk:50},
    {day:'Sat',score:95,risk:5},
    {day:'Sun',score:98,risk:2}
  ],
  currentPage:'home',
  lastUpdatedDate:TODAY_DATE_KEY,
  taskIdCounter:6,
  isVitalsEditing:false
};

let appState;
try {
  const saved = localStorage.getItem('rpmCoachStateDistributed');
  appState = saved ? JSON.parse(saved) : INITIAL_STATE;
} catch (error) {
  console.error('Error loading saved state:', error);
  appState = INITIAL_STATE;
}

const save = () => {
  try {
    const data = JSON.stringify(appState);
    if (data.length > 5000000) { // 5MB limit
      throw new Error('Data too large');
    }
    localStorage.setItem('rpmCoachStateDistributed', data);
  } catch (e) {
    console.error('Save failed:', e);
    alert('Could not save data. Please export your data.');
  }
};

const refreshIconsSoon = () => {
  if (typeof lucide==='undefined') return;
  requestAnimationFrame(()=>lucide.createIcons({attrs:{'stroke-width':2,'class':'lucide'}}));
};

const calculateHealthScore = () => {
  const c = (appState.tasks || []).filter(t=>t.isChecked).length;
  const total = (appState.tasks || []).length;
  return total?Math.round((c/total)*100):0;
};


// ====================
// THEME MANAGEMENT
// ====================

function initTheme() {
  const theme = localStorage.getItem('compassTheme') || 'neon';
  document.body.setAttribute('data-theme', theme);

  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
    themeSelect.addEventListener('change', (e) => {
      document.body.setAttribute('data-theme', e.target.value);
      localStorage.setItem('compassTheme', e.target.value);
      applyThemeEffects();
    });
  }

  applyThemeEffects();
}

function applyThemeEffects() {
  // Add floating animations to cards
  document.querySelectorAll('.card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    if (!card.classList.contains('slide-up-animation')) {
      card.classList.add('slide-up-animation');
    }
  });

  // Add pulse to interactive elements
  document.querySelectorAll('.btn-primary').forEach(btn => {
    if (!btn.classList.contains('pulse-animation')) {
      btn.classList.add('pulse-animation');
    }
  });
}

// ====================
// GAMIFICATION FUNCTIONS
// ====================

function showXPGain(amount, element) {
  const xpBadge = document.createElement('div');
  xpBadge.className = 'xp-badge slide-up-animation';
  xpBadge.innerHTML = `<i data-lucide="star"></i> +${amount} XP`;
  xpBadge.style.position = 'absolute';
  xpBadge.style.top = '-30px';
  xpBadge.style.left = '50%';
  xpBadge.style.transform = 'translateX(-50%)';

  element.style.position = 'relative';
  element.appendChild(xpBadge);

  setTimeout(() => {
    xpBadge.remove();
  }, 2000);

  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function playSound(sound) {
  // You can implement sound effects here
  console.log(`Playing sound: ${sound}`);
}

// ====================
// SOS ALERT
// ====================

let sosHoldTimeout;
let sosCountdown;

function startSOSCountdown() {
  const sosButton = document.querySelector('.sos-button');
  if (!sosButton) return;

  sosCountdown = 3;
  sosButton.innerHTML = `<span style="font-size: 24px; font-weight: bold;">${sosCountdown}</span>`;

  const countdownInterval = setInterval(() => {
    sosCountdown--;
    if (sosCountdown <= 0) {
      clearInterval(countdownInterval);
      // call the API-backed SOS function
      sendSOSAlertAPI().then(res => {
        if (!res || !res.success) console.warn('SOS send failed', res);
      }).catch(err => console.error('SOS send error', err));
      sosButton.innerHTML = '<i data-lucide="siren"></i>';
    } else {
      sosButton.innerHTML = `<span style="font-size: 24px; font-weight: bold;">${sosCountdown}</span>`;
    }
  }, 1000);
}

function sendSOSAlert() {
  // Implement SOS alert logic
  alert('SOS Alert Sent!');
  

  // Reset button
  const sosButton = document.querySelector('.sos-button');
  if (sosButton) {
    sosButton.innerHTML = '<i data-lucide="siren"></i>';
  }
}

// ====================
// INITIALIZATION
// ====================

document.addEventListener('DOMContentLoaded', function () {
  // Initialize theme
  initTheme();

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Set active nav item
  const currentPage = window.location.pathname.split('/').pop().split('.')[0] || 'index';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href')?.includes(currentPage)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Add hover effects to cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });

  // Initialize date/time
  updateDateTime();
  setInterval(updateDateTime, 60000);
});

function updateDateTime() {
  const now = new Date();
  const greeting = document.getElementById('greeting');
  const timeElement = document.getElementById('current-time');

  if (greeting) {
    const hour = now.getHours();
    let greetingText = 'Good Evening';
    if (hour < 12) greetingText = 'Good Morning';
    else if (hour < 18) greetingText = 'Good Afternoon';
    greeting.textContent = greetingText;
  }

  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// ====================
// HEADER INITIALIZATION
// ====================

function initHeader() {
  // Update greeting based on time of day
  updateDateTime();

  // Add hover effects to header settings icon
  const settingsIcon = document.querySelector('.header-settings-icon');
  if (settingsIcon) {
    settingsIcon.addEventListener('mouseenter', () => {
      settingsIcon.style.transform = 'rotate(15deg) scale(1.1)';
    });

    settingsIcon.addEventListener('mouseleave', () => {
      settingsIcon.style.transform = 'rotate(0) scale(1)';
    });

    // Add click animation
    settingsIcon.addEventListener('click', (e) => {
      // If we're already on settings page, go home instead
      if (window.location.pathname.includes('settings.html')) {
        e.preventDefault();
        window.location.href = 'index.html';
      }
    });
  }

  // Update theme selector to match current theme
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    const currentTheme = document.body.getAttribute('data-theme') || 'neon';
    themeSelect.value = currentTheme;

    themeSelect.addEventListener('change', (e) => {
      document.body.setAttribute('data-theme', e.target.value);
      localStorage.setItem('compassTheme', e.target.value);
      applyThemeEffects();
    });
  }
}

// Update the DOMContentLoaded event listener in script.js:
document.addEventListener('DOMContentLoaded', function () {
  // Initialize theme
  initTheme();

  // Initialize header
  initHeader();

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Set active nav item
  const currentPage = window.location.pathname.split('/').pop().split('.')[0] || 'index';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href')?.includes(currentPage)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Add hover effects to cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });

  // Initialize date/time
  updateDateTime();
  setInterval(updateDateTime, 60000);
});