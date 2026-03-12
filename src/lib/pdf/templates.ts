export const ORGANIZATION_DATA = {
  name: 'ООО "Агентство Цифрового Маркетинга"',
  shortName: 'ООО "АЦМ"',
  inn: '9713007100',
  kpp: '771301001',
  ogrn: '1237700876511',
  address: '127238, г. Москва, проезд 3-й Нижнелихоборский, д. 3, стр. 1',
  bank: {
    name: 'ООО "Бланк банк"',
    bik: '044525801',
    rs: '40702810200100153818',
    ks: '30101810645250000801',
  },
  taxInfo: 'НДС не облагается на основании ст. 346.12 и 346.13 гл. 26.2 НК РФ (УСН).',
  contactEmail: 'support@top-focus.ru',
};

export const PARTNER_CONFIG = {
  levels: {
    basic: { id: 'basic', name: 'Базовый', share: 0.10, threshold: 0 },
    pro: { id: 'pro', name: 'Профи', share: 0.20, threshold: 10 },
    premium: { id: 'premium', name: 'Премиум', share: 0.30, threshold: 50 },
  },
  churnRate: 0.15,
  avgCheck: 1500,
};
