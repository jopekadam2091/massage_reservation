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

// 🚀 1. POTVRDENIE REZERVÁCIE MASÁŽE (EVERVAULT DARK PULSE DIZAJN)
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
  const formattedDate = dateObj.toLocaleDateString('sk-SK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  const refString = bookingRef ? `#${bookingRef}` : '';

  const htmlContent = `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #010314; border: 1px solid #2B2F49; border-radius: 24px; color: #DDE0F2;">
      
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; padding: 6px 18px; background-color: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
          ✓ Rezervácia potvrdená
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
          ZenFlow Sanctuary
        </h1>
        <p style="color: #C7CAE0; font-size: 13px; margin-top: 6px;">Váš termín masáže bol úspešne zaregistrovaný</p>
      </div>

      <!-- MAIN CARD -->
      <div style="background-color: #0B0D22; padding: 24px; border-radius: 20px; border: 1px solid #2B2F49; margin-bottom: 24px;">
        
        <div style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #2B2F49;">
          <p style="margin: 0; color: #A78BFA; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Klient</p>
          <p style="margin: 4px 0 0; color: #FFFFFF; font-size: 16px; font-weight: 700;">${name}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="padding: 8px 0; color: #C7CAE0; font-size: 13px;">Procedúra:</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-size: 13px; font-weight: 600; text-align: right;">${type}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #C7CAE0; font-size: 13px;">Dĺžka procedúry:</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-size: 13px; font-weight: 600; text-align: right;">${duration} minút</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #C7CAE0; font-size: 13px;">Dátum:</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-size: 13px; font-weight: 600; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #C7CAE0; font-size: 13px;">Čas:</td>
            <td style="padding: 8px 0; color: #A78BFA; font-size: 14px; font-weight: 700; text-align: right;">${formattedTime}</td>
          </tr>
          ${bookingRef ? `
          <tr>
            <td style="padding: 8px 0; color: #C7CAE0; font-size: 13px;">Kód rezervácie:</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-size: 13px; font-weight: 600; text-align: right;">${refString}</td>
          </tr>
          ` : ''}
        </table>

        ${customerNote ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #2B2F49; color: #C7CAE0; font-size: 12px;">
            <strong style="color: #A78BFA;">Poznámka / Zľava:</strong> ${customerNote}
          </div>
        ` : ''}
      </div>

      <!-- NOTICE -->
      <p style="color: #C7CAE0; font-size: 12px; text-align: center; margin: 0 0 20px; line-height: 1.5;">
        Tešíme sa na vašu návštevu! Ak potrebujete termín upraviť alebo stornovať, môžete tak urobiť priamo vo svojom profile.
      </p>

      <!-- FOOTER -->
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #2B2F49; color: #64748b; font-size: 11px;">
        © ZenFlow Massage Sanctuary • Privátne Masáže & Vernostný systém
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ZenFlow Sanctuary" <${smtpUser}>`,
      to: to,
      subject: `Potvrdenie rezervácie ${refString} — ${type} (${formattedDate} o ${formattedTime})`,
      html: htmlContent,
    });
    console.log(`✅ [Email] Potvrdzovací e-mail odoslaný na ${to}`);
  } catch (err: any) {
    console.error('❌ [Email Chyba]:', err?.message || err);
  }
}

// 🚀 2. ROZHODNUTIE O STORNE REZERVÁCIE (EVERVAULT DARK PULSE DIZAJN)
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
    ? `Storno rezervácie ${refText} bolo schválené — ZenFlow Sanctuary`
    : `Storno rezervácie ${refText} nebolo akceptované — ZenFlow Sanctuary`;

  const badgeColor = isApproved ? '#10B981' : '#FF5A7A';
  const badgeBg = isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 90, 122, 0.15)';
  const badgeBorder = isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 90, 122, 0.3)';

  const htmlContent = `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #010314; border: 1px solid #2B2F49; border-radius: 24px; color: #DDE0F2;">
      
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; padding: 6px 18px; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; border-radius: 9999px; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
          ${isApproved ? '✓ Storno schválené' : '✕ Storno zamietnuté'}
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
          Rozhodnutie o storne rezervácie
        </h1>
        <p style="color: #C7CAE0; font-size: 13px; margin-top: 6px;">Rezervácia ${refText}</p>
      </div>

      <!-- MAIN CARD -->
      <div style="background-color: #0B0D22; padding: 24px; border-radius: 20px; border: 1px solid #2B2F49; margin-bottom: 24px; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 12px; color: #DDE0F2;">
          Dobrý deň <strong>${name}</strong>,
        </p>
        <p style="margin: 0; color: #C7CAE0;">
          ${isApproved 
            ? `Vaša žiadosť o storno pre rezerváciu <strong style="color: #FFFFFF;">${refText}</strong> bola úspešne schválená a termín bol uvoľnený.` 
            : `Vaša žiadosť o storno pre rezerváciu <strong style="color: #FFFFFF;">${refText}</strong> nebola schválená a termín zostáva platný. V prípade nejasností nás kontaktujte.`}
        </p>
      </div>

      <!-- FOOTER -->
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #2B2F49; color: #64748b; font-size: 11px;">
        © ZenFlow Massage Sanctuary • Privátne Masáže & Vernostný systém
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ZenFlow Sanctuary" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ [Email Storno] Odoslané na ${to} (Status: ${status})`);
  } catch (err: any) {
    console.error('❌ [Email Storno Chyba]:', err?.message || err);
  }
}

// 🚀 3. ODOSLANIE 6-MIESTNEHO OVEROVACIEHO KÓDU (OTP) NA REGISTRÁCIU
export async function sendOtpVerificationEmail({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}) {
  if (!to || !to.includes('@')) return false;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error('❌ [Email OTP]: Chýba SMTP_USER alebo SMTP_PASS v konfigurácii.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const subject = `Overenie účtu Email kódom`;

  const htmlContent = `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #010314; border: 1px solid #2B2F49; border-radius: 24px; color: #DDE0F2;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; padding: 6px 18px; background-color: rgba(102, 51, 238, 0.15); color: #A78BFA; border: 1px solid rgba(102, 51, 238, 0.3); border-radius: 9999px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
          Overenie účtu Email kódom
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
          ZenFlow Sanctuary
        </h1>
        <p style="color: #C7CAE0; font-size: 13px; margin-top: 6px;">Váš 6-miestny bezpečnostný kód</p>
      </div>

      <div style="background-color: #0B0D22; padding: 28px 24px; border-radius: 20px; border: 1px solid #2B2F49; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 16px; color: #DDE0F2; font-size: 14px; text-align: left;">
          Dobrý deň <strong>${name || 'vážený klient'}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #C7CAE0; font-size: 13px; line-height: 1.5; text-align: left;">
          Pre overenie účtu a prístup k vašim vernostným odmenám zadajte nasledujúci 6-miestny overovací kód:
        </p>

        <!-- 6-digit OTP Display -->
        <div style="display: inline-block; padding: 14px 28px; background-color: #010314; border: 2px solid #6633EE; border-radius: 16px; font-family: 'Courier New', monospace, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FFFFFF; text-shadow: 0 0 16px rgba(102, 51, 238, 0.6); margin: 0 auto 16px;">
          ${code}
        </div>

        <p style="margin: 0; color: #A78BFA; font-size: 12px;">
          ⏱️ Platnosť kódu vyprší o <strong>10 minút</strong>.
        </p>
      </div>

      <p style="color: #C7CAE0; font-size: 12px; text-align: center; margin: 0 0 20px; line-height: 1.5;">
        Ak ste o tento kód nežiadali, môžete tento e-mail pokojne ignorovať.
      </p>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #2B2F49; color: #64748b; font-size: 11px;">
        © ZenFlow Massage Sanctuary • Bezpečné prihlásenie
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ZenFlow Sanctuary" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ [Email OTP]: Kód úspešne odoslaný na ${to}`);
    return true;
  } catch (err: any) {
    console.error('❌ [Email OTP Chyba]:', err?.message || err);
    throw err;
  }
}

// 🚀 4. ODOSLANIE 6-MIESTNEHO KÓDU PRE TRVALÉ VYMAZANIE ÚČTU
export async function sendDeleteAccountOtpEmail({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}) {
  if (!to || !to.includes('@')) return false;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error('❌ [Email Delete OTP]: Chýba SMTP_USER alebo SMTP_PASS.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const subject = `Overenie vymazania účtu Email kódom`;

  const htmlContent = `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #010314; border: 1px solid #2B2F49; border-radius: 24px; color: #DDE0F2;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; padding: 6px 18px; background-color: rgba(255, 90, 122, 0.15); color: #FF5A7A; border: 1px solid rgba(255, 90, 122, 0.3); border-radius: 9999px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
          Vymazanie účtu
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
          Potvrdenie vymazania účtu
        </h1>
        <p style="color: #C7CAE0; font-size: 13px; margin-top: 6px;">Overovací kód pre potvrdenie žiadosti</p>
      </div>

      <div style="background-color: #0B0D22; padding: 28px 24px; border-radius: 20px; border: 1px solid #2B2F49; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 16px; color: #DDE0F2; font-size: 14px; text-align: left;">
          Dobrý deň <strong>${name || 'vážený klient'}</strong>,
        </p>
        <p style="margin: 0 0 20px; color: #C7CAE0; font-size: 13px; line-height: 1.6; text-align: left;">
          Pre potvrdenie žiadosti o trvalé vymazanie vášho účtu zo systému zadajte nasledujúci 6-miestny overovací kód:
        </p>

        <!-- 6-digit OTP Display -->
        <div style="display: inline-block; padding: 14px 28px; background-color: #010314; border: 2px solid #FF5A7A; border-radius: 16px; font-family: 'Courier New', monospace, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FF5A7A; text-shadow: 0 0 16px rgba(255, 90, 122, 0.6); margin: 0 auto 16px;">
          ${code}
        </div>

        <p style="margin: 0; color: #C7CAE0; font-size: 12px;">
          ⏱️ Platnosť kódu vyprší o <strong>10 minút</strong>.
        </p>
      </div>

      <p style="color: #C7CAE0; font-size: 12px; text-align: center; margin: 0 0 20px; line-height: 1.5;">
        Ak ste o vymazanie účtu nežiadali vy, tento e-mail môžete pokojne ignorovať.
      </p>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #2B2F49; color: #64748b; font-size: 11px;">
        © ZenFlow Massage Sanctuary • Bezpečnostný systém
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ZenFlow Sanctuary" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ [Email Delete OTP]: Kód úspešne odoslaný na ${to}`);
    return true;
  } catch (err: any) {
    console.error('❌ [Email Delete OTP Chyba]:', err?.message || err);
    throw err;
  }
}

// 🚀 5. ODOSLANIE 6-MIESTNEHO BEZPEČNOSTNÉHO KÓDU PRE PRIHLÁSENIE ADMINISTRÁTORA (2FA)
export async function sendAdminLoginOtpEmail({
  to,
  name,
  code,
}: {
  to: string;
  name?: string;
  code: string;
}) {
  if (!to || !to.includes('@')) return false;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error('❌ [Email Admin OTP]: Chýba SMTP_USER alebo SMTP_PASS.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const subject = `Bezpečnostné overenie administrátora (2FA kód)`;

  const htmlContent = `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #010314; border: 1px solid #2B2F49; border-radius: 24px; color: #DDE0F2;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; padding: 6px 18px; background-color: rgba(102, 51, 238, 0.2); color: #A78BFA; border: 1px solid rgba(102, 51, 238, 0.4); border-radius: 9999px; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
          🛡️ Admin Security • 2FA
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
          Overenie prihlásenia administrátora
        </h1>
        <p style="color: #C7CAE0; font-size: 13px; margin-top: 6px;">Dvojstupňová ochrana administrátorského účtu</p>
      </div>

      <div style="background-color: #0B0D22; padding: 28px 24px; border-radius: 20px; border: 1px solid #2B2F49; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 16px; color: #DDE0F2; font-size: 14px; text-align: left;">
          Dobrý deň <strong>${name || 'Administrátor'}</strong>,
        </p>
        <p style="margin: 0 0 20px; color: #C7CAE0; font-size: 13px; line-height: 1.6; text-align: left;">
          Bolo zaznamenané prihlásenie do administrátorského rozhrania. Pre dokončenie vstupu a odomknutie administrácie zadajte tento 6-miestny overovací kód:
        </p>

        <!-- 6-digit OTP Display -->
        <div style="display: inline-block; padding: 14px 28px; background-color: #010314; border: 2px solid #6633EE; border-radius: 16px; font-family: 'Courier New', monospace, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FFFFFF; text-shadow: 0 0 18px rgba(102, 51, 238, 0.8); margin: 0 auto 16px;">
          ${code}
        </div>

        <p style="margin: 0; color: #A78BFA; font-size: 12px;">
          ⏱️ Platnosť kódu vyprší o <strong>10 minút</strong>.
        </p>
      </div>

      <p style="color: #C7CAE0; font-size: 12px; text-align: center; margin: 0 0 20px; line-height: 1.5;">
        Ak ste sa do administrácie neprihlasovali vy, okamžite si zmeňte heslo.
      </p>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #2B2F49; color: #64748b; font-size: 11px;">
        © ZenFlow Massage Sanctuary • Administrátorský bezpečnostný systém
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ZenFlow Sanctuary" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ [Email Admin 2FA OTP]: Kód úspešne odoslaný na ${to}`);
    return true;
  } catch (err: any) {
    console.error('❌ [Email Admin 2FA OTP Chyba]:', err?.message || err);
    throw err;
  }
}
