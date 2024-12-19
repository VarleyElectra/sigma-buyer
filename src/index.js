const api = require('./telegram-api/api');
const auth = require('./telegram-api/auth');
const fs = require('fs');
const { callsFilantrop, callsMadApes, spyDefi } = require('./telegram-api/channelsData');
const {findSolanaAddresses} = require("./utils");

// Функция для получения информации о канале по username
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
async function getMessagesFromChannel(channelData) {
  try {
    const inputPeer = {
      _: 'inputPeerChannel',
      access_hash: channelData.access_hash,
      channel_id: channelData.id,
    };

    const LIMIT_COUNT = 50;
    const allMessages = [];

    const firstHistoryResult = await api.call('messages.getHistory', {
      peer: inputPeer,
      limit: LIMIT_COUNT,
    });

    // console.log('firstHistoryResult', firstHistoryResult)

    const messages = firstHistoryResult.messages
      .filter(message => message.message) // Оставляем только сообщения с текстом
      .map(message => {
        console.log('message')
        console.log('findSolanaAddresses(message)', findSolanaAddresses(message.message))
        return {
          addresses: findSolanaAddresses(message.message),
          message: message.message,
        }
      }); // Извлекаем текст сообщений

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

// Основная функция запуска
async function main() {
  try {
    console.log('Авторизация...');
    await auth();

    // console.log('Получение информации о канале spydefi...');
    // await getChannelByUsername('spydefi');
    //
    // console.log('Получение списка чатов...');
    // await getChats();
    //
    // console.log('Получение сообщений из канала callsMadApes...');
    // await getMessagesFromChannel(callsMadApes);

  } catch (error) {
    console.error('Ошибка выполнения программы:', error);
  }
}

// Запуск программы
main();
