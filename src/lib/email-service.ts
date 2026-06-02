export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendEmail(data: ContactFormData): Promise<void> {
  // Using Formspree as a simple backend-less solution
  // Formspree handles email sending without exposing credentials
  const formspreeEndpoint = "https://formspree.io/f/xyzxyzxy"; // This will be configured

  const response = await fetch(formspreeEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to send email. Please try again.");
  }

  const result = (await response.json()) as { ok?: boolean };
  if (!result.ok) {
    throw new Error("Failed to send email. Please try again.");
  }
}
