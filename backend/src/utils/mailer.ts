import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, // true for 465, false for other ports
  requireTLS: true,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendOTP(email: string, otp: string, type: string) {
  try {
    let subject = 'Dapur Gizi - Kode OTP Verifikasi Email';
    let text = `Halo,\n\nKode OTP Anda untuk verifikasi email adalah: ${otp}\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.\n\nTerima kasih,\nTim Dapur Gizi`;

    if (type === 'PASSWORD_RESET') {
      subject = 'Dapur Gizi - Reset Password';
      text = `Halo,\n\nKode OTP Anda untuk reset password adalah: ${otp}\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.\n\nTerima kasih,\nTim Dapur Gizi`;
    }

    const info = await transporter.sendMail({
      from: `"Dapur Gizi" <${config.smtp.from}>`,
      to: email,
      subject: subject,
      text: text,
    });

    console.log(`📧 Berhasil kirim email ke ${email}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    return false;
  }
}
