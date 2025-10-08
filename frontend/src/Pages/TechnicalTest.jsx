import React, { useState, useEffect } from 'react';

const TechnicalSkillsTest = () => {
  const [currentState, setCurrentState] = useState('loading'); // 'loading', 'question', 'results', 'error'
  const [questionData, setQuestionData] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [error, setError] = useState(null);

  const startNewTest = async () => {
    setCurrentState('loading');
    setError(null);
    setUserAnswer('');
    setResultsData(null);

    try {
      const response = await fetch('http://localhost:5000/get_technical_question');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An unknown server error.');
      }
      setQuestionData(data);
      setCurrentState('question');
    } catch (err) {
      console.error('Error fetching question:', err);
      setError(err.message);
      setCurrentState('error');
    }
  };

  const handleAnswerChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer) {
      alert('Please select an answer.');
      return;
    }

    setCurrentState('loading');

    try {
      const response = await fetch('http://localhost:5000/evaluate_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_answer: userAnswer }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An unknown server error.');
      }
      setResultsData(data);
      setCurrentState('results');
    } catch (err) {
      console.error('Error evaluating answer:', err);
      setError(err.message);
      setCurrentState('error');
    }
  };

  const renderQuestion = () => {
    if (!questionData) return null;
    return (
      <div className="question-area">
        <p className="topic-display uppercase text-sm font-bold text-gray-500 mb-2">
          Topic: {questionData.topic}
        </p>
        <div className="question-text text-xl font-medium text-gray-800 mb-5">
          {questionData.question}
        </div>
        <form onSubmit={submitAnswer} className="space-y-4">
          <ul className="options-list space-y-3 list-none p-0">
            {questionData.options.map((option) => {
              const id = option.replace(/[^a-zA-Z0-9]/g, '');
              return (
                <li key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={id}
                    name="answer"
                    value={option}
                    checked={userAnswer === option}
                    onChange={handleAnswerChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor={id} className="ml-3 text-lg text-gray-700 cursor-pointer select-none">
                    {option}
                  </label>
                </li>
              );
            })}
          </ul>
          <button
            type="submit"
            className="action-button bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 w-full"
          >
            Submit Answer
          </button>
        </form>
      </div>
    );
  };

  const renderResults = () => {
    if (!resultsData) return null;
    const isCorrect = resultsData.is_correct;
    return (
      <div className="results-area">
        <div
          className={`result-box p-5 rounded-md text-center mb-5 ${
            isCorrect
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-red-50 border-l-4 border-red-500'
          }`}
        >
          <h2 className={`text-2xl font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h2>
          {!isCorrect && (
            <p className="text-gray-700 mt-2">
              <strong>The correct answer was:</strong> {resultsData.correct_answer}
            </p>
          )}
        </div>
        <div className="explanation bg-gray-50 p-4 rounded-md mb-5">
          <p className="text-gray-800 font-medium">
            <strong>Explanation:</strong> {resultsData.explanation}
          </p>
        </div>
        <button
          onClick={startNewTest}
          className="action-button bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 w-full"
        >
          Try Another Question
        </button>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 text-lg">Generating a random technical question... Please wait.</p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="error-message text-red-600 font-bold text-lg mb-4">Error: {error}</p>
      <button
        onClick={startNewTest}
        className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
      >
        Retry
      </button>
    </div>
  );

  useEffect(() => {
    startNewTest();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Technical Skills Test</h1>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        {currentState === 'loading' && renderLoading()}
        {currentState === 'question' && renderQuestion()}
        {currentState === 'results' && renderResults()}
        {currentState === 'error' && renderError()}
      </div>
    </div>
  );
};

export default TechnicalSkillsTest;
