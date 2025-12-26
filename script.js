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
      sendSOSAlert();
      sosButton.innerHTML = '<i data-lucide="siren"></i>';
    } else {
      sosButton.innerHTML = `<span style="font-size: 24px; font-weight: bold;">${sosCountdown}</span>`;
    }
  }, 1000);
}

function sendSOSAlert() {
  // Implement SOS alert logic
  alert('SOS Alert Sent!');
  triggerConfetti();

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