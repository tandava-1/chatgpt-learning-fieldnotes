# Make your own track

The app imports `hub/curriculum.js` at build time. Change that file, run `npm test` and `npm run build`, and preview the result. No separate server or database migration is needed.

## Content exports

| Export | Shape | Purpose |
| --- | --- | --- |
| `weeks` | Array of week objects | The ordered learning track |
| `seedResources` | Array of resources | Initial bookshelf; user notes overlay these locally |
| `writingSeeds` | Array of writing objects | Starting essay ideas |
| `dayLabels` | Seven strings | Daily rhythm |
| `dayMinutes` | Seven numbers | Daily workload; zero is a rest day |
| `taskFor(week, day)` | Function returning `{title,detail,target}` | Daily tasks; day is zero-based |
| `tutorPrompt(week)` | Function returning text | Tutor conversation starter |
| `briefingPrompt` | String | Optional research prompt |
| `starterIdeas` | Three strings | Fictional project menu |
| `ui` | String dictionary | Interface labels, explanations and message templates |
| `format(template, ...values)` | Formatting helper | Replaces numbered `{0}` placeholders |
| `storageMessages` | String dictionary | Persistence errors |

`ui` keys are stable identifiers derived from the original phrases. Edit their values, not their keys. A placeholder such as `{0}` receives a runtime value; keep its number unchanged. Navigation names currently serve as routing IDs; preserve Today, Journey, Exercises, Library, Writing, Signal desk, Progress and Settings unless also updating app routing. This is content separation, not a full localization framework.

## Week fields

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | Number | Contiguous IDs starting at 1 |
| `title`, `phase`, `concepts` | Strings | Heading, grouping and concept overview |
| `question`, `followup` | Strings | Opening question and challenge |
| `exercise`, `deliverable`, `lab` | Strings | Assignment, artifact and experiment |
| `lesson` | String array | Short conceptual explanations |
| `writing` | String | Writing prompt/title |
| `resourceIds` | String array | IDs present in `seedResources` |

## Resource and writing fields

| Object | Fields |
| --- | --- |
| Resource | `id`, `title`, `url`, `type` (Article/Video/Course/Paper/Tool), `week` (0 = ongoing), `status` (Saved/In progress/Completed), `notes` |
| Writing | `id`, `title`, `text`, `week`, `status` (Idea/Drafting/Ready/Published), `url` |

Keep IDs stable after starting a track so existing local notes continue to match. For an unrelated course, use a separate origin or intentionally change the storage key after backing up. If you change the number of weeks, update writing seeds, checkpoints and week-specific interface text. The current experience assumes a seven-day rhythm with six learning tasks and a rest day. Changing that rhythm requires app changes as well as content edits.

## Draft a new track with an AI

Copy this prompt and add your subject:

> Help me draft a Fieldnotes track about [subject] for [audience] at [starting level], with [time budget]. First ask about outcomes, prior knowledge and practical constraints. Read my existing hub/curriculum.js and preserve its exported contracts. Propose the module outline and wait for agreement. Then draft one module at a time: a question, concept explanations, exercise, practical experiment, deliverable, writing prompt and reliable reading links. Never invent a reading, statistic, quotation or URL. Verify sources using browsing; if verification is unavailable, mark the reading as a candidate outside the code and leave it out of the resource list. Label fictional scenarios and hypothetical numbers clearly. Make exercises require evidence and admit uncertainty. Use generic fictional examples, never my private projects or personal information. Ask me to review each module before moving on. Finish by checking resource IDs, weekly structure, prompts and all UI text for assumptions about the old topic.

## Verify a change

Run tests and build, serve locally, and visit all eight tabs and every module. Save a note and task, reload, and verify persistence. Try a separate browser profile: it should start empty. Inspect browser errors. Confirm links and exported backups are usable. Never commit learner exports or local configuration.
