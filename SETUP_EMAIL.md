# Email Service Setup Guide

Your portfolio now has a completely revamped contact form with a simpler, more reliable email system. Here's how to set it up:

## Quick Start (Recommended)

### Option 1: Using Formspree (Easiest - No Backend Needed)

Formspree is a free form submission service that requires zero backend setup.

#### Steps:
1. Go to [formspree.io](https://formspree.io)
2. Sign up for a free account
3. Create a new form and select "Standard Form"
4. You'll get a form ID (looks like: `xyzabc123`)
5. Update the form endpoint in `src/components/home-contact.tsx`:

```typescript
// Replace this line:
"https://formspree.io/f/xyzabc123", // ← Put your form ID here
```

**Done!** Your contact form is now fully functional. Emails will be sent to your registered email address.

---

### Option 2: Using Firebase Cloud Functions (More Control)

If you want more control over email sending, you can use Firebase Cloud Functions.

#### Steps:
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase Functions:
```bash
firebase init functions
```

3. Create a Cloud Function for sending emails (in `functions/src/index.ts`):

```typescript
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendContactEmail = functions.https.onCall(async (data) => {
  const { name, email, subject, message } = data;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Portfolio Contact: ${subject}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email");
  }
});
```

4. Set environment variables:
```bash
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
```

5. Deploy:
```bash
firebase deploy --only functions
```

6. Update your contact form to use the Firebase function.

---

### Option 3: Node.js Backend (Most Flexible)

Create a simple Express backend to handle emails.

#### Create `backend/server.js`:

```javascript
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post("/api/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Email send failed:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log("Server running on port", process.env.PORT || 3001);
});
```

---

## Current Changes Made

### ✅ CV Modal
- Beautiful PDF-like modal with print functionality
- Replaces the old Google Docs link
- Shows comprehensive CV with experience, skills, and projects
- Mobile responsive

### ✅ Simplified Contact Form
- Removed EmailJS (which exposed credentials)
- Much cleaner form with better error handling
- Shows loading states and success messages
- All form state is properly managed

### ✅ Updated Content
- Hero section now mentions **Devscot** instead of Crazybeings Studio
- About section now reflects your actual 5+ years of experience
- Services updated with your real tech stack
- All content more authentic and professional

### ✅ Removed Dependencies
- No more `@emailjs/browser` (removed the security risk)
- Cleaner, more maintainable code

---

## Testing Locally

1. Install dependencies:
```bash
npm install
```

2. Start the dev server:
```bash
npm run dev
```

3. Open `http://localhost:5173` and test the contact form

---

## Environment Variables

If using Firebase Functions or a Node.js backend, create a `.env` file:

```env
VITE_API_URL=http://localhost:3001  # For local development
# Production URL will be different
```

Or for Formspree, no env vars needed - just update the form ID in the component.

---

## Troubleshooting

### Formspree Errors
- Make sure your form ID is correct
- Check that you've verified your email in Formspree

### Firebase/Node.js Errors
- Verify Gmail app password (not your regular password)
- Check CORS settings if requests are blocked
- Look at function logs for detailed errors

---

## Security Notes

✅ **This new setup is much more secure:**
- No API credentials exposed in client-side code
- All email logic happens server-side
- User email addresses are protected

---

## Support

For questions or issues:
1. Check the service documentation (Formspree, Firebase, etc.)
2. Review server logs for errors
3. Test your email setup thoroughly before going live
