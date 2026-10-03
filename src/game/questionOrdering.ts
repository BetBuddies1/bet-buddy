import type { Question } from './types';

type FamilyQueue = {
  questions: Question[];
  nextIndex: number;
};

/**
 * Balance an already shuffled, filtered pool by semantic family. Each family gets
 * one turn per pass, so a large variant family cannot dominate the first rounds.
 * Family order follows its first occurrence in the input; variants retain their
 * input order except for a preferred first representative. Nothing is discarded.
 */
export function arrangeQuestionDeck(questions: Question[]): Question[] {
  const families = new Map<string | symbol, FamilyQueue>();

  for (const question of questions) {
    // A separate symbol keeps every untagged question independent, including one
    // whose id happens to equal another question's family name.
    const familyKey = question.topicFamily ?? Symbol();
    let family = families.get(familyKey);
    if (!family) {
      family = { questions: [], nextIndex: 0 };
      families.set(familyKey, family);
    }
    family.questions.push(question);
  }

  for (const family of families.values()) {
    const preferredIndex = family.questions.findIndex((question) => question.preferredInFamily);
    if (preferredIndex > 0) {
      const [preferred] = family.questions.splice(preferredIndex, 1);
      family.questions.unshift(preferred);
    }
  }

  const arranged: Question[] = [];
  while (arranged.length < questions.length) {
    for (const family of families.values()) {
      if (family.nextIndex < family.questions.length) {
        arranged.push(family.questions[family.nextIndex]);
        family.nextIndex += 1;
      }
    }
  }
  return arranged;
}
