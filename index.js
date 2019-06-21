'use strict';

const { parse } = require('./parser.js');
const Telegraf = require('telegraf');
const SECRET_KEY = '868853661:AAH36Ot5-90yT_QJTs2FOoLKLcQSyWThATk';//process.env.BOT_TOKEN;//
const bot = new Telegraf(SECRET_KEY);
bot.start((ctx) => ctx.reply('Hello, this is KPI rozklad bot!\nPrint group name whose schedual you want to see.'));
bot.help((ctx) => ctx.reply('Print group name whose schedual you want to see.'));
bot.hears(/^[А-ЯІа-яі]{2}-[1-9а-яі]{2,5}$/, (ctx) => parse(ctx.message.text)
    .then(result=>{ctx.reply(result)})
    .catch(()=>ctx.reply('Something went wrong.\nAre you sure that you choosen the right group and rozklad service is available?')));

//bot.launch()
bot.telegram.setWebhook(process.env.WEB_HOOK_PATH);//'https://nodelabs-kpi-schedule-bot.doctorblinch.now.sh');
module.exports = bot.webhookCallback('/');
