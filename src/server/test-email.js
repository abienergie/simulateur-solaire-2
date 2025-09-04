import { transporter } from './config/email.js';

async function sendTestEmail() {
  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Abi Énergie" <abienergie2025@gmail.com>',
      to: 'ilan.yvel@gmail.com',
      subject: 'Test',
      text: ''
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

sendTestEmail();