# Bet Buddy – Konzeptpapier
### Single Source of Truth | Version 1.0 | April 2026

---

## 1. Projektübersicht

**Bet Buddy** ist ein Party-Spiel für Freundesgruppen, bei dem Teams gegeneinander auf die Fähigkeiten ihrer Partner wetten. Inspiriert von "Mein Mann kann" und "Bet Buddies" verbindet es Einschätzungsvermögen, Bluff und lustige Challenges.

**Zielgruppe:** Privater Freundeskreis (5–10 Personen), keine öffentliche Veröffentlichung geplant.

**Nutzungsszenario:** Ein einzelnes Smartphone wird herumgereicht. Alle Spieler sitzen zusammen, das Gerät ist der Spielleiter.

---

## 2. Spielregeln

### 2.1 Vorbereitung

- Spieler geben ihre Namen ein (gerade Anzahl erforderlich, mindestens 4).
- Die App bildet Teams aus je 2 Personen ("Buddies").
- Spieler wählen aktive Fragekategorien aus.
- Spieler legen die Rundenzahl fest (Default: 10).

### 2.2 Rundenablauf

Jede Runde besteht aus drei Phasen:

**Phase 1 – Frage:**
Eine Frage wird angezeigt, z. B. *"Wie viele Gewürze kann dein Buddy in 30 Sekunden aufzählen?"*

**Phase 2 – Bietrunde:**
- Ein Spieler aus jedem Team bietet abwechselnd.
- Der Counter startet bei dem in der Frage definierten Mindestwert (z. B. 1).
- Spieler erhöhen den Counter durch Tippen.
- Jedes Gebot muss höher sein als das vorherige.
- Es gibt kein Maximum – Übermut wird durch das Spielprinzip bestraft.
- Ein Spieler kann jederzeit "passen" → das gegnerische Team muss die Challenge meistern.

**Phase 3 – Challenge:**
1. Ein 5-Sekunden-Vorlauf-Countdown wird angezeigt (mit Tick-Sound).
2. Der eigentliche Timer startet (Dauer variiert je nach Frage, z. B. 30 Sekunden).
3. Der Buddy des bietenden Teams führt die Aufgabe aus.
4. Ein Mitspieler tippt einen Zähl-Button, um die Leistung zu tracken.
5. Bei Ablauf des Timers ertönt ein Endsignal.

**Ergebnis:**
- Gezählter Wert ≥ Gebot → Punkt für das bietende Team.
- Gezählter Wert < Gebot → Punkt für das gegnerische Team.

### 2.3 Bieter-Reihenfolge

- In der ersten Runde beginnt ein zufällig gewähltes Team.
- Ab Runde 2 beginnt immer das Team, das die vorherige Runde **verloren** hat (Catch-up-Mechanismus).
- Bei Gleichstand in der vorherigen Runde beginnt das Team, das in der Runde davor verloren hat.

### 2.4 Spielende

- Nach der festgelegten Anzahl Runden endet das Spiel.
- Das Team mit den meisten Punkten gewinnt.
- Bei Gleichstand: unentschieden (kein Tiebreaker nötig für ein Party-Spiel).

### 2.5 Rollen während einer Runde

| Rolle | Was sie tun | Wer |
|---|---|---|
| Bieter Team A | Erhöht den Counter oder passt | Ein Spieler aus Team A |
| Bieter Team B | Erhöht den Counter oder passt | Ein Spieler aus Team B |
| Challenger | Führt die Aufgabe aus | Der Buddy des Teams, das den höchsten Wert geboten hat |
| Zähler | Tippt den Count-Button während der Challenge | Beliebiger Mitspieler (nicht der Challenger) |

---

## 3. Fragenkategorien

### 3.1 Startkategorien (MVP)

| Kategorie | Emoji | Beispielfragen |
|---|---|---|
| Allgemeinwissen | 🧠 | "Wie viele europäische Hauptstädte kann dein Buddy in 45s aufzählen?" |
| Geographie | 🌍 | "Wie viele Länder in Afrika kann dein Buddy in 30s nennen?" |
| Kreativ & Witzig | 🎭 | "Wie viele Tiergeräusche kann dein Buddy in 20s nachahmen?" |
| Körperlich | 💪 | "Wie viele Liegestütze schafft dein Buddy in 30s?" |
| Essen & Trinken | 🍕 | "Wie viele Gewürze kann dein Buddy in 30s aufzählen?" |
| Geschichte | 📜 | "Wie viele römische Kaiser kann dein Buddy in 45s nennen?" |

### 3.2 Fragenanforderungen

- Mindestens 20 Fragen pro Kategorie zum Start.
- Jede Frage hat eine definierte Zeitdauer (15s, 30s, 45s oder 60s).
- Jede Frage hat einen Mindest-Startwert für das Gebot (typisch: 1).
- Fragen werden innerhalb einer Partie nicht wiederholt.
- Fragen werden zufällig aus den aktiven Kategorien gezogen.

### 3.3 Fragen-Datenformat

```typescript
interface Question {
  id: string;                  // Eindeutige ID, z.B. "allg-001"
  text: string;                // Fragetext mit {time} als Platzhalter
  category: CategoryId;        // Kategorie-Schlüssel
  timeLimit: number;           // Sekunden für die Challenge
  type: 'count';               // Fragetyp (aktuell nur 'count')
  minBid: number;              // Mindestgebot (typisch: 1)
}
```

### 3.4 Geplante Erweiterungen (Post-MVP)

- **Interaktive Karten-Challenge:** Eine SVG-Weltkarte wird angezeigt, der Spieler muss die richtigen Länder antippen. Kein externer Kartenanbieter – offline-fähige SVG-Karte eingebettet.
- **Quiz-Modus:** Multiple-Choice-Fragen innerhalb des Zeitlimits.
- **Eigene Fragen:** Spieler können vor dem Spiel eigene Fragen hinzufügen.
- **Schätz-Fragen:** "Wie nah kommt dein Buddy an das richtige Ergebnis?" (z. B. Einwohnerzahlen).

---

## 4. Technische Architektur

### 4.1 Technologie-Entscheidung: PWA (Progressive Web App)

**Begründung:**

| Anforderung | Lösung durch PWA |
|---|---|
| Gemischte Geräte (Android + iOS) | Läuft in jedem modernen Browser |
| Keine Installation / kein Sideloading | Link öffnen → "Zum Startbildschirm" → fertig |
| Offline-Fähigkeit | Service Worker cached alle Ressourcen |
| Langlebigkeit ohne Wartung | Browser-Standards sind stabil, kein App-Store-Review |
| Minimale Angriffsfläche | Browser-Sandbox schützt das Gerät |
| Einfaches Teilen | URL verschicken |

**Bewusst verworfen:**

| Alternative | Grund der Ablehnung |
|---|---|
| Native Android (Kotlin) | iOS-Nutzer ausgeschlossen |
| React Native / Expo | Overkill für Single-Device-App, APK-Verteilung nötig |
| Flutter | Selbes Problem wie React Native, plus größere Bundle-Size |
| Vanilla HTML/JS | Kein Komponentenmodell, schwer wartbar bei wachsenden Features |

### 4.2 Tech-Stack

| Paket | Version | Zweck | Größe | Risikobewertung |
|---|---|---|---|---|
| Vite | ^6.x | Build-Tool, Dev-Server, PWA-Plugin | Dev only | Kein Runtime-Risiko |
| React | ^19.x | UI-Framework | ~40KB | Sehr niedrig (Meta maintained) |
| React-DOM | ^19.x | DOM-Rendering | Inkl. in React | Sehr niedrig |
| TypeScript | ^5.x | Typsicherheit | Dev only | Kein Runtime-Risiko |
| Tailwind CSS | ^4.x | Utility-First Styling | Dev only (purged) | Kein Runtime-Risiko |
| Zustand | ^5.x | State Management | ~1KB | Niedrig |
| Howler.js | ^2.x | Plattformübergreifender Sound | ~7KB | Niedrig |
| Lucide React | ^0.4x | Icons | ~0KB (tree-shaken) | Sehr niedrig |
| vite-plugin-pwa | ^0.x | PWA / Service Worker Generation | Dev only | Kein Runtime-Risiko |
| **Gesamt Runtime** | | | **~48KB** | |

**Bewusst nicht verwendet:**

| Paket | Grund |
|---|---|
| Framer Motion | Unnötige Dependency (~30KB). CSS-Animationen reichen und sind langlebiger. |
| Redux | Overkill. Zustand ist leichter und für unseren linearen Spielfluss ideal. |
| Leaflet / Mapbox | Externe Tile-Server = nicht offline-fähig. SVG-Karte stattdessen. |
| Firebase / Supabase | Kein Backend nötig. Jede Cloud-Dependency ist ein Wartungspunkt. |
| Analytics (Mixpanel, etc.) | Keine Datenerhebung. Privates Spiel unter Freunden. |

### 4.3 Ordnerstruktur

```
bet-buddy/
├── public/
│   ├── sounds/                    # Sound-Dateien (MP3)
│   │   ├── countdown-tick.mp3     # Countdown-Tick (5-4-3-2-1)
│   │   ├── challenge-start.mp3    # Spannungsgeladener Start-Sound
│   │   ├── time-up.mp3            # Buzzer / Ende-Signal
│   │   ├── point-scored.mp3       # Erfolgs-Jingle
│   │   ├── point-lost.mp3         # Misserfolgs-Sound
│   │   ├── bid-raise.mp3          # Gebot erhöht (kurzer Click/Pop)
│   │   └── game-over.mp3          # Spielende-Fanfare
│   ├── favicon.svg
│   └── manifest.json              # PWA-Manifest
│
├── src/
│   ├── components/
│   │   ├── screens/               # Ein Screen = ein Spielzustand
│   │   │   ├── StartScreen.tsx     # Titelbildschirm, Spiel starten
│   │   │   ├── PlayerSetup.tsx     # Spieler hinzufügen
│   │   │   ├── TeamReveal.tsx      # Team-Zuteilung anzeigen
│   │   │   ├── CategorySelect.tsx  # Kategorien an/aus
│   │   │   ├── GameSettings.tsx    # Rundenzahl etc.
│   │   │   ├── QuestionDisplay.tsx # Frage anzeigen
│   │   │   ├── BiddingRound.tsx    # Counter + Bieten
│   │   │   ├── ChallengePrep.tsx   # "Team X muss zeigen..." + 5s Countdown
│   │   │   ├── ChallengeTimer.tsx  # Timer + Zähl-Button
│   │   │   ├── RoundResult.tsx     # Geschafft / Nicht geschafft
│   │   │   ├── Scoreboard.tsx      # Zwischenstand
│   │   │   └── GameOver.tsx        # Endbildschirm + Gesamtsieger
│   │   │
│   │   └── ui/                    # Wiederverwendbare UI-Bausteine
│   │       ├── Button.tsx
│   │       ├── Counter.tsx         # Animierter Zähler
│   │       ├── Timer.tsx           # Kreisförmiger Countdown
│   │       ├── TeamBadge.tsx       # Team-Anzeige mit Farbe
│   │       ├── CategoryToggle.tsx  # Kategorie an/aus Switch
│   │       └── ProgressBar.tsx     # Rundenanzeige
│   │
│   ├── data/
│   │   ├── questions/
│   │   │   ├── allgemeinwissen.ts
│   │   │   ├── geographie.ts
│   │   │   ├── kreativ.ts
│   │   │   ├── koerperlich.ts
│   │   │   ├── essen-trinken.ts
│   │   │   ├── geschichte.ts
│   │   │   └── index.ts           # Exportiert alle Kategorien
│   │   └── types.ts               # TypeScript-Interfaces
│   │
│   ├── store/
│   │   └── gameStore.ts           # Zentraler Spielzustand (Zustand)
│   │
│   ├── hooks/
│   │   ├── useTimer.ts            # Countdown-Logik
│   │   ├── useSound.ts            # Sound abspielen (Howler-Wrapper)
│   │   └── useWakeLock.ts         # Bildschirm an halten während Challenge
│   │
│   ├── utils/
│   │   ├── shuffle.ts             # Fisher-Yates Shuffle
│   │   ├── teamBuilder.ts         # Teams zufällig zusammenstellen
│   │   └── questionPool.ts        # Fragen ziehen ohne Wiederholung
│   │
│   ├── App.tsx                    # Screen-Router basierend auf GamePhase
│   ├── main.tsx                   # Entry Point
│   └── index.css                  # Tailwind-Import + Custom Properties
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts                 # Vite + Tailwind + PWA Plugin
├── .gitignore
└── README.md
```

### 4.4 State Management

Ein einzelner Zustand-Store verwaltet das gesamte Spiel:

```typescript
interface GameState {
  // Meta
  phase: GamePhase;

  // Spieler & Teams
  players: Player[];
  teams: Team[];

  // Einstellungen
  totalRounds: number;
  activeCategories: CategoryId[];

  // Aktuelle Runde
  currentRound: number;
  currentQuestion: Question | null;
  usedQuestionIds: string[];

  // Bietrunde
  currentBid: number;
  biddingTeamIndex: number;
  lastBidderTeamIndex: number;
  firstBidderIndex: number;

  // Challenge
  challengeTeamIndex: number;
  challengeCount: number;

  // Historie
  roundHistory: RoundResult[];

  // Actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  buildTeams: () => void;
  toggleCategory: (id: CategoryId) => void;
  setTotalRounds: (n: number) => void;
  startGame: () => void;
  nextQuestion: () => void;
  raiseBid: () => void;
  pass: () => void;
  incrementCount: () => void;
  endChallenge: () => void;
  nextRound: () => void;
  resetGame: () => void;
}
```

### 4.5 Screen-Flow

```
StartScreen
    │
    ▼
PlayerSetup ──→ min. 4 Spieler, gerade Anzahl
    │
    ▼
TeamReveal ──→ zufällige Teamzuteilung anzeigen
    │
    ▼
CategorySelect ──→ min. 1 Kategorie aktiv
    │
    ▼
GameSettings ──→ Rundenzahl festlegen
    │
    ▼
┌─► QuestionDisplay ──→ Frage anzeigen
│       │
│       ▼
│   BiddingRound ──→ Teams bieten abwechselnd
│       │
│       ▼
│   ChallengePrep ──→ "Team X, zeigt was ihr könnt!" + 5s Countdown
│       │
│       ▼
│   ChallengeTimer ──→ Timer läuft + Zähl-Button
│       │
│       ▼
│   RoundResult ──→ Geschafft / Nicht geschafft + Punkt vergeben
│       │
│       ▼
│   Scoreboard ──→ Aktueller Punktestand
│       │
│       ▼
│       ├── Weitere Runden? ──→ zurück zu QuestionDisplay
│       │
└───────┘
        │
        ▼ (letzte Runde vorbei)
    GameOver ──→ Sieger + "Nochmal spielen?"
        │
        ▼
    StartScreen (Reset)
```

---

## 5. Sound-Konzept

### 5.1 Benötigte Sounds

| Sound | Einsatz | Charakter | Dauer |
|---|---|---|---|
| `countdown-tick` | 5-4-3-2-1 Vorlauf | Kurzer, klarer Tick | ~0.2s |
| `challenge-start` | Timer beginnt | Spannungsvoller Startton, energetisch | ~1s |
| `time-up` | Timer abgelaufen | Buzzer / Horn, deutlich hörbar | ~1.5s |
| `point-scored` | Challenge geschafft | Kurzer Erfolgs-Jingle, fröhlich | ~1.5s |
| `point-lost` | Challenge nicht geschafft | Kurzer Misserfolgs-Sound, komisch (nicht deprimierend) | ~1s |
| `bid-raise` | Gebot wird erhöht | Kurzer Pop/Click, befriedigend | ~0.1s |
| `game-over` | Spielende | Fanfare, feierlich | ~3s |

### 5.2 Sound-Quellen (CC0 / Public Domain)

Alle Sounds müssen **CC0 (Public Domain)** lizenziert sein, damit keine Attribution nötig ist und keine rechtlichen Risiken entstehen.

**Empfohlene Quellen:**

1. **Kenney.nl** (https://kenney.nl/assets/category:Audio)
   - "Interface Sounds" – 100 UI-Sounds, CC0, ideal für `bid-raise` und `countdown-tick`
   - "Digital Audio" – 60 Sounds, CC0, gut für `challenge-start` und `time-up`
   - "UI Audio" – 50 Sounds, CC0, Button-Clicks und Feedback-Sounds
   - Alle als ZIP herunterladbar, sofort einsatzbereit.

2. **Freesound.org** (https://freesound.org)
   - Größte CC-lizenzierte Sound-Datenbank weltweit.
   - **Wichtig:** Beim Download auf CC0-Lizenz filtern. CC-BY erfordert Attribution, CC-BY-NC verbietet kommerzielle Nutzung.
   - Gut für spezifische Sounds wie Buzzer oder Fanfaren.

3. **Pixabay Sound Effects** (https://pixabay.com/sound-effects/)
   - Royalty-free, keine Attribution erforderlich.
   - Gute Auswahl an Game-Sounds.

4. **OpenGameArt.org** (https://opengameart.org/content/cc0-sound-effects)
   - Kuratierte CC0-Sound-Sammlung speziell für Spiele.

**Empfehlung:** Starte mit Kenney.nl – die Packs sind kuratiert, konsistent im Stil, und als ZIP sofort nutzbar. Ergänze einzelne Sounds von Freesound.org falls nötig.

### 5.3 Technische Umsetzung

Sounds werden mit **Howler.js** abgespielt, da die native Web Audio API auf mobilen Browsern (insbesondere iOS Safari) Einschränkungen hat – Audio muss nach einer User-Interaktion freigegeben werden. Howler handhabt das automatisch.

```typescript
// hooks/useSound.ts – vereinfachtes Beispiel
import { Howl } from 'howler';

const sounds = {
  tick: new Howl({ src: ['/sounds/countdown-tick.mp3'] }),
  start: new Howl({ src: ['/sounds/challenge-start.mp3'] }),
  timeUp: new Howl({ src: ['/sounds/time-up.mp3'] }),
  // ...
};

export function useSound() {
  return {
    play: (name: keyof typeof sounds) => sounds[name].play(),
  };
}
```

### 5.4 Sound-Dateien Format

- **Format:** MP3 (universelle Browser-Kompatibilität).
- **Qualität:** 128kbps reicht für kurze Sound-Effekte.
- **Dateigröße:** Alle Sounds zusammen sollten unter 500KB bleiben.

---

## 6. Sicherheitskonzept

### 6.1 Bedrohungsmodell

Die App wird auf den privaten Geräten von Freunden installiert (als PWA). Da keine aktive Wartung stattfindet, muss die Angriffsfläche von Anfang an minimal sein.

**Kein Risiko:**
- Die App hat keinen Server → kein Backend-Hack möglich.
- Die App speichert keine persönlichen Daten → kein Datenleck möglich.
- Die App hat keine Accounts → kein Credential-Theft möglich.

**Geringes Risiko:**
- NPM Supply-Chain-Angriff über kompromittierte Dependency.
- Veraltete Browser-API die sich inkompatibel ändert (App funktioniert nicht mehr, aber kein Sicherheitsproblem).

**Mitigationen:**

| Risiko | Maßnahme |
|---|---|
| Supply-Chain (npm) | Nur 4 Runtime-Dependencies, alle >10K GitHub Stars und aktiv maintained |
| XSS | Kein User-Input wird als HTML gerendert. React escaped standardmäßig. |
| Netzwerk-Zugriff | App macht keine HTTP-Requests. Service Worker nur für lokales Caching. |
| Geräte-Zugriff | Keine Permissions angefordert (kein Kamera/Mikrofon/Kontakte/Standort). |
| Daten-Persistenz | Spielstand wird nur im Memory gehalten, nicht persistiert. |
| Veraltete Dependencies | Lock-File (package-lock.json) pinnt exakte Versionen. Build wird einmal gemacht und deployed. Danach werden keine Dependencies nachgeladen. |

### 6.2 PWA-spezifische Sicherheit

- **HTTPS ist Pflicht** für PWAs. GitHub Pages und Netlify erzwingen das automatisch.
- **Service Worker Scope:** Der Service Worker cached nur eigene Assets (HTML, JS, CSS, Sounds). Keine Drittanbieter-URLs.
- **Content Security Policy (CSP):** Wird über Meta-Tag in index.html gesetzt.

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; connect-src 'none';">
```

`connect-src 'none'` ist der Schlüssel – die App darf keine Netzwerk-Requests machen. Punkt.

### 6.3 Sicherheits-Checkliste für den Build

- [ ] `npm audit` zeigt keine high/critical Vulnerabilities
- [ ] `connect-src 'none'` ist im CSP gesetzt
- [ ] Kein `eval()`, kein `innerHTML` mit User-Input
- [ ] Keine externe Ressource wird geladen (keine CDN-Scripts, keine Web-Fonts von Google)
- [ ] Service Worker cached nur lokale Assets
- [ ] Keine Permissions im PWA-Manifest außer `display: standalone`
- [ ] `package-lock.json` ist committed und wird beim Build verwendet

---

## 7. UI/UX-Konzept

### 7.1 Design-Richtung

**Ästhetik:** Lebendig, partyartig, aber nicht kindisch. Kräftige Farben, große Buttons (Handy wird herumgereicht – Buttons müssen sofort erkennbar sein), klare Typographie.

**Kritische UI-Anforderungen für den Use Case:**

- **Große Touch-Targets:** Mindestens 48x48px, besser 64x64px. Beim Bieten und Zählen wird schnell und hektisch getippt.
- **Hoher Kontrast:** Das Spiel wird in unterschiedlichen Lichtverhältnissen gespielt (Wohnzimmer, Garten, Bar). Text muss immer lesbar sein.
- **Kein versehentliches Navigieren:** Keine Swipe-Gesten die versehentlich die Seite wechseln. Wichtige Aktionen (Passen, Spiel beenden) erfordern Bestätigung.
- **Screen Wake Lock:** Während der Challenge darf sich der Bildschirm nicht abschalten. Die Screen Wake Lock API wird dafür genutzt.

### 7.2 Farbschema

Zwei Team-Farben als Identität, plus neutrale Farben für UI:

```css
:root {
  --team-a: #FF6B35;        /* Warmes Orange */
  --team-a-light: #FFA06B;
  --team-b: #2EC4B6;         /* Teal/Türkis */
  --team-b-light: #6EDDD2;
  --bg-primary: #1A1A2E;     /* Dunkler Hintergrund */
  --bg-secondary: #16213E;
  --text-primary: #EAEAEA;
  --text-secondary: #A0A0B0;
  --accent: #E94560;          /* Akzentfarbe für CTAs */
  --success: #4ADE80;
  --failure: #F87171;
}
```

### 7.3 Typografie

- **Display / Headlines:** Eine markante, fette Schrift – z.B. "Fredoka" (Google Fonts, als lokale Datei eingebettet, kein externer Request).
- **Body / UI:** System-Font-Stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) – keine externe Dependency, sofort verfügbar.

### 7.4 Screen-Wireframes (Beschreibung)

**StartScreen:** Logo/Titel groß zentriert, ein einzelner "Neues Spiel"-Button.

**PlayerSetup:** Eingabefeld + "Hinzufügen"-Button oben. Liste der Spieler darunter mit Löschen-Option. "Weiter"-Button unten (disabled bis ≥4 Spieler, gerade Anzahl).

**BiddingRound:** Frage oben. Großer Counter in der Mitte. Zwei Team-Buttons links/rechts zum Erhöhen. Pass-Button unten. Aktuelles Gebot und aktiver Bieter klar hervorgehoben in der jeweiligen Team-Farbe.

**ChallengeTimer:** Kreisförmiger Countdown-Timer (großer Kreis, Zahl in der Mitte). Zähl-Button unten (groß, deutlich, pulsierend). Gezählter Wert sichtbar. Gebot als Referenz angezeigt.

---

## 8. Deployment & Hosting

### 8.1 Hosting-Lösung: GitHub Pages

**Warum GitHub Pages:**
- Kostenlos.
- HTTPS automatisch.
- Deployment über `git push` (GitHub Actions).
- Kein Backend, kein Server-Management.
- Zuverlässig und langlebig – GitHub Pages wird nicht abgeschaltet.

**Alternative:** Netlify (ebenfalls kostenlos, etwas einfacheres Deployment per Drag & Drop).

### 8.2 Deployment-Workflow

```
Lokale Entwicklung (VS Code)
        │
        ▼
  git push origin main
        │
        ▼
  GitHub Actions: npm install → npm run build
        │
        ▼
  /dist wird auf GitHub Pages deployed
        │
        ▼
  https://dein-username.github.io/bet-buddy/
```

### 8.3 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

### 8.4 Updates verteilen

Wenn du neue Fragen oder Features hinzufügst:
1. Code ändern in VS Code.
2. `git push` – GitHub Actions baut und deployed automatisch.
3. Freunde öffnen die App → Service Worker erkennt Update → neue Version wird automatisch geladen.

---

## 9. Entwicklungsplan

### Phase 1 – Kern-Spielfluss (MVP)

**Ziel:** Ein spielbares Spiel mit dem vollständigen Rundenablauf.

| Schritt | Komponente | Beschwindigkeit |
|---|---|---|
| 1.1 | Projekt-Setup | Vite + React + TS + Tailwind + Zustand + Howler |
| 1.2 | Datenmodell & Types | `types.ts` mit allen Interfaces |
| 1.3 | Game Store | `gameStore.ts` mit Zustand |
| 1.4 | StartScreen | Titelbildschirm |
| 1.5 | PlayerSetup | Spieler anlegen |
| 1.6 | TeamReveal | Teams anzeigen |
| 1.7 | CategorySelect | Kategorien wählen |
| 1.8 | GameSettings | Rundenzahl |
| 1.9 | QuestionDisplay | Frage anzeigen |
| 1.10 | BiddingRound | Bieten |
| 1.11 | ChallengePrep + Timer | Countdown + Zählen |
| 1.12 | RoundResult | Ergebnis |
| 1.13 | Scoreboard | Punktestand |
| 1.14 | GameOver | Endscreen |
| 1.15 | Fragen schreiben | Min. 20 pro Kategorie (6 Kategorien = 120 Fragen) |
| 1.16 | Sounds einbinden | 7 Sound-Effekte |
| 1.17 | PWA-Setup | manifest.json + Service Worker |
| 1.18 | Deployment | GitHub Pages + Actions |

### Phase 2 – Polish & Feedback

| Schritt | Was |
|---|---|
| 2.1 | Erster Testabend mit Freunden |
| 2.2 | Feedback einarbeiten (Timing, UX, Fragen-Qualität) |
| 2.3 | Animationen verfeinern (CSS Transitions/Keyframes) |
| 2.4 | Edge Cases abfangen (Browser-Tab wechseln während Timer, etc.) |
| 2.5 | Wake Lock implementieren |

### Phase 3 – Erweiterungen

| Schritt | Was |
|---|---|
| 3.1 | Interaktive SVG-Weltkarte für Geographie-Challenges |
| 3.2 | Quiz-Fragetyp (Multiple Choice unter Zeitdruck) |
| 3.3 | Eigene Fragen erstellen (vor Spielstart) |
| 3.4 | Weitere Kategorien (Musik, Film, Sport, etc.) |
| 3.5 | Schätz-Fragen ("Wie nah kommt dein Buddy an...?") |

---

## 10. Offene Entscheidungen

| # | Frage | Status |
|---|---|---|
| 1 | Font-Wahl für Headlines (lokal eingebettet) | Offen – wird beim UI-Build entschieden |
| 2 | Exakte Sound-Dateien auswählen | Offen – Kenney.nl Packs herunterladen und passende auswählen |
| 3 | Team-Bildung: rein zufällig oder wählbar? | Offen – Vorschlag: zufällig mit Option zum Neuauslosen |
| 4 | Mehr als 2 Teams unterstützen? | Offen – MVP nur 2 Teams, Erweiterung möglich |
| 5 | Vite base-path für GitHub Pages konfigurieren | Wird beim Setup gemacht |

---

## 11. Glossar

| Begriff | Bedeutung |
|---|---|
| Buddy | Der Teampartner eines Spielers |
| Bieter | Der Spieler, der den Counter in der Bietrunde erhöht |
| Challenger | Der Buddy, der die Aufgabe während des Timers ausführt |
| PWA | Progressive Web App – Website die sich wie native App verhält |
| Service Worker | Browser-Script das Offline-Caching ermöglicht |
| Zustand | Leichtgewichtiger React State Manager (deutsch: "Zustand") |
| CSP | Content Security Policy – Browser-Sicherheitsrichtlinie |
| CC0 | Creative Commons Zero – Public Domain Lizenz, keine Einschränkungen |
