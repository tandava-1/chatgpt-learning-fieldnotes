# Working on Fieldnotes

Read `CONTEXT.md` before starting, if you have it. Its "Current state" section
is where the project stands; its log is how it got there. Update both as you
work. This repo is public: `CONTEXT.md` stays local and is gitignored, so keep
anything private out of this file, the README and `docs/`.

Fieldnotes is a public, forkable template: a calm, self-paced, twelve-week AI
learning studio built with Vite and React. Progress is stored in the learner's
browser only; there is no server, login, database or API key.

## Rules

- Nothing personal goes in: no deployment details, account names, private URLs
  or real product ideas. Example projects stay fictional (Community garden
  planner, Museum visit guide, Board-game rules helper).
- No network requests and no secrets in the app. `hub/storage.js` keeps
  progress in the browser. Never embed an API key in the static site.
- `hub/curriculum.js` holds all course material and interface copy. Navigation
  IDs and storage keys in it are application contracts: keep them stable.
- The skills keep their placeholders (`{HUB_URL}`, `{CURRICULUM_PATH}`,
  `{TIMEZONE}`) and stay assistant-neutral.
- `docs/make-your-own-track.md` and `docs/privacy.md` are linked from the
  README and read by people who fork the repo. Don't move them.
- `_local/` is gitignored and must stay out of git.
- Licences: code, helper instructions and starter scripts are MIT; course
  material, interface copy, artwork and docs are CC BY 4.0.
- Commit with the GitHub noreply address, never a personal email.

## Commands

- `npm ci`, then `npm run dev` (local), `npm run build` (type-check and build
  into `dist/`, which is gitignored), `npm run preview`.
- `npm test` runs `scripts/storage.test.mjs`; `node starter/check-course.mjs`
  checks the course file.
