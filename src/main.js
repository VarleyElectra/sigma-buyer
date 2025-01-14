const { TelegramClient, Api} = require("telegram");
const { StringSession } = require("telegram/sessions");
const { extractSignal } = require("./utils");
const config = require("./telegram-api/config"); // Ваша функция для поиска адресов Solana
const {api_id: apiId, api_hash: apiHash, phone, code, password} = config;
const readline = require('readline');
const {spyDefi, winterArcticAlpha, callsMadApes, winterArcAlphaDegenIndicatorID, winterArcPrivateChannelID,
  alexStyleGamble, shitDegensChannelID, shitDegensChannel, shitDegenIndicatorID
} = require("./telegram-api/channelsData");
const {getMessagesFromTGChannel} = require("./telegram-api/TG-api-utils");

const session = new StringSession("1AgAOMTQ5LjE1NC4xNjcuNDEBuy7UqqK+Bp9BcUCqt0DlJx3Hd8FYCZnZUvawyGQU8sV6uG57UqH40H/3XSBkD9NVNpTrCCW/wI4KW8o6vtidFy8+2xBAhGh5zHYeenoFH/tOpK26bviPLFgAj66KkJaUgjZHHXM8pYlhCLxrrR/Q0pCNhN+awaSpW5ulxI5t1ITnNrmM1mGf3Bm+N5Zl8pIEa9CvJKIHXzFnhWNer82j0TLFRJa5GbyO7GGtnTazRBqpe0L2kQn5CM2CmqZ17h1aXH3Rv4WHS1p94n6EIbaaQrRsq+9aws/WSi0cuIpIHDoSSdBmVgdaNSDhOcGfP+1ozv6CVq/6zpeRx91IO8LOaHo="); // Используется для хранения сессии
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const LIMIT_COUNT = 50;
const BLOOM_SOLANA_BOT = "BloomSolana_bot";

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
  console.log('me', me)

  // <-------------------------FUNCTIONS------------------------------>

  async function getSubscribedGroups(client) {
    try {
      const dialogs = await client.invoke(
        new Api.messages.GetDialogs({
          offsetDate: 0,
          offsetPeer: new Api.InputPeerEmpty(),
          offsetId: 0,
          limit: 100, // Лимит количества диалогов
          hash: 0,
        })
      );

      // Фильтруем только группы и супергруппы
      const groups = dialogs.chats.filter(
        (chat) => chat.className === "Channel" && chat.megagroup
      );

      console.log("Список групп, на которые вы подписаны:");
      groups.forEach((group) => {
        console.log(`- Название: ${group.title}`);
        console.log(`  Username: ${group.username || "нет"}`);
        console.log(`  ID: ${group.id}`);
        console.log("---");
      });

      return groups;
    } catch (error) {
      console.error("Ошибка получения списка групп:", error);
    }
  }

  async function getGroupAndTopics(client, groupName) {
    try {
      // Шаг 1: Получаем информацию о группе по её username
      const groupResult = await client.invoke(
        new Api.contacts.ResolveUsername({
          username: groupName.replace('@', ''), // Убираем символ '@', если он есть
        })
      );

      const group = groupResult.chats.find(chat => chat.username === groupName.replace('@', ''));
      if (!group) {
        console.error("Группа не найдена.");
        return null;
      }

      console.log("Информация о группе:", group);

      // Проверяем, поддерживает ли группа топики (является ли форумом)
      if (!group?.isForum) {
        console.log("Эта группа не поддерживает топики.");
        return null;
      }

      console.log("Группа поддерживает топики. Получаем их список...");

      // Шаг 2: Получаем список топиков
      const topics = await client.invoke(
        new Api.messages.GetThreads({
          peer: new Api.InputPeerChannel({
            channelId: group.id,
            accessHash: group.accessHash,
          }),
          limit: 100, // Максимальное количество топиков
        })
      );

      console.log("Список топиков:", topics?.threads);
      return { group, topics: topics?.threads };
    } catch (error) {
      console.error("Ошибка получения информации о группе и топиках:", error);
    }
  }

  // Функция для получения информации о канале по username
  async function getChannelByUsername(username) {
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

  // Функция для отправки сообщений боту
  async function sendMessageInTG(tgUserName, message) {
    try {
      const target = await client.invoke(
        new Api.contacts.ResolveUsername({
          username: tgUserName,
        })
      );

      const targetId = target.users[0].id;

      await client.sendMessage(targetId, {
        message: message,
      });

      console.log("Сообщение успешно отправлено!");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
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
            extractSignal(msg.message) // Ваша логика поиска адресов
          );
          return {
            addresses: extractSignal(msg.message),
            message: msg.message,
            post: msg,
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
  async function subscribeToUserInChat(channelId, userId) {
    client.addEventHandler(async (update) => {

      // if (update.className === 'UpdateNewChannelMessage'
      //   && update?.message?.peerId?.channelId?.value == BigInt(channelId)) {
      //   console.log('update', update)
      //   console.log('update message', update?.message?.message)
      //   console.log('<!!!!!!!!!!!!!!!!!!!!!!!!!!!!>')
      //   console.log('channelId', update?.message?.peerId?.channelId?.value)
      //   console.log('userId', update?.message?.fromId?.userId?.value)
      //   console.log('update?.message?.peerId?.channelId?.value == BigInt(channelId)', update?.message?.peerId?.channelId?.value == BigInt(channelId))
      //   console.log('<--------------------------------------->')
      //   console.log('\n')
      // }

      if (
        update.className === 'UpdateNewChannelMessage'
        && update?.message?.peerId?.channelId?.value == BigInt(channelId)
        && update?.message?.fromId?.userId?.value == BigInt(userId)
      ) {
        const message = update?.message?.message;
        console.log(`Новое сообщение в канале: ${message}`);

        const signal = extractSignal(message);
        console.log('signal', signal);
        if (signal) {
          await sendMessageInTG(BLOOM_SOLANA_BOT, signal);
        }

        // Здесь вы можете добавить дополнительную логику обработки сообщения
      }
    });
  }

// Подписка на новые сообщения из канала
  async function subscribeToChannel(channelId) {
    client.addEventHandler(async (update) => {
      const predicate = (
        update.className === 'UpdateNewChannelMessage'
          || update.className === 'UpdateEditChannelMessage'
        )
        && update?.message?.peerId?.channelId?.value == BigInt(channelId)

      if (predicate) {
        const message = update?.message?.message;
        const signal = extractSignal(message);
        if (signal) {
          await sendMessageInTG(BLOOM_SOLANA_BOT, signal);
        }
      }
    });
  }

  // Основная логика
  // const channels = await getChats();

  // Получение инфы о канале
  const targetChannel = await getChannelByUsername('Alexstyle_gamble');
  const channelId = targetChannel.chats[0]?.id; // Убедитесь, что используете правильное поле
  if (!channelId) {
    console.error("Не удалось получить ID канала.");
    return;
  }

  // await getMessagesFromChannel(targetChannel);

  // const res = await getGroupAndTopics(client, '@degenjournal alpha 🦈')
  // const groups = getSubscribedGroups(client);
  // console.log('groups', groups)

  // const groupInfo = await client.invoke(
  //   new Api.channels.GetChannels({
  //     id: [new Api.InputChannel({ channelId: shitDegensChannelID, accessHash: 0 })],
  //   })
  // );
  // console.log('groupInfo', groupInfo)
  // console.log('id', groupInfo?.chats[0].id)
  // console.log('accessHash', groupInfo?.chats[0].accessHash)

  // const messages = await getMessagesFromTGChannel(shitDegensChannel, 50);

  // const result = await client.invoke(
  //   new Api.messages.GetHistory({
  //     peer: new Api.InputPeerChannel({
  //       channelId: shitDegensChannel.id,
  //       accessHash: shitDegensChannel.access_hash,
  //     }),
  //     limit: 50, // Количество сообщений
  //     addOffset: 0,
  //     maxId: 0,
  //     minId: 0,
  //     hash: 0,
  //   })
  // );
  // const mapped = result.messages.map((message) => {
  //   return {
  //     message: message?.message,
  //     channelId: message?.peerId?.channelId,
  //     userId: message?.fromId?.userId,
  //   }
  // })
  // console.log('mapped', mapped); // prints the result

  // const botMessages = mapped.filter((message) => {
  //   return message?.channelId == (shitDegensChannelID);
  // }).map(message => {
  //   return {
  //     message: message?.message,
  //     signal: extractSignal(message?.message),
  //     userId: message?.userId,
  //   }
  // })
  //
  // console.log('botMessages', botMessages)

  // const botMessages = messages.filter((message) => {
  //   return message?.from_id?.user_id === winterArcAlphaDegenIndicatorID;
  // }).map(message => {
  //   return {
  //     message: message.message,
  //     signal: extractSignal(message.message)
  //   }
  // })
  //
  // console.log('botMessages', botMessages)

  console.log(`Подписываемся на новые сообщения из канала по channelId:`);
  await subscribeToUserInChat(winterArcPrivateChannelID, winterArcAlphaDegenIndicatorID);

  await subscribeToUserInChat(shitDegensChannelID, shitDegenIndicatorID);
  // await getChannelInfo(client, alexStyleGamble.id, alexStyleGamble.access_hash);

  console.log(`Подписываемся на новые сообщения из канала по channelId:`);
  await subscribeToChannel(callsMadApes.id);
})();
