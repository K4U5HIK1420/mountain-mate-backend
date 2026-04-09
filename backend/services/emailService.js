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

function formatBookingPrimaryDate(booking) {
  const raw = booking?.bookingType === "Hotel"
    ? booking?.startDate || booking?.date
    : booking?.date;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Date not available";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOwnerRequestEmailContent({ booking, listingLabel }) {
  const isRide = booking?.bookingType === "Transport";

  if (isRide) {
    return {
      title: "New Ride Request",
      subject: "Mountain Mate: New Ride Request",
      html: `
        <p>A new ride request has been created for <strong>${listingLabel || "your route"}</strong>.</p>
        <p><strong>Rider:</strong> ${booking.customerName}</p>
        <p><strong>Phone:</strong> ${booking.phoneNumber}</p>
        <p><strong>Travel Date:</strong> ${formatBookingPrimaryDate(booking)}</p>
        <p>Please log in to Mountain Mate partner panel to accept or decline this ride request.</p>
      `,
    };
  }

  return {
    title: "New Stay Booking Request",
    subject: "Mountain Mate: New Stay Booking Request",
    html: `
      <p>A new stay booking request has been created for <strong>${listingLabel || "your property"}</strong>.</p>
      <p><strong>Guest:</strong> ${booking.customerName}</p>
      <p><strong>Phone:</strong> ${booking.phoneNumber}</p>
      <p><strong>Check-in:</strong> ${formatBookingPrimaryDate(booking)}</p>
      <p>Please log in to Mountain Mate partner panel to confirm or decline this stay request.</p>
    `,
  };
}

function getUserConfirmedEmailContent({ booking, listingLabel }) {
  const isRide = booking?.bookingType === "Transport";

  if (isRide) {
    return {
      title: "Ride Confirmed",
      subject: "Mountain Mate: Ride Confirmed",
      html: `
        <p>Your ride for <strong>${listingLabel || "your selected route"}</strong> has been confirmed.</p>
        <p><strong>Name:</strong> ${booking.customerName}</p>
        <p><strong>Travel Date:</strong> ${formatBookingPrimaryDate(booking)}</p>
        <p>Your driver has approved the request. You can now coordinate pickup details inside Mountain Mate.</p>
      `,
    };
  }

  return {
    title: "Stay Booking Confirmed",
    subject: "Mountain Mate: Stay Booking Confirmed",
    html: `
      <p>Your stay booking for <strong>${listingLabel || "your selected property"}</strong> has been confirmed.</p>
      <p><strong>Name:</strong> ${booking.customerName}</p>
      <p><strong>Check-in:</strong> ${formatBookingPrimaryDate(booking)}</p>
      <p>Thank you for choosing Mountain Mate. Your host has approved the booking.</p>
    `,
  };
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
  const content = getOwnerRequestEmailContent({ booking, listingLabel });
  return sendEmail({
    to: ownerEmail,
    subject: content.subject,
    html: wrapTemplate(content.title, content.html),
  });
}

async function sendBookingConfirmedUserEmail({ userEmail, booking, listingLabel }) {
  if (!userEmail) return false;
  const content = getUserConfirmedEmailContent({ booking, listingLabel });
  return sendEmail({
    to: userEmail,
    subject: content.subject,
    html: wrapTemplate(content.title, content.html),
  });
}

module.exports = {
  sendBookingRequestOwnerEmail,
  sendBookingConfirmedUserEmail,
};
