function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add page numbers
    doc.setFontSize(8);
    doc.setTextColor(...PDF_STYLES.colors.text.muted);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );

    // Add non-contractual notice
    doc.setFontSize(7);
    doc.setTextColor(...PDF_STYLES.colors.text.muted);
    doc.text(
      'Document non contractuel. Les valeurs présentées sont des estimations basées sur les données fournies.',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
}