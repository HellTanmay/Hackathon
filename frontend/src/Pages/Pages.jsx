import React from 'react'
import { Link } from 'react-router'
const Pages = () => {
  return (
    <div>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Resume uploaded successfully! Choose a test to begin.</p>
          <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md inline-block">
            {/* <span className="text-sm text-green-800">✅ {selectedResume?.name}</span> */}
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
    </div>
  )
}

export default Pages
