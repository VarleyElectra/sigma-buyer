const { TelegramClient, Api} = require("telegram");
const { StringSession } = require("telegram/sessions");
const { extractSignal } = require("./utils");
const config = require("./telegram-api/config"); // Ваша функция для поиска адресов Solana
const {api_id: apiId, api_hash: apiHash, phone, code, password} = config;
const readline = require('readline');
const {spyDefi, winterArcticAlpha, callsMadApes, winterArcAlphaDegenIndicatorID, winterArcPrivateChannelID,
  alexStyleGamble, shitDegensChannelID, shitDegensChannel, shitDegenIndicatorID, DAOInsidersChatID, DAOInsidersChannel
} = require("./telegram-api/channelsData");
const {getMessagesFromTGChannel} = require("./telegram-api/TG-api-utils");

const session = new StringSession("1AgAOMTQ5LjE1NC4xNjcuNTEBu0aSea6AM1+PhzW5vW45XPyJe57GHEH43VoJw5oFbASCprQ2g4yu5DQNHhhsFpHolON9ZBoRSvyfYigw4TVqG4oxcTQG6KFcnV98OxAZASbOIK8WvOe6tOgQFYaomsoNKCuM8hKTAbPrxsjymbREWFUCPJaZfR50gM/+20UEdJ6j+/c+VrqIodLExCeQjPiGQBlGA+hnIk0NRM9Quw6c7Lwb7c9etr5Esta3K4H8IH/OyPqfSwroDT21LjUl2K/MXnuFCmk0mzBgkrSAYuy6NQGm3vwDZoMpf6SE2nXFiJw0OxTLExa1u10Ulh2h5SJwvFosRDWFZW/Bc/2Ag/w+f44="); // Используется для хранения сессии
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const LIMIT_COUNT = 50;
const BLOOM_SOLANA_BOT = "BloomSolana_bot";
const TROJAN_SOLANA_BOT = "odysseus_trojanbot";
const TRADEWIZ_SOLANA_BOT = "TradeWiz_Solbot";

const signalStorage = {};
const SIGNAL_TTL = 3600000; // 1 час в миллисекундах

function storeSignal(signal) {
  signalStorage[signal] = Date.now();
}

function checkSignal(signal) {
  const storedTimestamp = signalStorage[signal];
  if (storedTimestamp) {
    const currentTime = Date.now();
    if (currentTime - storedTimestamp < SIGNAL_TTL) {
      return true; // Сигнал уже существует и не истёк
    }
  }
  return false;
}


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
  async function getMessagesFromChatByIDAndHash(channelId, accessHash, totalLimit = 300) {
    let allMessages = [];
    let offsetId = 0; // Смещение для пагинации

    while (allMessages.length < totalLimit) {
      const limit = Math.min(100, totalLimit - allMessages.length); // Максимум 100 сообщений за запрос

      // Получаем сообщения с текущим смещением
      const messages = await client.invoke(
        new Api.messages.GetHistory({
          peer: new Api.InputPeerUser({
            userId: BigInt(channelId),
            accessHash: BigInt(accessHash),
          }),
          limit,
          offsetId,
        })
      );

      // Если больше нет сообщений, выходим из цикла
      if (!messages.messages.length) break;

      // Добавляем сообщения в общий массив
      allMessages = allMessages.concat(
        messages.messages.map(msg => ({
          message: msg.message,
          date: msg.date,
          id: msg.id,
        }))
      );

      // Обновляем смещение для следующего запроса
      offsetId = messages.messages[messages.messages.length - 1].id;
    }

    return allMessages;
  }

  async function getLastMessagesFromChat(client, username, totalLimit = 300) {
    try {
      const info = await client.invoke(
        new Api.contacts.ResolveUsername({
          username: username,
        })
      );

      const user = info.users.find(user => user.username === username);
      if (!user) {
        throw new Error(`Пользователь с username ${username} не найден.`);
      }

      let allMessages = [];
      let offsetId = 0; // Смещение для пагинации

      console.log(`Получаем последние ${totalLimit} сообщений от ${username}...`);

      while (allMessages.length < totalLimit) {
        const limit = Math.min(100, totalLimit - allMessages.length); // Максимум 100 сообщений за запрос

        console.log('typeof user.id', typeof user.id)
        console.log('typeof user.accessHash', typeof user.accessHash)
        // Получаем сообщения с текущим смещением
        const messages = await client.invoke(
          new Api.messages.GetHistory({
            peer: new Api.InputPeerUser({
              userId: user.id,
              accessHash: user.accessHash,
            }),
            limit,
            offsetId,
          })
        );

        // Если больше нет сообщений, выходим из цикла
        if (!messages.messages.length) break;

        // Добавляем сообщения в общий массив
        allMessages = allMessages.concat(
          messages.messages.map(msg => ({
            message: msg.message,
            date: msg.date,
            id: msg.id,
          }))
        );

        // Обновляем смещение для следующего запроса
        offsetId = messages.messages[messages.messages.length - 1].id;
      }

      console.log(`Найдено ${allMessages.length} сообщений от бота.`);

      return allMessages;
    } catch (error) {
      console.error(`Ошибка получения сообщений от бота ${username}:`, error);
      return null;
    }
  }

  async function filterLiquidityCalls() { // TODO: сделать универсальнее
    const messages = await getLastMessagesFromChat(client, BLOOM_SOLANA_BOT, 325);

    // Фильтруем сообщения по Liquidity
    const filteredMessages = messages.filter(msg => {
      const liquidityMatch = msg.message.match(/Liquidity: \$([\d\.]+)([KM]?)/);
      if (liquidityMatch) {
        const value = parseFloat(liquidityMatch[1]);
        const unit = liquidityMatch[2];

        // Преобразуем значение в тысячи, если указано K, или миллионы, если M
        const liquidityValue = unit === 'M' ? value * 1000 : value;
        return liquidityValue > 120 || unit === 'M';
      }
      return false;
    });
    const mappedMessages = filteredMessages.map(msg => {
      return {
        signal: extractSignal(msg.message),
        id: msg.id,
      }
    })
  }

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
  async function subscribeToUserInChat(channelId, userId, tradingBot) {
    client.addEventHandler(async (update) => {
      if (
        update.className === 'UpdateNewChannelMessage'
        && update?.message?.peerId?.channelId?.value == BigInt(channelId)
        && update?.message?.fromId?.userId?.value == BigInt(userId)
      ) {
        const message = update?.message?.message;
        console.log(`Новое сообщение в канале: ${message}`);

        const signal = extractSignal(message);
        console.log('signal', signal);
        if (signal && !checkSignal(signal)) {
          storeSignal(signal);
          await sendMessageInTG(tradingBot, signal);
        }

        // Здесь вы можете добавить дополнительную логику обработки сообщения
      }
    });
  }

// Подписка на новые сообщения из канала
  async function subscribeToChannel(channelId, tradingBot) {
    client.addEventHandler(async (update) => {
      const predicate = (
        update.className === 'UpdateNewChannelMessage'
          || update.className === 'UpdateEditChannelMessage'
        )
        && update?.message?.peerId?.channelId?.value == BigInt(channelId)

      if (predicate) {
        const message = update?.message?.message;
        const signal = extractSignal(message);
        if (signal && !checkSignal(signal)) {
          storeSignal(signal);
          await sendMessageInTG(tradingBot, signal);
        }
      }
    });
  }

  // Основная логика
  // сканирование сообщений по Id и access_hash
  const result = await client.invoke(
    new Api.messages.GetHistory({
      peer: new Api.InputPeerChannel({
        channelId: DAOInsidersChannel.id,
        accessHash: DAOInsidersChannel.access_hash,
      }),
      limit: 50, // Количество сообщений
      addOffset: 0,
      maxId: 0,
      minId: 0,
      hash: 0,
    })
  );
  // const result = await
  // getMessagesFromChatByIDAndHash(DAOInsidersChannel.id, DAOInsidersChannel.access_hash, 20) //TODO: ебанутая хуйня тупая шлюхая не работающая
  // console.log('result', result)
  // const mapped = result.messages.map((message) => {
  //   return {
  //     message: message?.message,
  //     channelId: message?.peerId?.channelId,
  //     userId: message?.fromId?.userId,
  //   }
  // })
  // console.log('mapped', mapped); // prints the result
  // const mappedChina = mapped.filter(obj => {
  //   const str = obj.message;
  //   return str.includes('6P2vnyjUnf88tdT3z5SKdvpnYnyUmRV3i84rRrCvpump')
  // })
  //
  // console.log('mappedChina', mappedChina)

  /

  // await subscribeToUserInChat(winterArcPrivateChannelID, winterArcAlphaDegenIndicatorID);
  // await subscribeToUserInChat(shitDegensChannelID, shitDegenIndicatorID, TROJAN_SOLANA_BOT);
  // await getChannelInfo(client, alexStyleGamble.id, alexStyleGamble.access_hash);
  // await subscribeToChannel(callsMadApes.id, TROJAN_SOLANA_BOT);
  // await subscribeToChannel(DAOInsidersChannel.id, BLOOM_SOLANA_BOT);


  // хранение и очистка коллов (против дублирования покупок или коллов)
  setInterval(() => {
    const currentTime = Date.now();
    Object.keys(signalStorage).forEach(signal => {
      if (currentTime - signalStorage[signal] > SIGNAL_TTL) {
        delete signalStorage[signal];
      }
    });
  }, 60000); // Проверять каждую минуту

})();
