import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    // Simulate loading for auth code swap
    const timer = setTimeout(() => {
      signInWithGoogle(); // Sign in with mock Google profile
      navigate('/dashboard');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, signInWithGoogle]);

  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Loading spinner */}
        <div className="w-10 h-10 border-4 border-subtle border-t-accent-blue rounded-full animate-spin"></div>
        <p className="text-[14px] text-secondary font-semibold font-sans">
          Restoring security session...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
