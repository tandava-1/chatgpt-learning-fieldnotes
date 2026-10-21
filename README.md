# ChatGPT Learning: Fieldnotes

A calm, self-paced AI learning studio: twelve weeks of concepts, practical exercises, writing and reflection. Keep the Cloud Garden design, follow the included track, or replace the content to study something else.

No ChatGPT subscription, AI API key, database or login is required. Use any assistant for optional tutoring. Progress stays in your browser; it does not sync across devices. Export backups regularly.

## The learning track

Each week includes a question, concept notes, an experiment, a deliverable, reading links and a writing prompt. The default rhythm is five hours per week, with a rest day; change your start date in Settings and work at your own pace.

| Week | Focus |
| --- | --- |
| 1 | Decide what actually needs AI |
| 2 | Understand training, inference and uncertainty |
| 3 | Specify a task and define good work |
| 4 | Supply knowledge through retrieval |
| 5 | Evaluate quality against a baseline |
| 6 | Choose workflows, agents and permissions |
| 7 | Design trust and recovery |
| 8 | Understand cost and latency |
| 9 | Find a business worth building |
| 10 | Deliver a useful outcome |
| 11 | Find value beyond the model |
| 12 | Make an evidence-backed investment decision |

Choose a fictional project in Settings: **Community garden planner**, **Museum visit guide**, or **Board-game rules helper**. These are practice scenarios, not claims about real products. You can enter your own idea locally.

## Repository map

```text
index.html                  minimal application entry
hub/studio.tsx              React study screens and interactions
hub/curriculum.js           course, resources, prompts and interface copy
hub/storage.js              browser-local persistence; no network requests
hub/styles.css              Cloud Garden visual design
public/                     artwork and favicon
skills/ai-tutor/             optional assistant-neutral tutoring instructions
skills/weekly-digest/        optional research instructions
starter/check-course.mjs     first local check, no credentials needed
scripts/storage.test.mjs     persistence and course-contract tests
docs/                       customization and privacy guides
```

This retains the reference template’s hub/content/docs/skills/starter structure, with a Vite/React build to preserve the existing Fieldnotes UI. The entry is at the repository root rather than `hub/index.html`.

## Setup

1. **Copy.** Choose **Use this template** on GitHub, then clone your own repository. Install Node.js 22.13+ (or a supported newer LTS), then run `npm ci` in the folder.
2. **Run or host.** Run `npm run dev` and open the local URL shown. For a static host, run `npm run build` and upload **only `dist/`** to a host you control. `npm run preview` checks that production build locally. Relative asset paths support subdirectory hosting, including GitHub Pages. This is a built application: do not open the source HTML directly as a local file. Publishing the course does not publish your browser’s progress.
3. **Optional helpers.** Copy the skill folder into your assistant’s supported skill directory, or paste its instructions into a conversation. Replace `{HUB_URL}`, `{CURRICULUM_PATH}` and `{TIMEZONE}`. No helper is automatically installed. Helpers read the course; they cannot silently access or update browser-local progress. Share only what you choose.
4. **Optional weekly task.** If your assistant supports schedules, ask it to run the weekly-digest instructions at your chosen time. Nothing in this repository installs a schedule. Review the digest yourself, then save a Signal desk card manually.
5. **Starter.** Run `node starter/check-course.mjs`, open week 1, choose a fictional project and save your first note. No API key is needed. Run `npm test` for the persistence checks.

## What works without a server

Today, Journey, saved task completion, exercise drafts and dated attempts, Library notes and custom links, Writing and Markdown export, Signal desk cards, reflections, Settings and JSON backup export all run locally.

Automatic AI scoring and automatic headline fetching are intentionally absent. Exercises provide tutor and review prompts for your preferred assistant; Signal desk links to original sources. Never embed an API key in a static website. A server-side evaluator would be a separate extension with its own authentication, secret storage and costs.

## Make your own track

Edit [`hub/curriculum.js`](hub/curriculum.js), following [the content guide](docs/make-your-own-track.md). All learner-facing course material and interface copy live there. Navigation IDs and storage keys are application contracts; keep them stable. Review time/week-specific interface copy if changing the track length. New content requires a rebuild before static hosting.

## Privacy

See [what is stored where](docs/privacy.md). A shared browser profile is shared access, not an authenticated private account. Clearing site data or changing origin does not preserve your progress. Export your work before moving. Backup import is not included.

## Licenses

Code, helper instructions and starter scripts: [MIT](LICENSE). Course material, interface copy, artwork and docs: [CC BY 4.0](LICENSE-CONTENT). External readings remain their authors’ work; only links and short descriptions are included.

> Based on Codex Learning: AI Fieldnotes by Shivank Shridhar (https://github.com/tandava-1/chatgpt-learning-fieldnotes), CC BY 4.0.
