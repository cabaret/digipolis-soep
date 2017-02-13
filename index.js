const Botkit = require('botkit');
const moment = require('moment');
const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const URL = 'http://www.metsense.be/nl/onze-uitbatingen';
const BOT_TRIGGERS = ['direct_message', 'direct_mention'];

const controller = Botkit.slackbot({
  debug: false,
});

controller.spawn({
  token: process.env.TOKEN,
}).startRTM();

const weekMenu = {
  1: '',
  2: '',
  3: '',
  4: '',
  5: '',
  suggestion: '',
};

const parseHtml = html => (
  new Promise((resolve) => {
    const firstOrLastTable = moment().week() % 2 === 0 ? 'first' : 'last';
    const $ = cheerio.load(html);
    const recipesFromNodes = $('.restaurant-menu')
      .eq(7)
      .find('table')[firstOrLastTable]()
      .find('tr')
      .map((rowIndex, rowNode) => {
        if (rowIndex === 0 || rowIndex === 7) return null;
        const row = $(rowNode);
        return row.map((cellIndex, cellNode) => (
          $(cellNode)
            .find('td')
            .last()
            .text()
            .replace(/&nbsp;/g, '')
            .trim()
        )).toArray();
      });
    const recipes = _.compact($(recipesFromNodes).toArray());

    weekMenu[1] = recipes[0];
    weekMenu[2] = recipes[1];
    weekMenu[3] = recipes[2];
    weekMenu[4] = recipes[3];
    weekMenu[5] = recipes[4];
    weekMenu.suggestion = recipes[5];
    return resolve(weekMenu);
  })
);

const getMenu = () => (
  request(URL).then(parseHtml).catch(console.log) // eslint-disable-line
);

controller.hears('maandag', BOT_TRIGGERS, (bot, message) => {
  const weekDay = 1;
  getMenu().then(menu => (
    bot.reply(message, `Maandag eten we ${menu[weekDay].toLowerCase()}.`)
  ));
});

controller.hears('dinsdag', BOT_TRIGGERS, (bot, message) => {
  const weekDay = 2;
  getMenu().then(menu => (
    bot.reply(message, `Dinsdag eten we ${menu[weekDay].toLowerCase()}.`)
  ));
});

controller.hears('woensdag', BOT_TRIGGERS, (bot, message) => {
  const weekDay = 3;
  getMenu().then(menu => (
    bot.reply(message, `Woensdag eten we ${menu[weekDay].toLowerCase()}.`)
  ));
});

controller.hears('donderdag', BOT_TRIGGERS, (bot, message) => {
  const weekDay = 4;
  getMenu().then(menu => (
    bot.reply(message, `Donderdag eten we ${menu[weekDay].toLowerCase()}.`)
  ));
});

controller.hears('vrijdag', BOT_TRIGGERS, (bot, message) => {
  const weekDay = 5;
  getMenu().then(menu => (
    bot.reply(message, `Vrijdag eten we durum (of ${menu[weekDay].toLowerCase()}).`)
  ));
});

controller.hears('soep', BOT_TRIGGERS, (bot, message) => {
  const weekDay = moment().day();
  getMenu().then((menu) => {
    if (weekDay >= 1 && weekDay <= 5) {
      bot.reply(message, `De soep van de dag is ${menu[weekDay].toLowerCase()}.`);
    } else {
      bot.reply(message, 'Vandaag werk ik niet!');
    }
  });
});

controller.hears('morgen', BOT_TRIGGERS, (bot, message) => {
  const weekDay = moment().add(1, 'day').day();
  getMenu().then((menu) => {
    if (weekDay === 5) {
      bot.reply(message, `Morgen eten we durum (of ${menu[weekDay].toLowerCase()}).`);
    } else {
      bot.reply(message, `Morgen eten we ${menu[weekDay].toLowerCase()}.`);
    }
  });
});

controller.hears('broodje', BOT_TRIGGERS, (bot, message) => {
  getMenu().then(menu => (
    bot.reply(message, `Het broodje van de week is ${menu.suggestion.toLowerCase()}.`)
  ));
});
