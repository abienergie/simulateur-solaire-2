import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_STYLES, TABLE_STYLES } from './styles';

export function generateSection(
  doc: jsPDF,
  title: string,
  data: Array<[string, string]>,
  options: {
    startY: number;
    icon?: string;
    headerColor?: number[];
  }
) {
  const { startY, headerColor = PDF_STYLES.colors.primary } = options;

  // Add section title
  doc.setFontSize(PDF_STYLES.fonts.section.size);
  doc.setTextColor(...PDF_STYLES.colors.text.dark);
  doc.text(title, PDF_STYLES.spacing.margin, startY);

  // Generate table
  autoTable(doc, {
    startY: startY + 5,
    head: [['', '']],
    body: data,
    theme: 'plain',
    styles: {
      ...TABLE_STYLES.cell,
      cellWidth: 'auto'
    },
    headStyles: {
      ...TABLE_STYLES.header,
      fillColor: headerColor
    },
    alternateRowStyles: TABLE_STYLES.alternateRow,
    margin: { left: PDF_STYLES.spacing.margin, right: PDF_STYLES.spacing.margin },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 'auto' }
    }
  });

  return (doc as any).lastAutoTable.finalY;
}