/* Booking forms for each tour program. Fields, options and WhatsApp message lines follow the original forms on
   /sea-trips, /elephant-park, /atv and /jet-ski. Every price comes from those pages; do not change a price here without the page. */
(function () {
  var C = { k: 'contact', label: 'WhatsApp / LINE', type: 'text', req: true, ph: '+66...', msg: 'Contact' };
  var N = { k: 'name', label: 'Full name', type: 'text', req: true, ph: 'Your name', msg: 'Name' };
  var D = { k: 'date', label: 'Date', type: 'date', req: true, msg: 'Date' };
  var P = { k: 'pickup', label: 'Hotel / pickup', type: 'text', ph: 'Hotel name or area', msg: 'Pickup', empty: '-' };
  var INF13 = { label: 'Infants 1–3', one: 'infant', many: 'infants' };
  /* Most vehicles one online booking can request. Larger groups message us. Real availability is checked by our team. */
  var MAX_VEHICLES = 10;
  function G(k, label, one, many, extra) { var g = { k: k, label: label, one: one, many: many }; for (var x in extra || {}) g[x] = extra[x]; return g; }
  function ride(roleK, role, roleOne, roleMany) {
    return [G(roleK, role, roleOne, roleMany, { min: 1, max: MAX_VEHICLES, vehicle: true }), G('pass', 'Passengers', 'passenger', 'passengers', { maxOf: roleK, maxMsg: 'Each vehicle carries one passenger at most. Add a ' + roleOne + ' or remove a passenger.' })];
  }
  function dur(list) { return list.map(function (r) { return { t: r[0], d: r[1], p: r[2] }; }); }
  function E3(a, c) { return [G('adults', 'Adults', 'adult', 'adults', { min: 1, price: a }), G('kids', 'Children 4–11', 'child', 'children', { kid: true, price: c }), G('inf', 'Children under 4', 'child under 4', 'children under 4', { kid: true, price: 0 })]; }
  function AC(a, c) { return [G('adults', 'Adults', 'adult', 'adults', { min: 1, price: a }), G('kids', 'Children', 'child', 'children', { kid: true, price: c })]; }
  window.IRPROGS = {
    sea: {
      title: 'Book a sea trip',
      intro: "Hi Island Rides Phuket! I'd like to book a sea trip.",
      note: 'Nothing is charged until we confirm.',
      fields: [
        { k: 'opt', label: 'Trip', type: 'select', req: true, msg: 'Trip', options: [
          { id: 'khai', text: 'Phi Phi & Khai Island · 3,600 / 2,700 THB', price: 3600, child: 2700, childLabel: 'Children 4–11', infant: INF13 },
          { id: 'bamboo', text: 'Phi Phi & Bamboo Island · 3,800 / 2,800 THB', price: 3800, child: 2800, childLabel: 'Children 4–11', infant: INF13 },
          { id: 'jb', text: 'James Bond Island · 3,800 / 2,800 THB', price: 3800, child: 2800, childLabel: 'Children 4–11', infant: INF13 },
          { id: 'yaoyai', text: 'James Bond & Yao Yai Island (speedboat) · 3,700 / 2,700 THB', price: 3700, child: 2700, childLabel: 'Children 4–11' },
          { id: 'hong', text: 'Hong by Starlight (sea kayak) · 3,950 / 1,975 THB', price: 3950, child: 1975, childLabel: 'Children 12 & under', infant: { label: 'Children 6 & under', one: 'child 6 & under', many: 'children 6 & under' } },
          { id: 'dayislands', text: 'A Day in the Islands (private sea kayak) · from 29,000 THB', info: 'From 29,000 THB', fromPrice: 29000 },
          { id: 'ltboat', text: 'Private Long-tail Boat · 4,000 THB per boat (up to 6)', info: '4,000 THB per boat · up to 6 guests', unitPrice: 4000, unit: ['boat', 'boats'], cap: 6 },
          { id: 'pn01', text: 'Phang Nga Private Longtail 01 · James Bond Highlights · 4,300 THB per boat', info: '4,300 THB per boat · 1–10 guests · 1.5–2.5 hours', unitPrice: 4300, unit: ['boat', 'boats'], cap: 10 },
          { id: 'pn02', text: 'Phang Nga Private Longtail 02 · Islands & Lagoons · 5,700 THB per boat', info: '5,700 THB per boat · 1–10 guests · 2.5–4 hours', unitPrice: 5700, unit: ['boat', 'boats'], cap: 10 },
          { id: 'pn03', text: 'Phang Nga Private Longtail 03 · James Bond & Panyee · 6,400 THB per boat', info: '6,400 THB per boat · 1–10 guests · 3–5 hours', unitPrice: 6400, unit: ['boat', 'boats'], cap: 10 },
          { id: 'pn04', text: 'Phang Nga Private Longtail 04 · The Complete Bay · 7,100 THB per boat', info: '7,100 THB per boat · 1–10 guests · 4–6 hours', unitPrice: 7100, unit: ['boat', 'boats'], cap: 10 }
        ] },
        N, C, D,
        { k: 'pax', label: 'People', type: 'people', req: true, msg: 'People' },
        P
      ],
      msgOrder: ['opt', 'name', 'contact', 'date', 'pax', 'pickup']
    },
    eleph: {
      title: 'Book Bukit Elephant Park',
      intro: "Hi Island Rides Phuket! I'd like to book Bukit Elephant Park.",
      note: 'Elephant Nature runs at 09:00 and 14:00 only. Nothing is charged until we confirm.',
      fields: [
        { k: 'opt', label: 'Program', type: 'select', req: true, msg: 'Program', options: [
          { id: 'eleph-nature', text: 'Elephant Nature (3 hrs) · 2,700 / 1,500 THB', info: '2,700 THB adult · 1,500 THB child 4–11 · about 3 hours', groups: E3(2700, 1500), times: [0, 2] },
          { id: 'eleph-feed', text: 'Walk & Feed (1.5 hrs) · 1,600 / 1,000 THB', info: '1,600 THB adult · 1,000 THB child 4–11 · about 1.5 hours', groups: E3(1600, 1000) },
          { id: 'eleph-mini', text: 'Mini Elephant Nature (1.5 hrs) · 1,400 / 800 THB', info: '1,400 THB adult · 800 THB child 4–11 · about 1.5 hours', groups: E3(1400, 800) }
        ] },
        N, C, D,
        { k: 'time', label: 'Time', type: 'select', msg: 'Time', options: [{ text: '09:00' }, { text: '11:00' }, { text: '14:00' }], rule: 'times', ruleMsg: 'Elephant Nature runs at 09:00 and 14:00 only. Choose one of those times.' },
        { k: 'pax', label: 'People', type: 'people', req: true, msg: 'People' },
        P
      ],
      msgOrder: ['opt', 'name', 'contact', 'date', 'time', 'pax', 'pickup']
    },
    atv: {
      title: 'Book an ATV tour',
      intro: "Hi Island Rides Phuket! I'd like to book an ATV tour.",
      note: 'Nothing is charged until we confirm.',
      fields: [
        { k: 'opt', label: 'Ride', type: 'select', req: true, msg: 'Ride', options: [
          { text: 'ATV 200cc', groups: ride('riders', 'Riders', 'rider', 'riders'), durations: dur([['30 mins', 1400, 800], ['45 mins', 1600, 1000], ['1 hour', 1800, 1200], ['1.5 hours', 2000, 1500], ['2 hours', 2200, 1800]]) },
          { text: 'ATV 520cc', groups: ride('riders', 'Riders', 'rider', 'riders'), durations: dur([['30 mins', 1800, 1600], ['45 mins', 2200, 1800], ['1 hour', 2600, 2000], ['1.5 hours', 3600, 2600]]) },
          { text: 'Buggy 600cc', groups: ride('drivers', 'Drivers', 'driver', 'drivers'), durations: dur([['30 mins', 1800, 1600], ['45 mins', 2200, 1800], ['1 hour', 2600, 2000], ['1.5 hours', 3600, 2600]]) },
          { text: 'Buggy 660cc', groups: ride('drivers', 'Drivers', 'driver', 'drivers'), durations: dur([['30 mins', 2000, 1800], ['45 mins', 2400, 2000], ['1 hour', 2800, 2200], ['1.5 hours', 3800, 2800]]) },
          { text: 'Go Kart 250cc (12 laps) · 1,500 THB', durations: dur([['12 laps', 1500, null]]), groups: [G('drivers', 'Drivers', 'driver', 'drivers', { min: 1, max: MAX_VEHICLES, vehicle: true, unitLabel: 'per kart' })] },
          { text: 'ATV for Kids 110cc (12 laps) · 1,500 THB', durations: dur([['12 laps', 1500, null]]), groups: [G('kidatv', 'Children 10–15', 'child', 'children', { min: 1, max: MAX_VEHICLES, kid: true, vehicle: true })] },
          { text: 'Elephant Feeding + ATV (60 mins) · 2,400 / 2,200 THB', groups: ride('riders', 'Riders', 'rider', 'riders'), durations: dur([['60 mins', 2400, 2200]]) },
          { text: 'Seaview Elephant Care + ATV (60 mins) · 2,600 / 2,400 THB', groups: ride('riders', 'Riders', 'rider', 'riders'), durations: dur([['60 mins', 2600, 2400]]) },
          { text: 'Elephant Feeding + Buggy (60 mins) · 3,200 / 2,600 THB', groups: ride('drivers', 'Drivers', 'driver', 'drivers'), durations: dur([['60 mins', 3200, 2600]]) },
          { text: 'Elephant Bathing & Care · 2,200 / 2,000 THB', groups: AC(2200, 2000) },
          { text: 'Elephant Feed & Care · 1,600 / 1,400 THB', groups: AC(1600, 1400) },
          { text: 'Elephant Nature & Care · 2,400 / 2,200 THB', groups: AC(2400, 2200) }
        ] },
        N, C,
        { k: 'dur', label: 'Riding time', type: 'dyn', from: 'durations' },
        { k: 'slot', label: 'Pickup', type: 'select', options: [{ text: 'Morning', info: 'Patong 08:00 · Kata / Karon 08:30' }, { text: 'Afternoon', info: 'Patong 12:00 · Kata / Karon 12:30' }] },
        { k: 'time', type: 'combo', parts: ['dur', 'slot'], msg: 'Duration / time', empty: '-' },
        D,
        { k: 'pax', label: 'People', type: 'people', req: true, msg: 'People', hint: 'One driver per ATV or buggy, and at most one passenger each. Kids ATV is for ages 10–15.' },
        P
      ],
      msgOrder: ['opt', 'time', 'name', 'contact', 'date', 'pax', 'pickup']
    },
    jetski: {
      title: 'Book the jet ski tour',
      intro: "Hi Island Rides Phuket! I'd like to book the jet ski tour.",
      note: 'Opens WhatsApp with your details filled in. Nothing is charged until we confirm.',
      fields: [
        { k: 'opt', label: 'Jet ski', type: 'select', req: true, msg: 'Jet ski', options: [
          { id: 'TOUR-004', text: 'Yamaha 1100cc · 7,900 THB', value: 'Yamaha 1100cc (7,900 THB)', info: '7,900 THB per jet ski · 4-hour tour · up to 2 people, 120 kg max', unitPrice: 7900 },
          { id: 'TOUR-007', text: 'Sea-Doo GTX Pro 1630cc · 9,500 THB', value: 'Sea-Doo GTX Pro 1630cc (9,500 THB)', info: '9,500 THB per jet ski · 4-hour tour · up to 2 people, 160 kg max', unitPrice: 9500 },
          { id: 'TOUR-006', text: 'Yamaha FX 1900cc · 13,500 THB', value: 'Yamaha FX 1900cc (13,500 THB)', info: '13,500 THB per jet ski · 4-hour tour · up to 2 people, 160 kg max', unitPrice: 13500 }
        ] },
        { k: 'units', label: 'Number of jet skis', type: 'units', unit: ['jet ski', 'jet skis'], max: MAX_VEHICLES, perUnit: 2 },
        N, C, D,
        { k: 'time', label: 'Trip', type: 'select', msg: 'Trip', options: [{ text: 'Morning 09:00–13:00' }, { text: 'Afternoon 13:30–17:30' }] },
        { k: 'pax', label: 'Number of people', type: 'people', req: true, msg: 'People', hint: 'Max 2 people per jet ski. Riders 17 and over can drive. Not recommended for children under 6.',
          groups: [G('adults', 'Adults 17+', 'adult', 'adults', { min: 1 }), G('kids', 'Children under 17', 'child', 'children', { kid: true, sub: 'Can drive only with a parent or staff on board' })] },
        P
      ],
      msgOrder: ['opt', 'name', 'contact', 'date', 'time', 'pax', 'pickup']
    }
  };
  window.IRPROGS._max = MAX_VEHICLES;
  /* which form and option a tour card opens */
  window.IRPROGMAP = { khai: ['sea', 'khai'], bamboo: ['sea', 'bamboo'], jb: ['sea', 'jb'], yaoyai: ['sea', 'yaoyai'], hong: ['sea', 'hong'],
    ltboat: ['sea', 'ltboat'], pnlong: ['sea', 'pn01'], eleph: ['eleph', null], jetski: ['jetski', null], atv: ['atv', null] };
})();
