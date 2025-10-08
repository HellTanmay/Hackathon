import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCheckCircle, 
  FaCircle, 
  FaArrowRight, 
  FaArrowAltCircleLeft 
} from 'react-icons/fa';  // From react-icons (install if needed)

const API_BASE = 'http://localhost:5000';  // Proxied to http://localhost:5001

function Aptitude() {
  const [quizState, setQuizState] = useState({
    isLoading: true,
    error: null,
    totalQuestions: 0,
    currentQuestionIndex: 0,
    questionText: '',
    options: [],
    selectedAnswer: null,
    showFeedback: false,
    isCorrect: null,
    correctAnswer: '',
    explanation: '',
    score: 0,
    quizOver: false
  });

  // Start quiz on mount
  useEffect(() => {
    startNewQuiz();
  }, []);

  const startNewQuiz = async () => {
    setQuizState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await axios.get(`${API_BASE}/start_new_quiz`);
      const { total_questions, question_index, question_text, options } = response.data;
      
      setQuizState({
        isLoading: false,
        error: null,
        totalQuestions: total_questions,
        currentQuestionIndex: question_index,
        questionText: question_text,
        options,
        selectedAnswer: null,
        showFeedback: false,
        isCorrect: null,
        correctAnswer: '',
        explanation: '',
        score: 0,
        quizOver: false
      });
    } catch (error) {
      setQuizState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || 'Failed to start quiz. Please try again.'
      }));
    }
  };

  const selectAnswer = (answer) => {
    setQuizState(prev => ({ ...prev, selectedAnswer: answer }));
  };

  const checkAnswer = async () => {
    if (!quizState.selectedAnswer) {
      alert('Please select an answer!');
      return;
    }

    setQuizState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await axios.post(`${API_BASE}/check_single_answer`, {
        question_index: quizState.currentQuestionIndex,
        user_answer: quizState.selectedAnswer
      });

      const { is_correct, correct_answer, explanation } = response.data;
      const newScore = quizState.score + (is_correct ? 1 : 0);

      setQuizState(prev => ({
        ...prev,
        showFeedback: true,
        isCorrect: is_correct,
        correctAnswer: correct_answer,
        explanation,
        score: newScore,
        isLoading: false
      }));
    } catch (error) {
      setQuizState(prev => ({
        ...prev,
        showFeedback: false,
        error: error.response?.data?.error || 'Failed to check answer.',
        isLoading: false
      }));
    }
  };

  const getNextQuestion = async () => {
    const nextIndex = quizState.currentQuestionIndex + 1;
    if (nextIndex >= quizState.totalQuestions) {
      setQuizState(prev => ({ ...prev, quizOver: true, showFeedback: false }));
      return;
    }

    setQuizState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await axios.post(`${API_BASE}/get_next_question`, {
        next_index: nextIndex
      });

      const { question_index, question_text, options, quiz_over } = response.data;
      
      if (quiz_over) {
        setQuizState(prev => ({ ...prev, quizOver: true, showFeedback: false, isLoading: false }));
      } else {
        setQuizState({
          ...quizState,
          currentQuestionIndex: question_index,
          questionText: question_text,
          options,
          selectedAnswer: null,
          showFeedback: false,
          isCorrect: null,
          correctAnswer: '',
          explanation: '',
          isLoading: false
        });
      }
    } catch (error) {
      setQuizState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to load next question.',
        isLoading: false
      }));
    }
  };

  const restartQuiz = () => {
    startNewQuiz();
  };

  // Loading Screen
  if (quizState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your quiz...</div>
      </div>
    );
  }

  // Error Screen
  if (quizState.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 text-center">
          <FaCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4 text-red-500">{quizState.error}</p>
          <button
            onClick={restartQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
          >
            <FaArrowAltCircleLeft className="inline mr-2" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz Over Screen
  if (quizState.quizOver) {
    const percentage = Math.round((quizState.score / quizState.totalQuestions) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex flex-col items-center justify-center p-4">
        <div id="quiz-container" className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
          <div id="final-score" className="text-3xl font-bold text-blue-600 mb-4">
            <p>Your Final Score: {percentage}/100</p>
            <p className="text-lg text-gray-600">You answered {quizState.score} out of {quizState.totalQuestions} questions correctly.</p>
          </div>
          <button
            id="restart-quiz-btn"
            onClick={restartQuiz}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 mt-4"
          >
            <FaArrowAltCircleLeft className="inline mr-2" /> Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  // Main Quiz Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Aptitude Test</h1>
      <div id="quiz-container" className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 animate-fade-in">
        {/* Question Header */}
        <div className="question-header flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Question {quizState.currentQuestionIndex + 1}</h2>
          <span className="progress-tracker font-bold text-gray-600">
            {quizState.currentQuestionIndex + 1} / {quizState.totalQuestions}
          </span>
        </div>

        {/* Question Text */}
        <p className="question-text text-lg font-medium text-gray-800 mb-6 text-center">{quizState.questionText}</p>

        {/* Options Area */}
        <div id="options-area">
          <ul className="options-list space-y-3">
            {quizState.options.map((option, idx) => (
              <li key={idx}>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:shadow-sm disabled:opacity-50">
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={quizState.selectedAnswer === option}
                    onChange={() => selectAnswer(option)}
                    disabled={quizState.showFeedback}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              </li>
            ))}
          </ul>

          {/* Feedback (if shown) */}
          {quizState.showFeedback && (
            <div className={`feedback-box p-4 mt-6 rounded-lg border-l-4 ${
              quizState.isCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex items-center mb-2">
                {quizState.isCorrect ? (
                  <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <FaCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <strong className={`${
                  quizState.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {quizState.isCorrect ? 'Correct!' : 'Incorrect.'}
                </strong>
              </div>
              {!quizState.isCorrect && (
                <p className="text-red-700 mb-2">
                  The correct answer was: <strong>{quizState.correctAnswer}</strong>
                </p>
              )}
              <p className="explanation text-gray-600 italic">{quizState.explanation}</p>
            </div>
          )}

          {/* Buttons */}
          {!quizState.showFeedback ? (
            <button
              id="check-answer-btn"
              onClick={checkAnswer}
              disabled={!quizState.selectedAnswer}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105 mt-6 disabled:cursor-not-allowed disabled:transform-none"
            >
              Check Answer
            </button>
          ) : (
            <button
              id="next-question-btn"
              onClick={getNextQuestion}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition transform hover:scale-105 mt-6 flex items-center justify-center"
            >
              <FaArrowRight className="mr-2" /> Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Aptitude;
