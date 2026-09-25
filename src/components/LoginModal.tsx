import React, { useState, useEffect } from 'react';
import { User, DispatchedEmail } from '../types';
import { api } from '../api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'forgot_email' | 'forgot_code' | 'forgot_success';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password state
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email simulation / live toast state
  const [lastDispatchedEmail, setLastDispatchedEmail] = useState<DispatchedEmail | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  // Handle Standard Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid email or password');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login error connecting to C++ backend');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Verification Code via Email
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.success) {
        setSuccessMsg(res.message || `Verification code sent to ${email.trim()}`);
        setMode('forgot_code');
        setResendTimer(60); // 60-second cooldown for resending

        // Fetch the simulated/sent email details for live in-app preview
        const mail = await api.getLatestEmail(email.trim());
        if (mail) {
          setLastDispatchedEmail(mail);
        } else if (res.codePreview) {
          setLastDispatchedEmail({
            id: 'mail_' + Date.now(),
            to: email.trim(),
            toName: res.name || 'User',
            subject: `Proton Security: Your Password Reset Code is ${res.codePreview}`,
            code: res.codePreview,
            sentAt: new Date().toISOString(),
            previewUrl: res.previewUrl,
            text: `Your password reset code is: ${res.codePreview}. It expires in 10 minutes.`,
            html: '',
          });
        }
      } else {
        setErrorMsg(res.error || 'Failed to send verification code');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error sending verification email');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.success) {
        setSuccessMsg(`A fresh verification code was sent to ${email.trim()}`);
        setResendTimer(60);
        const mail = await api.getLatestEmail(email.trim());
        if (mail) setLastDispatchedEmail(mail);
      } else {
        setErrorMsg(res.error || 'Failed to resend verification code');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resending code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = resetCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(email.trim(), cleanCode, newPassword);
      if (res.success) {
        setMode('forgot_success');
        setPassword(newPassword); // Preload password for instant sign in
        setErrorMsg(null);
      } else {
        setErrorMsg(res.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resetting password in C++ database');
    } finally {
      setLoading(false);
    }
  };

  const autoFillCode = (code: string) => {
    setResetCode(code);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close modal"
        >
          <span className="material-symbols-outlined text-[20px] block">close</span>
        </button>

        {/* Header Icon & Titles */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs transition-colors ${
              mode === 'forgot_success'
                ? 'bg-emerald-600'
                : mode === 'forgot_email' || mode === 'forgot_code'
                ? 'bg-indigo-600'
                : 'bg-[#1e40af]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {mode === 'forgot_success'
                ? 'check_circle'
                : mode === 'forgot_code'
                ? 'mark_email_read'
                : mode === 'forgot_email'
                ? 'lock_reset'
                : 'lock'}
            </span>
          </div>
          <div>
            <h3 className="font-headline text-[18px] font-bold text-[#0f172a]">
              {mode === 'login' && 'Directory Authentication'}
              {mode === 'forgot_email' && 'Forgot Password'}
              {mode === 'forgot_code' && 'Verify Code & Reset'}
              {mode === 'forgot_success' && 'Password Updated!'}
            </h3>
            <p className="text-[12px] text-[#64748b]">
              {mode === 'login' && 'Sign in with your email and password.'}
              {mode === 'forgot_email' && 'We will send a 6-digit verification code to your email.'}
              {mode === 'forgot_code' && `Verification code sent to ${email}`}
              {mode === 'forgot_success' && 'Your credentials have been securely stored in C++ WAL.'}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-[13px] border border-red-200 flex items-start gap-2.5 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 leading-snug">{errorMsg}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && mode !== 'forgot_success' && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[13px] border border-emerald-200 flex items-start gap-2.5 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-emerald-600">
              check_circle
            </span>
            <div className="flex-1 leading-snug">{successMsg}</div>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-3 pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@nexus.corp"
                    required
                    className="w-full h-11 pl-10 pr-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] font-medium text-[#334155]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_email');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[12px] font-medium text-[#0052cc] hover:text-[#003d99] hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-3 pointer-events-none">
                    key
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-11 pl-10 pr-10 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px] block">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0052cc] hover:bg-[#0043a8] text-white font-medium text-[14px] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating in C++ WAL...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Sign In to Directory</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* MODE 2: FORGOT PASSWORD - REQUEST VERIFICATION CODE */}
        {mode === 'forgot_email' && (
          <div>
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-3 pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kanithisaikiran3036@gmail.com"
                    required
                    autoFocus
                    className="w-full h-11 pl-10 pr-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-indigo-600">info</span>
                  A 6-digit numeric security code will be generated and dispatched to your email.
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[14px] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Dispatching Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="w-full h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[13px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back to Sign In
                </button>
              </div>
            </form>

            {/* Quick Email Selection for Fast Reset Verification */}
            <div className="mt-6 pt-4 border-t border-[#f1f5f9]">
              <span className="text-[11px] font-mono uppercase text-[#64748b] tracking-wider block mb-2">
                Quick Select Registered User
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setEmail('kanithisaikiran3036@gmail.com')}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-[12px] flex items-center justify-between cursor-pointer"
                >
                  <span className="font-mono text-slate-800">kanithisaikiran3036@gmail.com</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                    Admin
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmail('s.jenkins@nexus.corp')}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-[12px] flex items-center justify-between cursor-pointer"
                >
                  <span className="font-mono text-slate-800">s.jenkins@nexus.corp</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    Staff
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: FORGOT PASSWORD - ENTER VERIFICATION CODE & NEW PASSWORD */}
        {mode === 'forgot_code' && (
          <div>
            {/* Live Dispatched Email Alert Toast / Card */}
            {lastDispatchedEmail && (
              <div className="mb-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">
                      Email Dispatched To Inbox
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                    10m Expiry
                  </span>
                </div>

                <div className="text-[12px] text-indigo-950 font-medium truncate mb-2">
                  Subject: {lastDispatchedEmail.subject}
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Security Code:</span>
                    <span className="font-mono text-[16px] font-extrabold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {lastDispatchedEmail.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => autoFillCode(lastDispatchedEmail.code)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      Auto-Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailPreview(true)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      title="Inspect HTML Email"
                    >
                      View Mail
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] font-medium text-[#334155]">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || loading}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-3 pointer-events-none">
                    pin
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                    className="w-full h-11 pl-10 pr-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[16px] tracking-widest font-mono text-[#0f172a] focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-3 pointer-events-none">
                    key
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full h-11 pl-10 pr-10 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <span className="material-symbols-outlined text-[18px] block">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-3 pointer-events-none">
                    lock_clock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full h-11 pl-10 pr-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[14px] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Database in C++ WAL...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Verify & Reset Password</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[12px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_email');
                      setErrorMsg(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                  >
                    Change email address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* MODE 4: SUCCESS CONFIRMATION */}
        {mode === 'forgot_success' && (
          <div className="text-center py-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>

            <h4 className="text-[17px] font-bold text-slate-900 mb-2">
              Password Changed Successfully!
            </h4>
            <p className="text-[13px] text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
              Your new password has been verified and updated in the high-performance C++ storage engine for{' '}
              <strong className="text-slate-900 font-mono text-[12px]">{email}</strong>.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  // Direct 1-click login with the newly created password!
                  setLoading(true);
                  try {
                    const res = await api.login(email.trim(), password);
                    if (res.success && res.user) {
                      onLoginSuccess(res.user);
                      onClose();
                    } else {
                      setMode('login');
                    }
                  } catch {
                    setMode('login');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[14px] rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In Immediately</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="w-full h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[13px] rounded-xl transition-colors cursor-pointer"
              >
                Return to Login Screen
              </button>
            </div>
          </div>
        )}

        {/* Live Email Inspector Modal */}
        {showEmailPreview && lastDispatchedEmail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                    outgoing_mail
                  </span>
                  <span className="font-bold text-[15px] text-slate-900">
                    Dispatched Email Preview
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] block">close</span>
                </button>
              </div>

              <div className="space-y-2 text-[12px] bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 font-mono">
                <div>
                  <span className="text-slate-400">From: </span>
                  <span className="text-slate-800">
                    Proton Security &lt;security@proton-address.internal&gt;
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">To: </span>
                  <span className="text-indigo-600 font-semibold">{lastDispatchedEmail.to}</span>
                </div>
                <div>
                  <span className="text-slate-400">Subject: </span>
                  <span className="text-slate-900 font-semibold">{lastDispatchedEmail.subject}</span>
                </div>
                <div>
                  <span className="text-slate-400">Sent: </span>
                  <span className="text-slate-600">
                    {new Date(lastDispatchedEmail.sentAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Render email HTML preview */}
              <div
                className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-white"
                dangerouslySetInnerHTML={{
                  __html:
                    lastDispatchedEmail.html ||
                    `<div style="font-family:sans-serif; text-align:center; padding:20px;">
                      <h2>Password Reset Code</h2>
                      <div style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#0052cc; margin:16px 0;">${lastDispatchedEmail.code}</div>
                      <p style="color:#64748b;">Expires in 10 minutes</p>
                    </div>`,
                }}
              />

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    autoFillCode(lastDispatchedEmail.code);
                    setShowEmailPreview(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Use This Code ({lastDispatchedEmail.code})
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
