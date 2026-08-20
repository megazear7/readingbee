# Reading Bee

Reading Bee helps beginner readers learn to read. A student sees one word, phrase, or sentence on a dark screen. An instructor marks whether it was read correctly.

Built with TypeScript on the [Zelt stack](https://zelt.alexlockhart.me/) as a client-only SPA PWA. After the service worker installs, the app works fully offline. All data stays in the browser.

## Setup

```sh
nvm use 22
npm install
npm start
```

Open [localhost:3000](http://localhost:3000/).

## Test / lint

```sh
npm test
npm run fix
```

## Hosting

The app is a static PWA. Production host is Netlify at `readingbee.alexlockhart.me`.
