# SOC Commander

A browser-based, fictional Security Operations Centre analyst game. Defend Northstar Industries across three shifts by reviewing incoming alerts, investigating evidence, and selecting an appropriate primary response.

## Play locally

No dependencies, API keys, build tools or backend are required. From the repository root:

```sh
python -m http.server 8000
```

Open http://localhost:8000. Alternatively, serve the repository as a static website on GitHub Pages or another static hosting provider. For GitHub Pages, select the main branch and root folder in repository Settings > Pages.

## Gameplay

- 21 hand-written incidents across identity, endpoint, network and email security.
- Three difficulty levels (Recruit, Analyst and Commander), with seeded incident order and different response windows.
- Three shifts of seven cases each; new alerts appear as simulated time advances.
- Evidence review costs one simulated minute. Responses cost two minutes.
- Five response types: block source IP, isolate host, revoke access, quarantine email and close as benign.
- Security integrity and business continuity are separate, so inappropriate containment has consequences.
- Correct responses, evidence review and consecutive successes earn XP. Missing deadlines and wrong responses incur penalties.
- Analyst notes, simulated firewall blocklist, activity feed, shift debriefs and final campaign rank.
- Automatic browser-local saves and responsive layouts.

Time is turn-based, so reading an alert or taking a break does not penalise the player. A campaign is lost when security integrity or business continuity reaches zero. A campaign ends after completing all three shifts if both remain above zero.

## Tests

With Node.js 20 or later:

```sh
node test.js
node --check engine.js
node --check app.js
```

The regression suite runs 300 seeded full campaigns across all difficulties, checks incorrect responses, expiry, invalid actions, note limits, loss conditions and the firewall blocklist. It also exercises the application using a minimal mocked DOM and storage implementation. These checks are not a replacement for real browser or accessibility testing.

## Project layout

- `index.html`: welcome screen, dashboard, dialogs and semantic page structure
- `style.css`: responsive console styling
- `engine.js`: scenarios and deterministic game mechanics
- `app.js`: interface, interaction handling and local persistence
- `test.js`: dependency-free regression and smoke tests

## Simulation boundary

All incidents and company assets are fictional. External-looking IP addresses are reserved documentation addresses from RFC 5737. Blocking, isolation, credential revocation and email quarantine affect only game state. The application never scans, contacts or modifies real hosts, firewalls or accounts. Progress is stored locally, not synchronised to a server. Client-side scores are not suitable for competitive or accredited assessment.
