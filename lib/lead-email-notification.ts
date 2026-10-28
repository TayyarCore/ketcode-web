import nodemailer from "nodemailer";
import type { LeadRequest } from "./ai-sales-assistant";

type NotificationInput = {
  lead: LeadRequest;
  recipient: string;
  receivedAt: string;
};

export async function sendLeadEmailNotification({ lead, recipient, receivedAt }: NotificationInput) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SALES_FROM_EMAIL || user;

  if (!host || !user || !password || !from || !Number.isInteger(port)) {
    console.warn("Lead email notification skipped because SMTP is not configured.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 12_000,
  });

  const conversation = lead.messages
    .map((message) => `${message.role === "user" ? "العميل" : "المساعد"}: ${message.content}`)
    .join("\n\n");

  await transporter.sendMail({
    from: `KetCode Website <${from}>`,
    to: recipient,
    replyTo: lead.contactMethod === "email" ? lead.contact : undefined,
    subject: `طلب موقع جديد من ${lead.name}`,
    text: [
      "وصل طلب متابعة جديد من موقع KetCode.",
      "",
      `الاسم: ${lead.name}`,
      `طريقة التواصل: ${lead.contactMethod}`,
      `بيانات التواصل: ${lead.contact}`,
      `صفحة الطلب: ${lead.sourcePage}`,
      `وقت الاستلام: ${receivedAt}`,
      "",
      "المحادثة:",
      conversation,
    ].join("\n"),
  });

  return true;
}
