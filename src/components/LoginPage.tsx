import React, { useState, useEffect } from 'react';
import { User, DispatchedEmail } from '../types';
import { api } from '../api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  availableUsers?: User[];
}

type AuthMode = 'login' | 'forgot_email' | 'forgot_code' | 'forgot_success';
type RolePortal = 'staff' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  availableUsers = [],
}) => {
  const [activePortal, setActivePortal] = useState<RolePortal>('staff');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password states
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

  // When switching portals, clear errors and reset mode
  const handleSwitchPortal = (portal: RolePortal) => {
    setActivePortal(portal);
    setErrorMsg(null);
    if (mode !== 'login') {
      setMode('login');
    }
  };

  // Handle Standard Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your email and password.');
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
      setErrorMsg('Please enter your registered email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.success) {
        setSuccessMsg(res.message || `Verification code sent to ${email.trim()}`);
        setMode('forgot_code');
        setResendTimer(60);

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
        setPassword(newPassword);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-[18px]">
            <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
          </div>
          <div>
            <h1 className="font-headline text-[17px] font-bold text-white tracking-tight leading-tight flex items-center gap-2">
              Nexus Corporate Directory
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                PROD v2.4
              </span>
            </h1>
            <p className="text-[12px] text-slate-400">High-Performance C++ WAL Storage Engine</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-medium">Directory Service Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="material-symbols-outlined text-[16px] text-blue-400">lock</span>
            <span>256-Bit Encrypted Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Login / Forgot Password Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[480px]">
          {/* Main Card */}
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transition-all">
            {/* Top Banner / Portal Selector */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
                {/* Staff Login Tab */}
                <button
                  type="button"
                  onClick={() => handleSwitchPortal('staff')}
                  className={`py-2.5 px-3 rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activePortal === 'staff'
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  <span>Staff Login</span>
                  {activePortal === 'staff' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>

                {/* Admin Login Tab */}
                <button
                  type="button"
                  onClick={() => handleSwitchPortal('admin')}
                  className={`py-2.5 px-3 rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activePortal === 'admin'
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  <span>Admin Login</span>
                  {activePortal === 'admin' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8">
              {/* Header Icon & Title */}
              <div className="flex items-center gap-3.5 mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md transition-colors ${
                    mode === 'forgot_success'
                      ? 'bg-emerald-600 shadow-emerald-500/20'
                      : mode === 'forgot_email' || mode === 'forgot_code'
                      ? 'bg-indigo-600 shadow-indigo-500/20'
                      : activePortal === 'admin'
                      ? 'bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-[#0052cc] shadow-blue-600/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {mode === 'forgot_success'
                      ? 'check_circle'
                      : mode === 'forgot_code'
                      ? 'mark_email_read'
                      : mode === 'forgot_email'
                      ? 'lock_reset'
                      : activePortal === 'admin'
                      ? 'shield_person'
                      : 'account_circle'}
                  </span>
                </div>
                <div>
                  <h2 className="font-headline text-[20px] font-bold text-slate-900 tracking-tight leading-snug">
                    {mode === 'login' && (
                      activePortal === 'admin' ? 'Administrator Login' : 'Staff Member Login'
                    )}
                    {mode === 'forgot_email' && 'Reset Your Password'}
                    {mode === 'forgot_code' && 'Enter Verification Code'}
                    {mode === 'forgot_success' && 'Password Reset Complete!'}
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-normal">
                    {mode === 'login' && (
                      activePortal === 'admin'
                        ? 'Sole administrator portal: staff management & audit logs'
                        : 'Staff portal: view personal employment status and records'
                    )}
                    {mode === 'forgot_email' && 'Enter your email to receive a 6-digit verification code.'}
                    {mode === 'forgot_code' && `Verification code sent to ${email}`}
                    {mode === 'forgot_success' && 'Your new credentials are securely updated in C++ WAL.'}
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-700 text-[13px] border border-red-200 flex items-start gap-2.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <div className="flex-1 leading-snug">{errorMsg}</div>
                </div>
              )}

              {/* Success Banner */}
              {successMsg && mode !== 'forgot_success' && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-[13px] border border-emerald-200 flex items-start gap-2.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-emerald-600">
                    check_circle
                  </span>
                  <div className="flex-1 leading-snug">{successMsg}</div>
                </div>
              )}

              {/* MODE 1: LOGIN FORM */}
              {mode === 'login' && (
                <div>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                        {activePortal === 'admin' ? 'Administrator Email' : 'Staff Email Address'}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-3 pointer-events-none">
                          mail
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={
                            activePortal === 'admin'
                              ? 'kanithisaikiran3036@gmail.com'
                              : 's.jenkins@nexus.corp'
                          }
                          required
                          className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Password Input & Forgot Password Link */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[13px] font-semibold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot_email');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-3 pointer-events-none">
                          key
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
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

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full h-12 text-white font-semibold text-[14px] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2 ${
                        activePortal === 'admin'
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                          : 'bg-[#0052cc] hover:bg-[#0043a8] shadow-blue-500/25'
                      }`}
                    >
                      {loading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Authenticating against C++ WAL...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">login</span>
                          <span>
                            Sign In to {activePortal === 'admin' ? 'Admin Portal' : 'Staff Portal'}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* MODE 2: FORGOT PASSWORD - STEP 1 (REQUEST VERIFICATION CODE) */}
              {mode === 'forgot_email' && (
                <div>
                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                        Registered Account Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-3 pointer-events-none">
                          mail
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. kanithisaikiran3036@gmail.com or s.jenkins@nexus.corp"
                          required
                          autoFocus
                          className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                      <p className="text-[12px] text-slate-500 mt-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-indigo-600">info</span>
                        A 6-digit numeric verification code will be dispatched to your email address.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2.5">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[14px] rounded-xl transition-all shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Dispatching Email via Nodemailer...</span>
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
                        className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[13px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 3: FORGOT PASSWORD - STEP 2 (ENTER CODE & SET NEW PASSWORD) */}
              {mode === 'forgot_code' && (
                <div>
                  {/* Live Email Inspector Banner */}
                  {lastDispatchedEmail && (
                    <div className="mb-5 p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">
                            mark_email_read
                          </span>
                          Dispatched Email Captured
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEmailPreview(true)}
                          className="text-indigo-700 hover:text-indigo-950 font-medium underline cursor-pointer text-[11px]"
                        >
                          View Full Email
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-indigo-100">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Verification Code:</span>
                          <span className="font-mono text-[20px] font-extrabold text-indigo-700 tracking-widest">
                            {lastDispatchedEmail.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => autoFillCode(lastDispatchedEmail.code)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[12px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">flash_on</span>
                          Auto-Fill Code
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    {/* Verification Code Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[13px] font-semibold text-slate-700">
                          6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          disabled={resendTimer > 0 || loading}
                          onClick={handleResendCode}
                          className={`text-[12px] font-medium flex items-center gap-1 ${
                            resendTimer > 0
                              ? 'text-slate-400 cursor-not-allowed'
                              : 'text-indigo-600 hover:text-indigo-800 cursor-pointer'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">refresh</span>
                          {resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
                        </button>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-3 pointer-events-none">
                          pin
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="6-digit code (e.g. 123456)"
                          required
                          autoFocus
                          className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl text-[18px] font-mono tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-3 pointer-events-none">
                          lock
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
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

                    {/* Confirm Password */}
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-3 pointer-events-none">
                          verified_user
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2.5">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[14px] rounded-xl transition-all shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating C++ SQLite Database...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">key</span>
                            <span>Verify Code & Reset Password</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode('forgot_email')}
                        className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[13px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        <span>Change Email Address</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 4: RESET SUCCESS CONFIRMATION */}
              {mode === 'forgot_success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-[36px]">check</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-[18px] font-bold text-slate-900">
                      Password Successfully Reset!
                    </h3>
                    <p className="text-[13px] text-slate-600 mt-1 max-w-sm mx-auto">
                      Your new password has been verified and securely recorded in SQLite WAL. You can now proceed to log in.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 font-mono">
                    Account: <strong className="text-slate-900">{email}</strong>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[14px] rounded-xl transition-all shadow-md shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">login</span>
                      <span>Proceed to Sign In</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info / Security Note */}
          <div className="mt-6 text-center text-[12px] text-slate-400 space-y-1">
            <p className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-slate-500">lock</span>
              Protected by Enterprise Single-Admin RBAC & Email OTP Verification
            </p>
            <p className="text-slate-500 font-mono text-[11px]">
              Nexus Core Engine • C++20 • SQLite WAL • Nodemailer SMTP
            </p>
          </div>
        </div>
      </main>

      {/* Dispatched Email Full Preview Modal */}
      {showEmailPreview && lastDispatchedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-indigo-400">
                  email
                </span>
                <span className="font-semibold text-[14px]">Dispatched Email Inspector</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px] block">close</span>
              </button>
            </div>

            {/* Email Headers */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-[12px] space-y-1">
              <div className="flex">
                <span className="w-16 font-semibold text-slate-500">From:</span>
                <span className="text-slate-800 font-mono">
                  Proton Security &lt;security@proton-address.internal&gt;
                </span>
              </div>
              <div className="flex">
                <span className="w-16 font-semibold text-slate-500">To:</span>
                <span className="text-slate-800 font-mono font-medium">
                  {lastDispatchedEmail.to}
                </span>
              </div>
              <div className="flex">
                <span className="w-16 font-semibold text-slate-500">Subject:</span>
                <span className="text-slate-900 font-medium">{lastDispatchedEmail.subject}</span>
              </div>
              <div className="flex">
                <span className="w-16 font-semibold text-slate-500">Sent At:</span>
                <span className="text-slate-600 font-mono">
                  {new Date(lastDispatchedEmail.sentAt).toLocaleTimeString()} (
                  {new Date(lastDispatchedEmail.sentAt).toLocaleDateString()})
                </span>
              </div>
            </div>

            {/* Rendered Email Body */}
            <div className="p-6">
              <div className="border border-slate-200 rounded-xl p-6 bg-white text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">lock_reset</span>
                </div>
                <h4 className="text-[17px] font-bold text-slate-900">
                  Password Reset Verification Code
                </h4>
                <p className="text-[13px] text-slate-600 max-w-sm mx-auto">
                  Hello {lastDispatchedEmail.toName || 'User'}, we received a request to reset your
                  password. Use the verification code below:
                </p>

                <div className="py-3 px-6 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                  <span className="text-[28px] font-mono font-extrabold tracking-widest text-indigo-700">
                    {lastDispatchedEmail.code}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  This code expires in 10 minutes. If you did not request this reset, please ignore this email.
                </p>
              </div>

              {lastDispatchedEmail.previewUrl && (
                <div className="mt-4 text-center">
                  <a
                    href={lastDispatchedEmail.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
                  >
                    <span>Open in Ethereal Mail Viewer</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  autoFillCode(lastDispatchedEmail.code);
                  setShowEmailPreview(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">flash_on</span>
                <span>Auto-Fill & Close</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-[13px] font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
