import { Resend } from 'resend'

const RESEND_API_KEY = process.env.BACKEND_RESEND_API_KEY || ''
// Must be an address on a domain verified in Resend (e.g. medicote.me).
// Strip surrounding quotes: docker `env_file` keeps them literally, which makes
// Resend reject the `from` field with a 422 validation_error.
const EMAIL_FROM = (
  process.env.BACKEND_EMAIL_FROM || 'MediCôte <noreply@medicote.me>'
).replace(/^["']|["']$/g, '')
const APP_URL =
  process.env.BACKEND_FRONTEND_URL ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000'

function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// reusable Resend client (HTTP API - avoids blocked SMTP ports on the VPS).
// Lazily instantiated: `new Resend('')` throws "Missing API key", which would
// break any module that merely imports this file (e.g. test suites that never
// send mail). We only build the client on the first actual send.
let resendClient: Resend | null = null
function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY)
  }
  return resendClient
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send email')
  }
}

export interface EmailLayoutOptions {
  title: string
  preheader?: string
  contentHtml: string
  actionUrl?: string
  actionText?: string
  accentColor?: string
}

export function buildEmailHtml(options: EmailLayoutOptions): string {
  const accent = options.accentColor || '#ff8200'
  const preheaderHtml = options.preheader
    ? `<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; mso-hide:all;">${options.preheader}</span>`
    : ''

  const actionButtonHtml = (options.actionUrl && options.actionText)
    ? `
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${options.actionUrl}" style="background-color: ${accent}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-size: 15px; box-shadow: 0 4px 6px rgba(255, 130, 0, 0.15); min-height: 44px; line-height: 44px; padding-top: 0; padding-bottom: 0; text-align: center;">
          ${options.actionText}
        </a>
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <!--<![endif]-->
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      a {
        color: #ff8200;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      @media only screen and (max-width: 620px) {
        .container {
          width: 100% !important;
          padding: 10px !important;
        }
        .content-card {
          padding: 24px !important;
          border-radius: 8px !important;
        }
      }
    </style>
  </head>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; padding-top: 32px; padding-bottom: 32px;">
    ${preheaderHtml}
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="width: 600px; margin: 0 auto;">
            <!-- Brand Header -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-size: 28px; font-weight: 700; color: #ff8200; letter-spacing: -0.5px; padding-bottom: 4px;">
                      <span style="color: #ff8200;">Medi</span><span style="color: #009a44;">Côte</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; font-weight: 500;">
                      Plateforme de santé numérique
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Main Content Card -->
            <tr>
              <td style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);">
                <!-- Colored top accent line -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%" height="4" style="background-color: #ff8200; font-size: 1px; line-height: 1px;">&nbsp;</td>
                    <td width="50%" height="4" style="background-color: #009a44; font-size: 1px; line-height: 1px;">&nbsp;</td>
                  </tr>
                </table>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-card" style="padding: 40px; font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
                      ${options.contentHtml}
                      ${actionButtonHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top: 32px; padding-bottom: 16px; font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.6; text-align: center;">
                <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
                <p style="margin: 0; font-size: 11px;">Cet e-mail automatique a été envoyé par MediCôte. Veuillez ne pas y répondre directement.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`

  const html = buildEmailHtml({
    title: 'Vérification de votre e-mail - MediCôte',
    preheader: 'Activez votre compte pour commencer sur MediCôte.',
    contentHtml: `
      <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Vérification de votre e-mail</h2>
      <p style="margin: 0 0 16px 0;">Bonjour,</p>
      <p style="margin: 0 0 24px 0;">Merci de vous être inscrit sur MediCôte. Pour activer votre compte et accéder à nos services, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>

      <p style="margin: 24px 0 8px 0; font-size: 13px; color: #64748b;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
      <p style="margin: 0; font-size: 13px; word-break: break-all;"><a href="${verificationUrl}" style="color: #ff8200; text-decoration: none;">${verificationUrl}</a></p>
      
      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail en toute sécurité.</p>
    `,
    actionUrl: verificationUrl,
    actionText: 'Vérifier mon e-mail',
  })

  await sendEmail(to, 'Vérification de votre email - MediCôte', html)
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  const html = buildEmailHtml({
    title: 'Réinitialisation de votre mot de passe - MediCôte',
    preheader: 'Demande de réinitialisation de mot de passe.',
    contentHtml: `
      <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Réinitialisation de mot de passe</h2>
      <p style="margin: 0 0 16px 0;">Bonjour,</p>
      <p style="margin: 0 0 24px 0;">Vous avez demandé la réinitialisation du mot de passe de votre compte MediCôte. Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
      
      <p style="margin: 24px 0 8px 0; font-size: 13px; color: #64748b;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
      <p style="margin: 0; font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #ff8200; text-decoration: none;">${resetUrl}</a></p>
      
      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.</p>
    `,
    actionUrl: resetUrl,
    actionText: 'Réinitialiser mon mot de passe',
  })

  await sendEmail(to, 'Réinitialisation de votre mot de passe - MediCôte', html)
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Bienvenue sur MediCôte',
    preheader: 'Votre compte MediCôte est prêt.',
    contentHtml: `
      <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Bienvenue ${firstName} !</h2>
      <p style="margin: 0 0 16px 0;">Nous sommes ravis de vous accueillir sur MediCôte, votre plateforme de santé en ligne.</p>
      <p style="margin: 0 0 16px 0;">Vous pouvez désormais :</p>
      <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #475569;">
        <li style="margin-bottom: 8px;">Prendre rendez-vous avec des professionnels de santé</li>
        <li style="margin-bottom: 8px;">Consulter votre dossier médical</li>
        <li style="margin-bottom: 8px;">Accéder à la téléconsultation</li>
        <li style="margin-bottom: 8px;">Gérer vos documents médicaux</li>
      </ul>
    `,
    actionUrl: APP_URL,
    actionText: 'Accéder à mon compte',
  })

  await sendEmail(to, 'Bienvenue sur MediCôte', html)
}

interface AppointmentEmailData {
  patientName: string
  practitionerTitle: string
  practitionerFirstName: string
  practitionerLastName: string
  practitionerSpecialty: string
  appointmentDate: string
  appointmentTime: string
  consultationType: 'IN_PERSON' | 'TELECONSULTATION'
  consultationFee: number
  clinicAddress?: string
  appointmentId: string
}

export async function sendAppointmentConfirmationEmail(
  to: string,
  data: AppointmentEmailData,
): Promise<void> {
  const isTelemedicine = data.consultationType === 'TELECONSULTATION'
  const typeLabel = isTelemedicine
    ? 'Téléconsultation'
    : 'Consultation au cabinet'
  const locationInfo = isTelemedicine
    ? 'Vous recevrez un lien de connexion avant votre rendez-vous.'
    : `Adresse : ${data.clinicAddress || 'À confirmer'}`

  const html = buildEmailHtml({
    title: 'Confirmation de rendez-vous - MediCôte',
    preheader: `Votre rendez-vous avec ${data.practitionerTitle} ${data.practitionerLastName} est confirmé.`,
    contentHtml: `
      <h2 style="color: #009a44; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous confirmé ✓</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Votre rendez-vous a été confirmé avec succès. Voici les détails :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Spécialité :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerSpecialty}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 500;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 500;">${data.appointmentTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Type :</td>
            <td style="padding: 6px 0; color: #334155;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Tarif :</td>
            <td style="padding: 6px 0; color: #334155;">${data.consultationFee.toLocaleString('fr-FR')} FCFA</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Lieu / Infos :</td>
            <td style="padding: 10px 0 0 0; color: #64748b; border-top: 1px solid #e2e8f0; font-style: italic;">${locationInfo}</td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        Vous recevrez un rappel 24h et 1h avant votre rendez-vous. Pour annuler ou modifier votre rendez-vous, connectez-vous à votre espace patient.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Voir mes rendez-vous',
    accentColor: '#009a44',
  })

  await sendEmail(to, 'Confirmation de votre rendez-vous - MediCôte', html)
}

export async function sendAppointmentReminderEmail(
  to: string,
  data: AppointmentEmailData,
  reminderType: '24h' | '1h',
): Promise<void> {
  const isTelemedicine = data.consultationType === 'TELECONSULTATION'
  const typeLabel = isTelemedicine
    ? 'Téléconsultation'
    : 'Consultation au cabinet'
  const reminderLabel =
    reminderType === '24h' ? 'dans 24 heures' : 'dans 1 heure'
  const locationInfo = isTelemedicine
    ? 'Préparez-vous à rejoindre la téléconsultation depuis votre espace patient.'
    : `Adresse : ${data.clinicAddress || 'À confirmer'}`

  const html = buildEmailHtml({
    title: 'Rappel de rendez-vous - MediCôte',
    preheader: `Rappel : Votre rendez-vous ${reminderLabel} avec ${data.practitionerTitle} ${data.practitionerLastName}.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">⏰ Rappel : Rendez-vous ${reminderLabel}</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Nous vous rappelons que vous avez un rendez-vous ${reminderLabel}. Voici les détails :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Spécialité :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerSpecialty}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 500;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 500;">${data.appointmentTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Type :</td>
            <td style="padding: 6px 0; color: #334155;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Lieu / Infos :</td>
            <td style="padding: 10px 0 0 0; color: #64748b; border-top: 1px solid #e2e8f0; font-style: italic;">${locationInfo}</td>
          </tr>
        </table>
      </div>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Voir mes rendez-vous',
  })

  const subject =
    reminderType === '24h'
      ? 'Rappel : Votre rendez-vous demain - MediCôte'
      : 'Rappel : Votre rendez-vous dans 1 heure - MediCôte'

  await sendEmail(to, subject, html)
}

export interface HealthReminderEmailData {
  patientName: string
  practitionerTitle: string
  practitionerFirstName: string
  practitionerLastName: string
  message: string
  scheduledDate: string
  scheduledTime: string
}

export async function sendHealthReminderEmail(
  to: string,
  data: HealthReminderEmailData,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Rappel santé - MediCôte',
    preheader: `Rappel santé programmé par ${data.practitionerTitle} ${data.practitionerLastName}.`,
    contentHtml: `
      <h2 style="color: #009a44; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rappel santé</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${escapeEmailHtml(data.patientName)},</p>
      <p style="margin: 0 0 20px 0;">Votre praticien vous a programmé le rappel suivant :</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${escapeEmailHtml(data.practitionerTitle)} ${escapeEmailHtml(data.practitionerFirstName)} ${escapeEmailHtml(data.practitionerLastName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155;">${escapeEmailHtml(data.scheduledDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${escapeEmailHtml(data.scheduledTime)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ecfdf5; border-left: 4px solid #009a44; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 15px; color: #064e3b;">
        <p style="margin: 0; white-space: pre-line;">${escapeEmailHtml(data.message)}</p>
      </div>
    `,
    actionUrl: `${APP_URL}/patient/dashboard`,
    actionText: 'Voir mon tableau de bord',
    accentColor: '#009a44',
  })

  await sendEmail(to, 'Rappel santé - MediCôte', html)
}

export async function sendInvoiceEmail(
  to: string,
  data: {
    patientName: string
    invoiceNumber: string
    amount: number
    date: string
  },
  pdfBuffer: Buffer,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Votre facture MediCôte',
    preheader: `Votre facture ${data.invoiceNumber} est disponible.`,
    contentHtml: `
      <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Votre facture est disponible</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Veuillez trouver ci-joint votre facture <strong>${data.invoiceNumber}</strong> du ${data.date} pour un montant de <strong>${data.amount.toLocaleString('fr-FR')} FCFA</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 45%; vertical-align: top;">Numéro de facture :</td>
            <td style="padding: 6px 0; color: #334155;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date d'émission :</td>
            <td style="padding: 6px 0; color: #334155;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Montant total :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: bold;">${data.amount.toLocaleString('fr-FR')} FCFA</td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Merci de votre confiance.</p>
    `,
    actionUrl: `${APP_URL}/patient/billing`,
    actionText: 'Voir mes factures',
  })

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Votre facture ${data.invoiceNumber} - MediCôte`,
      html,
      attachments: [
        {
          filename: `Facture-${data.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    })
    if (error) {
      console.error('Error sending invoice email:', error)
      throw new Error('Failed to send invoice email')
    }
  } catch (error) {
    console.error('Error sending invoice email:', error)
    throw new Error('Failed to send invoice email')
  }
}

interface AppointmentCancellationEmailData {
  patientName: string
  practitionerTitle: string
  practitionerFirstName: string
  practitionerLastName: string
  appointmentDate: string
  appointmentTime: string
  reason?: string
}

export async function sendAppointmentCancelledByPractitionerEmail(
  to: string,
  data: AppointmentCancellationEmailData,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Annulation de votre rendez-vous - MediCôte',
    preheader: `Votre rendez-vous avec ${data.practitionerTitle} ${data.practitionerLastName} a été annulé.`,
    contentHtml: `
      <h2 style="color: #dc2626; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous annulé</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Nous vous informons que votre rendez-vous a été annulé par votre praticien.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentTime}</td>
          </tr>
          ${data.reason ? `
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Raison :</td>
            <td style="padding: 10px 0 0 0; color: #dc2626; border-top: 1px solid #e2e8f0; font-weight: 500;">${data.reason}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
        Nous nous excusons pour ce désagrément. Nous vous invitons à reprogrammer votre rendez-vous à une date qui vous convient.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Reprendre rendez-vous',
    accentColor: '#dc2626',
  })

  await sendEmail(to, 'Annulation de votre rendez-vous - MediCôte', html)
}

interface AppointmentModifiedEmailData {
  patientName: string
  practitionerTitle: string
  practitionerFirstName: string
  practitionerLastName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}

export async function sendAppointmentModifiedByPractitionerEmail(
  to: string,
  data: AppointmentModifiedEmailData,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Modification de votre rendez-vous - MediCôte',
    preheader: `Votre rendez-vous avec ${data.practitionerTitle} ${data.practitionerLastName} a été modifié.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous modifié</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Votre rendez-vous avec ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName} a été modifié.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Ancien créneau :</td>
            <td style="padding: 6px 0; color: #dc2626; text-decoration: line-through;">Le ${data.oldDate} à ${data.oldTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Nouveau créneau :</td>
            <td style="padding: 10px 0 0 0; color: #009a44; font-weight: bold; border-top: 1px solid #e2e8f0;">Le ${data.newDate} à ${data.newTime}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
        Veuillez vérifier votre disponibilité pour le nouveau créneau. Si ce créneau ne vous convient pas, vous pouvez annuler et reprendre un autre rendez-vous.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Voir mes rendez-vous',
  })

  await sendEmail(to, 'Modification de votre rendez-vous - MediCôte', html)
}

export async function sendNoShowEmail(
  to: string,
  data: {
    patientName: string
    practitionerTitle: string
    practitionerFirstName: string
    practitionerLastName: string
    appointmentDate: string
    appointmentTime: string
    noShowCount: number
  },
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Absence à votre rendez-vous - MediCôte',
    preheader: `Absence signalée à votre rendez-vous du ${data.appointmentDate}.`,
    contentHtml: `
      <h2 style="color: #dc2626; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Vous étiez absent à votre rendez-vous</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Nous avons constaté votre absence lors de votre rendez-vous prévu :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentTime}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #991b1b;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">Compteur d'absences :</p>
        <p style="margin: 0;">Vous avez actuellement <strong>${data.noShowCount} absence(s)</strong> enregistrée(s). Les absences répétées peuvent entraîner des restrictions sur la prise de rendez-vous.</p>
      </div>
      
      <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
        Si cette absence n'est pas de votre fait, veuillez contacter votre praticien.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Reprendre rendez-vous',
    accentColor: '#dc2626',
  })

  await sendEmail(to, 'Absence à votre rendez-vous - MediCôte', html)
}

export async function sendAutoNoShowPractitionerNotification(
  to: string,
  data: {
    practitionerName: string
    patientFirstName: string
    patientLastName: string
    appointmentDate: string
    appointmentTime: string
    noShowCount: number
  },
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Absence patient détectée automatiquement - MediCôte',
    preheader: `Absence du patient ${data.patientFirstName} ${data.patientLastName} lors de la téléconsultation.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Absence patient détectée automatiquement</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.practitionerName},</p>
      <p style="margin: 0 0 20px 0;">Le système a automatiquement détecté l'absence du patient suivant lors de votre téléconsultation :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Patient :</td>
            <td style="padding: 6px 0; color: #334155;">${data.patientFirstName} ${data.patientLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentTime}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #78350f;">
        <p style="margin: 0;"><strong>Note :</strong> Cette absence a été détectée automatiquement car le patient ne s'est pas connecté à la téléconsultation avant la fin du créneau. Le patient a été notifié et son compteur d'absences a été mis à jour (${data.noShowCount} absence(s) au total).</p>
      </div>
    `,
  })

  await sendEmail(to, 'Absence patient détectée - MediCôte', html)
}

export async function sendPractitionerAbsentNotification(
  to: string,
  data: {
    patientName: string
    practitionerTitle: string
    practitionerFirstName: string
    practitionerLastName: string
    appointmentDate: string
    appointmentTime: string
  },
): Promise<void> {
  const html = buildEmailHtml({
    title: "Votre téléconsultation n'a pas pu avoir lieu - MediCôte",
    preheader: `Praticien absent à votre téléconsultation du ${data.appointmentDate}.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Votre téléconsultation n'a pas pu avoir lieu</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Nous sommes désolés de vous informer que votre praticien n'a pas pu se connecter à la téléconsultation prévue :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentTime}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #065f46;">
        <p style="margin: 0;"><strong>Aucune absence ne vous est comptabilisée.</strong> Cette annulation n'est pas de votre fait. Vous pouvez reprendre un nouveau rendez-vous.</p>
      </div>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Reprendre rendez-vous',
  })

  await sendEmail(to, 'Téléconsultation annulée - MediCôte', html)
}

export async function sendPractitionerLateEmail(
  to: string,
  data: {
    patientName: string
    practitionerTitle: string
    practitionerFirstName: string
    practitionerLastName: string
    appointmentDate: string
    appointmentTime: string
    delayMinutes: number
  },
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Retard de votre praticien - MediCôte',
    preheader: `Votre praticien ${data.practitionerTitle} ${data.practitionerLastName} aura environ ${data.delayMinutes} minutes de retard.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Retard signalé par votre praticien</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Nous vous informons que votre praticien aura environ <strong>${data.delayMinutes} minutes</strong> de retard pour votre téléconsultation du ${data.appointmentDate} prévue à ${data.appointmentTime}.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Nouvelle estimation :</td>
            <td style="padding: 6px 0; color: #ff8200; font-weight: bold;">+ ${data.delayMinutes} minutes</td>
          </tr>
        </table>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
        Vous pouvez vous connecter à la salle de téléconsultation et attendre le praticien. Nous vous remercions pour votre patience.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/teleconsultations`,
    actionText: 'Rejoindre la téléconsultation',
  })

  await sendEmail(to, 'Retard de votre praticien - MediCôte', html)
}


export async function sendStaffAccountCreatedEmail(
  to: string,
  firstName: string,
  generatedPassword: string,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Votre compte personnel MediCôte',
    preheader: 'Votre compte personnel a été créé sur MediCôte.',
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Bienvenue ${firstName} !</h2>
      <p style="margin: 0 0 16px 0;">Un compte personnel a été créé pour vous sur MediCôte.</p>
      <p style="margin: 0 0 20px 0;">Voici vos identifiants de connexion temporaires :</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 45%; vertical-align: top;">Email :</td>
            <td style="padding: 6px 0; color: #334155;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Mot de passe temporaire :</td>
            <td style="padding: 6px 0; color: #334155; font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">${generatedPassword}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #78350f;">
        <p style="margin: 0;"><strong>Important :</strong> Nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>
      </div>
    `,
    actionUrl: `${APP_URL}/auth/login`,
    actionText: 'Se connecter',
  })

  await sendEmail(to, 'Votre compte personnel MediCôte', html)
}

export async function sendCabinetInvitationEmail(
  to: string,
  cabinetName: string,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Invitation à rejoindre un cabinet - MediCôte',
    preheader: `Le cabinet ${cabinetName} vous invite à rejoindre son équipe sur MediCôte.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Invitation à rejoindre un cabinet</h2>
      <p style="margin: 0 0 16px 0;">Bonjour,</p>
      <p style="margin: 0 0 20px 0;">Le cabinet <strong>${cabinetName}</strong> vous invite à rejoindre leur équipe sur MediCôte.</p>

      <p style="color: #666; font-size: 14px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Cette invitation expirera dans 7 jours. Si vous ne souhaitez pas rejoindre ce cabinet, vous pouvez ignorer cet email.</p>
    `,
    actionUrl: `${APP_URL}/practitioner/cabinets?tab=invitations`,
    actionText: "Voir l'invitation",
  })

  await sendEmail(to, `Invitation à rejoindre ${cabinetName} - MediCôte`, html)
}

export async function sendCabinetLeaveAppointmentCancelledEmail(
  to: string,
  data: {
    patientName: string
    practitionerTitle: string
    practitionerFirstName: string
    practitionerLastName: string
    cabinetName: string
    appointmentDate: string
    appointmentTime: string
  },
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Annulation de votre rendez-vous - MediCôte',
    preheader: `Votre rendez-vous avec ${data.practitionerTitle} ${data.practitionerLastName} a été annulé suite à un changement au cabinet ${data.cabinetName}.`,
    contentHtml: `
      <h2 style="color: #dc2626; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous annulé</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Nous vous informons que votre rendez-vous a été annulé car votre praticien ne fait plus partie du cabinet <strong>${data.cabinetName}</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Cabinet :</td>
            <td style="padding: 6px 0; color: #334155;">${data.cabinetName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentTime}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
        Nous nous excusons pour ce désagrément. Nous vous invitons à reprogrammer votre rendez-vous avec un autre praticien ou à contacter le cabinet.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Reprendre rendez-vous',
    accentColor: '#dc2626',
  })

  await sendEmail(to, 'Annulation de votre rendez-vous - MediCôte', html)
}

interface AppointmentCancelledByPatientEmailData {
  practitionerName: string
  patientFirstName: string
  patientLastName: string
  appointmentDate: string
  appointmentTime: string
  reason?: string
}

export async function sendAppointmentCancelledByPatientEmail(
  to: string,
  data: AppointmentCancelledByPatientEmailData,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Annulation de rendez-vous par un patient - MediCôte',
    preheader: `Le patient ${data.patientFirstName} ${data.patientLastName} a annulé son rendez-vous.`,
    contentHtml: `
      <h2 style="color: #dc2626; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous annulé par le patient</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.practitionerName},</p>
      <p style="margin: 0 0 20px 0;">Un patient a annulé son rendez-vous. Voici les détails :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Patient :</td>
            <td style="padding: 6px 0; color: #334155;">${data.patientFirstName} ${data.patientLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Date :</td>
            <td style="padding: 6px 0; color: #334155; border-top: 1px solid #e2e8f0;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155;">${data.appointmentTime}</td>
          </tr>
          ${data.reason ? `
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Raison :</td>
            <td style="padding: 10px 0 0 0; color: #64748b; border-top: 1px solid #e2e8f0; font-style: italic;">${data.reason}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
        Le créneau est maintenant disponible pour d'autres patients.
      </p>
    `,
    actionUrl: `${APP_URL}/practitioner/agenda`,
    actionText: 'Voir mon agenda',
    accentColor: '#dc2626',
  })

  await sendEmail(to, 'Annulation de rendez-vous - MediCôte', html)
}

interface AppointmentModifiedByPatientEmailData {
  practitionerName: string
  patientFirstName: string
  patientLastName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}

export async function sendAppointmentModifiedByPatientEmail(
  to: string,
  data: AppointmentModifiedByPatientEmailData,
): Promise<void> {
  const html = buildEmailHtml({
    title: 'Modification de rendez-vous par un patient - MediCôte',
    preheader: `Le patient ${data.patientFirstName} ${data.patientLastName} a déplacé son rendez-vous.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous modifié par le patient</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.practitionerName},</p>
      <p style="margin: 0 0 20px 0;">Un patient a modifié son rendez-vous. Voici les détails :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Patient :</td>
            <td style="padding: 6px 0; color: #334155;">${data.patientFirstName} ${data.patientLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Ancien :</td>
            <td style="padding: 6px 0; color: #dc2626; text-decoration: line-through; border-top: 1px solid #e2e8f0;">${data.oldDate} à ${data.oldTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Nouveau :</td>
            <td style="padding: 10px 0 0 0; color: #009a44; font-weight: bold; border-top: 1px solid #e2e8f0;">${data.newDate} à ${data.newTime}</td>
          </tr>
        </table>
      </div>
    `,
    actionUrl: `${APP_URL}/practitioner/agenda`,
    actionText: 'Voir mon agenda',
  })

  await sendEmail(to, 'Modification de rendez-vous - MediCôte', html)
}

interface AppointmentBookedByPractitionerEmailData {
  patientName: string
  practitionerTitle: string
  practitionerFirstName: string
  practitionerLastName: string
  practitionerSpecialty: string
  appointmentDate: string
  appointmentTime: string
  consultationType: 'IN_PERSON' | 'TELECONSULTATION'
  consultationFee: number
  clinicAddress?: string
}

export async function sendAppointmentBookedByPractitionerEmail(
  to: string,
  data: AppointmentBookedByPractitionerEmailData,
): Promise<void> {
  const isTelemedicine = data.consultationType === 'TELECONSULTATION'
  const typeLabel = isTelemedicine
    ? 'Téléconsultation'
    : 'Consultation au cabinet'
  const locationInfo = isTelemedicine
    ? 'Vous recevrez un lien de connexion avant votre rendez-vous.'
    : `Adresse : ${data.clinicAddress || 'À confirmer'}`

  const html = buildEmailHtml({
    title: 'Nouveau rendez-vous programmé - MediCôte',
    preheader: `Un rendez-vous a été programmé pour vous par ${data.practitionerTitle} ${data.practitionerLastName}.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Rendez-vous programmé pour vous ✓</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Votre praticien a programmé un rendez-vous pour vous. Voici les détails :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Praticien :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Spécialité :</td>
            <td style="padding: 6px 0; color: #334155;">${data.practitionerSpecialty}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 500;">${data.appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 500;">${data.appointmentTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Type :</td>
            <td style="padding: 6px 0; color: #334155;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Tarif :</td>
            <td style="padding: 6px 0; color: #334155;">${data.consultationFee.toLocaleString('fr-FR')} FCFA</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; font-weight: 600; color: #1e293b; vertical-align: top; border-top: 1px solid #e2e8f0;">Lieu / Infos :</td>
            <td style="padding: 10px 0 0 0; color: #64748b; border-top: 1px solid #e2e8f0; font-style: italic;">${locationInfo}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        Vous recevrez un rappel 24h et 1h avant votre rendez-vous. Pour annuler ou modifier votre rendez-vous, connectez-vous à votre espace patient.
      </p>
    `,
    actionUrl: `${APP_URL}/patient/appointments`,
    actionText: 'Voir mes rendez-vous',
  })

  await sendEmail(to, 'Nouveau rendez-vous programmé - MediCôte', html)
}

export interface EarlierSlotAlertEmailData {
  patientName: string
  practitionerTitle: string
  practitionerFirstName: string
  practitionerLastName: string
  cancelledDate: string
  cancelledTime: string
  practitionerId: string
}

export async function sendEarlierSlotAlertEmail(
  to: string,
  data: EarlierSlotAlertEmailData,
): Promise<void> {
  const alertUrl = `${APP_URL}/practitioner/${data.practitionerId}?tab=availability`

  const html = buildEmailHtml({
    title: 'Disponibilité plus proche libérée - MediCôte',
    preheader: `Une disponibilité plus proche s'est libérée avec ${data.practitionerTitle} ${data.practitionerLastName}.`,
    contentHtml: `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Créneau plus proche disponible !</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.patientName},</p>
      <p style="margin: 0 0 20px 0;">Vous avez activé l'alerte pour obtenir un rendez-vous plus proche avec <strong>${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</strong>.</p>
      <p style="margin: 0 0 20px 0;">Bonne nouvelle ! Le créneau suivant vient de se libérer :</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 35%; vertical-align: top;">Date :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: bold;">${data.cancelledDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Heure :</td>
            <td style="padding: 6px 0; color: #334155; font-weight: bold;">${data.cancelledTime}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 24px 0;">Si vous souhaitez réserver ce créneau à la place de votre rendez-vous actuel, veuillez cliquer sur le bouton ci-dessous pour vous connecter et accéder aux disponibilités du praticien :</p>
    `,
    actionUrl: alertUrl,
    actionText: 'Voir les disponibilités',
  })

  await sendEmail(to, 'Disponibilité plus proche libérée - MediCôte', html)
}

export async function sendTeleconsultationParticipantJoinedEmail(
  to: string,
  data: {
    recipientName: string
    senderName: string
    appointmentId: string
    isRecipientPatient: boolean
  }
): Promise<void> {
  const joinUrl = data.isRecipientPatient
    ? `${APP_URL}/patient/teleconsultations?appointmentId=${data.appointmentId}`
    : `${APP_URL}/practitioner/teleconsultations?appointmentId=${data.appointmentId}`

  const title = data.isRecipientPatient
    ? 'Votre praticien a rejoint la téléconsultation - MediCôte'
    : 'Votre patient a rejoint la téléconsultation - MediCôte'

  const contentHtml = data.isRecipientPatient
    ? `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Votre praticien vous attend</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.recipientName},</p>
      <p style="margin: 0 0 20px 0;">Votre praticien <strong>${data.senderName}</strong> a rejoint la téléconsultation. Vous pouvez vous connecter dès maintenant pour débuter la séance :</p>
    `
    : `
      <h2 style="color: #ff8200; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Votre patient est en ligne</h2>
      <p style="margin: 0 0 16px 0;">Bonjour ${data.recipientName},</p>
      <p style="margin: 0 0 20px 0;">Votre patient <strong>${data.senderName}</strong> a rejoint la téléconsultation. Vous pouvez vous connecter dès maintenant pour débuter la séance :</p>
    `

  const html = buildEmailHtml({
    title,
    preheader: data.isRecipientPatient
      ? `${data.senderName} a rejoint la téléconsultation.`
      : `${data.senderName} a rejoint la téléconsultation.`,
    contentHtml,
    actionUrl: joinUrl,
    actionText: 'Rejoindre la téléconsultation',
    accentColor: '#ff8200',
  })

  await sendEmail(to, title, html)
}

