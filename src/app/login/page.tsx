'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, loginWithGoogle } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(loginUsername, loginPassword);
    setSubmitting(false);
    if (result.success) router.push('/');
    else setError(result.error || 'Login failed');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(signupPassword)) {
      setError('Password needs 6+ chars, uppercase, lowercase, and a number.');
      return;
    }
    setSubmitting(true);
    const result = await signup(signupUsername, signupEmail, signupPassword, signupConfirmPassword);
    setSubmitting(false);
    if (result.success) router.push('/');
    else setError(result.error || 'Signup failed');
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setError('');
      setSubmitting(true);
      const result = await loginWithGoogle(credentialResponse.credential);
      setSubmitting(false);
      if (result.success) router.push('/');
      else setError(result.error || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="mb-10 text-center animate-slide-up">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
          <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 21h18v-2H2v2M20 8h-2V5h2v3m2-3v5c0 1.1-.9 2-2 2h-2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2h2v3m-4 5V5H4v8h12Z" />
          </svg>
        </div>
        <h1 className="text-6xl font-black text-primary font-cursive tracking-tight mb-2">
          Cafe Aroma
        </h1>
        <p className="text-secondary font-medium tracking-wide italic">A soothing experience in every cup</p>
      </div>

      {/* Flippable Card Container */}
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-inner">
          
          {/* FRONT: LOGIN */}
          <div className="flip-card-front">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(74,55,40,0.15)] border border-[#E5E0D5] flex flex-col h-full">
              <h2 className="text-3xl font-black text-primary font-cursive mb-6 text-center">Welcome Back</h2>
              
              {error && !isFlipped && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-6 flex-grow" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary ml-1">Username</label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="input-premium w-full text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-premium w-full text-base"
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn-premium w-full text-lg py-4 mt-4">
                  {submitting ? 'Brewing session...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="border-t border-[#E5E0D5] w-full absolute"></div>
                  <span className="bg-white px-4 text-xs font-bold text-muted uppercase tracking-widest relative z-10">Or continue with</span>
                </div>

                <div className="flex justify-center w-full">
                  <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google login failed')}
                      useOneTap
                      theme="outline"
                      shape="pill"
                      width="100%"
                    />
                  </GoogleOAuthProvider>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#F3EEE5] text-center">
                <p className="text-sm text-secondary font-medium">
                  New to Cafe Aroma?{' '}
                  <button onClick={toggleFlip} className="text-primary font-black hover:underline underline-offset-4 decoration-2 transition-all">
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* BACK: SIGNUP */}
          <div className="flip-card-back">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(74,55,40,0.15)] border border-[#E5E0D5] flex flex-col h-full">
              <h2 className="text-3xl font-black text-primary font-cursive mb-6 text-center">Join the Community</h2>

              {error && isFlipped && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-4 flex-grow" onSubmit={handleSignup}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary ml-1">Username</label>
                  <input
                    type="text"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="input-premium w-full py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="input-premium w-full py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary ml-1">Password</label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="input-premium w-full py-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary ml-1">Confirm</label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="input-premium w-full py-2"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-premium w-full py-3.5 mt-4">
                  {submitting ? 'Setting your table...' : 'Begin Journey'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#F3EEE5] text-center">
                <p className="text-sm text-secondary font-medium">
                  Already a member?{' '}
                  <button onClick={toggleFlip} className="text-primary font-black hover:underline underline-offset-4 decoration-2 transition-all">
                    Sign in here
                  </button>
                </p>
              </div>
              
              <div className="mt-4 text-[10px] text-muted text-center leading-tight">
                By signing up, you agree to our <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-12 animate-slide-up">
        <Link href="/" className="flex items-center text-secondary hover:text-primary transition-colors font-bold group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform inline-block">←</span>
          Return to Browse Menu
        </Link>
      </div>
    </div>
  );
}
