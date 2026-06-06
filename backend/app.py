import os
import PyPDF2
import json
import requests
import csv
import jwt
import datetime
from functools import wraps
from io import StringIO
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import re

# MONGODB DRIVER
from pymongo import MongoClient
from bson import ObjectId

# ==========================================
# 1. CONFIGURATION & SETUP
# ==========================================
GROQ_API_KEY = "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"
SECRET_KEY = "super_secret_pro_key"

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


MONGO_URI = "mongodb+srv://aviralsachdeva9_db_user:TjLsGKg2AUM7GNRy@cluster0.ynmgjfo.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client['resume_ats_db']  # Database Name

def init_mongo_admin():
    # Seed an admin user if it doesn't exist
    if not db.recruiters.find_one({'email': 'admin@hr.com'}):
        db.recruiters.insert_one({
            'name': 'Aviral Sachdeva',
            'email': 'admin@hr.com',
            'password': generate_password_hash('admin123', method='pbkdf2:sha256')
        })

init_mongo_admin()

# ==========================================
# 3. AUTH MIDDLEWARE
# ==========================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith("Bearer "):
            return jsonify({'error': 'Unauthorized'}), 401
        try:
            token = token.split(" ")[1]
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except:
            return jsonify({'error': 'Invalid Token'}), 401
        return f(*args, **kwargs)
    return decorated

# ==========================================
# 4. HYBRID AI ENGINE
# ==========================================
def regex_extract_email(text):
    match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    return match.group(0) if match else "Not Found"

def regex_extract_phone(text):
    match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    return match.group(0) if match else "Not Found"

def get_smart_ai_score(resume_text, jd_text):
    prompt = f"""
    You are an expert HR ATS (Applicant Tracking System). Analyze this resume against the JD with strict accuracy.
    RULES:
    1. 'candidate_name': Extract EXACT human name. If not found, output "Name Not Found".
    2. Output ONLY JSON.
    
    {{
        "candidate_name": "Full Name", 
        "email": "Email", 
        "phone": "Phone", 
        "core_skills": ["Skill1", "Skill2"], 
        "education": "Degree", 
        "experience_years": "Years",
        "score": 85, 
        "ats_score": 90,
        "ats_findings": ["Point"], 
        "strengths": ["Strength"], 
        "weaknesses": ["Weakness"]
    }}
    
    JD: {jd_text[:1500]}
    Resume: {resume_text[:3500]}
    """
    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", 
            headers={'Authorization': f'Bearer {GROQ_API_KEY}', 'Content-Type': 'application/json'},
            json={"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": prompt}], "response_format": {"type": "json_object"}, "temperature": 0.0})
        return json.loads(response.json()['choices'][0]['message']['content'])
    except:
        return {}

# ==========================================
# 5. ROUTES
# ==========================================
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email, password = data.get('email'), data.get('password')
    
    user = db.recruiters.find_one({'email': email})
    
    if user and check_password_hash(user['password'], password):
        token = jwt.encode({'user': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)}, SECRET_KEY, algorithm="HS256")
        return jsonify({"token": token, "name": user['name']}), 200
            
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/upload', methods=['POST'])
@token_required
def upload_file():
    jd = request.form.get('jd', '')
    files = request.files.getlist('resumes')
    results = []
    
    if not jd or not files:
        return jsonify({"error": "Missing data"}), 400

    # 1. Insert Job
    job_result = db.jobs.insert_one({
        'job_title': 'Target Role',
        'required_skills': jd,
        'timestamp': datetime.datetime.utcnow()
    })
    job_id = str(job_result.inserted_id)
    
    processed_candidates = []
    
    for file in files:
        if file.filename.endswith('.pdf'):
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            
            with open(path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = "".join([p.extract_text() for p in reader.pages])
            
            ai = get_smart_ai_score(text, jd)
            
            c_email = ai.get('email', '') if ai.get('email', '') and ai.get('email', '').lower() != 'not found' else regex_extract_email(text)
            c_phone = ai.get('phone', '') if ai.get('phone', '') and ai.get('phone', '').lower() != 'not found' else regex_extract_phone(text)
            
            # 2. Insert Candidate
            cand_result = db.candidates.insert_one({
                'name': ai.get('candidate_name') or "Not Found",
                'email': c_email,
                'phone': c_phone,
                'education': ai.get('education') or "Not Found",
                'experience': ai.get('experience_years') or "Not Found",
                'skills': ai.get('core_skills') or ["Not Found"]
            })
            cand_id = str(cand_result.inserted_id)
            
            processed_candidates.append({
                "cand_id": cand_id, "job_id": job_id, "file": file.filename, "ai_data": ai,
                "clean_email": c_email, "clean_phone": c_phone, "score": ai.get('score', 0)
            })

    # Sort and rank
    processed_candidates = sorted(processed_candidates, key=lambda x: x['score'], reverse=True)
    
    for index, cand in enumerate(processed_candidates):
        ai = cand['ai_data']
        
        # 3. Insert Result
        db.screening_results.insert_one({
            'candidate_id': cand['cand_id'],
            'job_id': cand['job_id'],
            'match_score': cand['score'],
            'ranking': index + 1,
            'ats_score': ai.get('ats_score', 0),
            'ats_findings': ai.get('ats_findings', []),
            'strengths': ai.get('strengths', []),
            'weaknesses': ai.get('weaknesses', []),
            'filename': cand['file'],
            'timestamp': datetime.datetime.utcnow()
        })
        
        ai["filename"] = cand['file']
        ai["candidate_name"] = ai.get('candidate_name') or "Not Found"
        ai["email"] = cand['clean_email']
        ai["phone"] = cand['clean_phone']
        results.append(ai)
            
    return jsonify({"results": results}), 200

@app.route('/export', methods=['GET'])
@token_required
def export_csv():
    # Fetch all screening results, sorted by ranking
    results_docs = list(db.screening_results.find().sort('ranking', 1))
    
    formatted_data = []
    
    # Fetch Admin details once
    admin_data = db.recruiters.find_one({'email': 'admin@hr.com'}) or {'name': 'Not Found', 'email': 'Not Found', 'password': 'Not Found', '_id': 'Not Found'}
    
    for res in results_docs:
        # Get Candidate Data
        cand = db.candidates.find_one({'_id': ObjectId(res['candidate_id'])}) or {}
        
        # Get Job Data
        job = db.jobs.find_one({'_id': ObjectId(res['job_id'])}) or {}
        
        # Formatting Array for CSV
        skills_str = ", ".join(cand.get('skills', [])) if isinstance(cand.get('skills'), list) else cand.get('skills', 'Not Found')
        
        row_list = [
            str(admin_data.get('_id', 'Not Found')), admin_data.get('name'), admin_data.get('email'), admin_data.get('password'),
            res['candidate_id'], cand.get('name', 'Not Found'), cand.get('email', 'Not Found'), f"\t{cand.get('phone', 'Not Found')}", cand.get('education', 'Not Found'), cand.get('experience', 'Not Found'), skills_str,
            res['job_id'], job.get('job_title', 'Not Found'), job.get('required_skills', 'Not Found'), "As per JD",
            str(res['_id']), res['candidate_id'], res['job_id'], res.get('match_score'), res.get('ranking'), res.get('ats_score')
        ]
        
        formatted_data.append(row_list)
    
    si = StringIO()
    cw = csv.writer(si)
    
    cw.writerow([
        'recruiter_id', 'recruiter_name', 'recruiter_email', 'recruiter_password',
        'candidate_id', 'candidate_name', 'candidate_email', 'candidate_phone', 'education', 'experience', 'skills',
        'job_id', 'job_title', 'required_skills', 'experience_required',
        'result_id', 'result_candidate_id', 'result_job_id', 'match_score', 'ranking', 'ats_score'
    ])
    cw.writerows(formatted_data)
    
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=Mongo_Database_Dump.csv"
    output.headers["Content-type"] = "text/csv"
    return output

if __name__ == '__main__':
    app.run(debug=True, port=5000)