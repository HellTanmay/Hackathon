import React, { useState } from "react";
import { Link } from "react-router";
import StudentAnalytics from "./Analytics";
const StudentDashboard = () => {
  const [selectedResume, setSelectedResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [results, setResults] = useState(null);

  const handleResume = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (resume formats)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid resume file (PDF, DOC, DOCX).");
      return;
    }

    setIsUploading(true);
    setSelectedResume(file);

    const formData = new FormData();
    formData.append("file", file);
    // Optional: formData.append('user_id', 'some_user_id'); // If authenticated

    try {
      const response = await fetch("http://localhost:5000/analyze_resume", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Analysis failed. Please try again.");
      }
      const data1 = await response.json();
      // Handle success: Display results inline (assuming backend returns analysis data)
      // If backend redirects, you might handle it differently (e.g., window.location.href)
      console.log("Analysis result:", data1);
      setResults(data1);
      const respo = await fetch("http://localhost:5000/upload_resume", {
        method: "POST",
        body: formData,
      });

      const data = await respo.json();

      if (data.success) {
        console.log("Resume uploaded:", data.filename);
        setResumeUploaded(true); // Proceed to dashboard
        // Optional: Store file_id in state or localStorage for later use
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600">
            Start by uploading your resume to access tests.
          </p>
        </div>

        {/* Resume Upload Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Upload Your Resume
          </h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Select a resume file (PDF, DOC, DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResume}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {isUploading && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">
                  Uploading your resume...
                </span>
              </div>
            )}
            {selectedResume && !isUploading && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800 text-center">
                  ✅ Resume selected:{" "}
                  <span className="font-normal">{selectedResume.name}</span>
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-gray-500 text-center mt-4">
              Your resume will be processed securely. You can proceed to tests
              once uploaded.
            </p>
            {selectedResume && (
              <Link
                to={"/pages"}
                className=" bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Take Technical Test
              </Link>
            )}
          </div>
        </section>
        {selectedResume && (
          <section className="bg-white rounded-lg shadow-md p-6 w-full">
            <StudentAnalytics />
        {results&&(   
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl overflow-hidden"> 
         
        <header className="bg-blue-600 text-white p-8 text-center rounded-t-lg">
          <h1 className="text-3xl font-bold mb-2">Your Resume Report</h1>
          <p className="text-2xl font-light">Overall Score: {results.overall_score}/100</p>
        </header> 

        {/* Content */}
        <div className="p-8">
          {/* Strengths and Weaknesses Grid */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths Card */}
              <div className="bg-gray-50 border border-gray-300 rounded-md p-5 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Strengths</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {results.strengths?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses Card */}
              <div className="bg-gray-50 border border-gray-300 rounded-md p-5 border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">❌ Areas for Improvement</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {results.weaknesses?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Before & After Section*/}
          <section className="mb-8 col-span-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-3">
              Main Point for Improvement: Before & After
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Before Box */}
              <div className="bg-red-50 border border-red-300 rounded-md p-4">
                <h4 className="font-medium text-red-800 mb-2">Before</h4>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">{results.before_after_example?.before}</pre>
              </div>

              {/* After Box */}
              <div className="bg-green-50 border border-green-300 rounded-md p-4">
                <h4 className="font-medium text-green-800 mb-2">After (Rewritten)</h4>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">{results.before_after_example?.after}</pre>
              </div>
            </div>
          </section> 

          {/* Learning Path Section*/}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-3">
              Recommended Learning Path
            </h2>
            <div className="space-y-4">
              {results.learning_path?.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 pb-4 last:border-b-0"
                >
                  <strong className="text-blue-600 block">Skill:</strong>{' '}
                  <span className="text-gray-700">{item.skill}</span>
                  <br />
                  <em className="text-gray-600 block mt-1">Resource:</em>{' '}
                  <span className="text-gray-700">{item.resource}</span>
                </div>
              ))}
            </div>
          </section> 

          {/* Final Advice Section*/}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-3">
              Final Actionable Advice
            </h2>
            <div className="bg-blue-50 text-blue-700 border-l-4 border-blue-500 p-5 rounded-md text-lg">
              <p className="whitespace-pre-wrap">{results.final_advice}</p>
            </div>
          </section>
        </div>
      </div>)} 
   


          </section>
        )}
      </div>
    </div>
  );
};

// // Render Dashboard after upload
// return (
//   <></>
// );

export default StudentDashboard;
