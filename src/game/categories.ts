import type { CategoryId, Question } from './types';

export const categoryOptions: Array<{ id: CategoryId; label: string }> = [
  { id: 'medien-popkultur', label: 'Medien & Popkultur' },
  { id: 'woerter-namen', label: 'Wörter & Namen' },
  { id: 'essen-trinken', label: 'Essen & Trinken' },
  { id: 'welt-orte', label: 'Welt & Orte' },
  { id: 'natur-wissen', label: 'Natur & Wissen' },
  { id: 'sport-freizeit', label: 'Sport & Freizeit' },
  { id: 'beruf-gesellschaft', label: 'Beruf & Gesellschaft' },
  { id: 'zuhause-alltag', label: 'Zuhause & Alltag' },
  { id: 'marken-technik', label: 'Marken & Technik' },
  { id: 'geschichte-kultur', label: 'Geschichte & Kultur' },
  { id: 'spiele-kreativitaet', label: 'Spiele & Kreativität' },
  { id: 'koerperlich', label: 'Körperliche Challenges' },
];

export const defaultSelectedCategories = categoryOptions.map((category) => category.id);

export function getCategoryLabel(category: Question['category']) {
  return categoryOptions.find((categoryOption) => categoryOption.id === category)?.label ?? category;
}
