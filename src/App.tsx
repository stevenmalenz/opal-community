import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Diagnostic } from './pages/Diagnostic';
import { SkillMap } from './pages/SkillMap';
import { LearningPath } from './pages/LearningPath';
import { ManagerHub } from './pages/ManagerHub';
import { Library } from './pages/Library';
import { Settings } from './pages/Settings';
import { AdminConsole } from './pages/AdminConsole';
import { ProgramProvider } from './context/ProgramContext';
import { UserMemoryProvider } from './context/UserMemoryContext';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { OnboardingPage } from './pages/OnboardingPage';
import { LandingPage } from './pages/LandingPage';
import { LessonView } from './pages/LessonView';
import { FlashCardView } from './pages/FlashCardView';
import { StudyBuddyHub } from './pages/StudyBuddyHub';
import { CertificateView } from './pages/CertificateView';
import { PublicProfile } from './pages/PublicProfile';
import { QAPage } from './pages/QAPage';
import { QuestionDetail } from './pages/QuestionDetail';
import { AskQuestionPage } from './pages/AskQuestionPage';
import { CohortsPage } from './pages/CohortsPage';
import { CohortDetail } from './pages/CohortDetail';
import { CohortSessionView } from './pages/CohortSessionView';
import { CoachingHub } from './pages/CoachingHub';
import { CoachPage } from './pages/CoachPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InviteProcessor } from './components/InviteProcessor';
import { ToolsPage } from './pages/ToolsPage';
import { PublicCoursePage } from './pages/PublicCoursePage';
import { CenterOfExcellencePage } from './pages/CenterOfExcellencePage';
import { GraduatesPage } from './pages/GraduatesPage';

import { GlobalStudyBuddy } from './components/GlobalStudyBuddy';

import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPage } from './pages/DebugPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <InviteProcessor />
        <ProgramProvider>
          <UserMemoryProvider>
            <ChatProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/tools" element={<ToolsPage />} />
                  <Route path="/course" element={<PublicCoursePage />} />
                  <Route path="/course/:courseId" element={<PublicCoursePage />} />
                  <Route path="/agent" element={<CenterOfExcellencePage />} />
                  <Route path="/graduates" element={<GraduatesPage />} />
                  <Route path="/u/:userId" element={<PublicProfile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="path" replace />} />
                    <Route path="dashboard" element={<Navigate to="path" replace />} />
                    <Route path="diagnostic" element={<Diagnostic />} />
                    <Route path="skills" element={<SkillMap />} />
                    <Route path="path" element={<LearningPath />} />
                    <Route path="track/:courseId" element={<LearningPath />} />
                    <Route path="study-buddy" element={<StudyBuddyHub />} />
                    <Route path="qa" element={<QAPage />} />
                    <Route path="qa/new" element={<AskQuestionPage />} />
                    <Route path="qa/:id" element={<QuestionDetail />} />
                    <Route path="cohorts" element={<CohortsPage />} />
                    <Route path="cohorts/:id" element={<CohortDetail />} />
                    <Route path="cohorts/:id/session/:sessionId" element={<CohortSessionView />} />
                    <Route path="coaching" element={<CoachingHub />} />
                    <Route path="certificate" element={<CertificateView />} />
                    <Route path="manager" element={<ManagerHub />} />
                    <Route path="library" element={<Library />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="admin" element={<AdminConsole />} />
                    <Route path="coach" element={<CoachPage />} />
                    <Route path="program/:programId/lesson/:moduleId/:lessonId" element={<LessonView />} />
                    <Route path="guide/:programId/:moduleId/:lessonId" element={<FlashCardView />} />
                    <Route path="debug" element={<DebugPage />} />
                  </Route>
                </Routes>
                <GlobalStudyBuddy />
              </ErrorBoundary>
            </ChatProvider>
          </UserMemoryProvider>
        </ProgramProvider>
      </Router>
    </AuthProvider>

  );
}

export default App;
