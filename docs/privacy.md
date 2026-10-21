# Privacy and storage

| Data | Location | Who can see it |
| --- | --- | --- |
| Course, interface and artwork | Public repository/static host | Anyone |
| Tasks, notes, reflections, resources, drafts, exercise attempts and settings | `localStorage`, key `fieldnotes.learning.v1`, on the current origin/browser profile | Anyone with access to that profile; scripts served on that origin |
| JSON and Markdown exports | Your downloads folder | Anyone with access to those files or anyone you share them with |
| Tutor conversation | Only an external assistant you choose to paste into | Subject to that provider’s privacy policy |
| API keys | Nowhere in this app | This edition never asks for or stores them |
| Basic page requests | Your chosen static hosting provider | Subject to its logging policies |
| Font requests | Google Fonts | Google receives ordinary font-request metadata; see below |

There is no application server, sign-in, analytics SDK, shared progress database or automatic AI request. Different browser profiles/devices have separate progress. Two tabs in the same profile share storage, but you should refresh between edits to avoid stale display state. Writes read the latest stored records before updating one item.

Browser storage is not encrypted by this app and is not an account security boundary. Host on a dedicated origin when possible: other applications on the same origin can access local storage. Do not store secrets or sensitive personal material in learning notes.

If storage is unavailable, full or malformed, the app reports an error instead of silently overwriting it. Export backups regularly. Clearing browser data can permanently remove your progress. A changed hostname, protocol or port is a different origin. This release exports but does not import backups.

The style sheet uses Google Fonts for DM Sans and Manrope. Remove its first `@import` line to use system fonts without those external requests. External resource links load only when you open them. The repository contains no owner backups, progress, deployment identifiers, API credentials or original Git history.
