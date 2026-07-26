import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 POMOCNÁ FUNKCIA: SKONTROLUJE, ČI SI KLIENT NEVYPNUL E-MAILY V NASTAVENIACH
async function isEmailNotificationEnabled(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('email_notifications')
      .eq('email', email.trim())
      .maybeSingle();

    if (data && data.email_notifications === false) {
      return false; // Klient si vypol e-maily!
    }
  } catch (err) {
    console.error('Chyba kontroly email_notifications:', err);
  }
  return true; // Predvolene zapnuté
}

type SendEmailProps = {
  to: string;
  name: string;
  type: string;
  duration: number;
  slot: string;
  finalPrice: number;
  customerNote?: string;
  bookingRef?: string;
};

export async function sendBookingConfirmationEmail({
  to,
  name,
  type,
  duration,
  slot,
  finalPrice,
  customerNote,
  bookingRef,
}: SendEmailProps) {
  if (!to || !to.includes('@')) return;

  // 🚀 KONTROLA PREFERENCIE KLIENTA
  const isEnabled = await isEmailNotificationEnabled(to);
  if (!isEnabled) {
    console.log(`ℹ️ [Email] Zákazník ${to} má vypnuté e-mailové notifikácie. Potvrdenie sa neodosiela.`);
    return;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const dateObj = new Date(slot);
  const formattedDate = dateObj.toLocaleDateString('sk-SK');
  const formattedTime = dateObj.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  const refString = bookingRef ? `#${bookingRef}` : '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 6px 16px; background-color: #ecfdf5; color: #059669; border-radius: 20px; font-weight: bold; font-size: 13px; margin-bottom: 12px;">
          Potvrdené
        </div>
        <h1 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">
          Potvrdenie rezervácie ${refString} na masáž
        </h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Ďakujeme za vašu rezerváciu. Váš termín bol úspešne potvrdzený.</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 24px; border-radius: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <p style="margin: 10px 0; color: #334155; font-size: 14px;"><strong style="color: #0f172a;">Klient:</strong> ${name}</p>
        <p style="margin: 10px 0; color: #334155; font-size: 14px;"><strong style="color: #0f172a;">Procedúra:</strong> ${type} (${duration} minút)</p>
        <p style="margin: 10px 0; color: #334155; font-size: 14px;"><strong style="color: #0f172a;">Dátum:</strong> ${formattedDate}</p>
        <p style="margin: 10px 0; color: #334155; font-size: 14px;"><strong style="color: #0f172a;">Čas:</strong> ${formattedTime}</p>
        <p style="margin: 12px 0 0; color: #0f172a; font-size: 15px; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          <strong style="color: #0f172a;">Cena k úhrade:</strong> <span style="color: #10b981; font-size: 16px;">${finalPrice} €</span>
        </p>
        ${customerNote ? `<p style="margin: 10px 0 0; color: #64748b; font-size: 12px; border-top: 1px dashed #cbd5e1; padding-top: 10px;"><strong>Poznámky / Odmeny:</strong> ${customerNote}</p>` : ''}
      </div>

      <p style="color: #475569; font-size: 13px; text-align: center; margin-bottom: 20px;">
        Tešíme sa na vašu návštevu! Ak potrebujete stornovať alebo zmeniť termín, kontaktujte nás.
      </p>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 11px;">
        Privátne Masáže & Vernostný systém
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Privátne Masáže" <${smtpUser}>`,
      to: to,
      subject: `Potvrdenie rezervácie ${refString} na masáž - ${type} (${formattedDate} o ${formattedTime})`,
      html: htmlContent,
    });
    console.log(`✅ [Email] Potvrdzovací e-mail odoslaný na ${to}`);
  } catch (err: any) {
    console.error('❌ [Email Chyba]:', err?.message || err);
  }
}

export async function sendCancellationDecisionEmail({
  to,
  name,
  bookingRef,
  status,
}: {
  to: string;
  name: string;
  bookingRef: string;
  status: 'approved' | 'rejected';
}) {
  if (!to || !to.includes('@')) return;

  // 🚀 KONTROLA PREFERENCIE KLIENTA
  const isEnabled = await isEmailNotificationEnabled(to);
  if (!isEnabled) {
    console.log(`ℹ️ [Email] Zákazník ${to} má vypnuté e-mailové notifikácie. Storno e-mail sa neodosiela.`);
    return;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const isApproved = status === 'approved';
  const refText = bookingRef ? `#${bookingRef}` : '';
  const subject = isApproved
    ? `Storno rezervácie č. ${refText} bolo schválené`
    : `Storno rezervácie č. ${refText} nebolo akceptované`;

  const title = isApproved
    ? 'Storno rezervácie schválené'
    : 'Storno rezervácie zamietnuté';

  const message = isApproved
    ? `Vaša rezervácia <strong>${refText}</strong> bola úspešne stornovaná a termín bol zrušený.`
    : `Vaša žiadosť o storno pre rezerváciu <strong>${refText}</strong> nebola akceptovaná a váš termín zostáva platný. V prípade otázok kontaktujte administrátora.`;

  const badgeColor = isApproved ? '#059669' : '#e11d48';
  const badgeBg = isApproved ? '#ecfdf5' : '#fff1f2';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 6px 16px; background-color: ${badgeBg}; color: ${badgeColor}; border-radius: 20px; font-weight: bold; font-size: 13px; margin-bottom: 12px;">
          ${isApproved ? 'Schválené' : 'Zamietnuté'}
        </div>
        <h1 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">${title}</h1>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 24px; border-radius: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px; font-size: 14px; color: #334155; line-height: 1.6;">
        <p style="margin: 0 0 10px;">Dobrý deň <strong>${name}</strong>,</p>
        <p style="margin: 0;">${message}</p>
      </div>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 11px;">
        Privátne Masáže & Vernostný systém
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Privátne Masáže" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ [Email Storno] Odoslané na ${to} (Status: ${status})`);
  } catch (err: any) {
    console.error('❌ [Email Storno Chyba]:', err?.message || err);
  }
}