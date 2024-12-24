const { TelegramClient, Api} = require("telegram");
const { StringSession } = require("telegram/sessions");
const { findSolanaAddresses } = require("./utils");
const config = require("./telegram-api/config"); // Ваша функция для поиска адресов Solana
const {api_id: apiId, api_hash: apiHash, phone, code, password} = config;
const readline = require('readline');
const {spyDefi, winterArcticAlpha, callsMadApes} = require("./telegram-api/channelsData");

const session = new StringSession("1AgAOMTQ5LjE1NC4xNjcuNDEBux8KKq80sW8rfT+5PBUrlh0RReaZFdPJVzhF861p0AhSNFLUmFt593Gl0qIVAkmE+BxqpH0exO/aq+D+Bi7SK5WNHNpSBJjUQltjpXhycNMNw9TRWuBSlhZA/3ecFwOCPFgD5RrF0KkZ8PL6Bc02aB+bG4jT+1PoipRoq6MWqFjndAYzpfFEPNA1GQ47TTn9xStidpaQkEMT7rOUDc64EgrHpIHvlaPDo/doOQDiCDbHvtac5Ul6wjNUBg4giiDd+dJ99q2VeZV7pae7BM0X72iXHRYcf3QewF9gEG9WbR2d6L6+sOVoFp4Ydb7LHYY7fufhBWqMzhKgaBy4deyQHIo="); // Используется для хранения сессии
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const LIMIT_COUNT = 50;

(async () => {
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("Подключаемся к Telegram...");
  // Подключаемся к Telegram
  await client.start({
    phoneNumber: async () => {
      return new Promise(resolve => {
        rl.question('Введите ваш номер телефона: ', resolve);
      });
    },
    password: async () => {
      return new Promise(resolve => {
        rl.question('Введите ваш двухфакторный пароль: ', resolve);
      });
    },
    phoneCode: async () => {
      return new Promise(resolve => {
        rl.question('Введите код из SMS: ', resolve);
      });
    },
    onError: (err) => console.log(err),
  });

  console.log("Вы успешно вошли!");
  console.log("Сессия сохранена:", client.session.save());

  // Пример использования клиента для получения информации о текущем пользователе
  const me = await client.getMe();
  console.log('Текущий пользователь:', me.username);

  // Функция для получения информации о канале по username
  async function getChannelByUsername(username, channelId) {
    try {
      const channel = await client.invoke(
        new Api.contacts.ResolveUsername({
          username: username,
        })
      );

      console.log("Информация о канале:", channel);
      return channel;
    } catch (error) {
      console.error("Ошибка получения информации о канале:", error);
    }
  }

  // Функция для получения списка чатов
  async function getChats() {
    const dialogs = await client.getDialogs();
    const channels = dialogs.filter((dialog) => dialog.isChannel);

    console.log("Ваши каналы:");
    channels.forEach((channel) => {
      console.log(`- Название: ${channel.title}`);
      console.log(`  ID: ${channel.id}`);
      console.log(`  Access Hash: ${channel.accessHash || "Нет доступа"}`);
      console.log("---");
    });

    return channels;
  }

  // Функция для получения сообщений из канала
  async function getMessagesFromChannel(channel) {
    try {
      const result = await client.getMessages(channel, { limit: LIMIT_COUNT });

      const messages = result
        .filter((msg) => msg.message) // Оставляем только сообщения с текстом
        .map((msg) => {
          console.log("Сообщение:", msg.message);
          console.log(
            "Адреса Solana:",
            findSolanaAddresses(msg.message) // Ваша логика поиска адресов
          );
          return {
            addresses: findSolanaAddresses(msg.message),
            message: msg.message,
          };
        });

      console.log("Сообщения из канала:", messages);
      return messages;
    } catch (error) {
      console.error("Ошибка получения сообщений из канала:", error);
    }
  }

  async function getChannelInfo(client, channelId, accessHash) {
    try {
      const channel = await client.invoke(
        new Api.channels.GetChannels({
          id: [new Api.InputChannel({ channelId: channelId, accessHash: accessHash })],
        })
      );
      console.log("Информация о канале:", channel);
    } catch (error) {
      console.error("Ошибка получения информации о канале:", error);
    }
  }


// Подписка на новые сообщения из канала
  async function subscribeToChannel(channelId) {
    client.addEventHandler(async (update) => {
      // console.log('<--------------------------------------------->')
      // console.log('update.message.peerId.channelId', update?.message?.peerId?.channelId)
      // console.log('update.message.peerId.channelId == channelId', update?.message?.peerId?.channelId?.value == channelId)
      // console.log('update.className', update.className)
      if (update.className === 'UpdateNewChannelMessage' && update?.message?.peerId?.channelId?.value == channelId) {
        console.log('update', update)
        const message = update.message;
        console.log(`Новое сообщение в канале!`);
        console.log(`Текст сообщения: ${message.message}`);

        // Здесь вы можете добавить дополнительную логику обработки сообщения
      }
    });
  }


  // Основная логика
  // const channels = await getChats();

  // Получение инфы о канале
  // const targetChannel = await getChannelByUsername('spydefi');
  // const channelId = targetChannel.chats[0]?.id; // Убедитесь, что используете правильное поле
  // if (!channelId) {
  //   console.error("Не удалось получить ID канала.");
  //   return;
  // }

  // await getMessagesFromChannel(targetChannel);

  await getChannelInfo(client, spyDefi.id, spyDefi.access_hash);

  console.log(`Подписываемся на новые сообщения из канала по channelId:`);
  await subscribeToChannel(callsMadApes.id);
})();
