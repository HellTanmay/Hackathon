import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'; // npm install @heroicons/react

const StudentAnalytics = ({ userId = 'student123' }) => { // userId prop for backend query
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/student-analytics?user_id=${userId}`,{method:'GET'});
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data);
        } else {
          throw new Error(data.error || 'No data available');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overall_score, scores, recommendations } = analyticsData;
  const chartData = [
    { skill: 'Communication', score: scores.communication },
    { skill: 'Technical', score: scores.technical },
    { skill: 'Problem Solving', score: scores.problem_solving },
  ];

  const getColorForScore = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <ChartBarIcon className="w-6 h-6 text-white mr-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Performance Analytics
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Track your progress across key skills. Overall Score: <span className="font-bold text-2xl text-blue-600">{overall_score}/100</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart - Overall Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Skill Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 text-center mt-4">
              Visualize your strengths and areas for improvement.
            </p>
          </div>

          {/* Overall Score Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/50 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Performance</h2>
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{overall_score}</span>
                <span className="text-white ml-1">/100</span>
              </div>
              <p className="text-gray-600">
                {overall_score >= 80 ? 'Excellent!' : overall_score >= 60 ? 'Good progress!' : 'Keep practicing!'}
              </p>
            </div>
          </div>
        </div>

        {/* Individual Scores Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Communication */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
                <p className="text-sm text-gray-600">HR & Soft Skills</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Score: {scores.communication}/100</span>
                <span className={getColorForScore(scores.communication)}>{scores.communication >= 80 ? 'Strong' : scores.communication >= 60 ? 'Average' : 'Needs Improvement'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressBarColor(scores.communication)} transition-all duration-300`}
                  style={{ width: `${scores.communication}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Technical */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Technical</h3>
                <p className="text-sm text-gray-600">Domain Knowledge</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Score: {scores.technical}/100</span>
                <span className={getColorForScore(scores.technical)}>{scores.technical >= 80 ? 'Strong' : scores.technical >= 60 ? 'Average' : 'Needs Improvement'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressBarColor(scores.technical)} transition-all duration-300`}
                  style={{ width: `${scores.technical}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Problem Solving */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Problem Solving</h3>
                <p className="text-sm text-gray-600">Logical & Analytical</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Score: {scores.problem_solving}/100</span>
                <span className={getColorForScore(scores.problem_solving)}>{scores.problem_solving >= 80 ? 'Strong' : scores.problem_solving >= 60 ? 'Average' : 'Needs Improvement'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressBarColor(scores.problem_solving)} transition-all duration-300`}
                  style={{ width: `${scores.problem_solving}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personalized Recommendations</h2>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-700">{rec}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Retake tests to improve your scores and unlock better job matches.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
