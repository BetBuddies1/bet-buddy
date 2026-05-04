# Bet Buddy

Bet Buddy ist ein lokales Partyspiel für 4, 6 oder 8 Personen. Teams treten in Bietrunden gegeneinander an und wetten darauf, wie gut ihre Buddies Challenges meistern.

## Sicherheitsmodell

Diese App ist als statische GitHub-Pages-PWA konzipiert:

- kein Backend
- keine Accounts
- keine Passwörter
- keine API-Keys
- keine Analytics
- keine externen Skripte oder Fonts
- keine externen Netzwerkrequests zur Laufzeit

Die verbindliche Sicherheitsreferenz ist `docs/SECURITY-SSOT.md`.

## Entwicklung

```bash
npm install
npm run dev
```

## Checks

```bash
npm run typecheck
npm test
npm audit --audit-level=high
npm run security:check
npm run build
```

## Deployment

Production läuft später über GitHub Pages und GitHub Actions. Das Repository wird erst gepusht, wenn der MVP lokal spielbar und sicher verifiziert ist.
