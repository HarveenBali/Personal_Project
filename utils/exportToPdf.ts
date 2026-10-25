import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  title?: string;
  backgroundColor?: string;
  scale?: number;
}

function resolveTarget(target: HTMLElement | string): HTMLElement {
  if (typeof target !== 'string') {
    return target;
  }

  const element = document.querySelector<HTMLElement>(target);
  if (!element) {
    throw new Error(`Could not find an element matching "${target}".`);
  }
  return element;
}

export async function exportToPdf(
  target: HTMLElement | string,
  {
    filename = 'change-request-audit.pdf',
    title = 'Change Request Audit Report',
    backgroundColor = '#ffffff',
    scale = 2,
  }: PdfExportOptions = {},
): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF export is only available in the browser.');
  }

  const element = resolveTarget(target);
  const capturedCanvas = await html2canvas(element, {
    backgroundColor,
    scale,
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const headerHeight = 48;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2 - headerHeight;
  const sourceSliceHeight = Math.max(
    1,
    Math.floor((contentHeight * capturedCanvas.width) / contentWidth),
  );
  const pageCount = Math.ceil(capturedCanvas.height / sourceSliceHeight);
  const generatedAt = new Date().toLocaleString();

  pdf.setProperties({
    title,
    subject: 'Audit document',
    creator: 'Personal Project reporting',
  });

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.setFontSize(16);
    pdf.text(title, margin, margin + 16);
    pdf.setFontSize(9);
    pdf.text(`Generated ${generatedAt} · Page ${pageIndex + 1} of ${pageCount}`, margin, margin + 32);

    const sourceY = pageIndex * sourceSliceHeight;
    const sliceHeight = Math.min(sourceSliceHeight, capturedCanvas.height - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = capturedCanvas.width;
    pageCanvas.height = sliceHeight;
    const context = pageCanvas.getContext('2d');
    if (!context) {
      throw new Error('Could not prepare the captured report for PDF export.');
    }
    context.drawImage(
      capturedCanvas,
      0,
      sourceY,
      capturedCanvas.width,
      sliceHeight,
      0,
      0,
      capturedCanvas.width,
      sliceHeight,
    );

    const imageHeight = Math.min(
      (sliceHeight * contentWidth) / capturedCanvas.width,
      contentHeight,
    );
    pdf.addImage(
      pageCanvas.toDataURL('image/png'),
      'PNG',
      margin,
      margin + headerHeight,
      contentWidth,
      imageHeight,
    );
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
