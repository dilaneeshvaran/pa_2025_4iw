import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || ''
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@medicote.ci'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

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
