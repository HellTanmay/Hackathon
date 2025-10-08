import React, { useState, useEffect, useRef } from 'react';

const FeedbackCard = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-4 rounded-xl border-l-4 border-${color}-400 shadow-md hover:shadow-lg transition-all duration-300`}>
    <div className="flex items-center gap-3 mb-2">
      <span className={`text-2xl`}>{icon}</span>
      <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
    </div>
    <p className={`text-lg font-bold ${
      value === 'Good' || value === 'Relevant' || value === 'Positive' ? 'text-green-600' :
      value === 'Somewhat Relevant' ? 'text-yellow-600' : 'text-gray-700'
    }`}>
      {value}
    </p>
  </div>
);

const AICommunicationTrainer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [question, setQuestion] = useState('Loading question...');
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [relevance, setRelevance] = useState('...');
  const [emotion, setEmotion] = useState('...');
  const [eyeContact, setEyeContact] = useState('...');
  const [tone, setTone] = useState('...');
  const [fillerCount, setFillerCount] = useState(0);
  const [grammarFeedback, setGrammarFeedback] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [videoInterval, setVideoInterval] = useState(null);

  const API_BASE = 'http://localhost:5000';

  // Speech Recognition Setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interim = '';
        let final = finalTranscript;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const newFinal = event.results[i][0].transcript.trim();
            if (newFinal) {
              final += newFinal + '. ';
              analyzeText(newFinal);
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setFinalTranscript(final);
        setInterimTranscript(interim);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition failed. Please try again.');
      };

      setRecognition(rec);
    } else {
      setError('Speech recognition not supported in this browser. Use Chrome or Firefox.');
    }
  }, [finalTranscript]);

  // Timer
  useEffect(() => {
    let timer;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      }), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  // Video Interval
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(analyzeVideoFrame, 1200);
      setVideoInterval(interval);
    } else {
      if (videoInterval) clearInterval(videoInterval);
    }
    return () => {
      if (videoInterval) clearInterval(videoInterval);
    };
  }, [isRecording]);

  // Setup Camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Mirror video
          videoRef.current.style.transform = 'scaleX(-1)';
        }
      } catch (err) {
        setError('Error accessing camera/microphone: ' + err.message);
      }
    }
    setupCamera();
  }, []);

  // Fetch Initial Question
  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_question`);
      const data = await response.json();
      setQuestion(data.question || 'Failed to load question');
    } catch (err) {
      setError('Error fetching question: ' + err.message);
    }
  };

  const analyzeVideoFrame =async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const w = 320;
      const h = (videoRef.current.videoHeight / videoRef.current.videoWidth) * w;
      if (!h) return;

      canvas.width = w;
      canvas.height = h;
      ctx.save();
      ctx.scale(-1, 1); // Mirror
      ctx.drawImage(videoRef.current, -w, 0, w, h);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      await fetch(`${API_BASE}/analyze_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
        .then((res) => res.json())
        .then((data) => {
          setEmotion(data.emotion || '...');
          setEyeContact(data.eye_contact||"...")
        })
        .catch((err) => console.error('Frame analysis error:', err));
    }
  };

  const analyzeText = async (text) => {
    try {
      const response = await fetch(`${API_BASE}/analyze_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setTone(`${data.tone || '...'} (Polarity: ${data.polarity || 0})`);
      setFillerCount(data.filler_count || 0);
      setGrammarFeedback(data.grammar_feedback || []);
    } catch (err) {
      console.error('Text analysis error:', err);
    }
  };

  const checkRelevance = async () => {
    const answer = finalTranscript.trim();
    if (!answer) return;

    setRelevance('Analyzing...');
    try {
      const response = await fetch(`${API_BASE}/check_relevance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });
      const data = await response.json();
      setRelevance(data.relevance || 'Error');
    } catch (err) {
      console.error('Relevance check error:', err);
      setRelevance('Error');
    }
  };

  const startRecording = () => {
    if (recognition) {
      resetFeedback();
      recognition.start();
      setIsRecording(true);
      setTimeLeft(60);
    } else {
      setError('Speech recognition not available.');
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
    checkRelevance();
    fetchQuestion(); // New question after stop
  };

  const resetFeedback = () => {
    setRelevance('...');
    setEmotion('...');
    setEyeContact('...');
    setTone('...');
    setFillerCount(0);
    setGrammarFeedback([]);
    setFinalTranscript('');
    setInterimTranscript('');
  };

  const newQuestion = () => {
    if (confirm('Start a new question? Current progress will be lost.')) {
      resetFeedback();
      fetchQuestion();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 py-8 px-4">
      {/* Hero Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center gap-3 mb-4">
        {/* <div className="text-4xl">🤖</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            
          </h1> */}
        </div> 
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Practice your interview skills with real-time AI feedback on body language, speech, and relevance.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-[1.02] transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📹</span>
            Your Video Feed
          </h2>
          <video ref={videoRef} autoPlay muted className="w-full rounded-xl shadow-md" />
          <canvas ref={canvasRef} className="hidden" />
          {isRecording && (
            <div className="mt-4 text-center">
              <div className="text-3xl font-mono text-indigo-600 mb-2 animate-pulse">{timeLeft}s</div>
              <p className="text-sm text-gray-500">Time left to answer</p>
            </div>
          )}
                  {/* Transcript */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">💬</span>
              Transcript
            </h4>
            <div className="min-h-[100px] max-h-48 overflow-y-auto p-3 bg-white rounded-lg border border-gray-200 text-sm">
              <div className="font-medium text-gray-800">{finalTranscript}</div>
              {interimTranscript && (
                <div className="text-gray-500 italic mt-2">
                  {interimTranscript} <span className="animate-pulse">...</span>
                </div>
              )}
              {!finalTranscript && !interimTranscript && (
                <p className="text-gray-400 italic">Start speaking to see your transcript...</p>
              )}
            </div>
          </div>
        </div>

        {/* Controls & Feedback */}
        <div className="space-y-6">
          {/* Question Box */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">❓</span>
              Interview Question
            </h2>
            <div className="text-lg font-medium text-center min-h-[60px] flex items-center justify-center italic">
              "{question}"
            </div>
            <button
              onClick={newQuestion}
              className="mt-4 w-full py-2 px-4 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm font-medium"
            >
              New Question
            </button>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!recognition}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                isRecording
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl animate-pulse'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? 'Stop Answering' : 'Start Answering'}
            </button>
          </div>

          {/* Feedback Cards */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Real-time Feedback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeedbackCard title="Answer Relevance" value={relevance} icon="👍" color="indigo" />
              <FeedbackCard title="Body Language (Emotion)" value={emotion} icon="❤️" color="pink" />
              <FeedbackCard title="Eye Contact" value={eyeContact} icon="👁️" color="blue" />
              <FeedbackCard title="Voice Tone" value={tone} icon="🔊" color="green" />
              <FeedbackCard title="Filler Words Used" value={`${fillerCount}`} icon="!" color="yellow" />
            </div>
          </div>

          {/* Grammar Feedback */}
          {grammarFeedback.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
              <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span>
                Grammar Feedback
              </h4>
              <div className="space-y-2 text-sm text-red-700 max-h-32 overflow-y-auto">
                {grammarFeedback.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-2 bg-red-100 rounded-lg">
                    <p>• {item.message}</p>
                    {item.replacements.length > 0 && (
                      <p className="text-green-700 font-semibold mt-1">
                        Suggestion: {item.replacements.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
                {grammarFeedback.length > 5 && (
                  <p className="text-xs text-gray-500">... and more</p>
                )}
              </div>
            </div>
          )}

  
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AICommunicationTrainer;
