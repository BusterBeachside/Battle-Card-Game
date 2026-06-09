import React, { useState } from 'react';
import { getSupabase } from '../../utils/supabaseClient';
import { syncUserData } from '../../utils/supabaseSync';
import { ProgressionData } from '../../utils/progression';
import { Mail, ShieldCheck, Key, RefreshCw, X, AlertCircle, Sparkles, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { playSound } from '../../utils/soundUtils';

interface UnderdogLoginModalProps {
  progression: ProgressionData;
  onClose: () => void;
  onAuthSuccess: (user: any, syncedProg: ProgressionData, source: 'local' | 'cloud') => void;
}

export const UnderdogLoginModal: React.FC<UnderdogLoginModalProps> = ({
  progression,
  onClose,
  onAuthSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [mode, setMode] = useState<'SIGN_IN' | 'REGISTER' | 'RESET_PASSWORD'>('SIGN_IN');
  const [step, setStep] = useState<'FORM' | 'VERIFY' | 'SUCCESS'>('FORM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncDetails, setSyncDetails] = useState<{ source: 'local' | 'cloud' | null }>({ source: null });
  const [resetSuccess, setResetSuccess] = useState(false);

  const supabase = getSupabase();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase URL and Anon Key are not configured in environment variables.");
      return;
    }

    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    playSound('menu_click');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });

      if (resetError) {
        throw resetError;
      }

      setResetSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while resetting password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase URL and Anon Key are not configured in environment variables.");
      return;
    }

    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    playSound('menu_click');

    try {
      if (mode === 'SIGN_IN') {
        // Sign In Directly with Email + Password
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (loginError) {
          throw loginError;
        }

        const user = data.user;
        if (!user) {
          throw new Error("Failed to retrieve user profile after signing in.");
        }

        // Sync local progression and cloud data upon login
        const { syncedData, source } = await syncUserData(user.id, progression);
        setSyncDetails({ source });
        setStep('SUCCESS');

        setTimeout(() => {
          onAuthSuccess(user, syncedData, source);
          onClose();
        }, 2200);

      } else {
        // Create Account (REGISTER) with Email + Password
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (signUpError) {
          throw signUpError;
        }

        const user = data.user;
        if (!user) {
          throw new Error("Failed to register new account. Check details.");
        }

        // If the email is already confirmed or auto-confirm is enabled, session is active immediately
        const session = data.session;
        if (session || (user.identities && user.identities.length > 0 && user.email_confirmed_at)) {
          const { syncedData, source } = await syncUserData(user.id, progression);
          setSyncDetails({ source });
          setStep('SUCCESS');

          setTimeout(() => {
            onAuthSuccess(user, syncedData, source);
            onClose();
          }, 2200);
        } else {
          // Email confirmation code verification required
          setStep('VERIFY');
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (!token || token.trim().length === 0) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    playSound('menu_click');

    try {
      // Verify OTP pin code (type 'signup')
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup'
      });

      if (verifyError) {
        throw verifyError;
      }

      const user = data.user;
      if (!user) {
        throw new Error("No user profile returned after verification.");
      }

      // Sync progression with database
      const { syncedData, source } = await syncUserData(user.id, progression);

      setSyncDetails({ source });
      setStep('SUCCESS');
      
      setTimeout(() => {
        onAuthSuccess(user, syncedData, source);
        onClose();
      }, 2200);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid or expired confirmation code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="underdog-login-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        {step !== 'SUCCESS' && (
          <button 
            type="button"
            onClick={() => { playSound('menu_click'); onClose(); }}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Modal Head Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2.5 animate-pulse">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-black font-title text-white tracking-wide">
            UNDERDOG ID
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Unified Gaming Account & Cloud Sync
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-900/40 rounded-xl flex items-start gap-2.5 text-red-350 text-xs leading-relaxed animate-in slide-in-from-top-1 duration-150">
            <AlertCircle className="shrink-0 w-4 h-4 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'FORM' && mode === 'RESET_PASSWORD' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest font-title">
                Password Recovery
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Lost access to your account? Enter your email address below and we'll send you a password reset verification link.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 size={16} />
                  <span>Reset Link Transmitted</span>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  A password recovery link has been transmitted to <strong className="text-slate-200">{email}</strong>. Check your inbox to set a new password, then return here to login.
                </p>
                <button
                  type="button"
                  onClick={() => { playSound('menu_click'); setMode('SIGN_IN'); setResetSuccess(false); setError(null); }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-title">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 font-medium text-sm transition-all outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <span>Send Recovery Email</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { playSound('menu_click'); setMode('SIGN_IN'); setError(null); }}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-white transition-colors py-1 cursor-pointer"
                  >
                    Cancel and Return
                  </button>
                </div>
              </>
            )}
          </form>
        ) : step === 'FORM' && (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Toggle tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => { playSound('menu_click'); setMode('SIGN_IN'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold font-title uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  mode === 'SIGN_IN' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { playSound('menu_click'); setMode('REGISTER'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold font-title uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  mode === 'REGISTER' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-title">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 font-medium text-sm transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-title">
                  Password
                </label>
                {mode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={() => { playSound('menu_click'); setMode('RESET_PASSWORD'); setError(null); }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 font-medium text-sm transition-all outline-none"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Helpful subtext */}
            <p className="text-[10px] text-slate-500 leading-normal">
              {mode === 'SIGN_IN' 
                ? "Secure login to access cloud save data instantenously." 
                : "Creates account & registers details securely. Email confirmation may be requested."}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <span>{mode === 'SIGN_IN' ? 'Sign In' : 'Create Account'}</span>
                  <Sparkles size={14} className="text-indigo-200" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'VERIFY' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-title">
                  Verification Code / Pin
                </label>
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="text-[10px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                  disabled={loading}
                >
                  Change Email
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Enter signup pin code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 font-mono tracking-widest text-center text-lg font-bold transition-all outline-none"
                  disabled={loading}
                />
              </div>
              <p className="text-[10px] text-indigo-300 leading-normal text-center">
                We sent a signup verification pin code to <strong className="text-white">{email}</strong>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <span>Verify Pin Code & Complete Register</span>
              )}
            </button>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={36} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-title">Authentication Succeeded!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connected to <strong className="text-indigo-400">{email}</strong> securely.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              {syncDetails.source === 'local' ? (
                <span>
                  ☁️ Local profile had higher progress. Submitting local data to the Cloud...
                </span>
              ) : (
                <span>
                  ☁️ Cloud profile retrieved successfully. Synchronizing save data to this build...
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
