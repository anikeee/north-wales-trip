// Every fact in this file comes from the "North Wales" trip plan PDF.
// Text is kept word for word. Only the in-app links (directions to each stop,
// map searches for named cafés and car parks) are added, so the app can open
// Google Maps from wherever you are.

const STAY_ADDRESS = '8 Morfa Rd, Penrhyn Bay, Llandudno LL30 3PT';

// Directions from the phone's current location (Google Maps fills in "Your location").
export const directionsTo = (place) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}&travelmode=driving`;

// Opens a place in Google Maps so you can see opening hours, photos and call them.
export const mapSearch = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const trip = {
  title: 'North Wales',
  subtitle: 'Friday 6 to Monday 9 November, three nights at The Cherries',
  timezone: 'Europe/London',
  start: '2026-11-06T10:00',
  end: '2026-11-09T18:30',
  stay: {
    name: 'The Cherries',
    address: STAY_ADDRESS,
    maps: 'https://www.google.com/maps/search/?api=1&query=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT',
    directions: directionsTo(STAY_ADDRESS),
    checkIn: 'Fri after 16:00, lockbox',
    checkOut: 'Mon by 10:00',
    guests: '4 adults and 1 infant',
  },
  intro:
    'Start with the plan for each day. Every stop shows parking, food and toilets, with halal food first where there is any.',
  sun: { rise: '07:25', set: '16:30' },
  weatherNote:
    'Weather is the Met Office forecast for Llandudno in °C, checked Thursday 5 November. It will shift, so check again each morning. Snowdonia is usually colder and windier than the coast.',
  sources:
    'Drive times are typical, without traffic. Restaurant and shop details, including opening hours, are from Google Maps. Parking prices are from the national park and councils where available, and from recent visitor reports elsewhere. The pictures on each card are illustrations.',
};

/*
 Detail rows on a stop:
   { kind: 'parking' | 'food' | 'toilets', items: [Item] }
 Item:
   { tag?, tone?, text?, venues?, q? }
   tag    bold label from the PDF ("Free", "Paid", "Halal", "Veg options" ...)
   tone   'free' | 'paid' | 'halal' | 'ask' | 'veg'  (drives the colour)
   text   the sentence after the label
   venues [{ name, text, q }] for food items that name places; name is tappable
   q      a Google Maps search for the item (car parks)
*/

export const days = [
  {
    id: 'fri',
    date: '2026-11-06',
    short: 'Fri',
    label: 'Friday 6 Nov',
    title: 'Arrive and settle in',
    driving: 'About 4.5 hours’ drive up',
    weather: {
      icon: 'cloud',
      summary: 'Cloudy, high 10°, low 7°',
      short: 'Cloudy, 10°',
      high: 10,
      low: 7,
      note: 'Some rain possible in the morning while you drive, drier later. Dark by about 16:35.',
    },
    route: { destination: STAY_ADDRESS, waypoints: [] },
    stops: [
      {
        id: 'fri-1000',
        time: '10:00',
        kind: 'drive',
        title: 'Leave London',
        text: 'With a couple of stops you’ll arrive close to check-in.',
        dest: STAY_ADDRESS,
        destLabel: 'Route to The Cherries',
      },
      {
        id: 'fri-1600',
        time: '16:00',
        kind: 'home',
        title: 'Check in at The Cherries',
        text: 'Self check-in with the lockbox.',
        dest: STAY_ADDRESS,
      },
      {
        id: 'fri-1630',
        time: '16:30',
        kind: 'shop',
        title: 'Food shop',
        text: 'Aldi and Asda on Conway Road are about 8 minutes away and open until 10pm. Big shops close at 4pm on Sunday, so stock up tonight.',
        link: { href: '#/shops', label: 'See all food shops' },
      },
      {
        id: 'fri-1730',
        time: '17:30',
        kind: 'sight',
        title: 'Llandudno pier and promenade, then dinner',
        text: 'A short walk along the seafront.',
        drive: '5 min drive',
        place: 'llandudno-pier',
        dest: 'Llandudno Pier, Llandudno',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'bays further east along the promenade towards the Little Orme, then walk.' },
              { tag: 'Paid', tone: 'paid', text: 'Happy Valley pay and display next to the pier, and bays along the promenade.', q: 'Happy Valley car park, Llandudno' },
            ],
          },
          {
            kind: 'food',
            items: [
              {
                tag: 'Halal',
                tone: 'halal',
                venues: [
                  { name: 'The Big Mouth Grill', text: '147 Mostyn St, Pakistani grill, 1pm to 10pm.', q: 'The Big Mouth Grill, 147 Mostyn St, Llandudno' },
                  { name: 'Dinos', text: '5 Gloddaeth St, burgers and grills, 4pm to 10pm on Fridays.', q: 'Dinos, 5 Gloddaeth St, Llandudno' },
                ],
              },
            ],
          },
          { kind: 'toilets', items: [{ text: 'Public toilets along the promenade.' }] },
        ],
      },
    ],
  },
  {
    id: 'sat',
    date: '2026-11-07',
    short: 'Sat',
    label: 'Saturday 7 Nov',
    title: 'Snowdonia and the coast',
    driving: 'About 3.5 hours of driving',
    weather: {
      icon: 'sun-cloud',
      summary: 'Sunny spells, high 11°, low 7°',
      short: 'Sunny spells, 11°',
      high: 11,
      low: 7,
      note: 'The best morning of the trip, so it gets the longest day. Showers likely from 1pm to 5pm. Almost no wind.',
    },
    route: {
      origin: STAY_ADDRESS,
      destination: STAY_ADDRESS,
      waypoints: [
        'Padarn Country Park, Llanberis LL55 4TY',
        'Llyn Cwellyn, Betws Garmon',
        'Beddgelert',
        'Croesor',
        'Penrhyndeudraeth',
        'Portmeirion',
        'Criccieth Castle, Criccieth',
        'Porthmadog',
      ],
    },
    stops: [
      { id: 'sat-0830', time: '08:30', kind: 'drive', title: 'Leave The Cherries' },
      {
        id: 'sat-0915',
        time: '09:15',
        kind: 'sight',
        title: 'Llanberis and the Llanberis Path',
        text: 'Walk by Llyn Padarn, then the first stretch of the path for the views, and turn back.',
        drive: '45 min drive',
        place: 'llanberis',
        dest: 'Padarn Country Park, Llanberis LL55 4TY',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Paid', tone: 'paid', text: 'Padarn Country Park car park by the lake, LL55 4TY, pay and display.', q: 'Padarn Country Park car park, Llanberis LL55 4TY' },
              { tag: 'Free', tone: 'free', text: 'none reliable in the daytime.' },
            ],
          },
          {
            kind: 'food',
            items: [
              {
                venues: [
                  { lead: 'Cafés in the village.' },
                  { name: 'Spice of Llanberis', text: 'is Indian but only opens in the evening.', q: 'Spice of Llanberis, Llanberis', joiner: ' ' },
                ],
              },
            ],
          },
          { kind: 'toilets', items: [{ text: 'In Padarn Country Park and in the village, open all year.' }] },
        ],
      },
      {
        id: 'sat-1030',
        time: '10:30',
        kind: 'sight',
        title: 'Betws Garmon and Llyn Cwellyn',
        text: 'The lake on the quiet side of Snowdon. Photos and a stretch.',
        drive: '15 min drive',
        place: 'betws-garmon',
        dest: 'Llyn Cwellyn, Betws Garmon',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Paid', tone: 'paid', text: 'Llyn Cwellyn national park car park, £5 up to 4 hours, card only.', q: 'Llyn Cwellyn car park' },
              { tag: 'Free', tone: 'free', text: 'none confirmed.' },
            ],
          },
          { kind: 'toilets', items: [{ text: 'None found. Use the ones in Llanberis.' }] },
        ],
      },
      {
        id: 'sat-1115',
        time: '11:15',
        kind: 'sight',
        title: 'Beddgelert',
        text: 'A walk along the river and a hot drink.',
        drive: '15 min drive',
        place: 'beddgelert',
        dest: 'Beddgelert',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Paid', tone: 'paid', text: 'village car park, £5 up to 4 hours, card only.', q: 'Beddgelert car park' },
              { tag: 'Free', tone: 'free', text: 'none.' },
            ],
          },
          {
            kind: 'food',
            items: [
              {
                tag: 'Veg options',
                tone: 'veg',
                venues: [
                  { name: 'Caffi Colwyn', text: '1 Church St, 10am to 4pm on weekends, does a veggie breakfast.', q: 'Caffi Colwyn, 1 Church St, Beddgelert' },
                  { name: 'Ty Coets', text: 'on the square for coffee and cake.', q: 'Ty Coets, Beddgelert', joiner: ' ' },
                ],
              },
            ],
          },
          { kind: 'toilets', items: [{ text: 'Public toilets in the village, open all year.' }] },
        ],
      },
      {
        id: 'sat-1200',
        time: '12:00',
        kind: 'sight',
        title: 'Croesor',
        text: 'A small valley at the end of a narrow road. Half an hour on foot is plenty.',
        drive: '20 min drive',
        place: 'croesor',
        dest: 'Croesor',
        details: [
          {
            kind: 'parking',
            items: [{ tag: 'Free', tone: 'free', text: 'national park car park in the hamlet, 20 spaces.', q: 'Croesor car park' }],
          },
          { kind: 'toilets', items: [{ text: 'None. Go in Beddgelert first.' }] },
        ],
      },
      {
        id: 'sat-1300',
        time: '13:00',
        kind: 'food',
        title: 'Lunch in Penrhyndeudraeth',
        text: 'No halal places found nearby at lunchtime, so this is a fully vegetarian café.',
        drive: '15 min drive',
        place: 'portmeirion',
        dest: 'The Eating Gorilla, 21 High St, Penrhyndeudraeth',
        details: [
          {
            kind: 'food',
            items: [
              {
                tag: 'Vegetarian and vegan',
                tone: 'veg',
                venues: [
                  { name: 'The Eating Gorilla', text: '21 High St, 9am to 3pm on Saturdays. Big portions, cakes and games for kids.', q: 'The Eating Gorilla, 21 High St, Penrhyndeudraeth' },
                ],
              },
            ],
          },
          {
            kind: 'parking',
            items: [{ text: 'Street parking in the village; check the signs. Portmeirion’s free car park is 5 minutes away.' }],
          },
          { kind: 'toilets', items: [{ text: 'In the café for customers.' }] },
        ],
      },
      {
        id: 'sat-1415',
        time: '14:15',
        kind: 'sight',
        title: 'Portmeirion (optional)',
        optional: true,
        text: 'The colourful Italian style village. Winter hours are 9:30am to 5:30pm, last entry 4:30pm. Tickets about £20 per adult, under 5s free.',
        drive: '5 min drive',
        place: 'portmeirion',
        dest: 'Portmeirion',
        details: [
          {
            kind: 'parking',
            items: [{ tag: 'Free', tone: 'free', text: 'large car park by the entrance.', q: 'Portmeirion car park' }],
          },
          { kind: 'toilets', items: [{ text: 'At the welcome centre by the entrance, and in the cafés inside.' }] },
        ],
      },
      {
        id: 'sat-1545',
        time: '15:45',
        kind: 'sight',
        title: 'Criccieth',
        text: 'The seafront and the castle on its headland. Sunset is around 16:30. Bring waterproofs.',
        drive: '20 min drive',
        place: 'criccieth',
        dest: 'Criccieth Castle, Criccieth',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'roadside along the seafront and around the castle, free outside summer.' },
              { tag: 'Paid', tone: 'paid', text: 'pay and display car parks on the Esplanade.', q: 'Esplanade car park, Criccieth' },
            ],
          },
          { kind: 'toilets', items: [{ text: 'In the small park behind the Esplanade. Locked from 6pm.' }] },
        ],
      },
      {
        id: 'sat-1645',
        time: '16:45',
        kind: 'food',
        title: 'Early dinner in Porthmadog',
        text: 'On the way back towards the main road.',
        drive: '10 min drive',
        dest: 'Porthmadog',
        details: [
          {
            kind: 'food',
            items: [
              {
                tag: 'Indian, ask if halal',
                tone: 'ask',
                venues: [
                  { name: 'Glaslyn Tandoori', text: '26a Lombard St, from 4:30pm, with a big vegetarian choice.', q: 'Glaslyn Tandoori, 26a Lombard St, Porthmadog' },
                  { name: 'Sima Tandoori', text: '97 High St, from 5pm.', q: 'Sima Tandoori, 97 High St, Porthmadog' },
                ],
              },
            ],
          },
          {
            kind: 'parking',
            items: [{ tag: 'Free', tone: 'free', text: 'Gwynedd council car parks are free from 6pm to 8am, and there’s street parking on the High Street.' }],
          },
          { kind: 'toilets', items: [{ text: 'In the restaurant.' }] },
        ],
      },
      {
        id: 'sat-1800',
        time: '18:00',
        kind: 'home',
        title: 'Back to The Cherries',
        text: 'Home around 19:15.',
        drive: '1 h 10 drive',
        dest: STAY_ADDRESS,
      },
    ],
  },
  {
    id: 'sun',
    date: '2026-11-08',
    short: 'Sun',
    label: 'Sunday 8 Nov',
    title: 'Anglesey and a beach sunset',
    driving: 'About 2.5 hours of driving',
    weather: {
      icon: 'sun-rain',
      summary: 'Wet start, then sunny spells, high 11°, low 6°',
      short: 'Wet start, then sunny, 11°',
      high: 11,
      low: 6,
      note: 'Rain likely early, so start late. Dry from about 4pm with a clear evening.',
    },
    route: {
      origin: STAY_ADDRESS,
      destination: STAY_ADDRESS,
      waypoints: [
        'Garth Pier, Bangor',
        'Llanfairpwllgwyngyll railway station',
        'Llanddwyn Beach car park, Newborough',
        'Bangor Tandoori, 360 High St, Bangor',
      ],
    },
    stops: [
      { id: 'sun-1030', time: '10:30', kind: 'drive', title: 'Leave The Cherries' },
      {
        id: 'sun-1100',
        time: '11:00',
        kind: 'food',
        title: 'Bangor: Garth Pier, then halal lunch',
        text: 'Walk the pier over the Menai Strait, then eat on the High Street.',
        drive: '30 min drive',
        place: 'bangor-garth-pier',
        dest: 'Garth Pier, Bangor',
        details: [
          {
            kind: 'food',
            items: [
              {
                tag: 'Halal',
                tone: 'halal',
                venues: [{ name: 'Anka Turkish Restaurant', text: '49 High St, from 12pm.', q: 'Anka Turkish Restaurant, 49 High St, Bangor' }],
              },
              {
                tag: 'Pakistani, ask if halal',
                tone: 'ask',
                venues: [{ name: 'Desi Food Point', text: '230 High St, from 11am on Sundays.', q: 'Desi Food Point, 230 High St, Bangor' }],
              },
            ],
          },
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'Deiniol Shopping Centre car park is free all day on Sundays, right by the High Street.', q: 'Deiniol Shopping Centre car park, Bangor' },
              { tag: 'Paid', tone: 'paid', text: 'small pay and display car park at the pier entrance.', q: 'Garth Pier car park, Bangor' },
            ],
          },
          { kind: 'toilets', items: [{ text: 'Just outside the pier entrance.' }] },
        ],
      },
      {
        id: 'sun-1245',
        time: '12:45',
        kind: 'sight',
        title: 'Llanfairpwll',
        text: 'Over the Britannia Bridge for a photo with the long station sign.',
        drive: '10 min drive',
        place: 'llanfairpwll',
        dest: 'Llanfairpwllgwyngyll railway station',
        details: [
          {
            kind: 'parking',
            items: [{ tag: 'Free', tone: 'free', text: 'large car park at the station, next to the James Pringle shop.', q: 'James Pringle Weavers, Llanfairpwll' }],
          },
          { kind: 'toilets', items: [{ text: 'None confirmed. Use the ones at Bangor pier.' }] },
        ],
      },
      {
        id: 'sun-1315',
        time: '13:15',
        kind: 'sight',
        title: 'Newborough Forest and Llanddwyn Beach',
        text: 'Walk the beach to Llanddwyn Island. A baby carrier is easier than a buggy on sand. Check the tide times first.',
        drive: '20 min drive',
        place: 'newborough-llanddwyn',
        dest: 'Llanddwyn Beach car park, Newborough',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Paid', tone: 'paid', text: 'main Beach car park in the forest. Number plates are scanned and you pay by app or online.', q: 'Llanddwyn Beach car park, Newborough' },
              { tag: 'Free', tone: 'free', text: 'Llyn Rhos-ddu car park on the A4080, with a longer walk through the forest.', q: 'Llyn Rhos-ddu car park, Newborough' },
            ],
          },
          { kind: 'food', items: [{ text: 'Nothing open here in winter. Bring snacks and drinks.' }] },
          { kind: 'toilets', items: [{ text: 'Free toilets with baby changing at the Beach car park. They close about 4pm in winter.' }] },
        ],
      },
      {
        id: 'sun-1630',
        time: '16:30',
        kind: 'sunset',
        title: 'Sunset on the beach',
        text: 'Watch the mountains catch the last light, then head back to the car.',
        place: 'newborough-llanddwyn',
      },
      {
        id: 'sun-1715',
        time: '17:15',
        kind: 'food',
        title: 'Dinner in Bangor',
        text: 'On the way home along the A55.',
        drive: '25 min drive',
        dest: 'Bangor Tandoori, 360 High St, Bangor',
        details: [
          {
            kind: 'food',
            items: [
              {
                tag: 'Halal (reviewers say so)',
                tone: 'halal',
                venues: [
                  { name: 'Bangor Tandoori', text: '360 High St, from 5pm.', q: 'Bangor Tandoori, 360 High St, Bangor' },
                  { lead: 'Or Anka again, open until 10pm.' },
                ],
              },
            ],
          },
          {
            kind: 'parking',
            items: [{ tag: 'Free', tone: 'free', text: 'Deiniol Shopping Centre car park on Sundays, or Gwynedd council car parks after 6pm.', q: 'Deiniol Shopping Centre car park, Bangor' }],
          },
        ],
      },
      {
        id: 'sun-1845',
        time: '18:45',
        kind: 'home',
        title: 'Back to The Cherries',
        drive: '30 min drive',
        dest: STAY_ADDRESS,
      },
    ],
  },
  {
    id: 'mon',
    date: '2026-11-09',
    short: 'Mon',
    label: 'Monday 9 Nov',
    title: 'The scenic road home',
    driving: 'About 6 hours including the drive home',
    weather: {
      icon: 'sun-cloud',
      summary: 'Dry with sunny spells, high 10°, low 8°',
      short: 'Dry with sunny spells, 10°',
      high: 10,
      low: 8,
      note: 'The driest day. A cold wind picks up in the afternoon, so it feels like 3 to 7°.',
    },
    route: {
      origin: STAY_ADDRESS,
      destination: 'London',
      waypoints: ['Ogwen Cottage, Bethesda', 'Capel Curig', 'Swallow Falls, Betws-y-Coed', 'Corwen'],
    },
    stops: [
      {
        id: 'mon-0945',
        time: '09:45',
        kind: 'home',
        title: 'Check out',
        text: 'Out by 10:00. There’s no halal food open at lunchtime on today’s route, so consider a halal takeaway on Sunday night to eat on the road.',
      },
      {
        id: 'mon-1030',
        time: '10:30',
        kind: 'sight',
        title: 'Llyn Ogwen and the Glyderau',
        text: 'Through Bangor and up the A5. Pull in at the lake for the view.',
        drive: '45 min drive',
        place: 'llyn-ogwen',
        dest: 'Ogwen Cottage, Bethesda',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'lay-bys along the A5 beside the lake.' },
              { tag: 'Paid', tone: 'paid', text: 'Ogwen car park, £5 up to 4 hours, card only.', q: 'Ogwen Cottage car park, Bethesda' },
            ],
          },
          { kind: 'food', items: [{ text: 'Small snack bar at Ogwen for drinks and cakes.' }] },
          { kind: 'toilets', items: [{ text: 'Accessible toilets at the Ogwen car park.' }] },
        ],
      },
      {
        id: 'mon-1115',
        time: '11:15',
        kind: 'food',
        title: 'Capel Curig and an early lunch',
        text: 'The classic view across the lakes to the Snowdon peaks.',
        drive: '10 min drive',
        place: 'capel-curig',
        dest: 'Caffi Siabod, Capel Curig',
        details: [
          {
            kind: 'food',
            items: [
              {
                tag: 'Veg options',
                tone: 'veg',
                venues: [{ name: 'Caffi Siabod', text: 'on the A5, 8am to 5pm daily, with soups, jacket potatoes and cakes.', q: 'Caffi Siabod, Capel Curig', joiner: ' ' }],
              },
            ],
          },
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'national park car park in the village. Caffi Siabod’s own car park charges after 2 hours.', q: 'Capel Curig car park' },
            ],
          },
          { kind: 'toilets', items: [{ text: 'In the café for customers.' }] },
        ],
      },
      {
        id: 'mon-1215',
        time: '12:15',
        kind: 'sight',
        title: 'Swallow Falls and Betws-y-Coed',
        text: 'See the falls on the way in, then a wander round the village. Entry to the falls is £2 each.',
        drive: '10 min drive',
        place: 'betws-y-coed',
        dest: 'Swallow Falls, Betws-y-Coed',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'lay-by right next to Swallow Falls.', q: 'Swallow Falls, Betws-y-Coed' },
              { tag: 'Paid', tone: 'paid', text: 'in the village, Cae Llan short stay at £1.50 an hour, or the national park long stay at £5 up to 4 hours. Both card only.', q: 'Cae Llan car park, Betws-y-Coed' },
            ],
          },
          {
            kind: 'food',
            items: [
              {
                tag: 'Ask if halal',
                tone: 'ask',
                venues: [{ name: 'Abbasi’s Indian', text: 'which reviewers say is halal, but it only opens at 5pm.', q: 'Abbasi’s Indian, Betws-y-Coed' }],
              },
              {
                tag: 'Veg options',
                tone: 'veg',
                venues: [{ name: 'Cafe Madlen', text: 'at the garden centre, 10am to 5pm.', q: 'Cafe Madlen, Betws-y-Coed', joiner: ' ' }],
              },
            ],
          },
          { kind: 'toilets', items: [{ text: 'Cae Llan, Station Road, 50p, with baby changing. None at the falls.' }] },
        ],
      },
      {
        id: 'mon-1315',
        time: '13:15',
        kind: 'sight',
        title: 'Tŷ Nant and Corwen',
        text: 'East over open moorland on the A5. A good last toilet stop before England.',
        drive: '35 min drive',
        place: 'corwen-ty-nant',
        dest: 'Corwen',
        details: [
          {
            kind: 'parking',
            items: [
              { tag: 'Free', tone: 'free', text: 'Pavilion car park, London Road.', q: 'Pavilion car park, London Road, Corwen' },
              { tag: 'Paid', tone: 'paid', text: 'Green Lane car park in the centre, about £1.50 an hour.', q: 'Green Lane car park, Corwen' },
            ],
          },
          { kind: 'toilets', items: [{ text: 'Green Lane car park, 40p, 7am to 6pm.' }] },
        ],
      },
      {
        id: 'mon-1400',
        time: '14:00',
        kind: 'drive',
        title: 'On to London',
        text: 'About 4 hours via Llangollen and Shrewsbury. Pontcysyllte Aqueduct is a short detour near Llangollen. Home around 18:30.',
        drive: '4 h drive',
        place: 'pontcysyllte',
        dest: 'London',
        destLabel: 'Route to London',
      },
    ],
  },
];

// Hours: [open, close] as HH:MM, close "24:00" means midnight. `all` covers Monday to Saturday
// unless a day is listed, `sun` is Sunday.
export const shops = [
  {
    name: 'Aldi Llandudno',
    address: 'Mostyn Champneys Retail Park, Conway Rd, LL30 1RY',
    drive: 'About 8 min drive',
    hoursText: '8am to 10pm, Sunday 10am to 4pm',
    hours: { all: ['08:00', '22:00'], sun: ['10:00', '16:00'] },
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Aldi%2C%20Mostyn%20Champneys%20Retail%20Park%2C%20Llandudno%20LL30%201RY&travelmode=driving',
  },
  {
    name: 'Asda Llandudno Superstore',
    address: 'Conway Rd, LL30 1PJ. Has a pharmacy and café.',
    drive: 'About 8 min drive',
    hoursText: '7am to 10pm, Sunday 10am to 4pm',
    hours: { all: ['07:00', '22:00'], sun: ['10:00', '16:00'] },
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Asda%20Llandudno%20Superstore%2C%20Conway%20Rd%2C%20LL30%201PJ&travelmode=driving',
  },
  {
    name: 'Tesco Express',
    address: '87 to 89 Mostyn St, Llandudno town centre',
    drive: 'About 10 min drive',
    hoursText: '6am to 11pm every day',
    hours: { all: ['06:00', '23:00'], sun: ['06:00', '23:00'] },
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Tesco%20Express%2C%2087%20Mostyn%20St%2C%20Llandudno&travelmode=driving',
  },
  {
    name: 'Forti Bags Asian Supermarket',
    address: '21 Station Rd, Colwyn Bay, LL29 8BP. Asian and African groceries, parathas and spices. Ask about halal meat.',
    drive: 'About 10 min drive',
    hoursText: '8am to 10pm every day',
    hours: { all: ['08:00', '22:00'], sun: ['08:00', '22:00'] },
    halal: 'ask',
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Forti%20Bags%2C%2021%20Station%20Rd%2C%20Colwyn%20Bay%20LL29%208BP&travelmode=driving',
  },
  {
    name: 'Tesco Superstore',
    address: 'Llandudno Junction, LL31 9XY. Has a café and petrol station.',
    drive: 'About 12 min drive',
    hoursText: '6am to midnight, Sunday 10am to 4pm',
    hours: { all: ['06:00', '24:00'], sun: ['10:00', '16:00'] },
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Tesco%20Superstore%2C%20Llandudno%20Junction%20LL31%209XY&travelmode=driving',
  },
  {
    name: 'Lidl',
    address: 'New Rd, Llandudno Junction, LL31 9SJ',
    drive: 'About 12 min drive',
    hoursText: '8am to 10pm, Sunday 10am to 4pm',
    hours: { all: ['08:00', '22:00'], sun: ['10:00', '16:00'] },
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Lidl%2C%20New%20Rd%2C%20Llandudno%20Junction%20LL31%209SJ&travelmode=driving',
  },
  {
    name: 'Rhyl Meat and Grocery',
    address: '36 to 37 Wellington Rd, Rhyl, LL18 1BN.',
    halalNote: 'Halal meat counter',
    after: 'fresh flatbreads and baklava, according to reviews.',
    drive: 'About 25 min drive',
    hoursText: '9am to 7pm every day',
    hours: { all: ['09:00', '19:00'], sun: ['09:00', '19:00'] },
    halal: 'yes',
    maps: 'https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20LL30%203PT&destination=Rhyl%20Meat%20And%20Grocery%2C%2036%20Wellington%20Rd%2C%20Rhyl%20LL18%201BN&travelmode=driving',
  },
];

const P = (dest) =>
  `https://www.google.com/maps/dir/?api=1&origin=8%20Morfa%20Rd%2C%20Penrhyn%20Bay%2C%20Llandudno%20LL30%203PT&destination=${dest}&travelmode=driving`;

// Places to visit, closest first. `day` links a place to the day it is in the plan.
// `dest` is copied exactly from the PDF's "Map and directions" link (already URL encoded).
export const places = [
  { id: 'llandudno-pier', group: 'near', name: 'Llandudno pier and promenade', drive: '5 min drive', mins: 5, day: 'fri', text: 'A long Victorian pier and a curving seafront under the Great Orme. Lovely for an evening stroll.', maps: P('Llandudno%20Pier%2C%20Llandudno') },
  { id: 'great-orme', group: 'near', name: 'Great Orme', drive: '10 min drive', mins: 10, text: 'Drive the loop road around the headland or up to the summit for big sea views. Look out for the wild goats.', maps: P('Great%20Orme%20Summit%2C%20Llandudno') },
  { id: 'snowsports', group: 'near', name: 'Llandudno Snowsports Centre', drive: '10 min drive', mins: 10, text: 'A dry ski slope on the Great Orme with lessons, tubing and a long toboggan run, plus a lodge for food and drinks. Check times and book ahead.', maps: P('Llandudno%20Snowsports%20Centre%2C%20Llandudno%20LL30%202QL') },
  { id: 'conwy-castle', group: 'near', name: 'Conwy Castle and town walls', drive: '15 min drive', mins: 15, text: 'A huge medieval castle, with walls you can walk around the old town and a little harbour.', maps: P('Conwy%20Castle%2C%20Conwy') },
  { id: 'welsh-mountain-zoo', group: 'near', name: 'Welsh Mountain Zoo', drive: '15 min drive', mins: 15, text: 'A hillside zoo above Colwyn Bay with sea views. An easy half day with the little one.', maps: P('Welsh%20Mountain%20Zoo%2C%20Colwyn%20Bay') },
  { id: 'bodnant-garden', group: 'near', name: 'Bodnant Garden', drive: '20 min drive', mins: 20, text: 'A National Trust garden with late autumn colour, a wooded valley and mountain views.', maps: P('Bodnant%20Garden%2C%20Tal-y-Cafn') },
  { id: 'tu-hwnt-ir-bont', group: 'near', name: 'Tu Hwnt i’r Bont, Llanrwst', drive: '25 min drive', mins: 25, text: 'A very old stone cottage tearoom by the river bridge. Its ivy turns red in autumn.', maps: P('Tu%20Hwnt%20i%E2%80%99r%20Bont%2C%20Llanrwst') },
  { id: 'aber-falls', group: 'near', name: 'Aber Falls', drive: '25 min drive', mins: 25, text: 'A tall waterfall at the end of a quiet valley, about 45 minutes’ walk each way on a good track.', maps: P('Aber%20Falls%2C%20Abergwyngregyn') },
  { id: 'bangor-garth-pier', group: 'near', name: 'Bangor and Garth Pier', drive: '30 min drive', mins: 30, day: 'sun', text: 'A Victorian pier reaching out into the Menai Strait, with Anglesey across the water.', maps: P('Garth%20Pier%2C%20Bangor') },
  { id: 'betws-y-coed', group: 'far', name: 'Betws-y-Coed and Swallow Falls', drive: '35 min drive', mins: 35, day: 'mon', text: 'A riverside village in the woods, with Swallow Falls just up the road. Plenty of cafés for lunch.', maps: P('Swallow%20Falls%2C%20Betws-y-Coed') },
  { id: 'llyn-crafnant', group: 'far', name: 'Llyn Crafnant', drive: '35 min drive', mins: 35, text: 'A still lake in a hidden valley above Trefriw, a short walk from the car park.', maps: P('Llyn%20Crafnant%2C%20Trefriw') },
  { id: 'llanfairpwll', group: 'far', name: 'Llanfairpwll', drive: '40 min drive', mins: 40, day: 'sun', text: 'The village with the famously long name. A quick photo stop at the station sign.', maps: P('Llanfairpwllgwyngyll%20railway%20station') },
  { id: 'beaumaris', group: 'far', name: 'Beaumaris and Penmon Point', drive: '40 min drive', mins: 40, text: 'A moated castle on Anglesey’s seafront facing the mountains. Penmon’s lighthouse is ten minutes further.', maps: P('Beaumaris%20Castle%2C%20Beaumaris') },
  { id: 'caernarfon-castle', group: 'far', name: 'Caernarfon Castle', drive: '40 min drive', mins: 40, text: 'A huge towered castle on the waterfront. A good stop if it rains, 15 minutes from Llanberis.', maps: P('Caernarfon%20Castle%2C%20Caernarfon') },
  { id: 'llanberis', group: 'far', name: 'Llanberis and Llyn Padarn', drive: '45 min drive', mins: 45, day: 'sat', text: 'A lakeside village at the start of the Llanberis Path, the gentlest way up Snowdon.', maps: P('Llanberis') },
  { id: 'capel-curig', group: 'far', name: 'Capel Curig', drive: '45 min drive', mins: 45, day: 'mon', text: 'The classic view across twin lakes to the Snowdon peaks.', maps: P('Capel%20Curig') },
  { id: 'llyn-ogwen', group: 'far', name: 'Llyn Ogwen and Cwm Idwal', drive: '45 min drive', mins: 45, day: 'mon', text: 'A roadside lake under rugged peaks. Llyn Idwal is about 25 minutes’ walk up a rocky path.', maps: P('Ogwen%20Cottage%2C%20Bethesda') },
  { id: 'betws-garmon', group: 'far', name: 'Betws Garmon and Llyn Cwellyn', drive: '50 min drive', mins: 50, day: 'sat', text: 'A quiet lake on the western side of Snowdon, on the road to Beddgelert.', maps: P('Betws%20Garmon') },
  { id: 'newborough-llanddwyn', group: 'far', name: 'Newborough Forest and Llanddwyn', drive: '55 min drive', mins: 55, day: 'sun', text: 'Pine forest, a huge beach and a tidal island with a lighthouse. Check the tides before walking out.', maps: P('Llanddwyn%20Beach%20car%20park%2C%20Newborough') },
  { id: 'beddgelert', group: 'far', name: 'Beddgelert', drive: '1 h drive', mins: 60, day: 'sat', text: 'A stone village where two rivers meet, with a gorge walk just to the south.', maps: P('Beddgelert') },
  { id: 'corwen-ty-nant', group: 'far', name: 'Corwen and Tŷ Nant', drive: '1 h 05 drive', mins: 65, day: 'mon', text: 'Open moorland on the old A5 road, dropping into the Dee valley at Corwen.', maps: P('Corwen') },
  { id: 'portmeirion', group: 'far', name: 'Penrhyndeudraeth and Portmeirion', drive: '1 h 05 drive', mins: 65, day: 'sat', text: 'Portmeirion’s colourful Italian style village is five minutes from Penrhyndeudraeth. Tickets needed.', maps: P('Portmeirion') },
  { id: 'south-stack', group: 'far', name: 'South Stack Lighthouse', drive: '1 h 05 drive', mins: 65, text: 'A lighthouse on a tiny island below tall sea cliffs at the far tip of Anglesey.', maps: P('South%20Stack%20Lighthouse%2C%20Holyhead') },
  { id: 'criccieth', group: 'far', name: 'Criccieth', drive: '1 h 10 drive', mins: 70, day: 'sat', text: 'A castle on its own headland above a sweep of beach, with sunset over the sea.', maps: P('Criccieth%20Castle%2C%20Criccieth') },
  { id: 'croesor', group: 'far', name: 'Croesor', drive: '1 h 15 drive', mins: 75, day: 'sat', text: 'A tiny hamlet at the end of a narrow valley road, under the pointed peak of Cnicht.', maps: P('Croesor') },
  { id: 'pontcysyllte', group: 'far', name: 'Pontcysyllte Aqueduct', drive: '1 h 15 drive', mins: 75, text: 'A canal carried high above the river Dee, a World Heritage Site. A short detour on Monday’s drive home.', maps: P('Pontcysyllte%20Aqueduct') },
  { id: 'nant-mill', group: 'far', name: 'Nant Mill Wood', drive: '1 h 15 drive', mins: 75, text: 'A wooded river valley near Wrexham with a pretty waterfall on a short trail from the car park. Pairs well with Pontcysyllte on Monday’s drive home.', maps: P('Nant%20Mill%20Visitor%20Centre%2C%20Coedpoeth%20LL11%203BT') },
  { id: 'harlech-castle', group: 'far', name: 'Harlech Castle', drive: '1 h 20 drive', mins: 80, text: 'A castle on a crag with the sea below and mountains behind, 15 minutes south of Penrhyndeudraeth.', maps: P('Harlech%20Castle%2C%20Harlech') },
];

export const placeGroups = [
  { id: 'near', title: 'Closest places to visit', text: 'All within 30 minutes of The Cherries, closest first.' },
  { id: 'far', title: 'Snowdonia (Eryri) and further out', text: 'From 35 minutes to about 1 hour 20 away, closest first.' },
];

export const tips = [
  { title: 'Halal food', text: 'Halal places are listed from Google Maps and reviews. Call ahead to confirm, as suppliers can change. Places marked “ask if halal” weren’t confirmed.' },
  { title: 'Paying for parking', text: 'Snowdonia national park car parks take card or contactless only, no cash. Gwynedd council car parks are free from 6pm to 8am.' },
  { title: 'Short days', text: 'Sunrise is about 07:25 and sunset about 16:30. Many toilets close at 4pm to 6pm, so go when you can.' },
  { title: 'Llanddwyn tides', text: 'The way onto the island floods around high tide. Check Sunday’s tide times first.' },
  { title: 'Llanberis Path', text: 'The summit and back takes about 6 hours. With a baby, the lower stretch is the sensible choice.' },
  { title: 'Winter opening hours', text: 'Castles, gardens and cafés keep shorter hours in November. Check before you go.' },
];
