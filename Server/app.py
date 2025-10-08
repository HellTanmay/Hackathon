import os
import io
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.utils import secure_filename

# --- Basic Flask App Setup ---
app = Flask(__name__)
# Allow Cross-Origin Resource Sharing (CORS) for your front-end
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})

# --- Configuration ---
# Define the path for the upload folder
# This will create an 'uploads' directory in the same folder as your app.py
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

# Initialize MongoDB client and select the database and collection
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

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
     

@app.route('/download_resume/<resume_id>', methods=['GET'])
def download_resume(resume_id):
    """
    Downloads a resume file from the server based on its database ID.
    """
    try:
        # 1. --- Find the resume metadata in MongoDB ---
        resume_data = collection.find_one({'_id': ObjectId(resume_id)})
        
        if not resume_data:
            return jsonify({'error': 'Resume not found in database'}), 404
        
        # 2. --- Get file details from the database record ---
        file_path = resume_data.get('file_path')
        original_name = resume_data.get('original_name', 'download') # Use original name for download
        
        # Check if the file actually exists on the server filesystem
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'File not found on server'}), 404

        # 3. --- Send the file to the client ---
        return send_file(
            file_path,
            download_name=original_name,
            as_attachment=True # This prompts the user to download the file
        )
    except Exception as e:
        print(f"An error occurred during download: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500


# --- Main execution block ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
