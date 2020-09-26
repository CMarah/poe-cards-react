const fetch = require('isomorphic-fetch');

const ITEMS_TO_HIDE = ["Precursor's Emblem", "Soul Taker"];
const EXCEPTION_CARDS = ['Wealth and Power', "The Dragon's Heart"];

const downloadData = async league => {
  const fetchPoeNinja = type => fetch(
    'https://cors-anywhere.herokuapp.com/https://poe.ninja/api/data/' +
    `${type === 'Currency' ? 'currencyoverview' : 'itemoverview'}?league=${league}&type=${type}`
  )
    .then(res => res.json())
    .then(res => res.lines);
  const downloads = await Promise.all([
    fetchPoeNinja('DivinationCard'),
    fetchPoeNinja('UniqueWeapon'),
    fetchPoeNinja('UniqueArmour'),
    fetchPoeNinja('UniqueAccessory'),
    fetchPoeNinja('Prophecy'),
    fetchPoeNinja('UniqueFlask'),
    fetchPoeNinja('SkillGem'),
    fetchPoeNinja('Currency'),
  ]);

  const keys = [
    'card_info', 'weapon_info', 'armour_info', 'acc_info',
    'proph_info', 'flask_info', 'gem_info', 'curr_info',
  ];
  return downloads.reduce((acc, dl, i) => ({
    ...acc,
    [keys[i]]: dl,
  }), { league });
};

const getTradeUrl = (name, price, league) =>
  `https://www.pathofexile.com/trade/search/${league}?q={` +
  "%22query%22:{%22filters%22:{%22type_filters%22:{%22filters%22:{%22category" +
  `%22:{%22option%22:%22card%22}}}},%22type%22:%22${name.replace(' ', '%20')}%22}}`;

const getCardsMap = card_info => card_info
.filter(card => EXCEPTION_CARDS.includes(card.name) || (
  card.chaosValue > 3 &&
  card.explicitModifiers.length && (
    card.explicitModifiers[0].text.includes('uniqueitem') ||
    card.explicitModifiers[0].text.includes('divination') ||
    card.explicitModifiers[0].text.includes('currencyitem') ||
    card.explicitModifiers[0].text.includes('prophecy')
  ) &&
  card.explicitModifiers[0].text.match(/{['\s\w]+}/)
)).map(card => ({
  name: card.name,
  stack_size: card.stackSize,
  single_price: card.chaosValue,
  total_price: parseFloat((card.chaosValue*card.stackSize).toFixed(0)),
  item: card.explicitModifiers[0].text.match(/{[\w'\s]+}/)[0].slice(1,-1),
  type: card.explicitModifiers[0].text.match(/\w+/)[0],
  raw_item: card.explicitModifiers,
}));

const getCurrencyItem = (item, { curr_info }) => {
  const currency = curr_info.find(c => item.includes(c.currencyTypeName));
  const amount = item.match(/\d+/) || 1;
  if (!currency || !amount || !currency.receive) return null;
  return {
    chaosValue: amount*currency.receive.value,
  };
}

const getItem = (item, type, info) => {
  if (false && item === 'Level 4 Enlighten') return {
    chaosValue: info.gem_info.find(
      g => g.name === 'Enlighten Support' && g.gemLevel === 4
    ).chaosValue,
  };
  if (false && item === 'Level 4 Empower') return {
    chaosValue: info.gem_info.find(
      g => g.name === 'Empower Support' && g.gemLevel === 4
    ).chaosValue,
  };

  const { card_info, weapon_info, armour_info, acc_info, proph_info, flask_info } = info;
  const gear = [...weapon_info, ...armour_info, ...acc_info, ...flask_info].find(
    g => g.name === item && g.links === 0
  );
  const card_o = card_info.find(c => c.name === item && c.links === 0);
  const prophecy = proph_info.find(p => p.name.includes(item));
  const currency = type === 'currencyitem' ? getCurrencyItem(item, info) : null;
  return gear ||card_o || prophecy || currency;
}

const myNumber = num => parseFloat(num.toFixed(0)).toLocaleString();

const getResults = (data, min_budget, max_budget, league) => {
  const clean_cards = getCardsMap(data.card_info);

  const trades = clean_cards.map(card => {
    const item = getItem(card.item, card.type, data);
    return !item ? null : {
      ...card,
      item_price: item.chaosValue,
      benefit: item.chaosValue - card.total_price,
      proportional_benefit: (item.chaosValue - card.total_price)/card.total_price,
      benefit_per_card: (item.chaosValue - card.total_price)/card.stack_size,
      trade_url: getTradeUrl(card.name, card.single_price, league),
    };
  })
    .filter(c => c
      && c.total_price > (min_budget || 0)
      && c.total_price < (max_budget || Infinity)
      && !ITEMS_TO_HIDE.includes(c.item)
    );
  const best_trades = trades.sort((a,b) => a.benefit_per_card - b.benefit_per_card);
  return best_trades.reverse().map(tr => ([
    tr.name.slice(0,24),
    tr.item,
    tr.stack_size,
    ...([
      tr.single_price,
      tr.total_price,
      tr.item_price,
      tr.benefit,
      tr.benefit_per_card,
    ].map(x => myNumber(x))),
    tr.trade_url,
  ]));
};

//TODO the bargain
//TODO the white knight

export { getResults, downloadData };
