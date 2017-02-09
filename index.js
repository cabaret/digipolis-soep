const Botkit = require('botkit');
const moment = require('moment');
const request = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');

const URL = 'http://www.metsense.be/nl/onze-uitbatingen';

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
    const $ = cheerio.load(html);
    const recipesFromNodes = $('.restaurant-menu')
      .eq(7)
      .find('table')
      .first()
      .find('tr')
      .map((rowIndex, rowNode) => {
        if (rowIndex === 0 || rowIndex === 7) return null;
        const row = $(rowNode);
        return row.map((cellIndex, cellNode) => {
          const cell = $(cellNode);
          return cell
            .find('td')
            .last()
            .text()
            .replace(/&nbsp;/g, '')
            .trim();
        }).toArray();
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

controller.hears('welke soep', ['direct_mention'], (bot, message) => {
  const weekDay = moment().day();
  getMenu().then(menu => (
    bot.reply(message, `De soep van de dag is: ${menu[weekDay]}.`)
  ));
});

controller.hears('broodje', ['direct_mention'], (bot, message) => {
  getMenu().then(menu => (
    bot.reply(message, `Het broodje van de week is: ${menu.suggestion}.`)
  ));
});