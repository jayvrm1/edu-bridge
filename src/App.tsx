/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AppShell } from './components/layout/AppShell';
import { NavRoute } from './components/layout/Sidebar';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AITutorPage } from './pages/tutor/AITutorPage';
import { SignStudioPage } from './pages/sign-language/SignStudioPage';
import { CoursesPage } from './pages/learning/CoursesPage';
import { QuizzesPage } from './pages/quizzes/QuizzesPage';
import { AchievementsPage } from './pages/achievements/AchievementsPage';
import { LeaderboardPage } from './pages/leaderboard/LeaderboardPage';
import { AccessibilityPage } from './pages/accessibility/AccessibilityPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AuthPage } from './pages/auth/AuthPage';
import { BackendStatusModal } from './components/common/BackendStatusModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
        <div className="p-6 bg-white rounded-2xl border-2 border-[#222222] shadow-stitch flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-[#F28C00] animate-ping" />
          <span className="text-sm font-bold text-[#222222]">Initializing EduBridge AI...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={() => setCurrentRoute('dashboard')} />;
  }

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentRoute('courses');
  };

  return (
    <AppShell
      currentRoute={currentRoute}
      onNavigate={(route) => {
        if (route !== 'courses') setSelectedCourseId(null);
        setCurrentRoute(route);
      }}
      onSelectSign={() => setCurrentRoute('sign-studio')}
    >
      {currentRoute === 'dashboard' && (
        <DashboardPage
          onNavigate={(route) => setCurrentRoute(route)}
          onSelectCourse={handleSelectCourse}
        />
      )}

      {currentRoute === 'tutor' && <AITutorPage />}

      {currentRoute === 'sign-studio' && <SignStudioPage />}

      {currentRoute === 'courses' && (
        <CoursesPage
          selectedCourseId={selectedCourseId}
          onSelectCourse={handleSelectCourse}
        />
      )}

      {currentRoute === 'quizzes' && <QuizzesPage />}

      {currentRoute === 'achievements' && <AchievementsPage />}

      {currentRoute === 'leaderboard' && <LeaderboardPage />}

      {currentRoute === 'accessibility' && <AccessibilityPage />}

      {currentRoute === 'profile' && (
        <ProfilePage onOpenBackendModal={() => setIsBackendModalOpen(true)} />
      )}

      <BackendStatusModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </AppShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
