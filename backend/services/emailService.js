let nodemailer = null;
try {
  // Keep email optional in environments where SMTP dependency is not installed yet.
  // eslint-disable-next-line global-require
  nodemailer = require("nodemailer");
} catch (_err) {
  nodemailer = null;
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;
  if (!nodemailer) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function wrapTemplate(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#fff;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:14px;overflow:hidden;">
        <div style="padding:16px 20px;background:linear-gradient(90deg,#ff7a18,#ffb347);color:#111;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
          Mountain Mate
        </div>
        <div style="padding:22px 20px;">
          <h2 style="margin:0 0 12px 0;color:#fff;">${title}</h2>
          <div style="color:#d6d6d6;line-height:1.65;font-size:14px;">
            ${bodyHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
  const tx = getTransporter();
  if (!tx || !to) return false;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await tx.sendMail({ from, to, subject, html });
  return true;
}

async function sendBookingRequestOwnerEmail({ ownerEmail, booking, listingLabel }) {
  if (!ownerEmail) return false;
  const html = wrapTemplate(
    "New Booking Request",
    `
      <p>A new booking request has been created for <strong>${listingLabel || "your listing"}</strong>.</p>
      <p><strong>Guest:</strong> ${booking.customerName}</p>
      <p><strong>Phone:</strong> ${booking.phoneNumber}</p>
      <p><strong>Travel Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
      <p>Please login to Mountain Mate partner panel to confirm or decline.</p>
    `
  );
  return sendEmail({
    to: ownerEmail,
    subject: "Mountain Mate: New Booking Request",
    html,
  });
}

async function sendBookingConfirmedUserEmail({ userEmail, booking, listingLabel }) {
  if (!userEmail) return false;
  const html = wrapTemplate(
    "Booking Confirmed",
    `
      <p>Your booking for <strong>${listingLabel || "selected listing"}</strong> has been confirmed.</p>
      <p><strong>Name:</strong> ${booking.customerName}</p>
      <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
      <p>Thank you for choosing Mountain Mate.</p>
    `
  );
  return sendEmail({
    to: userEmail,
    subject: "Mountain Mate: Booking Confirmed",
    html,
  });
}

module.exports = {
  sendBookingRequestOwnerEmail,
  sendBookingConfirmedUserEmail,
};
