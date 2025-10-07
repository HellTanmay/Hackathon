import React, { useState, useEffect, useRef } from 'react';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  FaceSmileIcon,
  EyeIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'; // Install: npm install @heroicons/react

const HRTestPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [question, setQuestion] = useState('Loading question...');
  const [emotion, setEmotion] = useState('...');
  const [eyeContact, setEyeContact] = useState('...');
  const [tone, setTone] = useState('...');
  const [grammarErrors, setGrammarErrors] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const videoIntervalRef = useRef(null);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript);

        if (finalTranscript.trim()) {
          analyzeText(finalTranscript);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsAnswering(false);
      };

      setRecognition(rec);
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }
  }, []);

  // Setup Camera
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        alert('Please allow camera and microphone access to use this feature.');
      }
    };

    setupCamera();
    fetchNewQuestion();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    };
  }, []);

  // Analyze Video Frame
  const analyzeVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Mirror effect
    context.save();
    context.scale(-1, 1);
    context.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();

    const dataUrl = canvas.toDataURL('image/jpeg');

    fetch('/analyze_frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl })
    })
      .then(response => response.json())
      .then(data => {
        setEmotion(data.emotion || '...');
        setEyeContact(data.eye_contact || '...');
      })
      .catch(error => console.error('Error analyzing frame:', error));
  };

  // Analyze Text
  const analyzeText = (text) => {
    fetch('/analyze_text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    })
      .then(response => response.json())
      .then(data => {
        setTone(`${data.tone} (Polarity: ${data.polarity})`);
        setGrammarErrors(data.grammar_errors || 0);
      })
      .catch(error => console.error('Error analyzing text:', error));
  };

  // Fetch New Question
  const fetchNewQuestion = () => {
    fetch('/get_question')
      .then(response => response.json())
      .then(data => {
        setQuestion(data.question || 'Default question: Tell me about yourself.');
      })
      .catch(error => {
        console.error('Error fetching question:', error);
        setQuestion('Tell me about yourself.'); // Fallback
      });
  };

  // Handle Start/Stop Answering
  const handleStartAnswering = () => {
    if (!recognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (!isAnswering) {
      recognition.start();
      videoIntervalRef.current = setInterval(analyzeVideoFrame, 1500);
      setIsAnswering(true);
    } else {
      recognition.stop();
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
      setIsAnswering(false);
      setTranscript('');
      fetchNewQuestion(); // Load next question
    }
  };

  // Mock function to get icon and color for feedback (extend with real logic)
  const getFeedbackIconAndColor = (value, type) => {
    if (value === '...' || !value) {
      return { icon: null, color: 'text-gray-500' };
    }
    // Mock: Assume positive if value includes 'good' or low errors; customize based on backend data
    const isPositive = type === 'grammar' ? value < 2 : value.toLowerCase().includes('good') || value.toLowerCase().includes('high');
    return {
      icon: isPositive ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col overflow-hidden">
      {/* Header - Fixed small height */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 bg-white/80 backdrop-blur-sm border-b border-white/50">
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-1">
            <VideoCameraIcon className="w-4 h-4 text-white mr-1.5" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              AI-Powered HR Interview Trainer
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-gray-700 max-w-md mx-auto leading-tight">
            Practice your interview skills with real-time AI feedback.
          </p>
        </div>
      </div>

      {/* Main Content - Takes remaining viewport height */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 px-2 sm:px-4 lg:px-6 py-2 lg:py-4 overflow-hidden">
        {/* Video Container - Flex to fill space */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-xl p-2 lg:p-4 border border-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-1 lg:mb-3 flex-shrink-0">
            <div className="flex items-center">
              <VideoCameraIcon className="w-3 h-3 lg:w-5 lg:h-5 text-blue-600 mr-1 lg:mr-2" />
              <h2 className="text-xs lg:text-lg font-bold text-gray-900">Your Video Feed</h2>
            </div>
            {/* Recording indicator */}
            {isAnswering && (
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
            )}
          </div>
          <div className="flex-1 relative overflow-hidden rounded-lg">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover shadow-lg ring-1 ring-blue-200/50"
              style={{ transform: 'scaleX(-1)' }} 
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Controls and Feedback - Flex to fill space, scrollable if needed */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-xl p-2 lg:p-4 border border-white/50 flex flex-col overflow-y-auto">
          {/* Question Section */}
          <div className="mb-2 lg:mb-4 flex-shrink-0">
            <div className="flex items-center mb-1 lg:mb-2">
              <ChatBubbleLeftRightIcon className="w-3 h-3 lg:w-5 lg:h-5 text-purple-600 mr-1 lg:mr-2" />
              <h2 className="text-xs lg:text-lg font-bold text-gray-900">Interview Question</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-2 lg:p-4 rounded-lg border-l-2 lg:border-l-4 border-purple-500 shadow-inner">
              <p className="text-sm lg:text-lg font-semibold text-gray-800 text-center leading-relaxed">
                {question}
              </p>
            </div>
          </div>

          {/* Start/Stop Button */}
          <div className="mb-2 lg:mb-4 flex-shrink-0">
            <button
              onClick={handleStartAnswering}
              className={`w-full flex items-center justify-center py-2 lg:py-3 px-3 lg:px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm lg:text-base ${
                isAnswering
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-red-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-blue-500/25'
              }`}
            >
              {isAnswering ? (
                <>
                  <XCircleIcon className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2" />
                  Stop Answering
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2" />
                  Start Answering
                </>
              )}
            </button>
          </div>

          {/* Real-time Feedback */}
          <div className="mb-2 lg:mb-4 flex-1">
            <div className="flex items-center mb-1 lg:mb-2">
              <FaceSmileIcon className="w-3 h-3 lg:w-5 lg:h-5 text-green-600 mr-1 lg:mr-2" />
              <h3 className="text-xs lg:text-lg font-bold text-gray-900">Real-time Feedback</h3>
            </div>
            <div className="space-y-1 lg:space-y-2 overflow-y-auto max-h-full">
              <div className="flex items-center justify-between p-2 lg:p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all text-xs lg:text-sm">
                <div className="flex items-center">
                  <FaceSmileIcon className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500 mr-1 lg:mr-2 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">Body Language (Emotion):</span>
                </div>
                <div className="flex items-center">
                  {getFeedbackIconAndColor(emotion, 'emotion').icon}
                  <span className={`${getFeedbackIconAndColor(emotion, 'emotion').color} ml-1 lg:ml-2 font-medium`}>
                    {emotion}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 lg:p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all text-xs lg:text-sm">
                <div className="flex items-center">
                  <EyeIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500 mr-1 lg:mr-2 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">Eye Contact:</span>
                </div>
                <div className="flex items-center">
                  {getFeedbackIconAndColor(eyeContact, 'eye').icon}
                  <span className={`${getFeedbackIconAndColor(eyeContact, 'eye').color} ml-1 lg:ml-2 font-medium`}>
                    {eyeContact}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 lg:p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all text-xs lg:text-sm">
                <div className="flex items-center">
                  <SpeakerWaveIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-500 mr-1 lg:mr-2 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">Voice Tone:</span>
                </div>
                <div className="flex items-center">
                  {getFeedbackIconAndColor(tone, 'tone').icon}
                  <span className={`${getFeedbackIconAndColor(tone, 'tone').color} ml-1 lg:ml-2 font-medium`}>
                    {tone}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 lg:p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all text-xs lg:text-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 mr-1 lg:mr-2 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">Grammar Errors:</span>
                </div>
                <div className="flex items-center">
                  {getFeedbackIconAndColor(grammarErrors, 'grammar').icon}
                  <span className={`${getFeedbackIconAndColor(grammarErrors, 'grammar').color} ml-1 lg:ml-2 font-medium`}>
                    {grammarErrors}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="flex-shrink-0">
            <div className="flex items-center mb-1 lg:mb-2">
              <DocumentTextIcon className="w-3 h-3 lg:w-5 lg:h-5 text-gray-600 mr-1 lg:mr-2" />
              <h3 className="text-xs lg:text-lg font-bold text-gray-900">Transcript</h3>
            </div>
            <div className="min-h-[60px] lg:min-h-[80px] border-2 border-gray-200 p-2 lg:p-3 bg-white rounded-lg shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs lg:text-sm overflow-y-auto max-h-32 lg:max-h-40">
              {transcript || (
                <p className="text-gray-500 italic text-center py-2 lg:py-4">Start speaking to see your transcript appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Footer - Integrated at bottom if space allows */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-2 bg-white/50 backdrop-blur-sm border-t border-white/30 text-center text-xs text-gray-600">
        <p className="leading-tight">
          <span className="font-semibold text-blue-600">Pro Tip:</span> Speak clearly and maintain eye contact. Requires camera/mic access.
        </p>
      </div>
    </div>
  );
};

export default HRTestPage;
