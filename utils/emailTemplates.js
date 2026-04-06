export default {
  customer_confirmation: (data) => ({
    subject: "Thank you for submitting your inquiry!",
    body: `
      <p>Hi ${data.firstname || ""},\n</p>
      <p>We&apos;ve received your request, and a member of our team will contact you within 24 hours.</p>
      <p>If your request is urgent, please contact us directly at 713-550-3575. We look forward to speaking with you.</p>
    `
  }),

  internal_notification: (data) => ({
    subject: "New Lead Submitted",
    body: `
      <p>New lead received:</p>
      <p>Name: ${data.firstname} ${data.lastname}</p>
      <p>Email: ${data.email}</p>
      <p>Phone: ${data.phone}</p>
    `
  })
};
