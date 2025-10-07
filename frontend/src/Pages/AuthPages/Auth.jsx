import React, { useEffect, useState } from "react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const root = window.document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }, []);

  const validate = () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (isSignUp && password !== confirmPassword) e.confirmPassword = "Passwords must match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (isSignUp) {
      alert("Welcome aboard — account created (demo)");
      setIsSignUp(false);
      setPassword("");
      setConfirmPassword("");
    } else {
      alert("Signed in (demo)");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="hidden md:flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg">
          <div className="mb-6">
            <div className="text-3xl font-bold tracking-tight">Career Readiness Assistant</div>
            <p className="mt-2 text-sm opacity-90">Assess skills, get tailored feedback, and connect with recruiters — start with an account.</p>
          </div>
          <ul className="space-y-3 text-sm mt-4 opacity-95">
            <li className="flex items-start gap-3"><span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</span> Skill-based assessments</li>
            <li className="flex items-start gap-3"><span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</span> Personalized improvement paths</li>
            <li className="flex items-start gap-3"><span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</span> Recruiter-ready summaries</li>
          </ul>
          <div className="mt-auto text-xs opacity-85">Secure • Private • Designed for students</div>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{isSignUp ? "Create your account" : "Welcome back"}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{isSignUp ? "Sign up to track your readiness" : "Sign in to continue"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 w-full p-3 rounded-lg border ${errors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none`}
                placeholder="you@university.edu"
                aria-invalid={!!errors.email}
              />
              {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1 w-full p-3 rounded-lg border ${errors.password ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none`}
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-sm text-gray-500 dark:text-gray-300">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-1 w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none`}
                  placeholder="Repeat your password"
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <div className="text-xs text-red-500 mt-1">{errors.confirmPassword}</div>}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600" />
                <span>Remember me</span>
              </label>
              {!isSignUp && <a href="#" className="text-sm text-blue-600 dark:text-blue-400">Forgot?</a>}
            </div>

            <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-medium hover:scale-[1.01] transition">
              {isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <p className="text-gray-700 dark:text-gray-300">Already have an account? <button onClick={() => setIsSignUp(false)} className="text-blue-600 dark:text-blue-400 font-medium">Sign in</button></p>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">Don't have an account? <button onClick={() => setIsSignUp(true)} className="text-blue-600 dark:text-blue-400 font-medium">Sign up</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}