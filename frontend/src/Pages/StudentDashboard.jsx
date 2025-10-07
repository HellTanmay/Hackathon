import React, { useState } from 'react';
import { Link } from 'react-router';
const StudentDashboard = () => {
  const [selectedResume, setSelectedResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (resume formats)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid resume file (PDF, DOC, or DOCX).');
      return;
    }

    setIsUploading(true);
    setSelectedResume(file);

    // Simulate upload (replace with actual API call)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Mock delay
      console.log('Resume uploaded:', file.name);
      setResumeUploaded(true); // Proceed to dashboard
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestClick = (testType) => {
    // Handle navigation or modal opening for the test
    // For now, log the action; in a real app, use React Router or modals
    console.log(`Starting ${testType} test...`);
    alert(`Redirecting to ${testType} Test. (Implement navigation here)`);
  };

  if (!resumeUploaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
            <p className="text-gray-600">Start by uploading your resume to access tests.</p>
          </div>

          {/* Resume Upload Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Upload Your Resume</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Select a resume file (PDF, DOC, DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {isUploading && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Uploading your resume...</span>
                </div>
              )}
              {selectedResume && !isUploading && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800 text-center">
                    ✅ Resume selected: <span className="font-normal">{selectedResume.name}</span>
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Your resume will be processed securely. You can proceed to tests once uploaded.
            </p>
          </section>
        </div>
      </div>
    );
  }

  // Render Dashboard after upload
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Resume uploaded successfully! Choose a test to begin.</p>
          <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md inline-block">
            <span className="text-sm text-green-800">✅ {selectedResume?.name}</span>
          </div>
        </div>

        {/* Tests Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* HR Test Button */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">HR Test</h3>
            <p className="text-gray-600 mb-4 text-sm">Assess your soft skills and behavioral fit.</p>
            <Link to={'/test-hr'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Take HR Test
            </Link>
          </div>

          {/* Technical Test Button */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Test</h3>
            <p className="text-gray-600 mb-4 text-sm">Evaluate your domain-specific knowledge.</p>
            <Link to={'/techincal-test'}
             
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Take Technical Test
            </Link>
          </div>

          {/* Problem Solving Test Button */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Solving Test</h3>
            <p className="text-gray-600 mb-4 text-sm">Test your logical thinking and analytical skills.</p>
            <Link to={'/problem-solving'}
              
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              Take Problem Solving Test
            </Link>
          </div>
        </section>

        {/* Footer/Next Steps */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Apply?</h3>
          <p className="text-gray-600">
            Complete the tests to generate your full assessment report. Good luck!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
