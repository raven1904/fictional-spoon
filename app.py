from flask import Flask, request, jsonify
from flask_cors import CORS
from twilio.rest import Client
from datetime import datetime   
from flask import send_from_directory

app = Flask(__name__)
CORS(app)

# Twilio credentials (PUT YOUR REAL VALUES)
ACCOUNT_SID = "AC07962c2a7f0475dd65578f09deab36b4"
AUTH_TOKEN = "d52d557a5f93c9cdf2daefa76b2fb29d"
WHATSAPP_FROM = "whatsapp:+14155238886"  # Twilio sandbox number

# Contact numbers - MAKE SURE NO TRAILING SPACES
FAMILY_NUMBERS = [
    "+919325298788",  # Family member 1
       # Family member 2
]

DOCTOR_NUMBERS = [
    "+919325298788"  # Doctor's number
]

# Emergency contacts (for SOS)
EMERGENCY_NUMBERS = [
    "+919325298788",  # Primary emergency contact
     # Secondary emergency contact - NO SPACE!
]

client = Client(ACCOUNT_SID, AUTH_TOKEN)

def send_whatsapp_message(numbers, message):
    """Send WhatsApp message to multiple numbers"""
    sent_to = []
    for num in numbers:
        if num and len(num) > 5:  # Basic validation
            try:
                message_obj = client.messages.create(
                    body=message,
                    from_=WHATSAPP_FROM,
                    to=f"whatsapp:{num}"
                )
                sent_to.append(num)
                print(f"✅ Message sent to {num}, SID: {message_obj.sid}")
            except Exception as e:
                print(f"❌ Failed to send to {num}: {e}")
    return sent_to

@app.route("/send-sos", methods=["POST"])
def send_sos():
    """Send emergency SOS alert"""
    data = request.json
    print("🚨 Received SOS request:", data)
    
    patient_name = data.get("patient_name", "Patient")
    location = data.get("location", "Location not provided")
    vitals = data.get("vitals", {})
    
    sos_message = f"""
🚨 *EMERGENCY SOS ALERT* 🚨

*Patient:* {patient_name}
*Time:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
*Location:* {location}

*Current Vitals:*
• Heart Rate: {vitals.get('hr', 'N/A')} BPM
• Blood Pressure: {vitals.get('bp', 'N/A')} mmHg
• Blood Glucose: {vitals.get('bg', 'N/A')} mg/dL
• Oxygen Saturation: {vitals.get('spo2', 'N/A')}%

*Emergency Message:*
Patient has triggered an SOS alert. Immediate assistance may be required.

*This is an automated alert from COMPASS Health Monitoring System.*
"""
    
    # Send to all emergency contacts
    sent_to = send_whatsapp_message(EMERGENCY_NUMBERS, sos_message)
    
    success = len(sent_to) > 0
    return jsonify({
        "success": success, 
        "sent_to": sent_to,
        "message": "SOS alert sent to emergency contacts"
    })

@app.route("/send-report", methods=["POST"])
def send_report():
    """Send health report to family/doctor"""
    data = request.json
    print("📋 Received report request:", data)
    
    report_type = data.get("type", "family")  # 'family' or 'doctor'
    patient_name = data.get("patient_name", "Patient")
    report_data = data.get("report", {})
    
    if report_type == "doctor":
        # Doctor report format
        message = f"""
🏥 *MEDICAL REPORT FOR DOCTOR REVIEW*

*Patient:* {patient_name}
*Date:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

*Vital Signs:*
• Heart Rate: {report_data.get('hr', 'N/A')} BPM
• Blood Pressure: {report_data.get('bp', 'N/A')} mmHg
• Blood Glucose: {report_data.get('bg', 'N/A')} mg/dL
• SpO2: {report_data.get('spo2', 'N/A')}%

*Health Metrics:*
• Compliance Score: {report_data.get('score', 0)}%
• Current Streak: {report_data.get('streak', 0)} days
• Health Level: {report_data.get('level', 1)}
• Tasks Completed: {report_data.get('tasks_completed', 0)}/{report_data.get('tasks_total', 0)}
• Medications Taken: {report_data.get('meds_taken', 0)}/{report_data.get('meds_total', 0)}

*Recent Activities:*
{report_data.get('recent_activities', 'No activities recorded')}

*Medications:*
{report_data.get('medications', 'No medications listed')}

*Health Conditions:*
{report_data.get('conditions', 'Not specified')}

*Note: This is an automated report from COMPASS Health Monitoring System.*
"""
        numbers = DOCTOR_NUMBERS
    else:
        # Family report format
        feeling = "Great! 😊" if report_data.get('score', 0) > 80 else "Good 🙂" if report_data.get('score', 0) > 60 else "Needs attention 😐"
        
        message = f"""
👨‍👩‍👧‍👦 *FAMILY HEALTH UPDATE*

*Family Member:* {patient_name}
*Date:* {datetime.now().strftime('%Y-%m-%d')}
*Time:* {datetime.now().strftime('%H:%M')}

*Quick Status:*
• Feeling: {feeling}
• Daily Health Score: {report_data.get('score', 0)}%
• Medications Taken Today: {report_data.get('meds_taken', 0)}/{report_data.get('meds_total', 0)}
• Current Streak: {report_data.get('streak', 0)} days in a row! 🔥

*Today's Progress:*
{report_data.get('recent_activities', 'No activities today')}

*Vitals Summary:*
• Heart Rate: {report_data.get('hr', 'N/A')} BPM
• Blood Pressure: {report_data.get('bp', 'N/A')} mmHg
• Blood Sugar: {report_data.get('bg', 'N/A')} mg/dL

💝 *This update was automatically sent from COMPASS to keep you informed about my health journey.*
"""
        numbers = FAMILY_NUMBERS
    
    sent_to = send_whatsapp_message(numbers, message)
    
    success = len(sent_to) > 0
    return jsonify({
        "success": success, 
        "sent_to": sent_to,
        "message": f"{report_type.capitalize()} report sent successfully"
    })

@app.route("/send-alert", methods=["POST"])
def send_alert():
    """Legacy endpoint for backward compatibility"""
    data = request.json
    print("📨 Received alert request:", data)
    
    message_text = data.get("message", "🚨 Emergency alert!")
    patient_name = data.get("patient_name", "Patient")
    
    enhanced_message = f"""
{message_text}

Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    sent_to = send_whatsapp_message(FAMILY_NUMBERS + DOCTOR_NUMBERS, enhanced_message)
    
    success = len(sent_to) > 0
    return jsonify({"success": success, "sent_to": sent_to})

@app.route("/")
def home():
    return "COMPASS Alert Server Running Successfully!"

@app.route("/app")
def send_app():
    return send_from_directory(".", "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)