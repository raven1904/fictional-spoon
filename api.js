// api.js - Enhanced for Twilio integration
// ====================
// API Communication Module
// ====================

const API_BASE_URL = window.location.origin;

// Initialize app state
let appState = null;

function initializeAppState() {
  try {
    const saved = localStorage.getItem('compassAppState');
    appState = saved ? JSON.parse(saved) : getDefaultAppState();
    
    // Also check for the alternative localStorage key from script.js
    if (!saved) {
      const scriptSaved = localStorage.getItem('rpmCoachStateDistributed');
      if (scriptSaved) {
        appState = JSON.parse(scriptSaved);
      }
    }
    
    // Ensure emergency contacts are set
    if (!appState.emergencyContacts) {
      appState.emergencyContacts = [
        {
          name: "Avinash Hugar",
          phone: "(555) 123-4567",
          relationship: "Primary Emergency Contact",
          primary: true,
          whatsapp: true
        },
        {
          name: "Dr. Sharma",
          phone: "(555) 987-6543",
          relationship: "Primary Physician",
          primary: false,
          whatsapp: false
        }
      ];
    }
    
    console.log('✅ App State Initialized:', appState);
    
  } catch (error) {
    console.error('Error loading app state:', error);
    appState = getDefaultAppState();
  }
}

// Generic API request handler
async function sendAPIRequest(endpoint, method = 'POST', data = {}) {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    console.log(`📡 API Request: ${method} ${url}`, data);
    
    const requestOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client': 'COMPASS-Web',
        'X-Client-Version': '2.0.0'
      },
      mode: 'cors'
    };

    if (method !== 'GET') {
      requestOptions.body = JSON.stringify({
        ...data,
        client_timestamp: new Date().toISOString()
      });
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ API Response from ${endpoint}:`, result);
    
    return result;
    
  } catch (error) {
    console.error(`❌ API Connection Error (${endpoint}):`, error);
    
    // Show user-friendly error
    showNotification(
      'Connection Error',
      error.message.includes('Failed to fetch') 
        ? 'Cannot connect to server. Please check if the Python server is running on port 5002.'
        : `API Error: ${error.message}`,
      'error'
    );
    
    throw error;
  }
}

// ====================
// SOS ALERT WITH TWILIO
// ====================

async function sendSOSAlert() {
  try {
    // Show loading state
    const sosButton = document.querySelector('.sos-button');
    if (sosButton) {
      sosButton.innerHTML = '<i data-lucide="loader" class="spinning"></i>';
    }
    
    // Get user location
    const location = await getUserLocation();
    
    // Get current vitals
    const vitals = getCurrentVitals();
    
    // Prepare SOS data
    const sosData = {
      patient_name: appState.profile.name,
      patient_id: getUserId(),
      emergency_contact: appState.profile.emergencyContact,
      location: location,
      vitals: vitals,
      additional_info: {
        conditions: appState.profile.conditions,
        medications: appState.profile.medications,
        blood_type: appState.profile.bloodType || 'Unknown'
      },
      additional_contacts: appState.emergencyContacts
    };
    
    // Send to Flask backend
    const response = await fetch(`${API_BASE_URL}/send-sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(sosData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // Handle response
    if (result.success) {
      // Success - show confirmation
      showNotification(
        '🚨 SOS Alert Sent!',
        `Emergency contacts notified via SMS, WhatsApp, and voice call.`,
        'success'
      );
      
      // Trigger confetti for positive feedback
      triggerConfetti();
      
      // Log the event
      logEvent('sos_alert_sent_twilio', {
        alert_id: result.data?.alert_id,
        contacts_notified: result.data?.delivery_summary?.contacts_notified || 0,
        timestamp: new Date().toISOString()
      });
      
      // Show detailed alert in console
      console.log('✅ SOS Alert Details:', result.data);
      
      return {
        success: true,
        message: "SOS Alert Processed Successfully",
        details: result.data,
        twilio_enabled: result.twilio_enabled
      };
      
    } else {
      // API returned error
      showNotification(
        '⚠️ Alert Processing Issue',
        result.message || 'Alert sent but with some issues.',
        'warning'
      );
      
      return {
        success: false,
        message: result.message,
        details: result.data
      };
    }
    
  } catch (error) {
    console.error("SOS Alert Error:", error);
    
    // Fallback emergency protocol
    const fallbackResult = activateEmergencyFallback();
    
    showNotification(
      '⚠️ Using Fallback System',
      fallbackResult.message,
      'error'
    );
    
    return {
      success: false,
      message: "Using fallback emergency system",
      fallback_activated: true,
      details: fallbackResult
    };
    
  } finally {
    // Reset SOS button after delay
    setTimeout(() => {
      const sosButton = document.querySelector('.sos-button');
      if (sosButton) {
        sosButton.innerHTML = '<i data-lucide="siren"></i>';
      }
    }, 3000);
  }
}

// ====================
// HEALTH REPORTS WITH TWILIO
// ====================

async function sendHealthReport(type, recipientInfo = null) {
  try {
    // Gather comprehensive health data
    const healthData = await gatherHealthData();
    
    // Prepare report data matching Flask backend expectations
    const reportData = {
      type: type,  // 'family' or 'doctor'
      patient_name: appState.profile.name,
      report: {
        hr: getCurrentVitals().hr,
        bp: getCurrentVitals().bp,
        bg: getCurrentVitals().glucose,
        spo2: getCurrentVitals().spo2,
        score: calculateHealthScore(),
        level: appState.gamification?.level || 1,
        streak: appState.gamification?.streak || 0,
        tasks_completed: healthData.progress.tasks_completed,
        tasks_total: healthData.progress.tasks_total,
        meds_taken: healthData.progress.tasks_completed,
        meds_total: healthData.progress.tasks_total,
        recent_activities: getRecentActivities(3).join('\n'),
        medications: appState.profile?.medications ? appState.profile.medications.join(', ') : 'No medications listed',
        conditions: appState.profile?.conditions || 'Not specified'
      }
    };
    
    // Send to Flask backend
    const response = await fetch(`${API_BASE_URL}/send-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // Success
      showNotification(
        `✅ ${type === 'family' ? 'Family' : 'Doctor'} Report Sent`,
        `Report delivered via WhatsApp.`,
        'success'
      );
      
      triggerConfetti();
      
      logEvent(`${type}_report_sent_twilio`, {
        report_type: type,
        recipient: recipientInfo?.name || 'default',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: `${type} report sent successfully via WhatsApp!`,
        details: result.data,
        delivery_channel: 'WhatsApp'
      };
      
    } else {
      // API error
      showNotification(
        '⚠️ Report Delivery Issue',
        result.message || 'Report generated but delivery failed.',
        'warning'
      );
      
      return {
        success: false,
        message: result.message || 'Failed to send report',
        details: result.data
      };
    }
    
  } catch (error) {
    console.error("Health Report Error:", error);
    
    showNotification(
      '⚠️ Report Generation Failed',
      error.message.includes('Failed to fetch')
        ? 'Cannot connect to server. Is it running on port 5002?'
        : error.message,
      'error'
    );
    
    return {
      success: false,
      message: `Error sending ${type} report: ${error.message}`,
      error: error.message
    };
  }
}

// ====================
// TWILIO TEST FUNCTION
// ====================

async function testTwilioConnection(testNumber = null) {
  try {
    if (!testNumber) {
      // Try to get test number from emergency contact
      testNumber = appState.emergencyContacts[0]?.phone;
      if (!testNumber) {
        testNumber = prompt("Enter a phone number to test Twilio:");
        if (!testNumber) return;
      }
    }
    
    showNotification('Testing Twilio', 'Sending test message...', 'info');
    
    const result = await sendAPIRequest('twilio/test', 'POST', {
      test_number: testNumber
    });
    
    if (result.success) {
      showNotification(
        '✅ Twilio Test Successful',
        `Test message sent to ${testNumber}`,
        'success'
      );
      
      return {
        success: true,
        message: "Twilio connection verified",
        details: result.data
      };
    } else {
      showNotification(
        '❌ Twilio Test Failed',
        result.data?.error || 'Check Twilio credentials',
        'error'
      );
      
      return {
        success: false,
        message: "Twilio test failed",
        details: result.data
      };
    }
    
  } catch (error) {
    console.error("Twilio Test Error:", error);
    
    showNotification(
      '❌ Twilio Test Error',
      error.message,
      'error'
    );
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ====================
// HELPER FUNCTIONS
// ====================

function getDefaultAppState() {
  return {
    profile: {
      name: 'Rohan Choure',
      dob: '1975-05-15',
      conditions: 'Hypertension, Type 2 Diabetes',
      emergencyContact: 'Avinash Hugar - (555) 123-4567',
      medications: ['Aspirin 75mg', 'Metformin 500mg', 'Lisinopril 10mg'],
      bloodType: 'O+'
    },
    vitals: { hr: 72, bp: '130/80', glucose: 105, spo2: 97 },
    gamification: { level: 5, xp: 150, streak: 3, badges: [] },
    tasks: []
  };
}

function showNotification(title, message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  // You can implement a proper notification UI here
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

async function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("Geolocation not supported");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const accuracy = position.coords.accuracy.toFixed(0);
        resolve(`${lat}, ${lng} (Accuracy: ${accuracy}m)`);
      },
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            resolve("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            resolve("Location unavailable");
            break;
          case error.TIMEOUT:
            resolve("Location request timeout");
            break;
          default:
            resolve("Location error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

function getCurrentVitals() {
  // Try to get from localStorage or use defaults
  const savedVitals = JSON.parse(localStorage.getItem('currentVitals') || '{}');
  
  return {
    hr: savedVitals.hr || appState.vitals.hr || 72,
    bp: savedVitals.bp || appState.vitals.bp || "130/80",
    glucose: savedVitals.glucose || appState.vitals.glucose || 105,
    spo2: savedVitals.spo2 || appState.vitals.spo2 || 97,
    temperature: savedVitals.temperature || 98.6,
    timestamp: new Date().toISOString()
  };
}

async function gatherHealthData() {
  const tasks = JSON.parse(localStorage.getItem('healthTasks') || '[]');
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  
  return {
    progress: {
      tasks_completed: completed,
      tasks_total: total,
      tasks_completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      daily_goal_achieved: completed >= 3
    }
  };
}

function calculateHealthScore() {
  const tasks = JSON.parse(localStorage.getItem('healthTasks') || '[]');
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  
  if (total === 0) return 85;
  
  const taskScore = (completed / total) * 100;
  
  // Factor in medication adherence
  const medTasks = tasks.filter(t => t.type === 'medication');
  const completedMeds = medTasks.filter(t => t.completed).length;
  const medScore = medTasks.length > 0 ? (completedMeds / medTasks.length) * 100 : 100;
  
  // Weighted average
  return Math.round((taskScore * 0.7) + (medScore * 0.3));
}

function calculateMedicationAdherence() {
  const tasks = JSON.parse(localStorage.getItem('healthTasks') || '[]');
  const medTasks = tasks.filter(t => t.type === 'medication');
  const completedMeds = medTasks.filter(t => t.completed).length;
  
  return medTasks.length > 0 
    ? Math.round((completedMeds / medTasks.length) * 100) 
    : 100;
}

function getRecentActivities(count = 3) {
  const tasks = JSON.parse(localStorage.getItem('healthTasks') || '[]');
  return tasks
    .filter(t => t.completed)
    .slice(0, count)
    .map(t => `${t.title} at ${t.time}`);
}

function getDefaultRecipient(type) {
  if (type === 'family') {
    return {
      name: "Avinash Hugar",
      phone: "(555) 123-4567",
      relationship: "Emergency Contact"
    };
  } else {
    return {
      name: "Dr. Sharma",
      phone: "(555) 987-6543",
      facility: "City General Hospital",
      specialty: "Cardiology"
    };
  }
}

function activateEmergencyFallback() {
  const message = `EMERGENCY: ${appState.profile.name} needs immediate assistance. ` +
                 `Conditions: ${appState.profile.conditions.join(', ')}. ` +
                 `Contact: ${appState.profile.emergencyContact}`;
  
  // Try to extract phone number
  const phoneMatch = appState.profile.emergencyContact.match(/(\d{3})[-\.\s]?(\d{3})[-\.\s]?(\d{4})/);
  const phone = phoneMatch ? phoneMatch[0] : null;
  
  // Open SMS app
  if (phone) {
    window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank');
  }
  
  // Try to open phone app
  if (phone) {
    window.open(`tel:${phone}`, '_blank');
  } else {
    window.open('tel:911', '_blank');
  }
  
  return {
    success: true,
    message: "Emergency fallback activated",
    actions: ["SMS app opened", "Phone app opened"],
    timestamp: new Date().toISOString()
  };
}

function saveReportLocally(type, recipient) {
  try {
    const reports = JSON.parse(localStorage.getItem('pendingReports') || '[]');
    
    reports.push({
      type: type,
      recipient: recipient,
      timestamp: new Date().toISOString(),
      data: {
        health_score: calculateHealthScore(),
        tasks_completed: getCompletedTasksCount(),
        medication_adherence: calculateMedicationAdherence()
      }
    });
    
    localStorage.setItem('pendingReports', JSON.stringify(reports));
    console.log('📝 Report saved locally for later sending');
    
  } catch (error) {
    console.error('Error saving report locally:', error);
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

function logEvent(eventName, data) {
  try {
    const events = JSON.parse(localStorage.getItem('appEvents') || '[]');
    events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('appEvents', JSON.stringify(events));
  } catch (error) {
    console.error("Event logging error:", error);
  }
}

// ====================
// API STATUS CHECK
// ====================

async function checkAPIStatus() {
  try {
    const result = await sendAPIRequest('status', 'GET');
    
    if (result.twilio?.enabled) {
      console.log('✅ API Server with Twilio is online:', result);
      
      // Show notification if first connection
      const firstConnection = !localStorage.getItem('apiFirstConnect');
      if (firstConnection) {
        showNotification(
          '✅ API Connected',
          `Twilio enabled: ${result.twilio.status}`,
          'success'
        );
        localStorage.setItem('apiFirstConnect', 'true');
      }
      
      return {
        online: true,
        twilio: result.twilio,
        version: result.version,
        stats: result.stats
      };
    } else {
      console.warn('⚠️ API Server online but Twilio not configured');
      showNotification(
        '⚠️ Twilio Not Configured',
        'SMS/WhatsApp features unavailable',
        'warning'
      );
      
      return {
        online: true,
        twilio: { enabled: false },
        version: result.version
      };
    }
    
  } catch (error) {
    console.error('❌ API Server is offline:', error);
    showNotification(
      '❌ API Server Offline',
      'Running in local mode. Start Python server on port 5002.',
      'error'
    );
    
    return {
      online: false,
      error: error.message
    };
  }
}

// ====================
// INITIALIZATION
// ====================

// Initialize when loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeAppState();
  
  // Check API status after a delay
  setTimeout(() => {
    checkAPIStatus().then(status => {
      console.log('API Status:', status);
      
      // Set up periodic status checks (every 5 minutes)
      setInterval(() => {
        checkAPIStatus();
      }, 5 * 60 * 1000);
    });
  }, 2000);
});

// Export functions
window.API = {
  sendSOSAlert,
  sendHealthReport,
  testTwilioConnection,
  checkAPIStatus,
  sendAPIRequest,
  showNotification,
  triggerConfetti
};
