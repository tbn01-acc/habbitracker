import { jsPDF } from 'jspdf';

let fontBase64Cache: string | null = null;

async function loadRobotoBase64(): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache;

  const response = await fetch('/fonts/Roboto-Regular.ttf');
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  fontBase64Cache = btoa(binary);
  return fontBase64Cache;
}

export async function setupCyrillicDoc(): Promise<jsPDF> {
  const doc = new jsPDF();
  const fontBase64 = await loadRobotoBase64();

  doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto');

  return doc;
}
