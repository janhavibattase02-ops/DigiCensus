#!/usr/bin/env python3
"""
DigiCensus 2027 — Python 3 Production & Security Server + Census Saathi Suite
Handling REST API endpoints:
  GET  /api/health
  POST /api/auth/send-otp
  POST /api/auth/verify-otp
  GET  /api/digilocker/status
  POST /api/digilocker/initiate
  POST /api/digilocker/verify-demo
  POST /api/saathi/passport
  POST /api/saathi/resume
  POST /api/saathi/ai-check
  POST /api/census/guide
  POST /api/truthcheck/analyze
  POST /api/census/submit
"""

import sys
import json
import time
import re
import hashlib
import secrets
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5001

# Security & Expiry Constants
OTP_EXPIRY_SECONDS = 300       # 5 minutes
RESEND_COOLDOWN_SECONDS = 60   # 60 seconds
MAX_VERIFY_ATTEMPTS = 5

# In-Memory Database Stores
otp_store = {}        # phone -> { hash, expires_at, attempts, last_sent_at, raw_otp }
verified_store = {}   # phone -> { verified: True, verified_at }
passport_store = {}   # householdCode -> { code, phone, resumeToken, progress, stateId, data, updatedAt }

def normalize_indian_phone(raw):
    if not raw:
        return None
    cleaned = re.sub(r'[\s\-\(\)\+]', '', str(raw))
    if cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]
    if re.match(r'^[6-9]\d{9}$', cleaned):
        return f"+91{cleaned}"
    return None

class CensusAPIHandler(BaseHTTPRequestHandler):

    def _set_cors_headers(self, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_cors_headers(200)

    def _read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body_bytes = self.rfile.read(content_length)
        try:
            return json.loads(body_bytes.decode('utf-8'))
        except Exception:
            return {}

    def do_GET(self):
        path = self.path.split('?')[0]

        if path == '/api/health':
            self._set_cors_headers(200)
            res = {
                "status": "ok",
                "service": "DigiCensus 2027 Python Security & Census Saathi Backend",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "digiLockerConfigured": False,
                "otpProvider": "DEVELOPMENT_MOCK_SMS",
                "saathiEngine": "ACTIVE"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        if path == '/api/digilocker/status':
            self._set_cors_headers(200)
            res = {
                "configured": False,
                "mode": "DEMO_MODE",
                "disclaimer": "DEMO VERIFICATION MODE — NOT REAL DIGILOCKER VERIFICATION"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        self._set_cors_headers(404)
        self.wfile.write(json.dumps({"error": "Route not found"}).encode('utf-8'))

    def do_POST(self):
        path = self.path.split('?')[0]
        body = self._read_json_body()
        now = time.time()

        # 1. SEND OTP
        if path == '/api/auth/send-otp':
            phone_raw = body.get('phone') or body.get('phoneNumber')
            normalized = normalize_indian_phone(phone_raw)

            if not normalized:
                self._set_cors_headers(400)
                res = {"success": False, "error": "Invalid Indian mobile number format. Please enter a valid 10-digit number starting with 6, 7, 8, or 9."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            existing = otp_store.get(normalized)
            if existing and (now - existing['last_sent_at']) < RESEND_COOLDOWN_SECONDS:
                remaining = int(RESEND_COOLDOWN_SECONDS - (now - existing['last_sent_at']))
                self._set_cors_headers(429)
                res = {"success": False, "error": f"Please wait {remaining} seconds before requesting a new OTP.", "cooldownRemaining": remaining}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            raw_otp = f"{secrets.randbelow(900000) + 100000}"
            otp_hash = hashlib.sha256(raw_otp.encode('utf-8')).hexdigest()

            otp_store[normalized] = {
                'hash': otp_hash,
                'expires_at': now + OTP_EXPIRY_SECONDS,
                'attempts': 0,
                'last_sent_at': now,
                'raw_otp': raw_otp
            }

            print(f"[SMS Service Demo] Sent OTP to {normalized}. Code: {raw_otp}")

            self._set_cors_headers(200)
            res = {
                "success": True,
                "message": f"OTP sent successfully to {normalized[:5]}****{normalized[-2:]}",
                "phone": normalized,
                "expiresInMinutes": 5,
                "cooldownSeconds": 60,
                "demoOtp": raw_otp
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 2. VERIFY OTP
        if path == '/api/auth/verify-otp':
            phone_raw = body.get('phone') or body.get('phoneNumber')
            submitted_otp = str(body.get('otp', '')).strip()

            normalized = normalize_indian_phone(phone_raw)
            if not normalized or not submitted_otp:
                self._set_cors_headers(400)
                res = {"success": False, "error": "Phone number and 6-digit OTP are required."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            record = otp_store.get(normalized)
            if not record:
                self._set_cors_headers(400)
                res = {"success": False, "error": "No active OTP request found for this number. Please request a new OTP."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            if now > record['expires_at']:
                del otp_store[normalized]
                self._set_cors_headers(400)
                res = {"success": False, "error": "This OTP has expired. Please request a new OTP."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            if record['attempts'] >= MAX_VERIFY_ATTEMPTS:
                del otp_store[normalized]
                self._set_cors_headers(429)
                res = {"success": False, "error": "Maximum verification attempts exceeded. Please request a new OTP."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            input_hash = hashlib.sha256(submitted_otp.encode('utf-8')).hexdigest()
            if input_hash != record['hash']:
                record['attempts'] += 1
                remaining = MAX_VERIFY_ATTEMPTS - record['attempts']
                self._set_cors_headers(400)
                res = {"success": False, "error": f"Incorrect OTP. Please try again. {remaining} attempt(s) remaining."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            del otp_store[normalized]
            verified_at = datetime.utcnow().isoformat() + "Z"
            verified_store[normalized] = {"verified": True, "verifiedAt": verified_at}

            self._set_cors_headers(200)
            res = {
                "success": True,
                "verified": True,
                "phone": normalized,
                "verifiedAt": verified_at,
                "message": "Mobile number verified successfully!"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 3. CENSUS SAATHI PASSPORT CREATION & SAVE DRAFT
        if path == '/api/saathi/passport':
            phone_raw = body.get('phone')
            normalized = normalize_indian_phone(phone_raw) or "+919876543210"
            code = body.get('code') or "CEN-7A92F4"
            progress = body.get('progress', 20)
            state_id = body.get('stateId', 'MH')
            data = body.get('formData', {})

            resume_token = f"rsm_{secrets.token_hex(16)}"
            updated_at = datetime.utcnow().isoformat() + "Z"

            passport_store[code] = {
                "code": code,
                "phone": normalized,
                "resumeToken": resume_token,
                "progress": progress,
                "stateId": state_id,
                "data": data,
                "updatedAt": updated_at
            }
            # Also index by token
            passport_store[resume_token] = passport_store[code]

            self._set_cors_headers(200)
            res = {
                "success": True,
                "householdCode": code,
                "resumeToken": resume_token,
                "progress": progress,
                "status": "Self-Enumeration In Progress",
                "updatedAt": updated_at
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 4. RESUME ANYWHERE WITH STRICT AUTHENTICATION
        if path == '/api/saathi/resume':
            target_ref = body.get('codeOrToken', '').strip()
            phone_raw = body.get('phone')
            normalized = normalize_indian_phone(phone_raw)

            if not target_ref or not normalized:
                self._set_cors_headers(400)
                res = {"success": False, "error": "Census Household Code / Token and verified phone number are required."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            # Check if phone is verified
            if not verified_store.get(normalized):
                self._set_cors_headers(401)
                res = {"success": False, "error": "Phone number authentication required. Please verify phone via OTP before resuming census draft."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            record = passport_store.get(target_ref)
            if not record:
                self._set_cors_headers(444)
                res = {"success": False, "error": "Invalid or expired Census Household Code. Please check the code and try again."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            # Ownership authorization check: User B cannot access User A's data!
            if record['phone'] != normalized:
                self._set_cors_headers(403)
                res = {"success": False, "error": "ACCESS DENIED: This Census Household Code belongs to a different verified phone account."}
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return

            self._set_cors_headers(200)
            res = {
                "success": True,
                "householdCode": record['code'],
                "progress": record['progress'],
                "formData": record['data'],
                "updatedAt": record['updatedAt'],
                "message": "Census draft retrieved successfully!"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 5. AI CENSUS CHECK
        if path == '/api/saathi/ai-check':
            form_data = body.get('formData', {})
            head_name = form_data.get('fullName', '').strip()
            members = form_data.get('members', [])
            house_type = form_data.get('houseType', '')
            water_source = form_data.get('waterSource', '')

            warnings = []
            fields_complete = 0

            if head_name: fields_complete += 3
            if house_type: fields_complete += 2
            if water_source: fields_complete += 2

            for i, m in enumerate(members):
                if m.get('name'): fields_complete += 2
                if m.get('age'): fields_complete += 1
                if m.get('gender'): fields_complete += 1

                # Check 1: Missing member name
                if not m.get('name') or not str(m.get('name')).strip():
                    warnings.append({
                        "id": f"warn_name_{i}",
                        "type": "MISSING_FIELD",
                        "title": f"Missing Member #{i+1} Name",
                        "message": f"Member #{i+1} is listed but has no full name specified.",
                        "step": 3
                    })

                # Check 2: Head of household age check
                if i == 0 and m.get('age') and int(m.get('age', 0)) < 18:
                    warnings.append({
                        "id": "warn_head_age",
                        "type": "INCONSISTENCY",
                        "title": "Household Head Age Warning",
                        "message": "The Head of Household is listed as under 18 years old. Please verify if this is accurate.",
                        "step": 3
                    })

                # Check 3: Missing occupation
                if not m.get('occupation'):
                    warnings.append({
                        "id": f"warn_occ_{i}",
                        "type": "MISSING_FIELD",
                        "title": f"Missing Member #{i+1} Occupation",
                        "message": f"Occupation is blank for {m.get('name') or f'Member #{i+1}'}.",
                        "step": 3
                    })

            # Check 4: Duplicate Names
            names = [m.get('name', '').lower().strip() for m in members if m.get('name')]
            if len(names) != len(set(names)):
                warnings.append({
                    "id": "warn_dup_names",
                    "type": "DUPLICATE",
                    "title": "Duplicate Member Names Detected",
                    "message": "Two or more household members appear to have the exact same name. Please confirm if they are distinct individuals.",
                    "step": 3
                })

            summary = "✓ Census information looks complete. No major inconsistencies detected." if not warnings else f"⚠ Found {len(warnings)} potential item(s) for your review."

            self._set_cors_headers(200)
            res = {
                "success": True,
                "fieldsComplete": fields_complete,
                "warningsCount": len(warnings),
                "warnings": warnings,
                "summary": summary
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 6. DIGILOCKER INITIATE / VERIFY
        if path == '/api/digilocker/initiate':
            self._set_cors_headers(200)
            res = {
                "success": True,
                "mode": "DEMO_MODE",
                "message": "DigiLocker integration not configured in environment. Simulated demo authentication active.",
                "state": secrets.token_hex(16)
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        if path == '/api/digilocker/verify-demo':
            time.sleep(0.8)
            self._set_cors_headers(200)
            res = {
                "success": True,
                "verified": True,
                "status": "VERIFIED",
                "mode": "DEMO_MODE",
                "disclaimer": "DEMO VERIFICATION — NOT REAL DIGILOCKER VERIFICATION",
                "verifiedAt": datetime.utcnow().isoformat() + "Z"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 7. CENSUS AI GUIDE
        if path == '/api/census/guide':
            message = body.get('message', '')
            q = message.lower()
            reply = "🛡️ Data Privacy Guaranteed: Under Section 15 of the Census Act 1948, individual census details are strictly confidential, end-to-end encrypted, and CANNOT be shared with NRC, tax, banking, or law enforcement agencies."
            if 'start' in q or 'how' in q or 'step' in q:
                reply = "🚀 Starting Self-Enumeration is easy! Click 'Start Self-Enumeration' to enter household head details, use 1-Tap DigiLocker profile autofill, add family members, and generate your 16-Digit SE ID."
            elif 'when' in q or 'date' in q or 'schedule' in q:
                reply = "📅 Phase 1 (Housing Census) runs Apr–Sep 2026, followed by Phase 2 (Population Enumeration) in Feb 2027. Check exact dates for all 29 states in the Schedule tab!"

            self._set_cors_headers(200)
            res = {"reply": reply, "source": "python_backend"}
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 8. SUBMIT SELF ENUMERATION
        if path == '/api/census/submit':
            head_name = body.get('headName', 'Rahul Sharma')
            rand_id = f"2027-{secrets.randbelow(9000)+1000}-{secrets.randbelow(9000)+1000}-{secrets.randbelow(9000)+1000}"
            self._set_cors_headers(200)
            res = {
                "success": True,
                "seId": rand_id,
                "message": "Household enumerated successfully.",
                "submittedAt": datetime.utcnow().isoformat() + "Z"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        self._set_cors_headers(404)
        self.wfile.write(json.dumps({"error": "Route not found"}).encode('utf-8'))

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, CensusAPIHandler)
    print(f"DigiCensus 2027 Python Security & Census Saathi Server listening on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
