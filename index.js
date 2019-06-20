'use strict';

const { JSDOM } = require('jsdom');
const request = require('request');

const url = 'http://rozklad.kpi.ua/Schedules/ScheduleGroupSelection.aspx';
var schedules =  {};

function getWeekData (id, document) {
    if(document.getElementById(id) === null || document.getElementById(id).getElementsByTagName('tr') === null){
        throw "Error";
    }
    return document.getElementById(id).getElementsByTagName('tr');
}

function getRowData (document) {
       if (document.getElementsByTagName('td') === null) {
           throw "Error";
       }
       return document.getElementsByTagName('td');
}


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
        }
      }
    }
  }
  return week;
}



function parseText(url) {
    return JSDOM.fromURL(url).then(dom => {

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
      console.log(week1,week2);
      schedules['week 1'] = week1;
      schedules['week 2'] = week2;
    //  console.log(schedules);

      //return schedules;
      const result = formatOutput(schedules)
      console.log(result);

        return new Promise(resolve => {
            resolve(result);
        })
    })
}


const getGroupUrl = function getGroupUrl(url, group) {
    return JSDOM.fromURL(url).then(dom => {
        const document = dom.window.document;
        const formElement = document.getElementById('aspnetForm');
        const hiddenInputs = formElement.querySelectorAll('input[type="hidden"]');

        const form = {
            ctl00$MainContent$ctl00$txtboxGroup: group,
            ctl00$MainContent$ctl00$btnShowSchedule: "Розклад занять"
        };

        [...hiddenInputs].forEach(elem =>{ elem.value ? form[elem.name] = elem.value : console.log("Error")});

        return new Promise(resolve=>{
            request.post({
                url: url,
                form: form
            }, (err, res)=>{
                resolve(`http://rozklad.kpi.ua${res.headers.location}`)
            });
        });
    });
};

const parse = function parse(group){
    return getGroupUrl(url, group).then(groupUrl=>{
            return parseText(groupUrl)
        },
        error=>{
            throw (error)
        })
};



const Telegraf = require('telegraf');
const SECRET_KEY = $BOT_TOKEN;//'868853661:AAH36Ot5-90yT_QJTs2FOoLKLcQSyWThATk';
const bot = new Telegraf(SECRET_KEY);
bot.start((ctx) => ctx.reply('Hello, this is KPI rozklad bot!\nPrint group name whose schedual you want to see.'));
bot.help((ctx) => ctx.reply('Print group name whose schedual you want to see.'));
bot.hears(/^[А-ЯІа-яі]{2}-[1-9а-яі]{2,5}$/, (ctx) => parse(ctx.message.text)
    .then(result=>{ctx.reply(result)})
    .catch(()=>ctx.reply('Something went wrong.\nAre you sure that you choosen the right group and rozklad service is available?')));

bot.telegram.setWebhook('https://nodelabs-kpi-schedule-bot.doctorblinch.now.sh');

module.exports = bot.webhookCallback('/');
