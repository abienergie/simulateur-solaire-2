import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration for Gmail SMTP with app password
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: 'abienergie2025@gmail.com',
    pass: 'rqsk xffr okob rewv' // App password
  },
  debug: process.env.NODE_ENV !== 'production'
});

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export async function testEmailConnection() {
  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('✗ SMTP connection failed:', error);
    throw error;
  }
}