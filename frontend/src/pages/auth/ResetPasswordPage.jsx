import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stage, setStage] = useState(1); // 1 = Request, 2 = Set new password
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRequestReset = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    setError(null);
    setSuccess(true);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    alert('Password updated successfully!');
    navigate('/auth/sign-in');
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="bg-surface border border-subtle rounded-card p-8 w-full max-w-[460px] flex flex-col items-center">
        {/* Minimal 2x2 Logomark */}
        <div className="w-[36px] h-[36px] rounded-[8px] overflow-hidden grid grid-cols-2 grid-rows-2 flex-shrink-0 border border-subtle mb-4">
          <div className="bg-cube-red"></div>
          <div className="bg-cube-blue"></div>
          <div className="bg-cube-green"></div>
          <div className="bg-cube-yellow"></div>
        </div>

        <h2 className="text-[22px] font-bold text-primary font-sans text-center mb-1">
          {stage === 1 ? 'Reset Password' : 'Update Password'}
        </h2>
        <p className="text-[13px] text-secondary font-sans text-center mb-6">
          {stage === 1
            ? 'Retrieve access to your optimization sandbox.'
            : 'Enter a strong, secure new password.'}
        </p>

        {stage === 1 ? (
          success ? (
            <div className="w-full flex flex-col gap-4 text-center mt-2">
              <div className="bg-accent-green-bg border border-accent-green/20 rounded-btn p-4 text-[14px] text-accent-green font-medium font-sans">
                Reset link sent to <strong>{email}</strong>. Check your inbox.
              </div>
              {/* Button to simulate clicking link in email (proceeds to stage 2) */}
              <Button
                variant="primary-black"
                fullWidth
                onClick={() => {
                  setSuccess(false);
                  setStage(2);
                }}
                className="h-11"
              >
                Simulate Email Link Click
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="w-full flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="operator@laboratory.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                labelClassName="text-primary"
              />

              {error && (
                <div className="text-[13px] text-accent-red font-medium font-sans">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary-black" fullWidth className="mt-2 h-11">
                Send Reset Link
              </Button>
            </form>
          )
        ) : (
          <form onSubmit={handleUpdatePassword} className="w-full flex flex-col gap-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              labelClassName="text-primary"
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              labelClassName="text-primary"
            />

            {error && (
              <div className="text-[13px] text-accent-red font-medium font-sans">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary-black" fullWidth className="mt-2 h-11">
              Update Password
            </Button>
          </form>
        )}

        <div className="mt-6 text-center select-none text-[13px] text-secondary font-sans">
          Remember credentials?{' '}
          <Link
            to="/auth/sign-in"
            className="text-accent-blue font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
