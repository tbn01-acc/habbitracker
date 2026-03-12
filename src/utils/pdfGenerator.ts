import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { moneyToWordsRu } from './moneyToWordsRu';
import { setupCyrillicDoc } from './pdfFontLoader';
import stampImage from '@/assets/stamp-acm.png';

// Organization constants
const ORG = {
  name: 'ООО "Агентство Цифрового Маркетинга"',
  shortName: 'ООО "АЦМ"',
  inn: '9713007100',
  kpp: '771301001',
  ogrn: '1237700876511',
  address: '127238, г. Москва, вн.тер.г. муниципальный округ Тимирязевский, проезд 3-й Нижнелихоборский, д. 3, стр. 1, пом. 2/1',
  bank: 'ООО "Бланк банк"',
  bik: '044525801',
  rs: '40702810200100153818',
  ks: '30101810645250000801',
  director: 'Генеральный директор',
};

export interface InvoiceData {
  number: string;
  date: string;
  clientName: string;
  clientInn: string;
  clientKpp?: string;
  clientAddress?: string;
  items: { name: string; quantity: number; price: number }[];
}

export interface ActData {
  number: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  clientName: string;
  clientInn: string;
  clientRepresentative?: string;
  serviceName: string;
  totalAmount: number;
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const generateInvoicePDF = async (data: InvoiceData): Promise<void> => {
  const doc = await setupCyrillicDoc();

  // Bank details header
  autoTable(doc, {
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0], font: 'Roboto' },
    body: [
      [{ content: ORG.bank, colSpan: 2 }, 'БИК', ORG.bik],
      [{ content: 'Банк получателя', colSpan: 2 }, 'К/с', ORG.ks],
      [`ИНН ${ORG.inn}`, `КПП ${ORG.kpp}`, 'Р/с', ORG.rs],
      [{ content: ORG.name, colSpan: 2 }, { content: '', colSpan: 2 }],
      [{ content: 'Получатель', colSpan: 2 }, { content: '', colSpan: 2 }],
    ],
    startY: 10,
    margin: { left: 10, right: 10 },
  });

  const lastY = (doc as any).lastAutoTable.finalY || 45;

  // Invoice title
  doc.setFontSize(14);
  doc.setFont('Roboto', 'normal');
  doc.text(`Счёт на оплату № ${data.number} от ${formatDate(data.date)}`, 10, lastY + 12);
  doc.setDrawColor(0);
  doc.line(10, lastY + 14, 200, lastY + 14);

  // Parties
  doc.setFontSize(9);
  doc.text(`Поставщик: ${ORG.name}, ИНН ${ORG.inn}, КПП ${ORG.kpp}`, 10, lastY + 22);
  doc.text(`Адрес: ${ORG.address}`, 10, lastY + 27);
  doc.text(`Покупатель: ${data.clientName}, ИНН ${data.clientInn}${data.clientKpp ? ', КПП ' + data.clientKpp : ''}`, 10, lastY + 35);
  if (data.clientAddress) {
    doc.text(`Адрес: ${data.clientAddress}`, 10, lastY + 40);
  }

  // Items table
  const tableBody = data.items.map((item, i) => [
    i + 1,
    item.name,
    item.quantity,
    'шт.',
    item.price.toLocaleString('ru-RU') + ' ₽',
    (item.quantity * item.price).toLocaleString('ru-RU') + ' ₽',
  ]);

  const totalSum = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  autoTable(doc, {
    startY: lastY + (data.clientAddress ? 48 : 43),
    head: [['№', 'Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма']],
    body: tableBody,
    styles: { fontSize: 8, textColor: [0, 0, 0], font: 'Roboto' },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'normal', font: 'Roboto' },
    columnStyles: {
      0: { cellWidth: 10 },
      5: { halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(9);
  doc.text(`Итого: ${totalSum.toLocaleString('ru-RU')} ₽`, 200, finalY + 8, { align: 'right' });
  doc.text('Без налога (НДС): —', 200, finalY + 13, { align: 'right' });

  doc.setFontSize(10);
  const totalInWords = moneyToWordsRu(totalSum);
  doc.text(`Всего к оплате: ${totalInWords}`, 10, finalY + 22);

  doc.setFontSize(7);
  doc.text('НДС не облагается (в связи с применением УСН, ст. 346.12 и 346.13 гл. 26.2 НК РФ).', 10, finalY + 28);

  // Signatures
  doc.line(10, finalY + 45, 90, finalY + 45);
  doc.text(`${ORG.director} ____________`, 10, finalY + 50);

  // Add stamp
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = stampImage;
    });
    doc.addImage(img, 'PNG', 55, finalY + 32, 30, 30);
  } catch {
    // Stamp image not available, skip
  }

  doc.save(`Счёт_АЦМ_${data.number}_${formatDate(data.date).replace(/\./g, '-')}.pdf`);
};

export const generateActPDF = async (data: ActData): Promise<void> => {
  const doc = await setupCyrillicDoc();

  doc.setFontSize(14);
  doc.setFont('Roboto', 'normal');
  doc.text(`Акт № ${data.number} от ${formatDate(data.date)}`, 105, 20, { align: 'center' });

  doc.setFontSize(9);

  const text1 = `Мы, нижеподписавшиеся, ${ORG.name}, в лице ${ORG.director}, с одной стороны, и ${data.clientName}${data.clientRepresentative ? ', в лице ' + data.clientRepresentative : ''}, с другой стороны, составили настоящий Акт о том, что:`;

  const splitText1 = doc.splitTextToSize(text1, 180);
  doc.text(splitText1, 10, 32);

  let yPos = 32 + splitText1.length * 5;

  const text2 = `В соответствии с Правилами Партнёрской программы (Офертой) на сайте https://top-focus.ru, за период с ${formatDate(data.periodStart)} по ${formatDate(data.periodEnd)} Исполнителем были оказаны услуги:`;
  const splitText2 = doc.splitTextToSize(text2, 180);
  doc.text(splitText2, 10, yPos + 8);
  yPos += 8 + splitText2.length * 5;

  // Service table
  autoTable(doc, {
    startY: yPos + 5,
    head: [['№', 'Наименование услуги', 'Сумма, ₽']],
    body: [[1, data.serviceName, data.totalAmount.toLocaleString('ru-RU') + ' ₽']],
    styles: { fontSize: 8, textColor: [0, 0, 0], font: 'Roboto' },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'normal', font: 'Roboto' },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(9);
  doc.text('Вышеуказанные услуги оказаны в полном объёме и в срок. Стороны претензий друг к другу не имеют.', 10, finalY + 10);

  const totalInWords = moneyToWordsRu(data.totalAmount);
  doc.text(`Общая стоимость услуг: ${data.totalAmount.toLocaleString('ru-RU')} (${totalInWords}) руб.`, 10, finalY + 18);

  doc.setFontSize(7);
  doc.text('НДС не облагается.', 10, finalY + 24);

  // Signatures
  doc.setFontSize(9);
  doc.text(`От ${ORG.shortName}:`, 10, finalY + 40);
  doc.line(10, finalY + 50, 90, finalY + 50);
  doc.text('/ М.П.', 75, finalY + 55);

  doc.text('От Партнёра/Клиента:', 110, finalY + 40);
  doc.line(110, finalY + 50, 200, finalY + 50);
  doc.text('/ М.П.', 185, finalY + 55);

  // Add stamp
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = stampImage;
    });
    doc.addImage(img, 'PNG', 40, finalY + 35, 30, 30);
  } catch {
    // skip
  }

  doc.save(`Акт_АЦМ_${data.number}_${formatDate(data.date).replace(/\./g, '-')}.pdf`);
};
