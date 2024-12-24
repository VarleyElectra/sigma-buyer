// Функция для получения информации о канале по username
const api = require("./api");

async function getChannelByUsername(username) {
  try {
    const result = await api.call('contacts.resolveUsername', {
      username,
    });
    console.log('Информация о канале:', result);
    return result;
  } catch (error) {
    console.error('Ошибка получения информации о канале:', error);
  }
}

// Функция для получения списка чатов
async function getChats() {
  try {
    const dialogs = await api.call('messages.getDialogs', {
      offset_peer: { _: 'inputPeerEmpty' },
    });

    const channels = dialogs.chats.filter(chat => chat._ === 'channel');

    console.log('Ваши каналы:');
    channels.forEach(channel => {
      console.log(`- Название: ${channel.title}`);
      console.log(`  ID: ${channel.id}`);
      console.log(`  Access Hash: ${channel.access_hash || 'Нет доступа'}`);
      console.log('---');
    });

    return channels;
  } catch (error) {
    console.error('Ошибка получения списка чатов:', error);
  }
}

// Функция для получения сообщений из канала
async function getMessagesFromChannel(channelData, messagesCount) {
  try {
    const inputPeer = {
      _: 'inputPeerChannel',
      access_hash: channelData.access_hash,
      channel_id: channelData.id,
    };

    const allMessages = [];

    const firstHistoryResult = await api.call('messages.getHistory', {
      peer: inputPeer,
      limit: messagesCount,
    });

    // console.log('firstHistoryResult', firstHistoryResult)

    const messages = firstHistoryResult.messages
      .filter(message => message.message) // Оставляем только сообщения с текстом
      .map(message => message.message); // Извлекаем текст сообщений

    console.log('Текстовые сообщения из канала:', messages);
    // console.log('Первая часть истории:', firstHistoryResult);

    const historyCount = firstHistoryResult.count;

    // Если хотите загрузить все сообщения, раскомментируйте цикл
    // for (let offset = 0; offset < historyCount; offset += LIMIT_COUNT) {
    //   const history = await api.call('messages.getHistory', {
    //     peer: inputPeer,
    //     limit: LIMIT_COUNT,
    //     add_offset: offset,
    //   });
    //   allMessages.push(...history.messages);
    // }

    const result = JSON.stringify(allMessages);
    console.log('Все сообщения:', result);

    // Если хотите сохранить в файл, раскомментируйте следующую строку
    // fs.writeFileSync('messages.json', JSON.stringify(allMessages));

    return allMessages;
  } catch (error) {
    console.error('Ошибка получения сообщений из канала:', error);
  }
}

module.exports = {
  getChannelByUsername,
  getChats,
  getMessagesFromChannel
};
