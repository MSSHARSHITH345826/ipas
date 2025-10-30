import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CaseProvider } from './contexts/CaseContext';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Chat from './pages/Chat';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import HospitalPortal from './pages/HospitalPortal';
import RecentCases from './pages/RecentCases';
import OCR from './pages/OCR';
import Tasks from './pages/Tasks';
import TrucareCloud from './pages/TrucareCloud';


// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/RecentCases" replace /> : <Login />} />
      <Route
        path="/RecentCases"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RecentCases />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
        <Route
        path="/OCR"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OCR />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/Tasks"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Tasks />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/TrucareCloud"
        element={
          <ProtectedRoute>
            <MainLayout>
              <TrucareCloud />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Cases />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Chat />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Upload />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Analytics />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital-portal"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HospitalPortal />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/RecentCases" replace />} />
      <Route path="*" element={<Navigate to="/RecentCases" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Global error handler to suppress ResizeObserver errors
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      if (typeof args[0] === 'string' && 
          (args[0].includes('ResizeObserver loop completed with undelivered notifications') ||
           args[0].includes('ResizeObserver loop limit exceeded'))) {
        return;
      }
      originalError(...args);
    };
    
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && 
          args[0].includes('ResizeObserver')) {
        return;
      }
      originalWarn(...args);
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('ResizeObserver')) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <CaseProvider>
            <Router>
              <AppRoutes />
            </Router>
          </CaseProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;