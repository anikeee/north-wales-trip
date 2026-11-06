# North Wales trip

The North Wales trip plan as an app: Friday 6 to Monday 9 November, three nights at The Cherries.

- **Website:** https://anikeee.github.io/north-wales-trip/
- **Android app:** [download the APK](https://github.com/anikeee/north-wales-trip/releases/latest/download/north-wales-trip.apk), open it on the phone and allow installs from your browser when asked. It is not on the Play Store.
- **iPhone:** open the website in Safari, tap Share, then Add to Home Screen.

## What it does

- **Today** shows the day's weather and sunset, where you are in the plan, and the next stop with one tap directions, parking and toilets. Tick stops as you go and it keeps up with you; otherwise it follows the clock (UK time).
- **Plan** has every stop for each day, with parking, food (halal first) and toilets, plus the whole day as one Google Maps route.
- **Places** lists all 28 places, closest first. Filter by what's in the plan or the optional extras, and star the ones you like.
- **Food shops** says which shops are open right now, including the 4pm closing on Sunday.
- **Info** has where you're staying, check in and out, daylight hours and the plan's tips.
- **Works offline.** The Android app has everything inside it, and the website saves itself on the phone after the first visit.

## How it's built

Plain HTML, CSS and JavaScript in `web/`, with no build step. The same folder is the GitHub Pages site and, through [Capacitor](https://capacitorjs.com), the Android app.

| Path | What it is |
| --- | --- |
| `web/js/data.js` | Every fact from the trip plan PDF, word for word |
| `web/js/app.js` | Screens, the now and next logic, open now for shops |
| `web/css/app.css` | Styles, using the colours from the PDF |
| `web/sw.js` | Offline support for the website |
| `web/img/places/` | The place pictures from the PDF |
| `android/` | The Capacitor Android project |
| `scripts/check-data.mjs` | Checks the data: counts, links, pictures, offline file list |
| `scripts/build-apk.sh` | Builds `dist/north-wales-trip.apk` |

```bash
npm install
npm run serve        # http://localhost:4817
npm run check        # data checks
npm run apk          # Android app (needs the Android SDK and JDK 21)
```

Add `?now=2026-11-07T10:20` to the address to see the app as it would look at that UK time.

The APK is signed with a key kept outside this repo (`keystore.properties` is git ignored). Keep that key to publish updates that install over the old version.

Pushing to `main` deploys `web/` to GitHub Pages. When files in `web/` change, bump `VERSION` in `web/sw.js` so phones pick up the new copy.

The site asks search engines not to index it. Fonts: Archivo, SIL Open Font License (`web/fonts/OFL.txt`).
