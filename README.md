# Fire TV Just Play

An intent-first viewing assistant for the Fire TV hackathon concept. It recommends a small, explainable shortlist from a MongoDB catalog.

## Structure

- `public/index.html` — frontend page
- `public/app.js` — browser logic
- `public/styles.css` — interface styles
- `server.js` — Express API and static file server
- `seed.js` — demo catalog loader
- `.env.example` — environment variable template

## Run locally

```bash
npm install
copy .env.example .env
npm run seed
npm start
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Set a real MongoDB Atlas connection string in `.env` before running the seed script or server.

## Security

Never commit `.env` or database credentials. Rotate any MongoDB password that has been exposed and use a new password in your local `.env` file.

## Video content

Use only videos and thumbnails that you own or are licensed to display. Replace demo URLs in `seed.js` with authorized video URLs.
