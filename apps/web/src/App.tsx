import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CommandPalette } from '@/components/search/CommandPalette';
import { CommandPaletteProvider, useCommandPaletteContext } from '@/contexts/CommandPaletteContext';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { Skeleton } from '@/components/ui/skeleton';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ChannelPage = lazy(() => import('@/pages/ChannelPage').then((m) => ({ default: m.ChannelPage })));
const CreateOrganizationPage = lazy(() => import('@/pages/workspaces/CreateOrganizationPage').then((m) => ({ default: m.CreateOrganizationPage })));
const CreateWorkspacePage = lazy(() => import('@/pages/workspaces/CreateWorkspacePage').then((m) => ({ default: m.CreateWorkspacePage })));
const JoinWorkspacePage = lazy(() => import('@/pages/workspaces/JoinWorkspacePage').then((m) => ({ default: m.JoinWorkspacePage })));
const CreateChannelPage = lazy(() => import('@/pages/channels/CreateChannelPage').then((m) => ({ default: m.CreateChannelPage })));
const NotePage = lazy(() => import('@/pages/NotePage').then((m) => ({ default: m.NotePage })));
const NotesPage = lazy(() => import('@/pages/notes/NotesPage').then((m) => ({ default: m.NotesPage })));
const CreateNotePage = lazy(() => import('@/pages/notes/CreateNotePage').then((m) => ({ default: m.CreateNotePage })));
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectBoardPage = lazy(() => import('@/pages/projects/ProjectBoardPage').then((m) => ({ default: m.ProjectBoardPage })));
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const FilesPage = lazy(() => import('@/pages/files/FilesPage').then((m) => ({ default: m.FilesPage })));

function AppContent() {
  const { isOpen, close } = useCommandPaletteContext();
  useMessageNotifications();

  const pageFallback = (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
    </div>
  );

  return (
    <>
      <Suspense fallback={pageFallback}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations/new"
            element={
              <ProtectedRoute>
                <CreateOrganizationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/new"
            element={
              <ProtectedRoute>
                <CreateWorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join"
            element={
              <ProtectedRoute>
                <JoinWorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channels/:channelId"
            element={
              <ProtectedRoute>
                <ChannelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/:workspaceId/channels/new"
            element={
              <ProtectedRoute>
                <CreateChannelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:noteId"
            element={
              <ProtectedRoute>
                <NotePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/:workspaceId/notes"
            element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/:workspaceId/notes/new"
            element={
              <ProtectedRoute>
                <CreateNotePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/:workspaceId/activity"
            element={
              <ProtectedRoute>
                <ActivityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/:workspaceId/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspaces/:workspaceId/files"
            element={
              <ProtectedRoute>
                <FilesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <CommandPaletteProvider>
              <AppContent />
              <Toaster />
            </CommandPaletteProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
