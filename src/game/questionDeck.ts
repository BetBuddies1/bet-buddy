import type { Question } from './types';

const questionBank: Question[] = [
  {
    id: 'q-capitals',
    text: 'Wie viele europäische Hauptstädte kann dein Buddy nennen?',
    category: 'geographie',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
  {
    id: 'q-kitchen',
    text: 'Wie viele Dinge in dieser Küche kann dein Buddy in 30 Sekunden finden?',
    category: 'kreativ',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
  {
    id: 'q-number-movies',
    text: 'Wie viele Filme mit einer Zahl im Titel kann dein Buddy nennen?',
    category: 'allgemeinwissen',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
  {
    id: 'q-jumping-jacks',
    text: 'Wie viele Hampelmänner schafft dein Buddy in 30 Sekunden?',
    category: 'koerperlich',
    timeLimit: 30,
    type: 'count',
    minBid: 5,
  },
  {
    id: 'q-foods-a',
    text: 'Wie viele Lebensmittel mit dem Anfangsbuchstaben A kann dein Buddy nennen?',
    category: 'essen-trinken',
    timeLimit: 30,
    type: 'count',
    minBid: 2,
  },
  {
    id: 'q-history-people',
    text: 'Wie viele historische Personen kann dein Buddy in 30 Sekunden nennen?',
    category: 'geschichte',
    timeLimit: 30,
    type: 'count',
    minBid: 2,
  },
  {
    id: 'q-room-colors',
    text: 'Wie viele sichtbare Farben kann dein Buddy im Raum finden?',
    category: 'kreativ',
    timeLimit: 30,
    type: 'count',
    minBid: 3,
  },
  {
    id: 'q-countries',
    text: 'Wie viele Länder außerhalb Europas kann dein Buddy nennen?',
    category: 'geographie',
    timeLimit: 30,
    type: 'count',
    minBid: 3,
  },
  {
    id: 'q-songs',
    text: 'Wie viele Songs mit einem Vornamen im Titel kann dein Buddy nennen?',
    category: 'allgemeinwissen',
    timeLimit: 30,
    type: 'count',
    minBid: 2,
  },
  {
    id: 'q-snacks',
    text: 'Wie viele salzige Snacks kann dein Buddy in 30 Sekunden aufzählen?',
    category: 'essen-trinken',
    timeLimit: 30,
    type: 'count',
    minBid: 2,
  },
];

export function getQuestionBank(): Question[] {
  return questionBank.map((question) => ({ ...question }));
}

export function createQuestionDeck(random = Math.random): Question[] {
  const questions = getQuestionBank();

  for (let index = questions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const question = questions[index];

    questions[index] = questions[swapIndex];
    questions[swapIndex] = question;
  }

  return questions;
}
