const { TelegramClient, Api} = require("telegram");
const { StringSession } = require("telegram/sessions");
const { extractSignal, formatCurrentDateTime} = require("./utils");
const config = require("./telegram-api/config"); // Ваша функция для поиска адресов Solana
const {api_id: apiId, api_hash: apiHash, phone, code, password} = config;
const readline = require('readline');
const {spyDefi, winterArcticAlpha, callsMadApes, winterArcAlphaDegenIndicatorID, winterArcPrivateChannelID,
  alexStyleGamble, shitDegensChannelID, shitDegensChannel, shitDegenIndicatorID, DAOInsidersChatID, DAOInsidersChannel,
  shitDegensAlphaID
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
  async function getLastMessageFromChat(client, username) {
    try {
      const info = await client.invoke(
        new Api.contacts.ResolveUsername({
          username: username,
        })
      );
      let attemptsCount = 0;

      const user = info.users.find(user => user.username === username);
      if (!user) {
        throw new Error(`Пользователь с username ${username} не найден.`);
      }

      // Получаем последнее сообщение
      let messages = await client.invoke(
        new Api.messages.GetHistory({
          peer: new Api.InputPeerUser({
            userId: user.id,
            accessHash: user.accessHash,
          }),
          limit: 1,
          offsetId: 0,
        })
      );

      while (messages?.messages[0]?.fromId != null) {
        if (attemptsCount > 50) return null;
        await new Promise((resolve) => setTimeout(resolve, 100));
        messages = await client.invoke(
          new Api.messages.GetHistory({
            peer: new Api.InputPeerUser({
              userId: user.id,
              accessHash: user.accessHash,
            }),
            limit: 1,
            offsetId: 0,
          })
        );
        attemptsCount += 1;
      }

      if (messages.messages.length === 0) {
        console.log("Нет сообщений.");
        return null;
      }

      return messages.messages[0];

    } catch (error) {
      console.error(`Ошибка получения последнего сообщения от бота ${username}:`, error);
      return null;
    }
  }

  async function interactWithBot2(client, botUsername) {
    const botInfo = await client.invoke(new Api.contacts.ResolveUsername({
      username: botUsername,
    }));
    const botId = botInfo.users[0].id;
    client.addEventHandler(async (update) => {
      if (update.className === "UpdateNewMessage" && update.message.peerId.userId?.value == BigInt(botId)) {
        console.log('update.message', update.message);
        const buttons = update?.message?.replyMarkup?.rows?.flatMap(row => row.buttons);

        console.log("Кнопки доступны:", buttons?.map((btn) => btn.text));
      }
    })
  }
  async function interactWithBot(client, botUsername, steps, signal) {
    // Поиск кнопки по тексту
    const findButton = (rows, buttonText) => {
      for (const row of rows) {
        const button = row.buttons.find((btn) => btn.text.includes(buttonText));
        if (button) return button;
      }
      return null;
    }
    const botInfo = await client.invoke(new Api.contacts.ResolveUsername({
      username: botUsername,
    }));
    const botId = botInfo.users[0].id;
    let actualMessage = null;
    let updatedMessage = null;
    let lastMessage = null;
    // let resolveLoadedData;
    // new Promise((resolve) => {
    //   resolveLoadedData = resolve;
    // });
    // client.addEventHandler(async (update) => {
    //   if (update.className === "UpdateNewMessage" && update.message.peerId.userId?.value == BigInt(botId)) {
    //     updatedMessage = update.message;
    //     // resolveLoadedData();
    //     console.log('updatedMessage', updatedMessage)
    //   }
    // })

    // client.addEventHandler(async (update) => {
    //   if (update.className === "UpdateNewMessage" && update.message.peerId.userId?.value == BigInt(botId)) {
    //     lastMessage = update.message;
    //     console.log("Ответ от бота:", update.message);
    //   }
    // });

    for (const step of steps) {
      console.log(`Executing step: ${step.description}`);
      if (step.isNeedToGetLastMessage) {
        lastMessage = await getLastMessageFromChat(client, botUsername);
      }
      // Если step.message ожидается, отправляем сообщение
      if (step.message) {
        await client.invoke(
          new Api.messages.SendMessage({
            peer: botUsername,
            message: step.message,
          })
        );
        // lastMessage = await waitForMessage(client, botId);
      }
      if (step.signal) {
        await client.invoke(
          new Api.messages.SendMessage({
            peer: botUsername,
            message: signal,
          })
        );
        // lastMessage = await waitForMessage(client, botId);
      }
      // console.log('lastMessage', lastMessage)
      // if (!lastMessage.replyMarkup || !lastMessage.replyMarkup.rows) {
      //   console.error("No buttons found in the response.");
      //   break;
      // }

      // Находим кнопку по тексту или другим условиям
      if (step.buttonText) {
        const button = findButton(lastMessage?.replyMarkup?.rows, step.buttonText);
        console.log('button', button)
        if (!button) {
          console.error(`Button "${step.buttonText}" not found.`);
          break;
        }

        await client.invoke(new Api.messages.GetBotCallbackAnswer({
          peer: botId,
          msgId: lastMessage?.id,
          data: button.data,
        }));
        // lastMessage = await waitForMessage(client, botId);
        console.log(`Clicked button: ${step.buttonText}`);
      }
    }

    console.log("Interaction complete.");
  }

// Функция ожидания нового сообщения
//   async function waitForMessage(client, botId, timeout = 10000) {
//     return new Promise((resolve, reject) => {
//       const handler = async (update) => {
//         if (update.className === "UpdateNewMessage" && update.message.peerId.userId?.value == BigInt(botId)) {
//           resolve(update.message);
//         }
//       };
//
//       client.addEventHandler(handler)
//
//       // setTimeout(() => {
//       //   // client.removeEventHandler('update', handler);
//       //   reject(new Error("Timeout waiting for message."));
//       // }, timeout);
//     });
//   }

  async function interactWithBot1(botUsername, signal) {
    // Получение информации о боте
    const botInfo = await client.invoke(new Api.contacts.ResolveUsername({
      username: botUsername,
    }));
    const botId = botInfo.users[0].id;
    console.log('botInfo', botInfo);

    // Отправка команды /start для начала взаимодействия
    await client.invoke(
      new Api.messages.SendMessage({
        peer: botUsername,
        message: "/sniper",
      })
    );

    // Состояние взаимодействия
    const botStates = {};

    client.addEventHandler(async (update) => {
      if (update.className === "UpdateNewMessage" && update.message.peerId.userId?.value == BigInt(botId)) {
        const message = update.message;
        console.log("Ответ от бота:", message.message);

        if (message.replyMarkup) {
          if (message.replyMarkup.rows) {
            // Inline-клавиатура
            const buttons = message.replyMarkup.rows.flatMap(row => row.buttons);
            console.log('buttons', buttons)

            console.log("Кнопки доступны:", buttons.map((btn) => btn.text));
            if (buttons.length > 0) {
              const createTaskButton = buttons.find((btn) => btn.text.includes('Create Task'))
              console.log('createTaskButton', createTaskButton)
              // const firstButton = buttons[0];
              await client.invoke(new Api.messages.GetBotCallbackAnswer({
                peer: message.botId,
                msgId: message.id,
                data: createTaskButton.data,
              }));
              await client.invoke(
                new Api.messages.SendMessage({
                  peer: botUsername,
                  message: signal,
                })
              );
            } else {
              console.error("No buttons in inline keyboard.");
            }
          } else {
            console.error("ReplyMarkup exists, but no rows found.");
          }
        } else {
          console.error("No ReplyMarkup in the message.");
        }

        // Логика для обработки текстовых сообщений
        if (message.message.includes("Введите данные")) {
          await client.invoke(
            new Api.messages.SendMessage({
              peer: botId,
              message: "Мои данные", // Отправляем требуемые данные
            })
          );
        }
      }
    });
  }

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

        const signal = extractSignal(message);
        if (signal && !checkSignal(signal)) {
          console.log(`signal: ${signal}; current time: ${formatCurrentDateTime()}`);
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
        && update?.message?.fromId?.userId?.value === undefined

      if (predicate) {
        const message = update?.message?.message;
        const signal = extractSignal(message);
        if (signal && !checkSignal(signal)) {
          console.log(`signal: ${signal}; current time: ${formatCurrentDateTime()}`);
          storeSignal(signal);
          await sendMessageInTG(tradingBot, signal);
        }
      }
    });
  }

  // Основная логика
  // сканирование сообщений по Id и access_hash
  // const result = await client.invoke(
  //   new Api.messages.GetHistory({
  //     peer: new Api.InputPeerChannel({
  //       channelId: winterArcticAlpha.id,
  //       accessHash: winterArcticAlpha.access_hash,
  //     }),
  //     limit: 50, // Количество сообщений
  //     addOffset: 0,
  //     maxId: 0,
  //     minId: 0,
  //     hash: 0,
  //   })
  // );
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

  // await subscribeToUserInChat(winterArcPrivateChannelID, winterArcAlphaDegenIndicatorID);
  // await subscribeToUserInChat(winterArcPrivateChannelID, shitDegensAlphaID, TRADEWIZ_SOLANA_BOT);
  // await getChannelInfo(client, alexStyleGamble.id, alexStyleGamble.access_hash);

  // await subscribeToChannel(winterArcPrivateChannelID, TRADEWIZ_SOLANA_BOT);
  await subscribeToChannel(callsMadApes.id, TROJAN_SOLANA_BOT);
  // await subscribeToChannel(DAOInsidersChannel.id, BLOOM_SOLANA_BOT);


  // Снайпинг запуска с помощью Bloom Solana Bot
  {
    const steps = [
      { description: "Step 1: Click start", message: "/sniper", isNeedToGetLastMessage: false, },
      { description: "Step 2: Click button 'Create Task'", buttonText: "Create Task", isNeedToGetLastMessage: true, },
      { description: "Step 3: Add contract", signal: true, isNeedToGetLastMessage: false, },
      { description: "Step 4: Mode", buttonText: "Pro Mode", isNeedToGetLastMessage: true, },
      { description: "Step 5: Buy Amount", buttonText: "Buy Amount", isNeedToGetLastMessage: false, },
      { description: "Step 6: Mode", message: "0.1", isNeedToGetLastMessage: true, },
    ]; // TODO: добавить остальные пункты


    // const update = await getLastMessageFromChat(client, BLOOM_SOLANA_BOT);
    // console.log('update', update)
    // console.log('update.message', update.message);
    // const buttons = update?.replyMarkup?.rows?.flatMap(row => row.buttons);
    // console.log("Кнопки доступны:", buttons?.map((btn) => btn.text));


    await interactWithBot(client, BLOOM_SOLANA_BOT, steps, '59h8yt1MqZ57EZShpcdfqGgYgNWJYoi3M8EyPuRPpump');
  }


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
