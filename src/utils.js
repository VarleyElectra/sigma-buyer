function containsText(text, patternText) {
  // Создаем регулярное выражение из переданного текста паттерна
  const pattern = new RegExp(patternText, 'i');

  // Проверяем, есть ли совпадение
  return pattern.test(text);
}

function extractSignal(text) {
  if (!text) {
    return ''
  }
  // Регулярное выражение для поиска адресов Solana (44 символа, Base58)
  const solanaAddressPattern = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

  const isPrelaunch = containsText(text, 'prelaunch');

  // Используем регулярное выражение для поиска всех совпадений
  const addresses = text.match(solanaAddressPattern);

  if (addresses && !isPrelaunch) {
    return addresses[0];
  }

  return '';
}

function formatCurrentDateTime(locale = 'en-US', options = {}) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
    ...options // Дополнительные опции
  });
  return formatter.format(now);
}

const text = 'Prelaunch (🔥ETH) Russian Pepe\n' +
  'Gambles Channel🎲\n' +
  '\n' +
  'Enter at your own risk! Wait for Lock/Renounce and always do your own research. Disclaimer (https://t.me/mad_apes_gambles/201)\n' +
  '\n' +
  '"Meet ПЕПЕ, the frog with a Russian twist – bold, funny, and tougher than Siberian winter. Dressed in an ushanka, sipping questionable tea, and always ready with a balalaika solo, ПЕПЕ is here to dominate the meme coin game like a true Slavic legend."\n' +
  '\n' +
  'Launches 6PM UTC\n' +
  'Telegram (https://t.me/RussianPepe_ETH) - Twitter (https://x.com/RussianPepe_ETH) - Website (https://www.russianpepe.com/)\n' +
  '\n' +
  'eL5fUxj2J4CiQsmW85k5FG9DvuQjjUoBHoQBi2Kpump'
console.log('extractSignal', extractSignal(text));
const regex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
const addresses = text.match(regex);
console.log('addresses', addresses)


module.exports = { extractSignal, formatCurrentDateTime };
