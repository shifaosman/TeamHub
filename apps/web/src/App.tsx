import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChannelPage } from '@/pages/ChannelPage';
import { CreateOrganizationPage } from '@/pages/workspaces/CreateOrganizationPage';
import { CreateWorkspacePage } from '@/pages/workspaces/CreateWorkspacePage';
import { CreateChannelPage } from '@/pages/channels/CreateChannelPage';
import { NotePage } from '@/pages/NotePage';
import { NotesPage } from '@/pages/notes/NotesPage';
import { CreateNotePage } from '@/pages/notes/CreateNotePage';
import { CommandPalette } from '@/components/search/CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';

function AppContent() {
  const { isOpen, setIsOpen } = useCommandPalette();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          path="/channels/:channelId"
          element={
            <ProtectedRoute>
              <ChannelPage />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
