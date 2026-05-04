# Security SSOT

Single Source of Truth für die Sicherheitsleitplanken von Bet Buddy.

Version: 2.3  
Datum: 2026-05-04  
Zielplattform: GitHub Pages  
App-Typ: Statische React/TypeScript-PWA ohne Backend

---

## 1. Sicherheitsziel

Bet Buddy wird für Freunde und Familie gebaut. Die App muss deshalb so wenig Angriffsfläche wie möglich bieten.

Das zentrale Sicherheitsprinzip lautet:

> Die App ist statisch, offlinefähig, datenarm und ohne externe Kommunikation.

Das bedeutet:

- Kein Backend.
- Keine Datenbank.
- Keine Benutzerkonten.
- Keine Passwörter.
- Keine API-Keys.
- Keine Tokens.
- Keine Analytics.
- Keine Werbung.
- Keine externen Skripte.
- Keine externen Fonts.
- Keine Cloud-Services innerhalb der App.
- Keine Netzwerkrequests aus der laufenden App.

Alles, was im Browser ausgeliefert wird, ist grundsätzlich einsehbar. Deshalb dürfen niemals Geheimnisse oder sensible Daten im Repository, im Build oder in der ausgelieferten App enthalten sein.

**Dieses Dokument ist die verbindliche Referenz (Single Source of Truth) für alle Sicherheitsentscheidungen.** Falls andere Projektdokumente (z.B. das Konzeptpapier) abweichende Sicherheitsvorgaben enthalten, gilt dieses Dokument.

---

## 2. Relevante Standards und Quellen

Diese Sicherheitsleitplanken orientieren sich an:

- NIST SP 800-218 Secure Software Development Framework (SSDF): https://csrc.nist.gov/pubs/sp/800/218/final
- NIST Cybersecurity Framework 2.0: https://www.nist.gov/cyberframework
- OWASP Application Security Verification Standard (ASVS): https://owasp.org/www-project-application-security-verification-standard/
- OWASP Top 10 (2025): https://owasp.org/Top10/
- OWASP Content Security Policy Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- OWASP Cross Site Scripting Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP NPM Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html
- BSI IT-Grundschutz, Webanwendungen und Webservices APP.3.1: https://www.bsi.bund.de/
- GitHub Pages HTTPS documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- GitHub Actions Security Hardening: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions

Für dieses Projekt ist kein vollständiges Enterprise-Compliance-Programm nötig. Wir verwenden die Standards als praktische Sicherheitsbaseline für eine private, statische Web-App.

---

## 3. Architekturentscheidungen

### 3.1 Erlaubt

- React + TypeScript.
- Vite Production Build.
- GitHub Pages mit HTTPS.
- Lokale statische Assets aus dem Repository.
- Lokale Platzhalter-Sounds.
- PWA Manifest.
- Service Worker für lokale App-Dateien.
- Screen Wake Lock API (hält Bildschirm während Challenge wach, erfordert keine Nutzer-Permission).
- Spielzustand im Arbeitsspeicher.

### 3.2 Nicht erlaubt

- Backend/API.
- Firebase, Supabase oder andere Backend-as-a-Service-Anbieter.
- Externe HTTP-Requests zur Laufzeit.
- CDN-Skripte.
- Google Fonts oder andere externe Fonts.
- Analytics-Tools.
- Werbenetzwerke.
- Remote-Konfiguration.
- Runtime Feature Flags von externen Diensten.
- Speicherung sensibler Informationen in Browser Storage.
- Push-Notifications.
- Background Sync.
- Zugriff auf Geräte-APIs (Kamera, Mikrofon, Geolocation, Bluetooth, USB).

---

## 4. Daten und Privatsphäre

Bet Buddy verarbeitet nur lokale Spielinformationen:

- Spielernamen.
- Teamzuordnung.
- Punktestand.
- aktuelle Runde.
- aktuelle Frage.
- aktuelle Gebote.

Diese Daten bleiben standardmäßig nur im Arbeitsspeicher und werden beim Neuladen der App verworfen.

### Regeln

- Kein Tracking.
- Keine Telemetrie.
- Keine IP-Auswertung durch die App.
- Keine persistente Speicherung von Spielernamen, sofern nicht später explizit beschlossen.
- Falls später lokale Speicherung gewünscht ist, müssen alle Werte aus `localStorage`, `sessionStorage` oder IndexedDB als untrusted input behandelt werden.
- Keine sensiblen Daten in `localStorage`, `sessionStorage` oder IndexedDB.

### 4.1 Input-Validierung

Alle Benutzereingaben müssen validiert werden, bevor sie im State gespeichert oder gerendert werden.

**Spielernamen:**

- Maximale Länge: 20 Zeichen.
- Erlaubte Zeichen: Unicode-Buchstaben, Zahlen, Leerzeichen, Bindestriche, Unterstriche.
- Leere oder rein aus Whitespace bestehende Namen sind nicht erlaubt.
- Trim vor Speicherung (führende/abschließende Whitespace entfernen).

**Benutzerdefinierte Fragen (Post-MVP):**

- Maximale Länge: 200 Zeichen.
- Nur Plaintext. Kein HTML, kein Markdown.
- Werden ausschließlich als Textknoten gerendert, niemals als HTML.
- Numerische Eingaben (Zeitlimit, Mindestgebot) müssen als Zahlen geparst und auf gültige Bereiche geprüft werden (z.B. Zeitlimit 10–120 Sekunden, Mindestgebot 1–100).

**Allgemeine Regeln:**

- Kein User-Input wird jemals als Objekt-Key verwendet, um Prototype-Pollution zu verhindern.
- Alle State-Updates verwenden Zustand-Actions mit festen, vordefinierten Keys.
- Keine dynamische Eigenschaftszuweisung mit benutzerkontrollierten Schlüsseln (kein `obj[userInput] = value`).

---

## 5. XSS- und Injection-Schutz

React rendert Text standardmäßig escaped. Diese Schutzwirkung darf nicht umgangen werden.

### Verbotene Patterns

Im Production-Code verboten:

- `dangerouslySetInnerHTML`
- `innerHTML`
- `outerHTML`
- `insertAdjacentHTML`
- `document.write`
- `eval`
- `new Function`
- `setTimeout("...")`
- `setInterval("...")`
- String-basierte Eventhandler wie `setAttribute("onclick", "...")`
- `window.open` mit dynamischen, benutzerkontrollierten URLs
- Template Literals mit benutzerkontrollierten Inhalten in `href` oder `src` Attributen

### Rendering-Regeln

- Spielernamen werden nur als Text gerendert (JSX `{playerName}`, niemals `dangerouslySetInnerHTML`).
- Fragen werden nur als strukturierte Daten gerendert, nicht als HTML.
- Eigene Fragen dürfen später ebenfalls nur als Text gerendert werden.
- Keine Markdown-/HTML-Renderer ohne explizite Sicherheitsprüfung.
- Keine dynamischen `javascript:`- oder `data:`-URLs.
- Keine dynamisch konstruierten `blob:`-URLs mit benutzerkontrolliertem Inhalt.

---

## 6. Content Security Policy

GitHub Pages erlaubt keine frei konfigurierbaren HTTP Security Headers. Deshalb wird eine CSP per Meta-Tag in `index.html` gesetzt.

Die CSP muss vor allen Skripten im Dokument stehen, idealerweise als erstes Element im `<head>`.

### 6.1 Empfohlene Baseline

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  script-src 'self';
  style-src 'self';
  img-src 'self';
  media-src 'self';
  font-src 'self';
  manifest-src 'self';
  worker-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'none';
">
```

### 6.2 Regeln

- `connect-src 'self'` ist Pflicht. Erlaubt ausschließlich Same-Origin-Requests und blockiert alle externen Netzwerk-Requests. `'self'` statt `'none'` ist nötig, weil `workbox-window` (Teil von `vite-plugin-pwa`) aus dem Dokument-Kontext einen `fetch()`-Aufruf zum Service-Worker-Script macht, um nach Updates zu prüfen. `connect-src 'none'` würde diesen Update-Check blockieren. Hinweis zur CSP-Scoping-Mechanik: Die Meta-Tag-CSP gilt nur für den Dokument-Kontext, nicht für den Service-Worker-Kontext (`ServiceWorkerGlobalScope`). Der SW-Precache in der Install-Phase ist daher von `connect-src` nicht betroffen – aber der clientseitige Update-Check schon.
- `script-src 'self'` ist Pflicht. Keine externen Script-Sources.
- `default-src 'none'` als restriktive Baseline. Jede erlaubte Quelle wird explizit aufgeführt.
- `font-src 'self'` für lokal eingebettete Fonts (z.B. Fredoka).
- Kein `unsafe-eval`.
- Kein `unsafe-inline` in `script-src` – unter keinen Umständen.
- `form-action 'none'` – keine Form-Submits.
- `object-src 'none'` – keine Plugin-/Object-Inhalte.

### 6.3 `style-src` und Tailwind CSS v4

Tailwind CSS v4 kompiliert im Vite-Production-Build zu einer statischen CSS-Datei. Daher ist `style-src 'self'` ausreichend und `unsafe-inline` nicht erforderlich.

Falls sich herausstellt, dass der Build-Prozess inline `<style>`-Tags generiert, die nicht eliminiert werden können:

1. Zuerst prüfen, ob eine Vite/Tailwind-Konfiguration das Problem löst.
2. Falls nicht lösbar: `style-src 'self' 'unsafe-inline'` nur für `style-src` erlauben.
3. Diese Ausnahme muss in diesem Dokument dokumentiert werden mit Begründung.
4. `unsafe-inline` darf niemals für `script-src` verwendet werden.

### 6.4 Bekannte Einschränkungen von CSP per Meta-Tag

Die folgenden Direktiven funktionieren **nicht** in CSP-Meta-Tags und erfordern HTTP-Header:

- `frame-ancestors` (Clickjacking-Schutz) – **nicht verfügbar auf GitHub Pages**.
- `report-uri` / `report-to` (CSP-Violation-Reporting) – nicht verfügbar.

Da GitHub Pages keine benutzerdefinierten HTTP-Header erlaubt, können diese Direktiven nicht gesetzt werden. Dies ist eine akzeptierte Einschränkung des Hostings. Falls Clickjacking-Schutz kritisch wird, muss auf ein Hosting mit Header-Kontrolle (Netlify, Cloudflare Pages, Vercel) gewechselt werden.

---

## 7. Zusätzliche Security-Meta-Tags

Neben der CSP können einige weitere Sicherheitsinformationen per Meta-Tag gesetzt werden.

### 7.1 Referrer-Policy

```html
<meta name="referrer" content="no-referrer">
```

Verhindert, dass der Browser bei Navigation zu externen Seiten (z.B. wenn ein Nutzer einen Link kopiert und woanders einfügt) die Bet-Buddy-URL als Referrer mitsendet. Obwohl die App keine externen Links enthält, ist dies eine Defense-in-Depth-Maßnahme.

**Hinweis:** Die korrekte Syntax ist `<meta name="referrer">`, nicht `<meta http-equiv="Referrer-Policy">`.

### 7.2 Nicht per Meta-Tag setzbare Header

Die folgenden Security-Header funktionieren **nur als HTTP-Header** und können auf GitHub Pages **nicht gesetzt** werden:

| Header | Zweck | Status |
|---|---|---|
| `X-Content-Type-Options: nosniff` | MIME-Sniffing verhindern | Nur als HTTP-Header. Nicht durch uns setzbar auf GitHub Pages. |
| `X-Frame-Options: DENY` | Clickjacking verhindern | Nur als HTTP-Header. Nicht setzbar (siehe auch CSP `frame-ancestors`). |
| `Permissions-Policy` | Browser-APIs deaktivieren | Nur als HTTP-Header. Keine Browserunterstützung als Meta-Tag. |
| `Strict-Transport-Security (HSTS)` | HTTPS erzwingen | Nur als HTTP-Header. GitHub Pages setzt HSTS automatisch. |

**Risikobewertung:** GitHub Pages erlaubt keine benutzerdefinierten HTTP-Header. HSTS wird von GitHub automatisch gesetzt. Für die übrigen Header (`X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`) besteht keine Kontrollmöglichkeit auf GitHub Pages. Dies ist ein akzeptiertes Restrisiko, da die App keine sensiblen Daten verarbeitet, keine authentifizierten Sessions hat und keine externen Ressourcen einbindet. Falls sich das ändert, muss auf ein Hosting mit Header-Kontrolle (Netlify, Cloudflare Pages, Vercel) gewechselt werden.

---

## 8. GitHub Pages Sicherheit

### GitHub Pages wird verwendet

- Repository kann für GitHub Pages mit GitHub Free öffentlich sein.
- Die veröffentlichte Website ist öffentlich erreichbar.
- GitHub Pages unterstützt HTTPS und HTTPS-Erzwingung.

### Regeln

- HTTPS in GitHub Pages erzwingen.
- Keine sensiblen Informationen im Repository.
- Keine Secrets in GitHub Actions Logs.
- Keine `.env`-Dateien committen.
- Keine Tokens oder API-Keys in `VITE_*` Variablen.
- Production-Build ohne Source Maps.
- Keine externen Assets über `http://`.
- Keine Wildcard-DNS-Konfiguration, falls später eine Custom Domain genutzt wird.
- `.nojekyll`-Datei im Repository committen (verhindert Jekyll-Verarbeitung durch GitHub Pages, die unbeabsichtigt Dateien exponieren oder ignorieren könnte).

Wichtig: Ein privates Repository macht eine öffentlich erreichbare Browser-App nicht geheim. Ausgeliefertes HTML, CSS und JavaScript kann im Browser analysiert werden.

---

## 9. Dependencies und Supply Chain

Dependencies sind ein wesentliches Risiko für eine statische App. Deshalb gilt: so wenige Abhängigkeiten wie möglich.

### Erlaubter MVP-Stack

- React.
- React DOM.
- TypeScript.
- Vite.
- Tailwind CSS.
- Zustand.
- Howler.js.
- Lucide React.
- vite-plugin-pwa.
- Testtools wie Vitest.


### Regeln

- `package-lock.json` wird committed.
- CI nutzt `npm ci`, nicht `npm install`.
- Keine unnötigen Dependencies.
- Keine Libraries, die `eval` oder `unsafe-eval` benötigen.
- Keine CDN-Dependencies.
- Keine Dependency wird nur für triviale Hilfsfunktionen eingebaut.
- Dependabot Alerts aktivieren.
- Vor Deployment `npm audit --audit-level=high` ausführen.
- High/Critical Findings blockieren Production, bis sie bewertet oder behoben sind.

### 9.1 Supply Chain Hardening

- `.npmrc` im Projektverzeichnis mit `ignore-scripts=true` committen. Dies verhindert die automatische Ausführung von `preinstall`/`postinstall`-Skripten bei `npm install`/`npm ci`. Keines der erlaubten Dependencies benötigt Lifecycle-Scripts.
- Keine Verwendung von `latest`-Tags in `package.json`. Nur `^`-Ranges mit gepinntem Lockfile.
- Bei Major-Version-Updates: mindestens 1 Woche Cooldown-Periode abwarten, bevor die neue Version übernommen wird.
- Lockfile-Integrität: `package-lock.json` muss SHA-512-Hashes enthalten (Standard bei npm v7+). Änderungen am Lockfile in Pull Requests bewusst reviewen.
- Neue Dependencies dürfen nur hinzugefügt werden, wenn sie in diesem Dokument (Sektion 9, Erlaubter Stack) aufgenommen werden. Jede Erweiterung erfordert eine dokumentierte Sicherheitsbewertung.

---

## 10. Service Worker und PWA

Service Worker sind privilegiert und müssen eng begrenzt bleiben.

### Regeln

- Service Worker cached nur lokale App-Dateien (HTML, CSS, JS, Sounds, Bilder, Manifest).
- Keine Drittanbieter-URLs im Cache.
- Keine dynamischen Netzwerkstrategien für externe Requests.
- Update-Verhalten testen, damit Nutzer nach Deployment eine neue Version erhalten.
- Keine sensiblen Daten im Cache.
- PWA Manifest fordert keine unnötigen Permissions an.
- Keine Push-Notifications (`push`-Event nicht registrieren).
- Keine Background Sync (`sync`-Event nicht registrieren).
- `vite-plugin-pwa` Konfiguration: `workbox.navigateFallback` nur auf `index.html` setzen.
- Service Worker Scope wird automatisch durch Vite `base`-Konfiguration bestimmt. Für GitHub Pages mit Subdirectory (z.B. `/bet-buddy/`) muss `base: '/bet-buddy/'` in `vite.config.ts` gesetzt werden, womit der Service Worker Scope korrekt auf diesen Pfad eingeschränkt wird.
- Cache-Versionierung: `vite-plugin-pwa` verwendet Content-Hashes für die Precache-Manifest-Einträge. Bei jedem Build werden veraltete Cache-Einträge automatisch invalidiert.

---

## 11. Tests und Security Gates

Vor Production muss die Pipeline mindestens diese Schritte ausführen:

```bash
npm ci
npm run typecheck
npm test
npm audit --audit-level=high
npm run build
```

**Reihenfolge bewusst gewählt:** `npm audit` läuft vor `npm run build`, damit ein kompromittierter Dependency-Baum erkannt wird, bevor er in den Build einfließt.

**Wichtig:** `npm audit` wird **ohne** `--omit=dev` ausgeführt. DevDependencies (Vite, Tailwind, Plugins) laufen während des Builds und können den Build-Output manipulieren. Eine kompromittierte devDependency ist ein vollwertiger Supply-Chain-Angriffsvektor.

### 11.1 Security Pattern Check

Zusätzlich soll ein automatisierter Security Pattern Check verbotene APIs im `src/`-Verzeichnis blockieren. Der Check sucht nach folgenden Patterns:

- `dangerouslySetInnerHTML`
- `innerHTML`
- `outerHTML`
- `insertAdjacentHTML`
- `document.write`
- `eval(`
- `new Function(`
- `setTimeout("`
- `setInterval("`
- `http://`
- `window.open`

**Implementierung als CI-Schritt:**

```bash
#!/bin/bash
# scripts/security-check.sh
set -euo pipefail

FORBIDDEN_PATTERNS=(
  'dangerouslySetInnerHTML'
  'innerHTML'
  'outerHTML'
  'insertAdjacentHTML'
  'document\.write'
  'eval('
  'new Function'
  'setTimeout("'
  'setInterval("'
  'http://'
  'window\.open'
)

EXIT_CODE=0
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if grep -rn --include='*.ts' --include='*.tsx' "$pattern" src/; then
    echo "SECURITY: Forbidden pattern found: $pattern"
    EXIT_CODE=1
  fi
done

exit $EXIT_CODE
```

Ein Deployment auf GitHub Pages darf nur erfolgen, wenn alle Checks erfolgreich sind oder ein Finding dokumentiert und bewusst akzeptiert wurde.

### 11.2 CSP-Validierung

Nach dem Build prüfen, dass die CSP im generierten `dist/index.html` vorhanden ist und die folgenden Pflicht-Direktiven enthält:

- `default-src 'none'`
- `script-src 'self'`
- `connect-src 'self'`
- `object-src 'none'`
- `form-action 'none'`

---

## 12. Production Build

### Regeln

- Source Maps in Production deaktivieren: `build.sourcemap: false` in `vite.config.ts` explizit setzen.
- Build-Artefakte werden reproduzierbar aus `package-lock.json` gebaut.
- Keine Debug-Ausgaben mit sensiblen Daten.
- Keine Testdaten mit echten persönlichen Informationen.
- Keine versteckten Admin-/Debug-Screens.
- Keine ungenutzten experimentellen APIs.
- Console-Statements im Production Build entfernen. Vites Standard-Minifier esbuild unterstützt dies nativ über die `esbuild.drop`-Option – keine zusätzliche Dependency nötig:

```typescript
// vite.config.ts (relevanter Ausschnitt)
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
```

**Hinweis:** Die `esbuild.drop`-Option ist Mode-abhängig konfiguriert, damit `console.log` im Development weiterhin funktioniert.

---

## 13. GitHub Actions Härtung

Der CI/CD-Workflow muss gegen Supply-Chain-Angriffe auf die Pipeline selbst gehärtet werden.

### Regeln

- Alle GitHub Actions per vollständigem SHA-Hash pinnen, nicht per Tag:

```yaml
# NICHT ERLAUBT:
- uses: actions/checkout@v4

# ERLAUBT:
- uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.2.2
```

- `permissions` auf Job-Ebene auf das absolute Minimum einschränken.
- Keine Secrets in Log-Ausgaben. Falls ein Secret in Logs auftaucht: sofort rotieren und Workflow-Logs löschen.
- Keine `pull_request_target`-Trigger, die Code aus Forks auschecken und ausführen.

### 13.1 Gehärtete Workflow-Vorlage

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions: {}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.2.2
      - uses: actions/setup-node@1d0ff469b7ec7b3cb9d8673fde0c81c44821de2a # v4.2.0
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm audit --audit-level=high
      - run: bash scripts/security-check.sh
      - run: npm run build
      - uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3.0.1
        with:
          path: dist
      - uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e # v4.0.5
```

**Hinweis:** Die SHA-Hashes sind Beispielwerte und müssen bei der Implementierung gegen die aktuellen Commit-Hashes der gewünschten Versionen geprüft werden. Dependabot kann so konfiguriert werden, dass er auch GitHub Actions SHA-Pins automatisch aktualisiert.

---

## 14. Betrieb und Wartung

Auch eine private Party-App braucht minimale Wartung.

### Monatlich oder vor einem Spieleabend

- GitHub Dependabot Alerts prüfen.
- `npm audit --audit-level=high` lokal oder in CI prüfen.
- App einmal auf Smartphone testen.
- GitHub Actions Deploymentstatus prüfen.

### Bei Sicherheitsmeldung

- Betroffene Dependency identifizieren.
- Risiko bewerten: Betrifft die Vulnerability eine Runtime-Dependency oder nur ein Dev-Tool?
- Update testen.
- Neu deployen.
- Falls die App kompromittiert wirken sollte: GitHub Pages vorübergehend deaktivieren.

---

## 15. Entscheidungen für den MVP

Diese Entscheidungen sind für Version 1 verbindlich:

- Spieleranzahl: 4, 6 oder 8.
- Teams: manuell gesetzt und manuell änderbar.
- Teamgröße: 2 Personen.
- Bietrunde: alle Teams bieten gegeneinander.
- Challenge-Team: das letzte nicht passende Team.
- Erfolg: Challenge-Team bekommt 1 Punkt.
- Scheitern: alle anderen Teams bekommen 1 Punkt.
- Sounds: lokale Platzhalter.
- Fragen: gemischt, als statische lokale Daten.
- Hosting: GitHub Pages.
- Security-Priorität: maximale Reduktion der Angriffsfläche.

---

## 16. Definition of Done für Security

Eine Version darf als production-ready gelten, wenn:

- Keine Secrets im Repository enthalten sind.
- Die App keine Runtime-Netzwerkrequests macht.
- CSP mit `default-src 'none'` gesetzt ist.
- CSP `connect-src 'self'` und `script-src 'self'` enthält.
- HTTPS auf GitHub Pages aktiv ist.
- Production Source Maps deaktiviert sind (`build.sourcemap: false`).
- Console-Statements im Production Build entfernt werden.
- Tests erfolgreich laufen.
- Build erfolgreich läuft.
- `npm audit --audit-level=high` keine blockierenden Findings zeigt (inkl. devDependencies).
- Der Security Pattern Check (Sektion 11.1) keine verbotenen Patterns findet.
- Verbotene XSS-/Eval-Patterns nicht vorkommen.
- Service Worker nur lokale Assets cached.
- Die App auf mindestens einem Desktop-Browser und einem Smartphone getestet wurde.
- Referrer-Policy Meta-Tag gesetzt ist.
- `.nojekyll`-Datei committed ist.
- `.npmrc` mit `ignore-scripts=true` committed ist.
- GitHub Actions per SHA gepinnt sind.
- Spielernamen-Input validiert wird (max. 20 Zeichen, Allowlist).

---

## 17. Incident Response (Minimal)

Für eine private App ist kein formelles Incident-Response-Programm nötig. Trotzdem sollten die folgenden Szenarien durchdacht sein:

### Kompromittierte Dependency

1. Dependabot-Alert oder `npm audit`-Finding bewerten.
2. Prüfen, ob die Vulnerability die Runtime betrifft oder nur Dev-Tooling.
3. Falls Runtime betroffen: Dependency updaten, testen, neu deployen.
4. Falls kein Fix verfügbar: Risiko dokumentieren und ggf. App vorübergehend offline nehmen.

### Verdacht auf XSS oder Code-Injection

1. Build-Output (`dist/`) manuell inspizieren.
2. Prüfen, ob verbotene Patterns (Sektion 5) eingeführt wurden.
3. Git-History auf verdächtige Commits prüfen.
4. Falls bestätigt: Betroffenen Commit reverten, neu deployen.

### Notfall: App offline nehmen

1. GitHub Pages in den Repository-Settings deaktivieren.
2. Oder: leere `index.html` deployen mit Wartungshinweis.

---

## 18. Änderungen an diesem Dokument

Dieses Dokument ist verbindlich. Wenn später Features hinzukommen, die gegen eine Leitplanke verstoßen könnten, muss zuerst dieses Dokument aktualisiert und die Sicherheitsentscheidung bewusst getroffen werden.

Beispiele:

- Eigene Fragen persistent speichern.
- Sharing-Funktionen.
- Online-Multiplayer.
- Backend.
- Analytics.
- Custom Domain.
- Externe Assets.
- Neue Runtime-Dependencies.

Jede Ausnahme muss dokumentiert werden mit:

- Grund.
- Risiko.
- Alternative.
- Gewählte Mitigation.

---

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-05-04 | Initiale Version. |
| 2.0 | 2026-05-04 | Security-Review durch Application Security Architect. CSP verschärft (`default-src 'none'`). Input-Validierung. Meta-Tag-Limitierungen dokumentiert. Supply-Chain-Hardening. GitHub Actions SHA-Pinning. Security Pattern Check. Incident Response. |
| 2.1 | 2026-05-04 | Terser durch native esbuild `drop`-Option ersetzt. `--omit=dev` aus `npm audit` entfernt – devDependencies sind ein Build-Zeit-Angriffsvektor. `connect-src` wurde fälschlicherweise auf `'self'` geändert (Fehlanalyse: CSP Meta-Tag-Scope wurde mit Service Worker-Scope verwechselt). |
| 2.2 | 2026-05-04 | `connect-src` zurück auf `'none'` revertiert (voreilig). Analyse: SW-Precache wird durch Meta-Tag-CSP nicht beeinflusst. Screen Wake Lock API aufgenommen. |
| 2.3 | 2026-05-04 | `connect-src` endgültig auf `'self'` festgelegt. Vollständige Drei-Ebenen-Analyse: (1) SW-Registration: gesteuert durch `worker-src`, nicht `connect-src`. (2) SW-Precache (Install-Phase): läuft im SW-Kontext, Meta-Tag-CSP irrelevant. (3) SW-Update-Check via `workbox-window`: läuft im **Dokument-Kontext** via `fetch()` – wird durch `connect-src 'none'` blockiert. Daher `'self'` erforderlich. Playwright-Ausnahme für `ignore-scripts` dokumentiert. SSOT-Autoritätsklausel in Sektion 1 ergänzt. |
