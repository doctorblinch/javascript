'use strict'
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}


const http = require('http');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

let data;
const schedules = {};

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

  schedules['week 1'] = week1;
  schedules['week 2'] = week2;
//  console.log(schedules);
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

http.get('http://rozklad.kpi.ua/Schedules/ViewSchedule.aspx?g=894be0b0-9c4b-492e-a3d0-a6950cb1a3e1', (res) =>{
    res.on('data', (chunk)=>{
        data+=chunk;
    });
    res.on('end', ()=>{
      parse(data);
        //console.log(data);
        //return data;
    });
}).on('error', (err)=>{
    console.log('Error', err);
});

function formatOutput(schedual, weeks=[1,2]){
    let formatedSchedual = "Розклад:\n";
    if (weeks.includes(1)){
      formatedSchedual += "\nТиждень #1\n";
      for (const day in schedual['week 1']){
        formatedSchedual += '\n' + day.toString() + '\n';
        for (const time in schedual['week 1'][day]){
          formatedSchedual += time.toString() + ': ';
          formatedSchedual += schedual['week 1'][day][time].toString();
          formatedSchedual += '\n';
        }
      }
    }
    if (weeks.includes(2)){
      formatedSchedual += "\nТиждень #2\n";
      for (const day in schedual['week 2']){
        formatedSchedual += '\n' + day.toString() + '\n';
        for (const time in schedual['week 2'][day]){
          formatedSchedual += time.toString() + ': ';
          formatedSchedual += schedual['week 2'][day][time].toString();
          formatedSchedual += '\n';
        }
      }
    }
    return formatedSchedual;
}


const Telegraf = require('telegraf');
const SECRET_KEY = '868853661:AAH36Ot5-90yT_QJTs2FOoLKLcQSyWThATk';
const bot = new Telegraf(SECRET_KEY);
bot.start((ctx) => ctx.reply('Hello!'));
bot.help((ctx) => ctx.reply('Print \'give rozklad\' to get all schedual.\n Print 1/2 to\
 get schedual of particular week'));
bot.hears('give rozklad', (ctx) => ctx.reply(formatOutput(schedules)));
bot.hears('1', (ctx) => {
  console.log('First week');
  ctx.reply(formatOutput(schedules,[1]))
});
bot.hears('2', (ctx) => {
  ctx.reply(formatOutput(schedules,[2]))
});
//bot.launch();
bot.telegram.setWebhook('https://nodelabs-kpi-schedule-bot.doctorblinch.now.sh');

module.exports = bot.webhookCallback('/');
