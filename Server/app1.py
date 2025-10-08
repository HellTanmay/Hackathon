from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import uuid
from werkzeug.utils import secure_filename

from deepface import DeepFace
from textblob import TextBlob
import random
import language_tool_python
import mediapipe as mp
import logging
import os
from bson import ObjectId

from pymongo import MongoClient
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv  # Optional: pip install python-dotenv

# Load .env if present (optional)
load_dotenv()

# --- Initialize Flask App and Tools ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})  # For React frontend


UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Allowed file extensions and MIME types for security
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

# --- MongoDB Connection ---
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "CareerReadiness"
COLLECTION_NAME = "resumes"


client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]
score=db["scores"]

def allowed_file(filename):
    """Checks if the file's extension is in the ALLOWED_EXTENSIONS set."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    """
    Handles the resume file upload.
    Saves the file to the server's filesystem and its metadata to MongoDB.
    """
    try:
        # 1. --- Validate the incoming request ---
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # 2. --- Validate the file type and content type ---
        if not allowed_file(file.filename) or file.content_type not in ALLOWED_MIME_TYPES:
            return jsonify({'error': 'Invalid file type. Only PDF, DOC, and DOCX are allowed.'}), 400
        
        # 3. --- Save the file to the server ---
        original_filename = secure_filename(file.filename)
        # Create a unique filename to prevent overwrites and security issues
        extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        
        file.save(file_path)
        
     
        resume_metadata = {
            'filename': unique_filename,
            'original_name': original_filename,
            'file_path': file_path,
            'content_type': file.content_type,
            'upload_date': datetime.now(),
            'user_id': request.form.get('user_id', 'anonymous')
        }
        
        # Insert the metadata document into the collection
        result = collection.insert_one(resume_metadata)
        
        # Return success with the ID of the new database record
        return jsonify({
            'success': True, 
            'message': 'File uploaded successfully.',
            'resume_id': str(result.inserted_id)
        }), 201

    except Exception as e:
        # Log the error for debugging
        print(f"An error occurred: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500


# Logging setup (suppress noisy logs)
logging.getLogger('werkzeug').setLevel(logging.ERROR)
logger = app.logger
logger.setLevel(logging.INFO)

# --- Configure Google API Key ---
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', "AIzaSyDG8HUqcnG3vx9IYbD0usYWEtfRq-ZKE74")  # Fallback to your key; use env for security
model = None
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('models/gemini-pro-latest')
    logger.info("Google Gemini model initialized successfully.")
except Exception as e:
    logger.error(f"ERROR: Could not initialize Google Gemini. Relevance check will fail. Error: {e}")
    model = None

# Initialize LanguageTool
try:
    logger.info("Initializing LanguageTool... This may take a moment.")
    tool = language_tool_python.LanguageTool('en-US')
    tool.disabled_rules = {'UPPERCASE_SENTENCE_START', 'SENTENCE_FRAGMENT', 'I_LOWERCASE', 'COMMA_PARENTHESIS_WHITESPACE'}
    logger.info("LanguageTool initialized and configured for spoken language.")
except Exception as e:
    logger.error(f"Failed to initialize LanguageTool: {e}")
    tool = None

# Constants
FILLER_WORDS = {'um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'i mean'}
mp_face_mesh = mp.solutions.face_mesh
latest_data = {"emotion": "...", "tone": "...", "eye_contact": "...", "confidence_score": 0}

INTERVIEW_QUESTIONS = [
    "Tell me about yourself.", 
    "What are your biggest strengths?", 
    "What is your biggest weakness?", 
    "Where do you see yourself in five years?", 
    "Why do you want to work for this company?"
]


# --- Helper Functions ---
def analyze_eye_contact(frame):
    try:
        # --- STABILITY FIX: Create a new FaceMesh instance for each analysis ---
        with mp_face_mesh.FaceMesh(
            static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5
        ) as face_mesh:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0].landmark
                pupil, eye_top, eye_bottom = face_landmarks[473], face_landmarks[159], face_landmarks[145]
                eye_left, eye_right = face_landmarks[33], face_landmarks[133]
                v_ratio = (pupil.y - eye_bottom.y) / (eye_top.y - eye_bottom.y) if (eye_top.y - eye_bottom.y) > 0 else 0.5
                h_ratio = (pupil.x - eye_left.x) / (eye_right.x - eye_left.x) if (eye_right.x - eye_left.x) > 0 else 0.5
                return "Good" if (0.25 < v_ratio < 0.75) and (0.25 < h_ratio < 0.75) else "Look at Camera"
            return "No Face Detected"
    except Exception: return "Error Analyzing"

# --- API Routes (JSON Only) ---
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

@app.route('/get_question', methods=['GET'])
def get_question():
    """Fetch a random interview question."""
    try:
        question = random.choice(INTERVIEW_QUESTIONS)
        return jsonify({'question': question})
    except Exception as e:
        logger.error(f"Error in get_question: {e}")
        return jsonify({'error': 'Failed to fetch question'}), 500
n=0
count=0

    
@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    try:
        data = request.get_json()
        image_data = data['image'].split(',')[1]
        frame = cv2.imdecode(np.frombuffer(base64.b64decode(image_data), np.uint8), cv2.IMREAD_COLOR)
        
        # We run both analyses to ensure one crashing doesn't stop the other
        try:
            emotion_result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False, detector_backend='opencv')
            emotion = emotion_result[0]['dominant_emotion'] if emotion_result else 'neutral'
        except Exception:
            emotion = '...'

        eye_contact = analyze_eye_contact(frame)
   
        return jsonify({'emotion': emotion, 'eye_contact': eye_contact})
    except Exception: return jsonify({'emotion': '...', 'eye_contact':'...'})

@app.route('/analyze_text', methods=['POST'])
def analyze_text():
    """Analyze text for tone, polarity, grammar, and filler words."""
    try:
        data = request.get_json()
        text = data.get('text', '') if data else ''
        if not text:
            return jsonify({'tone': '...', 'polarity': 0, 'grammar_feedback': [], 'filler_count': 0}), 400

        # Tone analysis
        blob = TextBlob(text)
        tone = "Neutral"
        if blob.sentiment.polarity > 0.1:
            tone = "Positive"
        elif blob.sentiment.polarity < -0.1:
            tone = "Negative"

        # Grammar analysis
        grammar_feedback = []
        if tool:
            matches = tool.check(text)
            grammar_feedback = [{"message": m.message, "replacements": m.replacements[:3]} for m in matches]

        # Filler words count
        filler_count = sum(1 for word in text.lower().split() if word in FILLER_WORDS)
      
            
        return jsonify({
            'tone': tone,
            'polarity': round(blob.sentiment.polarity, 2),
            'grammar_feedback': grammar_feedback,
            'filler_count': filler_count
        })
    except Exception as e:
        logger.error(f"Error in analyze_text: {e}")
        return jsonify({'tone': 'Error', 'polarity': 0, 'grammar_feedback': [], 'filler_count': 0}), 500

@app.route('/check_relevance', methods=['POST'])
def check_relevance():
    """Check if answer is relevant to the question using Gemini."""
    if not model:
        return jsonify({'relevance': 'API Key Error or Unavailable'}), 503

    try:
        data = request.get_json()
        question = data.get('question', '') if data else ''
        answer = data.get('answer', '') if data else ''
        if not question or not answer:
            return jsonify({'relevance': 'Missing question or answer'}), 400

        prompt = f"""Is the answer relevant to the question? Question: "{question}" Answer: "{answer}". Respond with only a score within 100%."""
        response = model.generate_content(prompt)
        relevance = response.text.strip()
     
        return jsonify({'relevance': relevance})
    except Exception as e:
        logger.error(f"Relevance check error: {e}")
        return jsonify({'relevance': 'API Error'}), 500

@app.route('/api/student-analytics', methods=['GET'])
def get_student_analytics():
         try:
             # Mock data; in reality, query MongoDB by user_id (e.g., from session/auth)
             user_id = request.args.get('user_id', 'anonymous')
             scores = {
                 'communication': random.randint(70, 100),
                 'technical': random.randint(60, 95),
                 'problem_solving': random.randint(65, 90)
             }
             overall_score = sum(scores.values()) / len(scores)
             recommendations = [
                 "Practice more coding challenges for technical skills." if scores['technical'] < 80 else "Excellent technical foundation!",
                 "Work on logical puzzles for better problem-solving."
             ]
             return jsonify({
                 'success': True,
                 'overall_score': round(overall_score),
                 'scores': scores,
                 'recommendations': recommendations
             }), 200
         except Exception as e:
             return jsonify({'error': str(e)}), 500
         

# --- NEW: INTERNAL APTITUDE QUESTION BANK ---
# This list contains all possible questions for the quiz.
# I have added 20 questions to start. You can easily add more to reach 100.
# Each question is a dictionary with "question", the correct "answer", and three "incorrect" options.

APTITUDE_QUESTION_BANK = [
    # --- Instructions to Add More ---
    # To add a new question, simply copy one of the blocks below, paste it at the end of the list,
    # and change the "question", "answer", and "incorrect" values.
    # Make sure to add a comma after the closing brace } of each question block.
    
    # --- Category: Percentages ---
    {
        "question": "What is 35% of 200?",
        "answer": "70",
        "incorrect": ["60", "75", "80"]
    },
    {
        "question": "A student scored 45 out of 50 in a test. What is the score as a percentage?",
        "answer": "90%",
        "incorrect": ["85%", "95%", "80%"]
    },
    {
        "question": "An item priced at $150 is sold with a 20% discount. What is the selling price?",
        "answer": "$120",
        "incorrect": ["$130", "$125", "$110"]
    },
    # --- Category: Simple Algebra ---
    {
        "question": "If 4x - 7 = 13, what is the value of x?",
        "answer": "5",
        "incorrect": ["4", "6", "3"]
    },
    {
        "question": "Find the value of y if 3(y + 2) = 21.",
        "answer": "5",
        "incorrect": ["6", "7", "4"]
    },
    # --- Category: Ratios ---
    {
        "question": "A mixture contains milk and water in the ratio 5:2. If there are 10 liters of water, how much milk is there?",
        "answer": "25 liters",
        "incorrect": ["20 liters", "30 liters", "15 liters"]
    },
    {
        "question": "Two numbers are in the ratio 3:4. If their sum is 49, what is the smaller number?",
        "answer": "21",
        "incorrect": ["28", "14", "24"]
    },
    # --- Category: Speed, Distance, Time ---
    {
        "question": "A train travels at a speed of 90 km/h. How long will it take to cover a distance of 270 km?",
        "answer": "3 hours",
        "incorrect": ["2.5 hours", "3.5 hours", "4 hours"]
    },
    {
        "question": "A cyclist covers 45 km in 3 hours. What is their average speed in km/h?",
        "answer": "15 km/h",
        "incorrect": ["10 km/h", "20 km/h", "12 km/h"]
    },
    # --- Category: Profit & Loss ---
    {
        "question": "An article is bought for $80 and sold for $96. What is the profit percentage?",
        "answer": "20%",
        "incorrect": ["16%", "25%", "15%"]
    },
    {
        "question": "A shopkeeper sells an item for $120 at a loss of 25%. What was the cost price?",
        "answer": "$160",
        "incorrect": ["$150", "$90", "$140"]
    },
    # --- Category: Number Series ---
    {
        "question": "What is the next number in the series: 3, 6, 12, 24, ...?",
        "answer": "48",
        "incorrect": ["36", "42", "30"]
    },
    {
        "question": "Find the missing number in the series: 5, 10, 15, __, 25, 30.",
        "answer": "20",
        "incorrect": ["18", "22", "16"]
    },
    # --- Category: Averages ---
    {
        "question": "The scores of a student in 3 subjects are 70, 80, and 90. What is the average score?",
        "answer": "80",
        "incorrect": ["75", "85", "82"]
    },
    {
        "question": "The average of five numbers is 30. If four of the numbers are 20, 25, 35, and 40, what is the fifth number?",
        "answer": "30",
        "incorrect": ["28", "32", "25"]
    },
    # --- More questions to help you reach 100 ---
    {
        "question": "If 15 oranges cost $3, how many oranges can you buy for $5?",
        "answer": "25",
        "incorrect": ["20", "30", "18"]
    },
    {
        "question": "What is the area of a square with a side length of 9 cm?",
        "answer": "81 sq cm",
        "incorrect": ["36 sq cm", "18 sq cm", "72 sq cm"]
    },
    {
        "question": "A project can be completed by 10 men in 20 days. How many days will it take for 5 men to complete the same project?",
        "answer": "40 days",
        "incorrect": ["10 days", "30 days", "25 days"]
    },
    {
        "question": "What is 7 multiplied by 13?",
        "answer": "91",
        "incorrect": ["81", "98", "101"]
    },
    {
        "question": "The sum of two numbers is 100 and their difference is 20. What is the larger number?",
        "answer": "60",
        "incorrect": ["40", "55", "65"]
    },
    {
        "question": "If A can do a piece of work in 10 days and B can do it in 15 days, how many days will they take to do it together?",
        "answer": "6 days",
        "incorrect": ["5 days", "12 days", "25 days"]
    },
    {
        "question": "A pipe can fill a tank in 3 hours, and another pipe can fill it in 6 hours. How long will it take to fill the tank if both pipes are opened together?",
        "answer": "2 hours",
        "incorrect": ["3 hours", "4.5 hours", "9 hours"]
    },
    {
        "question": "A and B together can complete a job in 4 days. If A alone can do it in 6 days, in how many days can B alone complete the job?",
        "answer": "12 days",
        "incorrect": ["8 days", "10 days", "2 days"]
    },
    # --- Category: Simple Interest ---
    {
        "question": "Find the simple interest on $1000 at a rate of 5% per annum for 3 years.",
        "answer": "$150",
        "incorrect": ["$100", "$50", "$200"]
    },
    {
        "question": "What is the total amount to be repaid on a loan of $500 at 10% simple interest per year for 4 years?",
        "answer": "$700",
        "incorrect": ["$200", "$600", "$550"]
    },
    # --- Category: Geometry ---
    {
        "question": "What is the perimeter of a rectangle with a length of 15 cm and a width of 10 cm?",
        "answer": "50 cm",
        "incorrect": ["25 cm", "150 sq cm", "45 cm"]
    },
    {
        "question": "Find the area of a right-angled triangle with a base of 12 cm and a height of 5 cm.",
        "answer": "30 sq cm",
        "incorrect": ["60 sq cm", "17 sq cm", "25 sq cm"]
    },
    {
        "question": "If the circumference of a circle is 44 cm, what is its radius? (Use π = 22/7)",
        "answer": "7 cm",
        "incorrect": ["14 cm", "22 cm", "8 cm"]
    },
    # --- Category: More Averages ---
    {
        "question": "A car travels to a city at a speed of 40 km/h and returns by the same route at a speed of 60 km/h. What is the average speed for the whole journey?",
        "answer": "48 km/h",
        "incorrect": ["50 km/h", "45 km/h", "52 km/h"]
    },
    {
        "question": "The average age of 5 friends is 24 years. If a 6th friend with age 30 joins them, what is the new average age?",
        "answer": "25 years",
        "incorrect": ["26 years", "24.5 years", "27 years"]
    },
    # --- Category: More Number Series ---
    {
        "question": "What comes next in the sequence: 1, 4, 9, 16, 25, ...?",
        "answer": "36",
        "incorrect": ["30", "32", "40"]
    },
    {
        "question": "Find the next term in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, ...",
        "answer": "13",
        "incorrect": ["10", "11", "12"]
    },
    {
        "question": "What is the next number in the pattern: 40, 35, 30, 25, ...?",
        "answer": "20",
        "incorrect": ["15", "22", "18"]
    },
    # --- Category: Logical Word Problems ---
    {
        "question": "A is 5 years older than B, who is twice as old as C. If the total of their ages is 40, how old is B?",
        "answer": "14",
        "incorrect": ["10", "19", "28"]
    },
    {
        "question": "In a room with 8 people, if everyone shakes hands with everyone else exactly once, how many handshakes occur in total?",
        "answer": "28",
        "incorrect": ["64", "56", "32"]
    },
    {
        "question": "A farm has only chickens and sheep. There are a total of 20 heads and 56 feet. How many chickens are there?",
        "answer": "12",
        "incorrect": ["8", "10", "14"]
    },
    {
        "question": "What is the angle between the hour and minute hands of a clock at 3:00?",
        "answer": "90 degrees",
        "incorrect": ["0 degrees", "45 degrees", "60 degrees"]
    },
    {
        "question": "A number is doubled and 8 is added. The result is 40. What is the number?",
        "answer": "16",
        "incorrect": ["20", "24", "12"]
    },
    {
        "question": "Which of these fractions is the largest: 3/4, 4/5, or 5/6?",
        "answer": "5/6",
        "incorrect": ["3/4", "4/5", "They are all equal"]
    },
    {
        "question": "What is the remainder when 53 is divided by 7?",
        "answer": "4",
        "incorrect": ["7", "5", "6"]
    },
    # --- More questions to reach the count ---
    {
        "question": "If a dozen eggs cost $2.40, what is the cost of a single egg?",
        "answer": "$0.20",
        "incorrect": ["$0.12", "$0.24", "$0.30"]
    },
    {
        "question": "The sum of the ages of a father and son is 50. Five years ago, the father was 5 times as old as the son. What is the current age of the father?",
        "answer": "35",
        "incorrect": ["40", "30", "45"]
    },
    {
        "question": "If 20% of a number is 40, what is the number?",
        "answer": "200",
        "incorrect": ["100", "800", "80"]
    },
    {
        "question": "Find the value of 5 + 5 * 5 - 5.",
        "answer": "25",
        "incorrect": ["45", "50", "0"]
    },
    {
        "question": "A watch is sold for $220 with a profit of 10%. What was the cost price of the watch?",
        "answer": "$200",
        "incorrect": ["$198", "$210", "$242"]
    },
    {
        "question": "What is the next prime number after 13?",
        "answer": "17",
        "incorrect": ["14", "15", "16"]
    },
    {
        "question": "How many seconds are there in 5 minutes?",
        "answer": "300",
        "incorrect": ["150", "360", "250"]
    },
    {
        "question": "If a book has 250 pages and you have read 100 pages, what percentage of the book is left to read?",
        "answer": "60%",
        "incorrect": ["40%", "150%", "50%"]
    },
    {
        "question": "What is the least common multiple (LCM) of 4 and 6?",
        "answer": "12",
        "incorrect": ["2", "24", "18"]
    },
    {
        "question": "A product costs $50. If the price is increased by 10% and then decreased by 10%, what is the final price?",
        "answer": "$49.50",
        "incorrect": ["$50", "$49", "$51"]
    },
]

correct_answers_store = {}

@app.route('/get_aptitude_questions', methods=['GET'])
def get_aptitude_questions():
    """
    Randomly selects 10 unique questions from the internal APTITUDE_QUESTION_BANK.
    """
    global correct_answers_store
    correct_answers_store = {}
    questions = []

    # Randomly sample 10 unique questions from our bank
    if len(APTITUDE_QUESTION_BANK) < 10:
        return jsonify({"error": "Not enough questions in the bank. Please add more."}), 500
        
    selected_questions = random.sample(APTITUDE_QUESTION_BANK, 10)

    for i, item in enumerate(selected_questions):
        question_id = f"q_{i}"
        
        # Combine correct and incorrect answers and shuffle them
        options = item['incorrect'] + [item['answer']]
        random.shuffle(options)
        
        # Store the correct answer on the server
        correct_answers_store[question_id] = item['answer']

        questions.append({
            'id': question_id,
            'question': item['question'],
            'options': options
        })
        
    return jsonify(questions)

@app.route('/submit_answers', methods=['POST'])
def submit_answers():
    user_answers = request.get_json()
    score = 0
    total_questions = len(correct_answers_store)

    for question_id, user_answer in user_answers.items():
        if question_id in correct_answers_store and user_answer == correct_answers_store[question_id]:
            score += 1
            
    final_score_percent = int((score / total_questions) * 100) if total_questions > 0 else 0
    
    return jsonify({
        'score': score,
        'total': total_questions,
        'percentage': final_score_percent
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
