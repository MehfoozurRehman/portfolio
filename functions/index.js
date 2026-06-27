const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");

const RECIPIENT_EMAIL = "mehfoozijaz786@gmail.com";

exports.contact = onRequest(
  {
    region: "us-central1",
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { name, email, project } = req.body ?? {};
    const safeName = String(name ?? "").trim();
    const safeEmail = String(email ?? "").trim();
    const safeProject = String(project ?? "").trim();

    if (!safeName || !safeEmail || !safeProject) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const port = Number(SMTP_PORT.value());
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port,
      secure: port === 465,
      auth: {
        user: SMTP_USER.value(),
        pass: SMTP_PASS.value(),
      },
    });

    try {
      await transporter.sendMail({
        from: `"Portfolio Contact" <${SMTP_USER.value()}>`,
        to: RECIPIENT_EMAIL,
        replyTo: safeEmail,
        subject: `Portfolio inquiry from ${safeName}`,
        text: `Name: ${safeName}\nEmail: ${safeEmail}\n\nProject:\n${safeProject}`,
        html: `
          <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
          <p><strong>Project:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(safeProject)}</p>
        `,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Failed to send contact email", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  }
);

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
