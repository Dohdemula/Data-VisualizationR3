const nodemailer = require('nodemailer');

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Auto-create throwaway Ethereal account for development
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('\n📧  Dev email ready (Ethereal)');
    console.log('    Preview emails at: https://ethereal.email');
    console.log(`    Login: ${testAccount.user} / ${testAccount.pass}\n`);
  }

  return _transporter;
}

const FROM = process.env.SMTP_FROM || '"InvenSight" <noreply@InvenSight.co.ke>';
const CLIENT = () => process.env.CLIENT_URL || 'http://localhost:3000';

async function sendInvite({ to, name, role, token }) {
  const t = await getTransporter();
  const link = `${CLIENT()}/accept-invite?token=${token}`;

  const info = await t.sendMail({
    from: FROM,
    to,
    subject: "You've been invited to InvenSight",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
        <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:1.2rem">InvenSight</h2>
        </div>
        <div style="padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You've been invited to join <strong>InvenSight</strong> as <strong>${role}</strong>.
             Click the button below to set your password and activate your account.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}"
               style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;
                      text-decoration:none;border-radius:6px;font-weight:600;font-size:0.95rem">
              Accept Invitation
            </a>
          </div>
          <p style="font-size:0.8rem;color:#64748b">
            This link expires in 72 hours. If you weren't expecting this, you can safely ignore it.
          </p>
        </div>
      </div>`,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('📧  Invite preview:', nodemailer.getTestMessageUrl(info));
  }
}

async function sendPasswordReset({ to, name, token }) {
  const t = await getTransporter();
  const link = `${CLIENT()}/reset-password?token=${token}`;

  const info = await t.sendMail({
    from: FROM,
    to,
    subject: 'Reset your InvenSight password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
        <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:1.2rem">InvenSight</h2>
        </div>
        <div style="padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to set a new one.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}"
               style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;
                      text-decoration:none;border-radius:6px;font-weight:600;font-size:0.95rem">
              Reset Password
            </a>
          </div>
          <p style="font-size:0.8rem;color:#64748b">
            This link expires in 1 hour. If you didn't request this, you can safely ignore it.
          </p>
        </div>
      </div>`,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('📧  Reset email preview:', nodemailer.getTestMessageUrl(info));
  }
}

module.exports = { sendInvite, sendPasswordReset };
