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

// Eatsence Nutrition Data
let eatsenceData = {
  totalCalories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  foods: []
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
  console.log(`Playing sound: ${sound}`);
  
  // Example implementation with Web Audio API
  if (sound === 'vitalsUpdate') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.log('Audio context not supported');
    }
  }
}

// ====================
// DATE/TIME FUNCTIONS
// ====================

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
// SOS ALERT
// ====================

function startSOSCountdown() {
  const sosButton = document.querySelector('.sos-button');
  if (!sosButton) return;

  let countdown = 3;
  sosButton.innerHTML = `<span style="font-size: 24px; font-weight: bold;">${countdown}</span>`;

  const countdownInterval = setInterval(() => {
    countdown--;
      if (countdown <= 0) {
      clearInterval(countdownInterval);
      // Prefer API implementation if available (api.js). Fallback to local handler.
      if (window.API && typeof window.API.sendSOSAlert === 'function') {
        window.API.sendSOSAlert();
      } else {
        sendSOSAlert();
      }
      sosButton.innerHTML = '<i data-lucide="siren"></i>';
    } else {
      sosButton.innerHTML = `<span style="font-size: 24px; font-weight: bold;">${countdown}</span>`;
    }
  }, 1000);
}

// ====================
// AI NUDGE COACH FUNCTIONS
// ====================

function showSubOptions(topic) {
  const subOptionsContainer = document.getElementById('ai-sub-options');
  const nudgeContext = document.getElementById('nudge-context');
  
  // Remove active class from all chips
  document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  
  // Add active class to clicked chip
  event.target.classList.add('active');
  
  // Define sub-options for each topic
  const subOptions = {
    fitness: [
      "Feeling too tired to exercise",
      "Lack of motivation for physical activity",
      "Joint pain during workouts",
      "Time constraints for exercise",
      "Don't know where to start"
    ],
    hydration: [
      "Forget to drink water",
      "Don't like the taste of plain water",
      "Too busy to track intake",
      "Prefer sugary drinks",
      "Medical condition affecting thirst"
    ],
    diet: [
      "Cravings for unhealthy food",
      "Emotional eating",
      "Meal prep is overwhelming",
      "Eating out too often",
      "Confused about nutrition guidelines"
    ]
  };
  
  if (subOptions[topic]) {
    subOptionsContainer.innerHTML = subOptions[topic]
      .map(option => `<div class="sub-chip" onclick="selectSubOption('${option}')">${option}</div>`)
      .join('');
    subOptionsContainer.classList.remove('hidden');
    
    // Set default context
    nudgeContext.value = `I need help with ${topic.toLowerCase()}: `;
  } else {
    subOptionsContainer.classList.add('hidden');
    nudgeContext.value = '';
  }
}

function selectSubOption(option) {
  const nudgeContext = document.getElementById('nudge-context');
  nudgeContext.value = option;
}

function setNudgeContext(context) {
  const nudgeContext = document.getElementById('nudge-context');
  const subOptionsContainer = document.getElementById('ai-sub-options');
  
  // Remove active class from all chips
  document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  
  subOptionsContainer.classList.add('hidden');
  nudgeContext.value = context || '';
  nudgeContext.focus();
}

function generateNudge() {
  const context = document.getElementById('nudge-context').value.trim();
  const tone = document.getElementById('nudge-tone').value;
  const strategy = document.getElementById('nudge-logic').value;
  
  if (!context) {
    alert('Please describe what you\'re struggling with or select a topic.');
    return;
  }
  
  // Show loading state
  const generateBtn = document.getElementById('nudge-generate-btn');
  const btnText = document.getElementById('nudge-btn-text');
  const loadingSpinner = document.getElementById('nudge-loading');
  
  btnText.textContent = 'Generating...';
  loadingSpinner.classList.remove('hidden');
  generateBtn.disabled = true;
  
  // Simulate AI processing delay
  setTimeout(() => {
    const nudgeOutput = document.getElementById('nudge-output');
    const nudgeText = document.getElementById('nudge-text');
    
    // Generate nudge based on inputs
    const nudges = {
      supportive: [
        "I understand this is challenging for you. Remember, progress isn't always linear.",
        "Be kind to yourself today. Small steps still move you forward.",
        "You're doing better than you think. Let's focus on what you CAN do."
      ],
      direct: [
        "Clinical evidence shows that consistency yields better results than intensity.",
        "Your data indicates this pattern. Let's address it systematically.",
        "Research supports breaking this into smaller, manageable actions."
      ],
      gamified: [
        "🎮 Level up challenge: Complete 3 small actions today to earn bonus XP!",
        "🏆 Achievement unlocked: 'Consistency Master' - keep your streak going!",
        "✨ Power-up activated! You've got this - every action counts toward your health quest."
      ],
      'tough-love': [
        "Stop making excuses. Your health is worth the effort.",
        "The only person you're cheating is yourself. Time to step up.",
        "Comfort zones are beautiful, but nothing grows there. Push yourself."
      ]
    };
    
    const strategies = {
      'implementation intentions': [
        "When [trigger], I will [specific action] at [time/place].",
        "Plan exactly when and where you'll take action this week.",
        "Create 'if-then' plans to automate your healthy choices."
      ],
      anchoring: [
        "Stack this new habit onto an existing one you already do consistently.",
        "Link your medication to your morning coffee routine.",
        "After brushing your teeth, immediately take your vitamins."
      ],
      'loss aversion': [
        "Don't break your 7-day streak! Visualize starting over at zero.",
        "Protect your safety shield by maintaining consistency this week.",
        "Remember how good it feels to see that streak number grow daily."
      ]
    };
    
    // Select random nudge and strategy
    const randomNudge = nudges[tone][Math.floor(Math.random() * nudges[tone].length)];
    const randomStrategy = strategies[strategy][Math.floor(Math.random() * strategies[strategy].length)];
    
    nudgeText.innerHTML = `
      <p><strong>Coach's Note:</strong> ${randomNudge}</p>
      <ul>
        <li><strong>Your Strategy:</strong> ${randomStrategy}</li>
        <li><strong>Action Plan:</strong> Identify one small step you can take within the next hour.</li>
        <li><strong>Accountability:</strong> Set a reminder for tomorrow at the same time.</li>
        <li><strong>Reward:</strong> Acknowledge your effort with a small, healthy reward.</li>
      </ul>
      <p style="margin-top: 15px; font-style: italic; color: var(--muted-2);">
        Based on your input: "${context}"
      </p>
    `;
    
    nudgeOutput.style.display = 'block';
    
    // Reset button state
    btnText.textContent = 'Generate Nudge Strategy';
    loadingSpinner.classList.add('hidden');
    generateBtn.disabled = false;
    
    // Show XP gain
    showXPGain(10, generateBtn);
    
  }, 1500);
}

function copyNudge() {
  const nudgeText = document.getElementById('nudge-text').innerText;
  navigator.clipboard.writeText(nudgeText)
    .then(() => {
      const copyBtn = document.querySelector('.copy-btn');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i data-lucide="check" style="width: 14px;"></i> COPIED!';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
}

// ====================
// EATSENCE AI NUTRITION FUNCTIONS
// ====================

function openEatsenceScan() {
  document.getElementById('eatsence-scan-modal').classList.remove('hidden');
}

function closeEatsenceModal() {
  document.getElementById('eatsence-scan-modal').classList.add('hidden');
}

function closeEatsenceResult() {
  document.getElementById('eatsence-result-modal').classList.add('hidden');
}

function triggerAnalysis() {
  const manualSelect = document.getElementById('manual-food-select');
  const selectedFood = manualSelect.value;
  
  if (!selectedFood) {
    alert('Please select a food item or upload an image.');
    return;
  }
  
  // Show loading
  document.getElementById('eatsence-loading').classList.remove('hidden');
  document.getElementById('btn-analyze').disabled = true;
  
  // Simulate AI analysis
  setTimeout(() => {
    // Mock analysis results
    const foodData = {
      'Raw Gala Apple, large size': { name: 'Gala Apple', kcal: 95, protein: 0.5, carbs: 25, fat: 0.3, confidence: 98, tip: 'Apples are high in fiber and antioxidants. Eat with the skin for maximum benefits.' },
      'Medium Ripe Banana': { name: 'Banana', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4, confidence: 96, tip: 'Bananas are great for potassium. They make an excellent pre-workout snack.' },
      'Raw Broccoli florets': { name: 'Broccoli', kcal: 55, protein: 3.7, carbs: 11, fat: 0.6, confidence: 94, tip: 'Broccoli is rich in vitamins C and K. Steaming preserves the most nutrients.' },
      'Whole Avocado': { name: 'Avocado', kcal: 240, protein: 3, carbs: 12, fat: 22, confidence: 97, tip: 'Avocados contain healthy monounsaturated fats. They help absorb fat-soluble vitamins.' },
      'Sweet Potato, cooked': { name: 'Sweet Potato', kcal: 180, protein: 2, carbs: 41, fat: 0.1, confidence: 95, tip: 'Sweet potatoes are rich in beta-carotene. Pair with a fat source for better absorption.' },
      'Raw Chicken Breast, 100g': { name: 'Chicken Breast', kcal: 165, protein: 31, carbs: 0, fat: 3.6, confidence: 99, tip: 'Chicken breast is lean protein. Bake or grill instead of frying for healthier preparation.' },
      'Cooked Brown Rice, 100g': { name: 'Brown Rice', kcal: 111, protein: 2.6, carbs: 23, fat: 0.9, confidence: 93, tip: 'Brown rice retains more fiber and nutrients than white rice. Soak before cooking to reduce cooking time.' }
    };
    
    const result = foodData[selectedFood] || {
      name: selectedFood,
      kcal: 150,
      protein: 5,
      carbs: 20,
      fat: 5,
      confidence: 85,
      tip: 'Remember to consider portion sizes for accurate calorie counting.'
    };
    
    // Update result modal
    document.getElementById('res-food-name').textContent = result.name;
    document.getElementById('res-confidence').textContent = result.confidence;
    document.getElementById('res-kcal').textContent = result.kcal;
    document.getElementById('res-protein').textContent = `${result.protein}g`;
    document.getElementById('res-carbs').textContent = `${result.carbs}g`;
    document.getElementById('res-fat').textContent = `${result.fat}g`;
    document.getElementById('res-tip').textContent = result.tip;
    
    // Hide loading, show result
    document.getElementById('eatsence-loading').classList.add('hidden');
    document.getElementById('btn-analyze').disabled = false;
    closeEatsenceModal();
    document.getElementById('eatsence-result-modal').classList.remove('hidden');
    
  }, 2000);
}

function confirmLogFood() {
  const portion = parseInt(document.getElementById('res-portion').value) || 100;
  const factor = portion / 100;
  
  const foodName = document.getElementById('res-food-name').textContent;
  const kcal = parseInt(document.getElementById('res-kcal').textContent) * factor;
  const protein = parseFloat(document.getElementById('res-protein').textContent) * factor;
  const carbs = parseFloat(document.getElementById('res-carbs').textContent) * factor;
  const fat = parseFloat(document.getElementById('res-fat').textContent) * factor;
  
  // Update eatsence data
  eatsenceData.totalCalories += Math.round(kcal);
  eatsenceData.protein += protein;
  eatsenceData.carbs += carbs;
  eatsenceData.fat += fat;
  eatsenceData.foods.push({
    name: foodName,
    kcal: Math.round(kcal),
    protein: protein.toFixed(1),
    carbs: carbs.toFixed(1),
    fat: fat.toFixed(1),
    portion: portion
  });
  
  // Update UI
  updateNutritionDisplay();
  
  // Show confirmation
  alert(`✅ ${foodName} logged! ${Math.round(kcal)} kcal added to your diary.`);
  
  // Close modal
  closeEatsenceResult();
  
  // Show XP gain
  const scanBtn = document.querySelector('[onclick="openEatsenceScan()"]');
  if (scanBtn) {
    showXPGain(15, scanBtn);
  }
}

function updateNutritionDisplay() {
  // Update kcal display
  const kcalDisplay = document.getElementById('kcal-display-card');
  if (kcalDisplay) {
    kcalDisplay.textContent = `${eatsenceData.totalCalories} kcal`;
  }
  
  // Update macro bars and values
  const proteinTarget = 60; // grams
  const carbsTarget = 250; // grams
  const fatTarget = 70; // grams
  
  // Update protein
  const proteinBar = document.getElementById('bar-protein');
  const proteinVal = document.getElementById('val-protein');
  const proteinPercent = Math.min((eatsenceData.protein / proteinTarget) * 100, 100);
  if (proteinBar) proteinBar.style.width = `${proteinPercent}%`;
  if (proteinVal) proteinVal.textContent = `${eatsenceData.protein.toFixed(0)}g`;
  
  // Update carbs
  const carbsBar = document.getElementById('bar-carbs');
  const carbsVal = document.getElementById('val-carbs');
  const carbsPercent = Math.min((eatsenceData.carbs / carbsTarget) * 100, 100);
  if (carbsBar) carbsBar.style.width = `${carbsPercent}%`;
  if (carbsVal) carbsVal.textContent = `${eatsenceData.carbs.toFixed(0)}g`;
  
  // Update fat
  const fatBar = document.getElementById('bar-fat');
  const fatVal = document.getElementById('val-fat');
  const fatPercent = Math.min((eatsenceData.fat / fatTarget) * 100, 100);
  if (fatBar) fatBar.style.width = `${fatPercent}%`;
  if (fatVal) fatVal.textContent = `${eatsenceData.fat.toFixed(0)}g`;
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

  // Apply card animations
  document.querySelectorAll('.card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('slide-up-animation');
  });

  // Initialize date/time
  updateDateTime();
  setInterval(updateDateTime, 60000);
  
  // Add pulse animation to primary buttons
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.classList.add('pulse-animation');
  });
  
  // Initialize file upload handlers for eatsence
  const cameraInput = document.getElementById('eatsence-camera');
  const uploadInput = document.getElementById('eatsence-upload');
  
  if (cameraInput) {
    cameraInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        // In a real app, you would upload and process the image
        document.getElementById('manual-food-select').value = 'Raw Gala Apple, large size';
        triggerAnalysis();
      }
    });
  }
  
  if (uploadInput) {
    uploadInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        // In a real app, you would upload and process the image
        document.getElementById('manual-food-select').value = 'Cooked Brown Rice, 100g';
        triggerAnalysis();
      }
    });
  }
  
  // Initialize manual food select
  const manualSelect = document.getElementById('manual-food-select');
  if (manualSelect) {
    manualSelect.addEventListener('change', function(e) {
      if (e.target.value) {
        document.getElementById('btn-analyze').disabled = false;
      }
    });
  }
});
// ====================
// MISSING FUNCTIONS FOR API.JS
// ====================

function logEvent(eventName, data) {
  console.log(`📝 Event logged: ${eventName}`, data);
  
  try {
    const events = JSON.parse(localStorage.getItem('appEvents') || '[]');
    events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    localStorage.setItem('appEvents', JSON.stringify(events));
  } catch (error) {
    console.error("Event logging error:", error);
  }
}

function getCompletedTasksCount() {
  const tasks = JSON.parse(localStorage.getItem('healthTasks') || '[]');
  return tasks.filter(t => t.completed).length;
}

function getUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}