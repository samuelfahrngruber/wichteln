# Wichteln

A Secret Santa app for friends and family. Built with Vite+, without a frontend framework.

- Add participants by name. Use a surname or nickname to distinguish people with the same name.
- Exclusions apply in one direction. Use “Add both directions” for couples.
- German is the default. Switch languages with the 🇦🇹 and 🇬🇧 buttons.
- The design follows your device’s light or dark mode.
- Create a link to a game with one card per participant.
- Select a card to reveal its recipient. Select it again to hide it.
- Only one card can be revealed at a time.
- The URL fragment holds versioned, base64url-encoded JSON: participants, exclusions, seed, and final assignments.
- Each person gives and receives exactly one gift. Nobody draws themselves.
- Impossible exclusions show an error.
- There is no backend or local storage. Save the generated link to keep the game.
- Reopening the same link must always show the same assignments.
- URL encoding hides plain text. It does not encrypt the game.

## Installation

Install [Vite+](https://viteplus.dev/guide/). On Linux or macOS:

```sh
curl -fsSL https://vite.plus | bash
```

Open a new terminal, then run:

```sh
git clone https://github.com/samuelfahrngruber/wichteln.git
cd wichteln
vp install
vp dev
```

Open the local URL printed by `vp dev`.

## Commands

- `vp install` installs dependencies.
- `vp dev` starts the dev server.
- `vp check` checks formatting, lint, and types.
- `vp test` tests assignment rules and saved links.
- `vp exec playwright install chromium` installs the test browser once.
- `vp run test:e2e` runs Chromium end-to-end tests. The dev server starts automatically.
- `vp build` builds the app in `dist`.
- `vp preview` previews the build.

This app was developed with AI assistance.
The project uses the [MIT license](LICENSE).

Pushes to `main` deploy to GitHub Pages through GitHub Actions.
