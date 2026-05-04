# Security Audit: Implementierung vs. SECURITY-SSOT v2.3

Datum: 2026-05-04  
Geprüft von: Application Security Architect (KI-gestützt)  
Referenz: `docs/SECURITY-SSOT.md` v2.3  
Ziel: Prüfung der aktuellen Codebase gegen alle 18 Sektionen der SECURITY-SSOT

---

## Zusammenfassung

| Kategorie | Ergebnis |
|---|---|
| Kritische Findings | **0** |
| Mittlere Findings | **2** |
| Niedrige Findings | **3** |
| SSOT-konforme Prüfpunkte | **14** |

Die Implementierung ist in gutem Zustand. Keine kritischen Sicherheitslücken. Alle Findings sind behebbar und nicht sicherheitskritisch.

---

## ✅ SSOT-konform (kein Handlungsbedarf)

| # | SSOT-Sektion | Prüfpunkt | Datei | Status |
|---|---|---|---|---|
| 1 | §6.1 | CSP Meta-Tag mit `default-src 'none'` als erstes Meta-Tag | `index.html:5-8` | ✅ |
| 2 | §6.2 | `connect-src 'self'` | `index.html:7` | ✅ |
| 3 | §6.2 | `script-src 'self'`, kein `unsafe-inline`/`unsafe-eval` | `index.html:7` | ✅ |
| 4 | §6.2 | `object-src 'none'`, `form-action 'none'`, `base-uri 'self'` | `index.html:7` | ✅ |
| 5 | §7.1 | Referrer-Policy: `<meta name="referrer" content="no-referrer">` | `index.html:9` | ✅ |
| 6 | §12 | `build.sourcemap: false` explizit gesetzt | `vite.config.ts:32` | ✅ |
| 7 | §12 | `esbuild.drop` für Console/Debugger, mode-abhängig | `vite.config.ts:34-36` | ✅ |
| 8 | §9.1 | `.npmrc` mit `ignore-scripts=true` | `.npmrc:1` | ✅ |
| 9 | §8 | `.nojekyll` committed | `.nojekyll` (Root) | ✅ |
| 10 | §4.1 | Input-Validierung Spielernamen (20 Zeichen, Allowlist, Trim, Tests) | `src/security/validatePlayerName.ts` | ✅ |
| 11 | §13 | GitHub Actions per SHA-Hash gepinnt (alle 4 Actions) | `.github/workflows/deploy.yml` | ✅ |
| 12 | §13 | `permissions: {}` Default + minimale Job-Permissions | `.github/workflows/deploy.yml:7,12-15` | ✅ |
| 13 | §9 | Dependabot für npm UND github-actions konfiguriert | `.github/dependabot.yml` | ✅ |
| 14 | §11.1 | Security Pattern Check mit allen 11 verbotenen Patterns | `scripts/security-check.mjs` | ✅ |

---

## ⚠️ Mittlere Findings

### M1: SSOT dokumentiert Bash-Skript, Implementierung nutzt Node.js

**Betroffene Dateien:**
- `docs/SECURITY-SSOT.md` Sektion 11.1 und 13.1
- `scripts/security-check.mjs` (tatsächliche Implementierung)
- `scripts/security-check.sh` (dokumentierte, aber nicht im Workflow genutzte Version)
- `.github/workflows/deploy.yml:26`

**Problem:** Die SSOT dokumentiert in Sektion 11.1 ein Bash-Skript (`scripts/security-check.sh`) und referenziert es in der Workflow-Vorlage (Sektion 13.1) als `bash scripts/security-check.sh`. Die tatsächliche Implementierung nutzt eine Node.js-Version (`scripts/security-check.mjs`), die über `npm run security:check` aufgerufen wird. Die Node.js-Version ist funktional äquivalent und plattformunabhängig.

**Sicherheitsauswirkung:** Keine. Reine Dokumentations-Inkonsistenz.

### M1: Implementierungsanweisung

```
AKTION: SSOT aktualisieren, um die Node.js-Implementierung als primäre Variante zu dokumentieren.

1. In `docs/SECURITY-SSOT.md`, Sektion 11.1:
   - Das Bash-Codebeispiel durch die Node.js-Variante ersetzen oder BEIDE dokumentieren.
   - Klarstellen, dass `scripts/security-check.mjs` die aktive Implementierung ist.
   - Den Verweis auf `bash scripts/security-check.sh` durch `npm run security:check` ersetzen.

2. In `docs/SECURITY-SSOT.md`, Sektion 13.1 (gehärtete Workflow-Vorlage):
   - Die Zeile `- run: bash scripts/security-check.sh` ändern zu:
     `- run: npm run security:check`

3. Optional: `scripts/security-check.sh` löschen, da sie nicht mehr genutzt wird.
   Falls sie als Fallback behalten wird, dies in der SSOT dokumentieren.

VALIDIERUNG:
- Prüfen, dass `npm run security:check` lokal erfolgreich läuft.
- Prüfen, dass die SSOT-Workflow-Vorlage mit dem tatsächlichen `deploy.yml` übereinstimmt.
```

---

### M2: CSP-Validierungsskript ist fragil bei HTML-Reformatierung

**Betroffene Datei:** `scripts/validate-csp.mjs`

**Problem:** Das Skript validiert die CSP im Build-Output (`dist/index.html`) durch exakte String-Suche (`html.includes("connect-src 'self'")`). Falls Vite oder ein Plugin den HTML-Output reformatiert (z.B. Whitespace-Normalisierung, Zeilenumbrüche), könnte die Validierung fehlschlagen oder fälschlich bestehen.

**Sicherheitsauswirkung:** Gering – falsche Sicherheit bei verändertem Build-Output theoretisch möglich.

### M2: Implementierungsanweisung

```
AKTION: CSP-Validierung robuster machen durch Whitespace-Normalisierung.

In `scripts/validate-csp.mjs`:

VORHER (Zeile 3):
  const html = readFileSync('dist/index.html', 'utf8');

NACHHER:
  const html = readFileSync('dist/index.html', 'utf8').replace(/\s+/g, ' ');

Das normalisiert alle Whitespace-Varianten (Zeilenumbrüche, Tabs, Mehrfach-Leerzeichen)
zu einem einzelnen Leerzeichen, bevor die Direktiven geprüft werden.

VALIDIERUNG:
- `npm run build` ausführen.
- Prüfen, dass `npm run security:csp` weiterhin erfolgreich läuft.
- Manuell testen: in `index.html` einen Zeilenumbruch in die CSP einfügen,
  Build ausführen, prüfen dass die Validierung trotzdem besteht.
```

---

## 📝 Niedrige Findings

### L1: `vite-plugin-pwa` als `dependency` statt `devDependency`

**Betroffene Datei:** `package.json:21`

**Problem:** `vite-plugin-pwa` ist unter `dependencies` statt `devDependencies` aufgeführt. Vite-Plugins werden nur zur Build-Zeit benötigt. Da `npm audit` ohne `--omit=dev` läuft, hat dies keine Audit-Auswirkung. Es ist ein Hygiene-Problem.

### L1: Implementierungsanweisung

```
AKTION: vite-plugin-pwa in devDependencies verschieben.

Kommandos:
  npm uninstall vite-plugin-pwa
  npm install -D vite-plugin-pwa

VALIDIERUNG:
- `npm run build` muss weiterhin erfolgreich laufen.
- `vite-plugin-pwa` steht danach unter `devDependencies` in `package.json`.
- `package-lock.json` wird automatisch aktualisiert – Änderung reviewen.
```

---

### L2: Playwright-Reste in `.gitignore`

**Betroffene Datei:** `.gitignore:8-9`

**Problem:** `.gitignore` enthält `playwright-report/` und `test-results/`, obwohl Playwright nicht als Test-Tool verwendet wird.

### L2: Implementierungsanweisung

```
AKTION: Playwright-spezifische Einträge aus .gitignore entfernen.

In `.gitignore`, die folgenden Zeilen entfernen:
  playwright-report/
  test-results/

VALIDIERUNG:
- Keine. Rein kosmetische Änderung.
```

---

### L3: Unnötiger `.env.example`-Eintrag in `.gitignore`

**Betroffene Datei:** `.gitignore:14`

**Problem:** `.gitignore` enthält `!.env.example` (Ausnahme vom `.env.*`-Pattern), obwohl die App keine Umgebungsvariablen nutzt und keine `.env.example` existiert.

### L3: Implementierungsanweisung

```
AKTION: .env-Ausnahme aus .gitignore entfernen.

In `.gitignore`, die folgende Zeile entfernen:
  !.env.example

VALIDIERUNG:
- Keine. Rein kosmetische Änderung.
```

---

## Operative Reihenfolge für die ausführende KI

Empfohlene Reihenfolge zur Behebung aller Findings:

1. **L2 + L3** – `.gitignore` aufräumen (2 Zeilen-Edits, risikolos)
2. **L1** – `vite-plugin-pwa` verschieben (`npm uninstall` + `npm install -D`)
3. **M2** – `validate-csp.mjs` robuster machen (1 Zeile ändern)
4. **M1** – SSOT-Dokumentation synchronisieren (Sektionen 11.1 und 13.1 aktualisieren)

Nach Abschluss:
- `npm run build` ausführen → muss erfolgreich sein
- `npm run security:check` ausführen → muss erfolgreich sein
- `npm run security:csp` ausführen → muss erfolgreich sein
- `npm test` ausführen → muss erfolgreich sein

---

## Gesamtbewertung

Die Implementierung setzt die SECURITY-SSOT v2.3 vorbildlich um. Alle sicherheitskritischen Leitplanken (CSP, Input-Validierung, Supply-Chain-Hardening, CI-Härtung, Build-Härtung) sind korrekt implementiert. Die fünf Findings sind Hygiene- und Dokumentationspunkte ohne Sicherheitsrisiko.
