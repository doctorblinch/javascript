'use strict';

const https = require('https');
const http = require('http');
const url = require('url');
//const cheerio = require('cheerio');
const jsdom = require('jsdom');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const rawdata = fs.readFileSync('config.json');
const token = JSON.parse(rawdata)['TOKEN'];

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const URL = 'http://rozklad.kpi.ua/Schedules/ViewSchedule.aspx?g=894be0b0-9c4b-492e-a3d0-a6950cb1a3e1';
//const URL = 'https://www.nasa.gov';
const parsedURL = URL.includes('//') ?
  url.parse(URL) : url.parse('//' + URL, false, true);

const schedules = {};

if (parsedURL.protocol === 'http:') {
  getPage(http);
} else if (parsedURL.protocol === 'https:') {
  getPage(https);
}

function getPage(obj) {
  obj.get(URL, res => {
    let data = '';

    res.on('data', chunck => {
      data += chunck;
    });

    res.on('end', () => {
      console.log('\tWe have received data!');
      parse(data);
      console.log('\tWe have parsed data!');
    });
  }).on('error', err => {
    //console.log(Object.getOwnPropertyNames(err));
    const errObj = {
      'StatusCode': err.code,
      'hostname': err.hostname,
      'host': err.host,
      'port': err.port,
      'message': err.message,
    };
    console.error('We have an error: \n', errObj);
  });
}

function parse(data) {
  const { JSDOM } = jsdom;
  const dom = new JSDOM(data);

  const firstWeek = dom.window.document
    .getElementById('ctl00_MainContent_FirstScheduleTable');
  const secondWeek = dom.window.document
    .getElementById('ctl00_MainContent_SecondScheduleTable');

  const allTrFirstWeek = firstWeek.querySelectorAll('tr');
  const allTrSecondWeek = secondWeek.querySelectorAll('tr');

  // tr[0] - day of week
  // tr[1] td[0] - time
  // const schedules = {};
  const week1 = parseWeek(allTrFirstWeek);
  const week2 = parseWeek(allTrSecondWeek);

  schedules['Перший тиждень'] = week1;
  schedules['Другий тиждень'] = week2;

  return schedules;
}

function parseWeek(allTr) {
  const week = {};
  const days = {};
  let time = undefined;

  for (let i = 0; i < allTr.length; i++) {
    const allTd = allTr[i].querySelectorAll('td');
    for (let j = 0; j < allTd.length; j++) {
      const td = allTd[j];
      if (i === 0) {
        if (td.textContent.trim() === '') {
          continue;
        }
        week[td.textContent.trim()] = {};
        days[j] = td.textContent.trim();
      } else {
        if (j === 0) {
          for (const day in week) {
            week[day][td.textContent.trim().slice(1)] = '';
          }
          time = td.textContent.trim().slice(1);
        } else {
          if (td.textContent.trim() === '') {
            delete week[days[j]][time];
          } else {
            week[days[j]][time] = td.textContent.trim();
          }
          // console.log('');
        }
        // console.log('');
      }
      //console.log(td.textContent.trim());
    }
  }

  return week;
}


bot.onText(/\/get (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  let someText = '';


  if (msg['text'] === 'full') {
    for (const week in schedules) {
      someText += week + ':\n\n';
      someText += '-------------------------------\n\n';
      for (const day in schedules[week]) {
        someText += '\t\t\t' + day + ':\n\n';
        for (const time in schedules[week][day]) {
          someText += '\t\t\t\t\t\t' + time + ': ' +
           schedules[week][day][time] + '\n\n';
        }
        someText += '\n\n';
      }
      someText += '-------------------------------\n\n';
    }
  } else {
    someText = 'I can\'t find this command';
  }

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, someText.slice(0, -33));
});
