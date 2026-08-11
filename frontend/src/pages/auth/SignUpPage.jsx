import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Checkbox from '../../components/common/Checkbox';

const SignUpPage = () => {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setError(null);
    try {
      const res = await signUp(name, email, password);
      if (res.success) {
        setSuccessMsg(res.message);
        // Clear fields
        setName('');
        setEmail('');
        setPassword('');
        setAgreed(false);
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    }
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
          Register Workspace
        </h2>
        <p className="text-[13px] text-secondary font-sans text-center mb-6">
          Create a free sandbox for performance analytics.
        </p>

        {successMsg ? (
          <div className="w-full flex flex-col gap-4 text-center mt-2">
            <div className="bg-accent-green-bg border border-accent-green/20 rounded-btn p-4 text-[14px] text-accent-green font-medium font-sans">
              {successMsg}
            </div>
            <Link to="/auth/sign-in" className="mt-2">
              <Button variant="primary-black" fullWidth className="h-11">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              labelClassName="text-primary"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="operator@laboratory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              labelClassName="text-primary"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              labelClassName="text-primary"
            />

            {/* Checkbox for terms */}
            <Checkbox
              label="I agree to the Terms of Service & Privacy Policy."
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}

        {!successMsg && (
          <div className="mt-6 text-center select-none text-[13px] text-secondary font-sans">
            Already registered?{' '}
            <Link
              to="/auth/sign-in"
              className="text-accent-blue font-bold hover:underline"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
