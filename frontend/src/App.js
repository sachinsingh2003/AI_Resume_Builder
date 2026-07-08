/** Root App component — providers + routes. Dark-mode is enforced via
 * `class="dark"` wrapper (design guidelines recommend dark default). */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import LegalPage from "@/pages/LegalPage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import Resumes from "@/pages/Resumes";
import ResumeEditor from "@/pages/ResumeEditor";
import ATSChecker from "@/pages/ATSChecker";
import InterviewPrep from "@/pages/InterviewPrep";
import CoverLetter from "@/pages/CoverLetter";
import CareerAdvisor from "@/pages/CareerAdvisor";
import JobTracker from "@/pages/JobTracker";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";

import "@/App.css";

function App() {
  return (
    <div className="App dark min-h-screen bg-background text-foreground">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<LegalPage kind="terms" />} />
            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/contact" element={<LegalPage kind="contact" />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="resumes" element={<Resumes />} />
              <Route path="resumes/:id" element={<ResumeEditor />} />
              <Route path="ats" element={<ATSChecker />} />
              <Route path="interview" element={<InterviewPrep />} />
              <Route path="cover-letter" element={<CoverLetter />} />
              <Route path="career" element={<CareerAdvisor />} />
              <Route path="jobs" element={<JobTracker />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
