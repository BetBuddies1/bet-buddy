import type { Question } from './types';

// Prompts stay on the device. Each entry names one concrete thing to draw;
// profession variants refer to the same answer and do not create extra cards.
const categoryPromptPools = new Map<string, readonly string[]>([
  [
    'Gegenstände',
    [
      'Regenschirm',
      'Schlüssel',
      'Brille',
      'Fahrrad',
      'Krone',
      'Uhr',
      'Tasse',
      'Kerze',
      'Schere',
      'Leiter',
      'Hammer',
      'Briefumschlag',
      'Anker',
      'Koffer',
      'Gitarre',
      'Bett',
      'Stuhl',
      'Kamm',
      'Vorhängeschloss',
      'Flasche',
      'Löffel',
      'Telefon',
      'Buch',
      'Zahnbürste',
    ],
  ],
  [
    'Sport',
    [
      'Fußball',
      'Basketball',
      'Handball',
      'Volleyball',
      'Tennis',
      'Tischtennis',
      'Badminton',
      'Golf',
      'Bowling',
      'Boxen',
      'Schwimmen',
      'Tauchen',
      'Rudern',
      'Segeln',
      'Surfen',
      'Skifahren',
      'Snowboarden',
      'Schlittschuhlaufen',
      'Radsport',
      'Reiten',
      'Bogenschießen',
      'Fechten',
      'Gewichtheben',
      'Klettern',
    ],
  ],
  [
    'Tiere',
    [
      'Hund',
      'Katze',
      'Maus',
      'Elefant',
      'Giraffe',
      'Löwe',
      'Affe',
      'Hase',
      'Fisch',
      'Vogel',
      'Ente',
      'Pinguin',
      'Schildkröte',
      'Schnecke',
      'Schmetterling',
      'Biene',
      'Spinne',
      'Frosch',
      'Krokodil',
      'Schlange',
      'Pferd',
      'Schwein',
      'Kuh',
      'Igel',
    ],
  ],
  [
    'Berufe',
    [
      'Feuerwehrkraft',
      'Polizeikraft',
      'Lehrkraft',
      'Pflegekraft',
      'Arzt / Ärztin',
      'Zahnarzt / Zahnärztin',
      'Tierarzt / Tierärztin',
      'Koch / Köchin',
      'Bäcker / Bäckerin',
      'Friseur / Friseurin',
      'Gärtner / Gärtnerin',
      'Pilot / Pilotin',
      'Astronaut / Astronautin',
      'Busfahrer / Busfahrerin',
      'Lokführer / Lokführerin',
      'Postbote / Postbotin',
      'Maler / Malerin',
      'Schreiner / Schreinerin',
      'Elektriker / Elektrikerin',
      'Maurer / Maurerin',
      'Fotograf / Fotografin',
      'Richter / Richterin',
      'Zauberer / Zauberin',
      'Clown',
    ],
  ],
]);

// These brands have pictorial symbols: drawing a brand name is unnecessary.
const logoPromptPool: readonly string[] = [
  'Nike',
  'Apple',
  'Audi',
  'Mercedes-Benz',
  'Adidas',
  'Puma',
  'Shell',
  'Toyota',
  'Renault',
  'Peugeot',
  'Lacoste',
  'Ferrari',
  'Starbucks',
  'Spotify',
  'Snapchat',
  'Instagram',
  'YouTube',
  'TikTok',
  'Mitsubishi',
  'Red Bull',
  'Pringles',
  'Firefox',
  'Lufthansa',
  'Duolingo',
];

function getDrawingPromptPool(
  question: Question,
  drawingCategory?: string,
): readonly string[] {
  if (question.type !== 'drawing') {
    return [];
  }

  const pool =
    question.id === 'q-kreativ-logos-zeichnen' || question.drawingPrompt !== 'category'
      ? logoPromptPool
      : categoryPromptPools.get(drawingCategory ?? '');

  // A missing category must not silently turn an agreed topic into another one.
  return pool ?? [];
}

/** Returns the achievable upper bound without shuffling or copying any cards. */
export function getDrawingPromptCount(question: Question, drawingCategory?: string): number {
  return getDrawingPromptPool(question, drawingCategory).length;
}

/** Returns one shuffled, independent deck without changing the question or pools. */
export function createDrawingPromptDeck(
  question: Question,
  drawingCategory?: string,
  random = Math.random,
): string[] {
  const prompts = [...getDrawingPromptPool(question, drawingCategory)];

  for (let index = prompts.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [prompts[index], prompts[swapIndex]] = [prompts[swapIndex], prompts[index]];
  }

  return prompts;
}
