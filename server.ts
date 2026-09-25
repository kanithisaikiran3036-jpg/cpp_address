import express from 'express';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer, { type Transporter } from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Cross-Platform Binary Path Resolution (Windows .exe vs Linux ELF)
const isWindows = process.platform === 'win32';
function resolveBinaryPath(): string {
  const candidates = isWindows
    ? [
        path.join(__dirname, 'bin', 'proton_core_engine.exe'),
        path.join(__dirname, 'cpp-backend', 'proton_core_engine.exe'),
        path.join(__dirname, 'bin', 'proton_core_engine'),
      ]
    : [
        path.join(__dirname, 'bin', 'proton_core_engine'),
        path.join(__dirname, 'bin', 'proton_core_engine.exe'),
      ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, 'bin', isWindows ? 'proton_core_engine.exe' : 'proton_core_engine');
}

const BIN_PATH = resolveBinaryPath();

// Ensure binary is executable (on Unix/Linux)
try {
  if (!isWindows && fs.existsSync(BIN_PATH)) {
    fs.chmodSync(BIN_PATH, 0o755);
  }
} catch (e) {
  console.warn('Could not chmod BIN_PATH:', e);
}

app.use(express.json());

// In-memory store for recent email dispatches to enable UI notification & preview
interface DispatchedEmail {
  id: string;
  to: string;
  toName?: string;
  subject: string;
  code: string;
  sentAt: string;
  previewUrl?: string;
  text: string;
  html: string;
}

const recentEmails: DispatchedEmail[] = [];

// Mail transporter setup
let transporter: Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (e) {
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporter;
}

async function sendVerificationEmail(toEmail: string, toName: string, code: string): Promise<DispatchedEmail> {
  const subject = `Proton Security: Your Password Reset Code is ${code}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <div style="background: #0052cc; width: 32px; height: 32px; border-radius: 8px; display: inline-block; vertical-align: middle; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 16px;">P</div>
          <span style="font-size: 16px; font-weight: 700; color: #0f172a; vertical-align: middle; margin-left: 10px;">Proton Directory Core</span>
        </div>
        
        <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Password Reset Verification</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${toName || 'User'}</strong>,<br/>
          We received a request to reset your password for your account (<span style="color: #0052cc; font-weight: 600;">${toEmail}</span>). Use the verification code below to authorize the password update:
        </p>

        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 14px 28px;">
            <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0052cc; display: block;">
              ${code}
            </span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 10px;">
            ⏱️ Code expires in <strong>10 minutes</strong>.
          </p>
        </div>

        <div style="background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
          <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
            🔒 <strong>Security Warning:</strong> If you did not make this request, ignore this email. Your current password remains secure.
          </p>
        </div>

        <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center;">
          Sent by Proton Address Core Engine • High-Performance C++ WAL Storage
        </div>
      </div>
    </body>
    </html>
  `;

  const emailRecord: DispatchedEmail = {
    id: 'mail_' + Date.now(),
    to: toEmail,
    toName,
    subject,
    code,
    sentAt: new Date().toISOString(),
    previewUrl: '',
    text: `Your password reset verification code is ${code}. It expires in 10 minutes.`,
    html,
  };

  recentEmails.unshift(emailRecord);
  if (recentEmails.length > 50) recentEmails.pop();

  // Dispatch via nodemailer in background or with quick timeout
  (async () => {
    try {
      const mailer = await getTransporter();
      const info = await mailer.sendMail({
        from: '"Proton Directory Security" <security@proton-address.internal>',
        to: toEmail,
        subject,
        text: emailRecord.text,
        html,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        emailRecord.previewUrl = preview;
      }
    } catch (err) {
      console.warn('Nodemailer background dispatch note:', err);
    }
  })();

  return emailRecord;
}

// Send Status Change Notification Email to Staff
async function sendStatusNotificationEmail(
  toEmail: string,
  toName: string,
  newStatus: string,
  oldStatus?: string,
  reason?: string
): Promise<DispatchedEmail> {
  const subject = `Nexus Personnel Notice: Account Status Updated to ${newStatus}`;
  const timestamp = new Date().toLocaleString();

  let statusBg = '#dcfce7';
  let statusColor = '#166534';
  let statusBorder = '#86efac';
  let statusBadgeIcon = '●';
  let statusDescription =
    'Your staff account is currently Active. You have full access to internal directory services, team contacts, and self-status verification.';

  if (newStatus === 'Suspended') {
    statusBg = '#fef3c7';
    statusColor = '#92400e';
    statusBorder = '#fcd34d';
    statusBadgeIcon = '▲';
    statusDescription =
      'Your staff account has been Suspended by Administration. Directory permissions are temporarily restricted. Please reach out to your administrator for clearance.';
  } else if (newStatus === 'Inactive') {
    statusBg = '#f1f5f9';
    statusColor = '#475569';
    statusBorder = '#cbd5e1';
    statusBadgeIcon = '■';
    statusDescription =
      'Your staff account has been set to Inactive. Profile records have been archived in accordance with directory administration policies.';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <div style="background: #0052cc; width: 32px; height: 32px; border-radius: 8px; display: inline-block; vertical-align: middle; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 16px;">N</div>
          <span style="font-size: 16px; font-weight: 700; color: #0f172a; vertical-align: middle; margin-left: 10px;">Nexus Corporate Directory</span>
        </div>
        
        <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Staff Status Update Notification</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${toName}</strong>,<br/>
          This is an official administrative dispatch to notify you that your account status in the Nexus Personnel Directory has been updated.
        </p>

        <div style="margin: 22px 0; text-align: center;">
          <div style="display: inline-block; background: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 12px; padding: 14px 28px;">
            <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
              ${oldStatus ? `Status Changed (${oldStatus} ➔ ${newStatus})` : 'Current Status'}
            </span>
            <span style="font-size: 26px; font-weight: 800; color: ${statusColor};">
              ${statusBadgeIcon} ${newStatus.toUpperCase()}
            </span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 12px; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            ${statusDescription}
          </p>
        </div>

        ${
          reason
            ? `
        <div style="background: #f8fafc; border-radius: 10px; padding: 14px; border: 1px solid #e2e8f0; margin: 18px 0;">
          <strong style="font-size: 12px; color: #334155; display: block; margin-bottom: 4px;">Administrative Reason / Note:</strong>
          <span style="font-size: 13px; color: #475569; line-height: 1.5;">${reason}</span>
        </div>
        `
            : ''
        }

        <div style="background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; margin-top: 18px;">
          <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
            🕒 <strong>Timestamp:</strong> ${timestamp}<br/>
            🛡️ <strong>Authorized By:</strong> System Administrator (Sole Administrator)<br/>
            📧 <strong>Recipient Staff Email:</strong> ${toEmail}
          </p>
        </div>

        <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center;">
          Sent by Nexus Personnel Security Service • C++ WAL Storage Engine
        </div>
      </div>
    </body>
    </html>
  `;

  const emailRecord: DispatchedEmail = {
    id: 'mail_status_' + Date.now(),
    to: toEmail,
    toName,
    subject,
    code: newStatus,
    sentAt: new Date().toISOString(),
    previewUrl: '',
    text: `Your Nexus Corporate Directory staff status has been updated to ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
    html,
  };

  recentEmails.unshift(emailRecord);
  if (recentEmails.length > 50) recentEmails.pop();

  (async () => {
    try {
      const mailer = await getTransporter();
      const info = await mailer.sendMail({
        from: '"Nexus Directory Administration" <security@proton-address.internal>',
        to: toEmail,
        subject,
        text: emailRecord.text,
        html,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        emailRecord.previewUrl = preview;
      }
    } catch (err) {
      console.warn('Nodemailer status notification dispatch note:', err);
    }
  })();

  return emailRecord;
}

// --------------------------------------------------------------------------
// Staff Leave Requests Management with Automated Staff Email Notification
// --------------------------------------------------------------------------
interface LeaveRequestRecord {
  id: string;
  userId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  emergencyContact?: string;
  handoverNotes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  notificationSent?: boolean;
}

const LEAVE_REQUESTS_FILE = path.join(__dirname, 'leave_requests.json');

function loadLeaveRequests(): LeaveRequestRecord[] {
  try {
    if (fs.existsSync(LEAVE_REQUESTS_FILE)) {
      const data = fs.readFileSync(LEAVE_REQUESTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading leave_requests.json, initializing defaults:', e);
  }

  // Seed default realistic requests for staff demonstration
  const defaults: LeaveRequestRecord[] = [
    {
      id: 'LR-2026-001',
      userId: 'u_staff_1001',
      staffId: 'STF-1001',
      staffName: 'Sarah Jenkins',
      staffEmail: 's.jenkins@nexus.corp',
      department: 'Operations',
      leaveType: 'Annual Leave',
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      totalDays: 5,
      reason: 'Annual planned family vacation and personal leave.',
      emergencyContact: '+1 (555) 902-1133 (Spouse)',
      handoverNotes: 'Alex Rivera will oversee pending operations syncs.',
      status: 'Pending',
      submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'LR-2026-002',
      userId: 'u_staff_1002',
      staffId: 'STF-1002',
      staffName: 'Alex Rivera',
      staffEmail: 'a.rivera@nexus.corp',
      department: 'Engineering',
      leaveType: 'Sick Leave',
      startDate: '2026-09-28',
      endDate: '2026-09-29',
      totalDays: 2,
      reason: 'Outpatient dental procedure and recommended recovery rest.',
      emergencyContact: '+1 (555) 888-2910',
      handoverNotes: 'Branch reviews delegated to lead platform architect.',
      status: 'Pending',
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  try {
    fs.writeFileSync(LEAVE_REQUESTS_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial leave_requests.json:', err);
  }

  return defaults;
}

function saveLeaveRequests(requests: LeaveRequestRecord[]): void {
  try {
    fs.writeFileSync(LEAVE_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write leave_requests.json:', err);
  }
}

// Dispatches Leave Status Notification Email to Staff (Accept/Reject)
async function sendLeaveDecisionNotificationEmail(
  leave: LeaveRequestRecord,
  decision: 'Approved' | 'Rejected',
  adminNotes?: string,
  reviewerName: string = 'Sole Administrator (kanithisaikiran3036@gmail.com)'
): Promise<DispatchedEmail> {
  const isApproved = decision === 'Approved';
  const subject = `Nexus Personnel Notice: Leave Request ${isApproved ? 'ACCEPTED & APPROVED' : 'REJECTED'} (${leave.leaveType})`;
  const timestamp = new Date().toLocaleString();

  const statusBg = isApproved ? '#dcfce7' : '#fee2e2';
  const statusColor = isApproved ? '#15803d' : '#b91c1c';
  const statusBorder = isApproved ? '#86efac' : '#fca5a5';
  const statusBadgeIcon = isApproved ? '✓' : '✕';
  const statusHeading = isApproved ? 'LEAVE REQUEST APPROVED' : 'LEAVE REQUEST REJECTED';

  const statusDescription = isApproved
    ? 'Congratulations! Your leave request has been officially ACCEPTED and APPROVED by the System Administrator. Your absence dates have been registered into the personnel schedule.'
    : 'Your leave request has been REJECTED by the System Administrator. Please review the administrative feedback notes below or consult with administration.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <div style="background: #0052cc; width: 32px; height: 32px; border-radius: 8px; display: inline-block; vertical-align: middle; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 16px;">N</div>
          <span style="font-size: 16px; font-weight: 700; color: #0f172a; vertical-align: middle; margin-left: 10px;">Nexus Corporate Directory</span>
        </div>
        
        <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 6px;">Staff Leave Request Decision Notice</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${leave.staffName}</strong> (ID: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${leave.staffId}</code>),<br/>
          This is an official administrative dispatch regarding your leave request <strong style="font-family: monospace;">${leave.id}</strong>.
        </p>

        <!-- Decision Banner -->
        <div style="margin: 22px 0; text-align: center;">
          <div style="display: inline-block; background: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 12px; padding: 16px 32px;">
            <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
              Administrative Decision
            </span>
            <span style="font-size: 24px; font-weight: 800; color: ${statusColor};">
              ${statusBadgeIcon} ${statusHeading}
            </span>
          </div>
          <p style="color: #475569; font-size: 13px; margin-top: 12px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            ${statusDescription}
          </p>
        </div>

        <!-- Request Summary Card -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin: 18px 0; font-size: 13px;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Leave Request Summary</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 38%;">Leave Category:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${leave.leaveType}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Leave Period:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${leave.startDate} to ${leave.endDate}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Total Duration:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${leave.totalDays} day(s)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; vertical-align: top;">Staff Reason:</td>
              <td style="padding: 4px 0; color: #334155;"><em>"${leave.reason}"</em></td>
            </tr>
          </table>
        </div>

        <!-- Admin Feedback Notes -->
        ${
          adminNotes
            ? `
        <div style="background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-radius: 12px; padding: 14px; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}; margin: 18px 0;">
          <strong style="font-size: 12px; color: ${isApproved ? '#166534' : '#991b1b'}; display: block; margin-bottom: 4px;">
            📝 Administrator Feedback / Reason:
          </strong>
          <span style="font-size: 13px; color: ${isApproved ? '#14532d' : '#7f1d1d'}; line-height: 1.5;">${adminNotes}</span>
        </div>
        `
            : ''
        }

        <!-- Dispatch Audit Details -->
        <div style="background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; margin-top: 18px;">
          <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
            🕒 <strong>Decision Timestamp:</strong> ${timestamp}<br/>
            🛡️ <strong>Reviewed By:</strong> ${reviewerName}<br/>
            📧 <strong>Recipient Staff Email:</strong> ${leave.staffEmail}
          </p>
        </div>

        <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center;">
          Sent by Nexus Personnel Leave Management • C++ SQLite WAL Backend
        </div>
      </div>
    </body>
    </html>
  `;

  const emailRecord: DispatchedEmail = {
    id: 'mail_leave_' + Date.now(),
    to: leave.staffEmail,
    toName: leave.staffName,
    subject,
    code: decision,
    sentAt: new Date().toISOString(),
    previewUrl: '',
    text: `Your Nexus Corporate Directory leave request (${leave.leaveType}: ${leave.startDate} to ${leave.endDate}) has been ${decision.toUpperCase()} by Administration.${adminNotes ? ` Administrator Remarks: ${adminNotes}` : ''}`,
    html,
  };

  recentEmails.unshift(emailRecord);
  if (recentEmails.length > 50) recentEmails.pop();

  (async () => {
    try {
      const mailer = await getTransporter();
      const info = await mailer.sendMail({
        from: '"Nexus Leave Administration" <leave-officer@proton-address.internal>',
        to: leave.staffEmail,
        subject,
        text: emailRecord.text,
        html,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        emailRecord.previewUrl = preview;
      }
    } catch (err) {
      console.warn('Nodemailer leave notification dispatch note:', err);
    }
  })();

  return emailRecord;
}

// Dispatches Leave Submission Confirmation Email to Staff
async function sendLeaveSubmittedConfirmationEmail(
  leave: LeaveRequestRecord
): Promise<DispatchedEmail> {
  const subject = `Nexus Personnel Notice: Leave Request Received (${leave.leaveType})`;
  const timestamp = new Date().toLocaleString();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <div style="background: #0052cc; width: 32px; height: 32px; border-radius: 8px; display: inline-block; vertical-align: middle; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 16px;">N</div>
          <span style="font-size: 16px; font-weight: 700; color: #0f172a; vertical-align: middle; margin-left: 10px;">Nexus Corporate Directory</span>
        </div>
        
        <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Leave Request Received (Pending Review)</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${leave.staffName}</strong>,<br/>
          Your leave request (Reference: <code style="font-family: monospace; font-weight: bold;">${leave.id}</code>) has been logged and forwarded to the System Administrator for formal review.
        </p>

        <div style="background: #eff6ff; border-radius: 12px; padding: 16px; border: 1px solid #bfdbfe; margin: 18px 0; font-size: 13px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #64748b; padding: 3px 0;">Leave Type:</td><td style="font-weight: 600; color: #1e3a8a;">${leave.leaveType}</td></tr>
            <tr><td style="color: #64748b; padding: 3px 0;">Duration:</td><td style="font-weight: 600; color: #1e3a8a;">${leave.startDate} to ${leave.endDate} (${leave.totalDays} day(s))</td></tr>
            <tr><td style="color: #64748b; padding: 3px 0;">Current Status:</td><td><strong style="color: #d97706; text-transform: uppercase;">⏳ PENDING ADMINISTRATOR APPROVAL</strong></td></tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          You will receive an automated follow-up email at <strong style="color: #0f172a;">${leave.staffEmail}</strong> as soon as the administrator accepts or rejects your request.
        </p>

        <div style="background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; margin-top: 18px; font-size: 11px; color: #64748b;">
          🕒 <strong>Submitted:</strong> ${timestamp} | <strong>Assigned Admin:</strong> kanithisaikiran3036@gmail.com
        </div>
      </div>
    </body>
    </html>
  `;

  const emailRecord: DispatchedEmail = {
    id: 'mail_submit_' + Date.now(),
    to: leave.staffEmail,
    toName: leave.staffName,
    subject,
    code: 'Pending',
    sentAt: new Date().toISOString(),
    previewUrl: '',
    text: `Your Nexus Corporate Directory leave request has been submitted and is pending review by the Administrator.`,
    html,
  };

  recentEmails.unshift(emailRecord);
  if (recentEmails.length > 50) recentEmails.pop();

  (async () => {
    try {
      const mailer = await getTransporter();
      const info = await mailer.sendMail({
        from: '"Nexus Leave Administration" <leave-officer@proton-address.internal>',
        to: leave.staffEmail,
        subject,
        text: emailRecord.text,
        html,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) emailRecord.previewUrl = preview;
    } catch (err) {
      console.warn('Nodemailer leave confirmation note:', err);
    }
  })();

  return emailRecord;
}

// Helper function to invoke the native C++ engine
function invokeCppEngine(args: string[], stdinInput?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const currentBinPath = resolveBinaryPath();
    if (!fs.existsSync(currentBinPath)) {
      return reject(
        new Error(
          `C++ Binary not found at ${currentBinPath}. On Windows, build with: cd cpp-backend && build_windows_msvc.bat (or build_windows_mingw.bat).`
        )
      );
    }

    const child = execFile(currentBinPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('C++ Engine execution error:', stderr || error.message);
        return reject(error);
      }
      try {
        const trimmed = stdout.trim();
        const parsed = JSON.parse(trimmed);
        resolve(parsed);
      } catch (parseErr) {
        console.error('Failed to parse C++ stdout as JSON:', stdout);
        resolve({ raw: stdout });
      }
    });

    if (stdinInput && child.stdin) {
      child.stdin.write(stdinInput);
      child.stdin.end();
    }
  });
}

// REST Endpoints

// 1. Auth Endpoint: Login using Email and Password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const data = await invokeCppEngine(['login', email.trim(), password]);
    if (!data.success) {
      return res.status(401).json(data);
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Forgot Password - Generates verification code and sends to user email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }
    const cleanEmail = String(email).trim();
    // 6-digit cryptographic verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Call C++ high-performance engine to check user and register code in SQLite WAL
    const cppRes = await invokeCppEngine(['create_reset_code', cleanEmail, code, '600']);
    if (!cppRes.success) {
      return res.status(404).json(cppRes);
    }

    // Send verification email via Nodemailer
    const emailRecord = await sendVerificationEmail(cleanEmail, cppRes.name || 'User', code);

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      name: cppRes.name,
      codePreview: code,
      previewUrl: emailRecord.previewUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Verify Reset Code
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required' });
    }
    const cppRes = await invokeCppEngine(['verify_reset_code', String(email).trim(), String(code).trim()]);
    if (!cppRes.success) {
      return res.status(400).json(cppRes);
    }
    res.json(cppRes);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1d. Complete Password Reset with New Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, verification code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }
    const cppRes = await invokeCppEngine(['reset_password', String(email).trim(), String(code).trim(), String(newPassword)]);
    if (!cppRes.success) {
      return res.status(400).json(cppRes);
    }
    res.json(cppRes);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1e. Get Dispatched Email for live UI simulation toast/view
app.get('/api/auth/latest-email', (req, res) => {
  const email = (req.query.email as string)?.toLowerCase();
  if (!email) {
    return res.json(recentEmails[0] || null);
  }
  const match = recentEmails.find(m => m.to.toLowerCase() === email);
  res.json(match || null);
});

// 2. System Overview Metrics (Matching Screenshot 1)
app.get('/api/overview', async (_req, res) => {
  try {
    const data = await invokeCppEngine(['overview']);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. List Users & Staff (Matching Screenshot 2)
app.get('/api/users', async (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const data = await invokeCppEngine(['list_users', search]);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get User Status (For Staff to view their status)
app.get('/api/users/:id', async (req, res) => {
  try {
    const data = await invokeCppEngine(['user_status', req.params.id]);
    if (data.error) {
      return res.status(404).json(data);
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Add Staff (Admin Only!)
app.post('/api/staff', async (req, res) => {
  try {
    const callerId = req.headers['x-user-id'] as string || req.body.caller_id || 'u_admin_sole';
    const jsonStr = JSON.stringify(req.body);
    const data = await invokeCppEngine(['create_staff', callerId, jsonStr]);
    if (!data.success) {
      return res.status(403).json(data);
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update User Profile / Status
app.put('/api/users/:id', async (req, res) => {
  try {
    const callerId = (req.headers['x-user-id'] as string) || req.body.caller_id || 'u_admin_sole';

    // Get prior user record to detect status changes
    let priorUser: any = null;
    try {
      priorUser = await invokeCppEngine(['user_status', req.params.id]);
    } catch (e) {
      // ignore
    }

    const jsonStr = JSON.stringify(req.body);
    const data = await invokeCppEngine(['update_user', callerId, req.params.id, jsonStr]);

    // If status was changed, notify staff member via email
    if (data.success && req.body.status && priorUser && priorUser.email) {
      const newStatus = req.body.status;
      const oldStatus = priorUser.status;
      if (newStatus !== oldStatus) {
        await sendStatusNotificationEmail(
          priorUser.email,
          priorUser.name || 'Staff Member',
          newStatus,
          oldStatus,
          req.body.reason
        );
        data.notificationSent = true;
        data.notifiedEmail = priorUser.email;
      }
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Dedicated Staff Status Update with Automated Email Notification
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const callerId = (req.headers['x-user-id'] as string) || req.body.caller_id || 'u_admin_sole';
    const { status, reason } = req.body;

    if (!status || !['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be one of: Active, Inactive, or Suspended',
      });
    }

    // Retrieve target staff member
    const priorUser = await invokeCppEngine(['user_status', req.params.id]);
    if (priorUser.error) {
      return res.status(404).json(priorUser);
    }

    const updatePayload = {
      name: priorUser.name,
      email: priorUser.email,
      department: priorUser.department,
      location: priorUser.location,
      phone: priorUser.phone,
      status: status,
    };

    const data = await invokeCppEngine([
      'update_user',
      callerId,
      req.params.id,
      JSON.stringify(updatePayload),
    ]);

    if (!data.success) {
      return res.status(403).json(data);
    }

    // Notify staff through the staff mail
    const emailRecord = await sendStatusNotificationEmail(
      priorUser.email,
      priorUser.name || 'Staff Member',
      status,
      priorUser.status,
      reason
    );

    res.json({
      success: true,
      user: data.user,
      notificationSent: true,
      email: priorUser.email,
      newStatus: status,
      oldStatus: priorUser.status,
      previewUrl: emailRecord.previewUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Delete User (Admin Only!)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const callerId = req.headers['x-user-id'] as string || (req.query.caller_id as string) || 'u_admin_sole';
    const data = await invokeCppEngine(['delete_user', callerId, req.params.id]);
    if (!data.success) {
      return res.status(403).json(data);
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Departments & Locations
app.get('/api/departments', async (_req, res) => {
  try {
    const data = await invokeCppEngine(['departments']);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/locations', async (_req, res) => {
  try {
    const data = await invokeCppEngine(['locations']);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Activity Logs
app.get('/api/activity', async (_req, res) => {
  try {
    const data = await invokeCppEngine(['activity']);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Engine Status & Benchmark
app.get('/api/status', async (_req, res) => {
  try {
    const data = await invokeCppEngine(['status']);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/benchmark', async (req, res) => {
  try {
    const iterations = req.body.iterations ? String(req.body.iterations) : '1000';
    const data = await invokeCppEngine(['benchmark', iterations]);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Staff Leave Requests Endpoints (Request, View, Accept/Reject with Automated Staff Email Notification)

// 11a. List Leave Requests (Admin views all, staff views their own)
app.get('/api/leave-requests', (req, res) => {
  try {
    const { userId, email, status } = req.query;
    let requests = loadLeaveRequests();

    if (userId) {
      requests = requests.filter((r) => r.userId === userId);
    } else if (email) {
      requests = requests.filter((r) => r.staffEmail.toLowerCase() === String(email).toLowerCase());
    }

    if (status && status !== 'all') {
      requests = requests.filter((r) => r.status.toLowerCase() === String(status).toLowerCase());
    }

    // Sort newest first
    requests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11b. Submit a Leave Request (Staff requests leave for Admin review)
app.post('/api/leave-requests', async (req, res) => {
  try {
    const {
      userId,
      staffId,
      staffName,
      staffEmail,
      department,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      emergencyContact,
      handoverNotes,
    } = req.body;

    if (!staffEmail || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Staff email, start date, end date, and reason are required fields.',
      });
    }

    // Calculate days if not supplied
    let days = Number(totalDays);
    if (!days || isNaN(days) || days <= 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    const currentRequests = loadLeaveRequests();
    const newId = `LR-${new Date().getFullYear()}-${String(currentRequests.length + 101).padStart(3, '0')}`;

    const newRequest: LeaveRequestRecord = {
      id: newId,
      userId: userId || 'u_staff_current',
      staffId: staffId || 'STF-TEMP',
      staffName: staffName || 'Staff Member',
      staffEmail: staffEmail.trim(),
      department: department || 'General',
      leaveType: leaveType || 'Annual Leave',
      startDate,
      endDate,
      totalDays: days,
      reason: reason.trim(),
      emergencyContact: emergencyContact ? String(emergencyContact).trim() : undefined,
      handoverNotes: handoverNotes ? String(handoverNotes).trim() : undefined,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };

    currentRequests.unshift(newRequest);
    saveLeaveRequests(currentRequests);

    // Send confirmation email to staff acknowledging receipt
    await sendLeaveSubmittedConfirmationEmail(newRequest);

    res.json({
      success: true,
      leaveRequest: newRequest,
      message: 'Leave request submitted successfully. It has been routed to the Administrator for approval.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11c. Review Leave Request (Admin accepts or rejects with automated staff email notification)
app.patch('/api/leave-requests/:id/review', async (req, res) => {
  try {
    const { status, adminNotes, reviewerName } = req.body;
    const leaveId = req.params.id;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be Approved or Rejected',
      });
    }

    const currentRequests = loadLeaveRequests();
    const targetIdx = currentRequests.findIndex((r) => r.id === leaveId);

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, error: `Leave request ${leaveId} not found` });
    }

    const targetRequest = currentRequests[targetIdx];
    const priorStatus = targetRequest.status;

    targetRequest.status = status;
    targetRequest.reviewedAt = new Date().toISOString();
    targetRequest.reviewedBy = reviewerName || 'Sole Administrator (kanithisaikiran3036@gmail.com)';
    targetRequest.adminNotes = adminNotes ? String(adminNotes).trim() : undefined;
    targetRequest.notificationSent = true;

    saveLeaveRequests(currentRequests);

    // Immediately notify the staff member through their staff email
    const emailRecord = await sendLeaveDecisionNotificationEmail(
      targetRequest,
      status,
      targetRequest.adminNotes,
      targetRequest.reviewedBy
    );

    res.json({
      success: true,
      leaveRequest: targetRequest,
      notificationSent: true,
      email: targetRequest.staffEmail,
      status,
      priorStatus,
      previewUrl: emailRecord.previewUrl,
      message: `Leave request has been ${status.toUpperCase()}. Official notification email dispatched to ${targetRequest.staffEmail}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite Middleware Integration for Dev / Static Serving for Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proton Address Core Server listening on http://0.0.0.0:${PORT}`);
    console.log(`C++ Native Storage Engine active at ${BIN_PATH}`);
  });
}

startServer();
