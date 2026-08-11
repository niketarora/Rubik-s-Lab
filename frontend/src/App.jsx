import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SolverWorkspace from './pages/SolverWorkspace';
import BenchmarkWorkspace from './pages/BenchmarkWorkspace';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ResultDetailsPage from './pages/ResultDetailsPage';
import DocumentationPage from './pages/DocumentationPage';
import AdminWorkspace from './pages/AdminWorkspace';

// Layout wrapper to conditional show/hide Navbar & Footer
const MainLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-page">
        {children}
      </main>
      <Footer />
    </div>
  );
};

// Route guard for normal registered users
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role === 'GUEST') {
    // Save the original path they wanted to visit
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  return children;
};

// Route guard for admin roles
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <MainLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes */}
        <Route path="/auth/sign-in" element={<SignInPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        
        {/* Workspace views */}
        <Route path="/solve" element={<SolverWorkspace />} />
        <Route path="/solve/:id" element={<ResultDetailsPage />} />
        <Route path="/results/:id" element={<ResultDetailsPage />} />
        
        <Route path="/compare" element={<BenchmarkWorkspace />} />
        
        {/* Docs */}
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/docs/:topic" element={<DocumentationPage />} />

        {/* User Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin Protected Routes */}
        <Route 
          path="/admin/*" 
          element={
            <AdminRoute>
              <AdminWorkspace />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminWorkspace />
            </AdminRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
