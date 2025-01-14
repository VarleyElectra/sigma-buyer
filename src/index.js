const api = require('./telegram-api/api');
const auth = require('./telegram-api/auth');
const fs = require('fs');
const { callsFilantrop, callsMadApes, spyDefi, winterArcticAlpha} = require('./telegram-api/channelsData');
const {extractSignal} = require("./utils");
const {getChats, getMessagesFromChannel, getChannelByUsername} = require("./telegram-api/TG-api-utils");

// Основная функция запуска
async function main() {
  try {
    console.log('Авторизация...');
    await auth();

    // console.log('Получение информации о канале spydefi...');
    // await getChannelByUsername('Alexstyle_gamble');
    //
    // console.log('Получение списка чатов...');
    // await getChats();
    //
    // console.log('Получение сообщений из канала callsMadApes...');
    // await getMessagesFromChannel(winterArcticAlpha);

  } catch (error) {
    console.error('Ошибка выполнения программы:', error);
  }
}

// Запуск программы
main();
