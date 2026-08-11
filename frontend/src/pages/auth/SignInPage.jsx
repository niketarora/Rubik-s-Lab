import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const SignInPage = () => {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    signIn(email, password);
    navigate('/dashboard');
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      {/* Centered Auth Card */}
      <div className="bg-surface border border-subtle rounded-card p-8 w-full max-w-[460px] flex flex-col items-center">
        {/* Minimal 2x2 Logomark */}
        <div className="w-[36px] h-[36px] rounded-[8px] overflow-hidden grid grid-cols-2 grid-rows-2 flex-shrink-0 border border-subtle mb-4">
          <div className="bg-cube-red"></div>
          <div className="bg-cube-blue"></div>
          <div className="bg-cube-green"></div>
          <div className="bg-cube-yellow"></div>
        </div>

        <h2 className="text-[22px] font-bold text-primary font-sans text-center mb-1">
          Welcome Back
        </h2>
        <p className="text-[13px] text-secondary font-sans text-center mb-6">
          Unlock absolute optimization logs.
        </p>

        {/* Google OAuth Button */}
        <Button
          variant="secondary"
          fullWidth
          onClick={handleGoogleSignIn}
          className="flex items-center gap-2 font-semibold mb-6 justify-center h-11"
        >
          {/* Mock Google colored G */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h3.99c2.34-2.16 3.68-5.32 3.68-8.75z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.99-3.13c-1.11.75-2.53 1.19-3.94 1.19-3.03 0-5.6-2.05-6.52-4.82H1.41v3.23C3.39 21.5 7.42 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.48 14.33A7.17 7.17 0 0 1 5.06 12c0-.8.14-1.6.42-2.33V6.44H1.41A11.93 11.93 0 0 0 0 12c0 2.11.55 4.1 1.41 5.56l4.07-3.23z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.93 1.19 15.24 0 12 0 7.42 0 3.39 2.5 1.41 6.44l4.07 3.23C6.4 6.8 8.97 4.75 12 4.75z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>

        {/* OR Separator */}
        <div className="flex items-center w-full mb-6 text-muted">
          <div className="flex-grow border-t border-subtle"></div>
          <span className="text-[11px] font-bold uppercase px-3 font-sans text-secondary select-none">
            OR
          </span>
          <div className="flex-grow border-t border-subtle"></div>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="operator@laboratory.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            labelClassName="text-primary" // design spec says auth form labels are dark
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            labelClassName="text-primary"
            rightLabelAction={
              <Link
                to="/auth/reset-password"
                className="text-[11px] font-semibold text-accent-blue hover:text-blue-700 hover:underline font-sans"
              >
                Forgot password?
              </Link>
            }
          />

          {error && (
            <div className="text-[13px] text-accent-red font-medium font-sans">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary-black"
            fullWidth
            disabled={loading}
            className="mt-2 h-11 font-semibold"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center select-none text-[13px] text-secondary font-sans">
          New operator?{' '}
          <Link
            to="/auth/sign-up"
            className="text-accent-blue font-bold hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
