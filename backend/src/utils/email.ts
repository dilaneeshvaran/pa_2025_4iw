import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.BACKEND_SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.BACKEND_SMTP_PORT || '587')
const SMTP_USER = process.env.BACKEND_SMTP_USER || ''
const SMTP_PASSWORD = process.env.BACKEND_SMTP_PASS || ''
const SMTP_FROM = process.env.BACKEND_SMTP_FROM || 'noreply@medicote.ci'
const APP_URL = process.env.BACKEND_APP_URL || 'http://localhost:3000'

// create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
})

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send email')
  }
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification de votre email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">Vérification de votre email</h2>
          <p>Bonjour,</p>
          <p>Merci de vous être inscrit sur MediCôte. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Vérifier mon email</a>
          </div>
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #0066cc;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Ce lien expirera dans 24 heures.</p>
          <p style="color: #666; font-size: 14px;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

  await sendEmail(to, 'Vérification de votre email - MediCôte', html)
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de votre mot de passe</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">Réinitialisation de mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Réinitialiser mon mot de passe</a>
          </div>
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Ce lien expirera dans 1 heure.</p>
          <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

  await sendEmail(to, 'Réinitialisation de votre mot de passe - MediCôte', html)
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur MediCôte</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">Bienvenue ${firstName} !</h2>
          <p>Nous sommes ravis de vous accueillir sur MediCôte, votre plateforme de santé en ligne.</p>
          <p>Vous pouvez désormais :</p>
          <ul>
            <li>Prendre rendez-vous avec des professionnels de santé</li>
            <li>Consulter votre dossier médical</li>
            <li>Accéder à la téléconsultation</li>
            <li>Gérer vos documents médicaux</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accéder à mon compte</a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de rendez-vous</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">Rendez-vous confirmé ✓</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Votre rendez-vous a été confirmé avec succès. Voici les détails :</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Praticien :</strong> ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</p>
            <p style="margin: 8px 0;"><strong>Spécialité :</strong> ${data.practitionerSpecialty}</p>
            <p style="margin: 8px 0;"><strong>Date :</strong> ${data.appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Heure :</strong> ${data.appointmentTime}</p>
            <p style="margin: 8px 0;"><strong>Type :</strong> ${typeLabel}</p>
            <p style="margin: 8px 0;"><strong>Tarif :</strong> ${data.consultationFee.toLocaleString('fr-FR')} FCFA</p>
            <p style="margin: 8px 0; color: #666;">${locationInfo}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Voir mes rendez-vous</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Vous recevrez un rappel 24h et 1h avant votre rendez-vous.
          </p>
          <p style="color: #666; font-size: 14px;">
            Pour annuler ou modifier votre rendez-vous, connectez-vous à votre espace patient.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rappel de rendez-vous</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">⏰ Rappel : Rendez-vous ${reminderLabel}</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Nous vous rappelons que vous avez un rendez-vous ${reminderLabel}.</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Praticien :</strong> ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</p>
            <p style="margin: 8px 0;"><strong>Spécialité :</strong> ${data.practitionerSpecialty}</p>
            <p style="margin: 8px 0;"><strong>Date :</strong> ${data.appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Heure :</strong> ${data.appointmentTime}</p>
            <p style="margin: 8px 0;"><strong>Type :</strong> ${typeLabel}</p>
            <p style="margin: 8px 0; color: #666;">${locationInfo}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Voir mes rendez-vous</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

  const subject =
    reminderType === '24h'
      ? 'Rappel : Votre rendez-vous demain - MediCôte'
      : 'Rappel : Votre rendez-vous dans 1 heure - MediCôte'

  await sendEmail(to, subject, html)
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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre facture MediCôte</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">Votre facture est disponible</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Veuillez trouver ci-joint votre facture <strong>${data.invoiceNumber}</strong> du ${data.date} pour un montant de <strong>${data.amount.toLocaleString('fr-FR')} FCFA</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/billing" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Voir mes factures</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Merci de votre confiance.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: `Votre facture ${data.invoiceNumber} - MediCôte`,
      html,
      attachments: [
        {
          filename: `Facture-${data.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })
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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Annulation de votre rendez-vous</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #cc0000; margin-top: 0;">Rendez-vous annulé</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Nous vous informons que votre rendez-vous a été annulé par votre praticien.</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Praticien :</strong> ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</p>
            <p style="margin: 8px 0;"><strong>Date :</strong> ${data.appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Heure :</strong> ${data.appointmentTime}</p>
            ${data.reason ? `<p style="margin: 8px 0;"><strong>Raison :</strong> ${data.reason}</p>` : ''}
          </div>

          <p>Nous vous invitons à reprogrammer votre rendez-vous à une date qui vous convient.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reprendre rendez-vous</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Nous nous excusons pour ce désagrément.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modification de votre rendez-vous</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #e67e00; margin-top: 0;">Rendez-vous modifié</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Votre rendez-vous avec ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName} a été modifié.</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0; color: #cc0000; text-decoration: line-through;"><strong>Ancien :</strong> ${data.oldDate} à ${data.oldTime}</p>
            <p style="margin: 8px 0; color: #009900;"><strong>Nouveau :</strong> ${data.newDate} à ${data.newTime}</p>
          </div>

          <p>Veuillez vérifier votre disponibilité pour le nouveau créneau. Si ce créneau ne vous convient pas, vous pouvez annuler et reprendre un autre rendez-vous.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Voir mes rendez-vous</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Absence à votre rendez-vous</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #cc0000; margin-top: 0;">Vous étiez absent à votre rendez-vous</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Nous avons constaté votre absence lors de votre rendez-vous prévu :</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Praticien :</strong> ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</p>
            <p style="margin: 8px 0;"><strong>Date :</strong> ${data.appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Heure :</strong> ${data.appointmentTime}</p>
          </div>

          <p>Vous avez actuellement <strong>${data.noShowCount} absence(s)</strong> enregistrée(s).</p>
          <p style="color: #cc0000;">Les absences répétées peuvent entraîner des restrictions sur la prise de rendez-vous.</p>
          
          <p>Si cette absence n'est pas de votre fait, veuillez contacter votre praticien.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reprendre rendez-vous</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Absence patient détectée automatiquement</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #cc6600; margin-top: 0;">Absence patient détectée automatiquement</h2>
          <p>Bonjour ${data.practitionerName},</p>
          <p>Le système a automatiquement détecté l'absence du patient suivant lors de votre téléconsultation :</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Patient :</strong> ${data.patientFirstName} ${data.patientLastName}</p>
            <p style="margin: 8px 0;"><strong>Date :</strong> ${data.appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Heure :</strong> ${data.appointmentTime}</p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Note :</strong> Cette absence a été détectée automatiquement car le patient ne s'est pas connecté à la téléconsultation avant la fin du créneau. Le patient a été notifié et son compteur d'absences a été mis à jour (${data.noShowCount} absence(s) au total).</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre téléconsultation n'a pas pu avoir lieu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #cc6600; margin-top: 0;">Votre téléconsultation n'a pas pu avoir lieu</h2>
          <p>Bonjour ${data.patientName},</p>
          <p>Nous sommes désolés de vous informer que votre praticien n'a pas pu se connecter à la téléconsultation prévue :</p>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Praticien :</strong> ${data.practitionerTitle} ${data.practitionerFirstName} ${data.practitionerLastName}</p>
            <p style="margin: 8px 0;"><strong>Date :</strong> ${data.appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Heure :</strong> ${data.appointmentTime}</p>
          </div>

          <div style="background-color: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;"><strong>Aucune absence ne vous est comptabilisée.</strong> Cette annulation n'est pas de votre fait. Vous pouvez reprendre un nouveau rendez-vous.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reprendre rendez-vous</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

  await sendEmail(to, 'Téléconsultation annulée - MediCôte', html)
}
