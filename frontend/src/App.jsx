import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import StudentDashboard from "./Pages/StudentDashboard";
import { BrowserRouter, Route, Routes } from "react-router";
import HrTest from "./Pages/HrTest";
import TechnicalTest from "./Pages/TechnicalTest";
import ProblemSolving from "./Pages/Problem-solving";
import StudentAnalytics from "./Pages/Analytics";
import AuthPage from "./Pages/AuthPages/Auth";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/"element={<StudentDashboard />}/>

          <Route path="/test-hr" element={<HrTest />} />
          <Route path="/techincal-test" element={<TechnicalTest />} />
          <Route path="/problem-solving" element={<ProblemSolving />} />
          <Route path="/analytics" element={<StudentAnalytics />} />
          <Route path="/auth" element={<AuthPage />} />

        
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
