import { PDFDocument } from 'pdf-lib';

/**
 * Merges multiple PDF documents into a single PDF
 * @param mainPdfBytes The main PDF document as Uint8Array
 * @param attachmentFiles Array of File objects containing PDF attachments
 * @returns Promise resolving to a Uint8Array of the merged PDF
 */
export async function mergePdfs(mainPdfBytes: Uint8Array, attachmentFiles: File[]): Promise<Uint8Array> {
  try {
    // Load the main PDF document
    const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
    
    // Process each attachment
    for (const file of attachmentFiles) {
      try {
        // Read the attachment file
        const fileArrayBuffer = await file.arrayBuffer();
        const attachmentBytes = new Uint8Array(fileArrayBuffer);
        
        // Load the attachment PDF
        const attachmentPdf = await PDFDocument.load(attachmentBytes);
        
        // Copy all pages from the attachment
        const copiedPages = await mainPdfDoc.copyPages(
          attachmentPdf, 
          attachmentPdf.getPageIndices()
        );
        
        // Add each copied page to the main document
        copiedPages.forEach(page => {
          mainPdfDoc.addPage(page);
        });
        
        console.log(`Successfully merged attachment: ${file.name}`);
      } catch (attachmentError) {
        console.error(`Error processing attachment ${file.name}:`, attachmentError);
        // Continue with other attachments even if one fails
      }
    }
    
    // Save the merged PDF
    return await mainPdfDoc.save();
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw new Error('Failed to merge PDF documents');
  }
}