import html2pdf from 'html2pdf.js';

interface ExportOptions {
  filename?: string;
  title?: string;
}

export async function exportLaporanToPDF(
  elementId: string,
  options: ExportOptions = {},
) {
  const {
    filename = `Laporan-Keuangan-${new Date().toISOString().split('T')[0]}.pdf`,
    title = 'Laporan Keuangan',
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const pdfConfig: Record<string, unknown> = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    },
    pagebreak: { mode: ['avoid-all'] },
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (html2pdf() as any).set(pdfConfig).from(element).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Gagal export laporan ke PDF');
  }
}
