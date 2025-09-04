import { jsPDF } from 'jspdf';
import { PDF_STYLES } from './styles';

export async function generateHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Add gradient background
  const { x1, y1, x2, y2 } = PDF_STYLES.gradients.header.coordinates;
  const [color1, color2] = PDF_STYLES.gradients.header.colors;
  
  doc.saveGraphicsState();
  const gradient = doc.addLinearGradient(x1, y1, x2, y2, color1, color2);
  doc.setFillColor(gradient);
  doc.rect(0, 0, doc.internal.pageSize.width, 60, 'F');
  doc.restoreGraphicsState();

  // Add logo
  const logoImg = new Image();
  logoImg.src = 'https://i.postimg.cc/RZ85P8zM/Logo-ABI.png';
  
  await new Promise((resolve, reject) => {
    logoImg.onload = resolve;
    logoImg.onerror = reject;
  });

  doc.addImage(logoImg, 'PNG', 15, 15, 50, 25);

  // Add title
  doc.setFontSize(PDF_STYLES.fonts.heading.size);
  doc.setTextColor(...PDF_STYLES.colors.text.light);
  doc.text(title, doc.internal.pageSize.width / 2, 35, { align: 'center' });

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(PDF_STYLES.fonts.subheading.size);
    doc.text(subtitle, doc.internal.pageSize.width / 2, 45, { align: 'center' });
  }
}