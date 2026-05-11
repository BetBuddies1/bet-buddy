import type { CategoryId, Question } from './types';

type QuestionFilterOptions = {
  includeSpecialQuestions?: boolean;
};

type ReplayQuestionFilterOptions = QuestionFilterOptions & {
  minimumQuestionCount?: number;
  seenQuestionIds?: Iterable<string>;
};

const specialQuestionIds = new Set<string>([
  "candidate-allgemeinwissen-abba-songtitel",
  "candidate-allgemeinwissen-deutsche-gesetzestexte",
  "candidate-allgemeinwissen-dienstgrade-bundeswehr",
  "candidate-allgemeinwissen-holzarten",
  "candidate-allgemeinwissen-ikea-produktnamen",
  "candidate-allgemeinwissen-knochen",
  "candidate-allgemeinwissen-michael-jackson-songtitel",
  "candidate-allgemeinwissen-steuerarten",
  "candidate-essen-trinken-griechische-spezialitaeten",
  "candidate-essen-trinken-vegane-ersatzprodukte",
  "candidate-geographie-griechische-inseln",
  "candidate-sport-freizeit-kraftuebungen-fitnessstudio",
  "q-allgemeinwissen-chemische-elemente",
  "q-allgemeinwissen-dateiendungen",
  "q-allgemeinwissen-fussballvereine-europa",
  "q-allgemeinwissen-griechisches-alphabet",
  "q-allgemeinwissen-harry-potter-zaubersprueche",
  "q-allgemeinwissen-milliardaere",
  "q-allgemeinwissen-nobelpreistraeger",
  "q-allgemeinwissen-olympische-sportarten",
  "q-allgemeinwissen-pokemon",
  "q-allgemeinwissen-programmiersprachen",
  "q-allgemeinwissen-star-wars-charaktere",
  "q-allgemeinwissen-sternbilder",
  "q-allgemeinwissen-videospiel-franchises",
  "q-essen-trinken-biersorten",
  "q-geographie-autokennzeichen-orte",
  "q-geographie-euro-laender",
  "q-geographie-hauptstaedte-b",
  "q-geographie-landeshauptstaedte-bundeslaender",
  "q-geographie-us-bundesstaaten",
  "q-geographie-weltwunder",
  "q-geschichte-antike-kulturen",
  "q-geschichte-bundeskanzler",
  "q-geschichte-deutsche-dichtende",
  "q-geschichte-epochen",
  "q-geschichte-griechische-philosophen",
  "q-geschichte-komponierende",
  "q-geschichte-kriege",
  "q-geschichte-personen-altes-rom",
  "q-geschichte-pharaonen",
  "q-geschichte-schlachten",
  "q-geschichte-shakespeare-stuecke",
  "q-geschichte-us-praesidenten",
]);

function q(
  category: CategoryId,
  id: string,
  text: string,
  timeLimit = 30,
  type: Question['type'] = 'count',
  options: Pick<Question, 'drawingPrompt'> = {},
): Question {
  return {
    id,
    text,
    category,
    timeLimit,
    type,
    ...options,
    ...(specialQuestionIds.has(id) ? { isSpecial: true } : {}),
  };
}

const questionBank: Question[] = [
  // Medien & Popkultur
  q("medien-popkultur", "q-allgemeinwissen-bands", "Wie viele Bands kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-memes", "Wie viele bekannte Internet-Memes kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-geschichte-mickey-maus-charaktere", "Wie viele Charaktere aus dem Mickey-Maus-Universum kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-comicfiguren", "Wie viele Comicfiguren kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-disney-figuren", "Wie viele Disney-Figuren kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-geschichte-disneyprinzessinnen", "Wie viele Disney-Prinzessinnen kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-fernsehsender", "Wie viele Fernsehsender kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-fernsehserien", "Wie viele Fernsehserien kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-filme-zahl", "Wie viele Filme mit einer Zahl im Titel kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-filmtitel", "Wie viele Filmtitel kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-harry-potter-charaktere", "Wie viele Harry-Potter-Charaktere kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-harry-potter-zaubersprueche", "Wie viele Harry-Potter-Zaubersprüche kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-musicals", "Wie viele Musicals kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-musikgenres", "Wie viele Musikgenres kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-musikinstrumente", "Wie viele Musikinstrumente kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-podcasts", "Wie viele Podcasts kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-pokemon", "Wie viele Pokémon kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-radiosender", "Wie viele Radiosender kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-schauspieler", "Wie viele Schauspielerinnen oder Schauspieler kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-social-media-plattformen", "Wie viele Social-Media-Plattformen kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-solo-musiker", "Wie viele Solo-Musikerinnen oder Solo-Musiker kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-abba-songtitel", "Wie viele Songtitel von ABBA kann dein Buddy nennen?"),
  q("medien-popkultur", "candidate-allgemeinwissen-michael-jackson-songtitel", "Wie viele Songtitel von Michael Jackson kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-star-wars-charaktere", "Wie viele Star-Wars-Charaktere kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-streamingdienste", "Wie viele Streamingdienste kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-superhelden", "Wie viele Superhelden kann dein Buddy nennen?"),
  q("medien-popkultur", "review-allgemeinwissen-superkraefte", "Wie viele Superkräfte kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-videospiel-franchises", "Wie viele Videospiel-Franchises kann dein Buddy nennen?"),
  q("medien-popkultur", "q-allgemeinwissen-videospielkonsolen", "Wie viele Videospielkonsolen kann dein Buddy nennen?"),

  // Wörter & Namen
  q("woerter-namen", "q-allgemeinwissen-griechisches-alphabet", "Wie viele Buchstaben des griechischen Alphabets kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-alphabet-rueckwaerts", "Wie viele Buchstaben kann dein Buddy rückwärts im Alphabet nennen?"),
  q("woerter-namen", "q-allgemeinwissen-dateiendungen", "Wie viele Dateiendungen kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-emoji-zeichen", "Wie viele Emoji-Zeichen kann dein Buddy nennen oder beschreiben?"),
  q("woerter-namen", "candidate-allgemeinwissen-gefuehle", "Wie viele Gefühle kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-maennliche-vornamen", "Wie viele männliche Vornamen kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-maennliche-vornamen-a", "Wie viele männliche Vornamen mit dem Anfangsbuchstaben A kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-maennliche-vornamen-j", "Wie viele männliche Vornamen mit dem Anfangsbuchstaben J kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-maennliche-vornamen-k", "Wie viele männliche Vornamen mit dem Anfangsbuchstaben K kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-maennliche-vornamen-l", "Wie viele männliche Vornamen mit dem Anfangsbuchstaben L kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-maennliche-vornamen-m", "Wie viele männliche Vornamen mit dem Anfangsbuchstaben M kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-maennliche-vornamen-s", "Wie viele männliche Vornamen mit dem Anfangsbuchstaben S kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-kosenamen-freund", "Wie viele Namen oder Kosenamen für eine Freundin oder einen Freund kann dein Buddy nennen?"),
  q("woerter-namen", "q-allgemeinwissen-programmiersprachen", "Wie viele Programmiersprachen kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-reimwoerter-haus", "Wie viele Reimwörter auf „Haus“ kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-reimwoerter-licht", "Wie viele Reimwörter auf „Licht“ kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-reimwoerter-stein", "Wie viele Reimwörter auf „Stein“ kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-reimwoerter-zeit", "Wie viele Reimwörter auf „Zeit“ kann dein Buddy nennen?"),
  q("woerter-namen", "q-allgemeinwissen-sprachen", "Wie viele Sprachen kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-sprichwoerter", "Wie viele Sprichwörter kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-synonyme-chef", "Wie viele Synonyme für „Chef“ kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-synonyme-partner", "Wie viele Synonyme oder Kosenamen für „Partner“ kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-vornamen-a", "Wie viele Vornamen mit dem Anfangsbuchstaben A kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-vornamen-b", "Wie viele Vornamen mit dem Anfangsbuchstaben B kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-vornamen-k", "Wie viele Vornamen mit dem Anfangsbuchstaben K kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-vornamen-l", "Wie viele Vornamen mit dem Anfangsbuchstaben L kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-vornamen-m", "Wie viele Vornamen mit dem Anfangsbuchstaben M kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-vornamen-n", "Wie viele Vornamen mit dem Anfangsbuchstaben N kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-vornamen-s", "Wie viele Vornamen mit dem Anfangsbuchstaben S kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-vornamen-t", "Wie viele Vornamen mit dem Anfangsbuchstaben T kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-weibliche-vornamen", "Wie viele weibliche Vornamen kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-weibliche-vornamen-a", "Wie viele weibliche Vornamen mit dem Anfangsbuchstaben A kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-weibliche-vornamen-j", "Wie viele weibliche Vornamen mit dem Anfangsbuchstaben J kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-weibliche-vornamen-k", "Wie viele weibliche Vornamen mit dem Anfangsbuchstaben K kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-weibliche-vornamen-l", "Wie viele weibliche Vornamen mit dem Anfangsbuchstaben L kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-allgemeinwissen-weibliche-vornamen-m", "Wie viele weibliche Vornamen mit dem Anfangsbuchstaben M kann dein Buddy nennen?"),
  q("woerter-namen", "review-allgemeinwissen-weibliche-vornamen-s", "Wie viele weibliche Vornamen mit dem Anfangsbuchstaben S kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-woerter-sch", "Wie viele Wörter kann dein Buddy nennen, die mit „Sch“ anfangen?"),
  q("woerter-namen", "candidate-kreativ-woerter-a", "Wie viele Wörter mit dem Anfangsbuchstaben A kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-woerter-b", "Wie viele Wörter mit dem Anfangsbuchstaben B kann dein Buddy nennen?"),
  q("woerter-namen", "review-kreativ-woerter-d", "Wie viele Wörter mit dem Anfangsbuchstaben D kann dein Buddy nennen?"),
  q("woerter-namen", "review-kreativ-woerter-f", "Wie viele Wörter mit dem Anfangsbuchstaben F kann dein Buddy nennen?"),
  q("woerter-namen", "review-kreativ-woerter-h", "Wie viele Wörter mit dem Anfangsbuchstaben H kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-kreativ-woerter-k", "Wie viele Wörter mit dem Anfangsbuchstaben K kann dein Buddy nennen?"),
  q("woerter-namen", "review-kreativ-woerter-l", "Wie viele Wörter mit dem Anfangsbuchstaben L kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-woerter-m", "Wie viele Wörter mit dem Anfangsbuchstaben M kann dein Buddy nennen?"),
  q("woerter-namen", "candidate-kreativ-woerter-p", "Wie viele Wörter mit dem Anfangsbuchstaben P kann dein Buddy nennen?"),
  q("woerter-namen", "review-kreativ-woerter-s", "Wie viele Wörter mit dem Anfangsbuchstaben S kann dein Buddy nennen?"),
  q("woerter-namen", "review-kreativ-woerter-t", "Wie viele Wörter mit dem Anfangsbuchstaben T kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-endung-ung", "Wie viele Wörter mit der Endung „-ung“ kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-doppelbuchstaben", "Wie viele Wörter mit Doppelbuchstaben kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-woerter-fuenf-buchstaben", "Wie viele Wörter mit genau fünf Buchstaben kann dein Buddy nennen?"),
  q("woerter-namen", "q-kreativ-woerter-ver", "Wie viele Wörter, die mit „Ver-“ anfangen, kann dein Buddy nennen?"),

  // Essen & Trinken
  q("essen-trinken", "candidate-essen-trinken-alkoholfreie-partygetraenke", "Wie viele alkoholfreie Partygetränke kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-alkoholische-getraenke", "Wie viele alkoholische Getränke kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-backwaren", "Wie viele Backwaren kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-stullen-belag", "Wie viele Beläge für eine Stulle oder ein Brötchen kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-biermarken", "Wie viele Biermarken kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-biersorten", "Wie viele Biersorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-brotsorten", "Wie viele Brotsorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-cocktails-longdrinks", "Wie viele Cocktails oder Longdrinks kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-desserts", "Wie viele Desserts kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-grillgut", "Wie viele Dinge, die man grillen kann, kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-kuehlschrank-inhalte", "Wie viele Dinge, die typischerweise in einem Kühlschrank liegen, kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-eissorten", "Wie viele Eissorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-fast-food-ketten", "Wie viele Fast-Food-Ketten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-gemuesesorten", "Wie viele Gemüsesorten kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-getreidesorten", "Wie viele Getreidesorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-gewuerze", "Wie viele Gewürze kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-griechische-spezialitaeten", "Wie viele griechische Spezialitäten kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-hauptgerichte", "Wie viele Hauptgerichte kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-kaffeespezialitaeten", "Wie viele Kaffeespezialitäten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-kaesesorten", "Wie viele Käsesorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-kraeuter", "Wie viele Kräuter kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-kuchensorten", "Wie viele Kuchensorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-kuechenutensilien", "Wie viele Küchenutensilien kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-lebensmittel-a", "Wie viele Lebensmittel mit dem Anfangsbuchstaben A kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-mineralwassermarken", "Wie viele Mineralwassermarken kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-nudelgerichte", "Wie viele Nudelgerichte kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-nudelsorten", "Wie viele Nudelsorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-nusssorten", "Wie viele Nusssorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-obstsorten", "Wie viele Obstsorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-pilzarten", "Wie viele Pilzarten kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-restaurantketten", "Wie viele Restaurantketten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-rote-lebensmittel", "Wie viele rote Lebensmittel kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-salatgerichte", "Wie viele Salatgerichte kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-allgemeinwissen-kino-snacks", "Wie viele Snacks im Kino kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-snacks-knabberzeug", "Wie viele Snacks oder Knabbersachen kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-softdrinkmarken", "Wie viele Softdrinkmarken kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-supermarktketten", "Wie viele Supermarktketten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-suessigkeiten", "Wie viele Süßigkeiten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-teesorten", "Wie viele Teesorten kann dein Buddy nennen?"),
  q("essen-trinken", "q-essen-trinken-tiefkuehlpizzamarken", "Wie viele Tiefkühlpizzamarken kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-grillutensilien", "Wie viele Utensilien zum Grillen kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-vegane-ersatzprodukte", "Wie viele vegane Ersatzprodukte kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-vorspeisen", "Wie viele Vorspeisen kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-weinsorten", "Wie viele Weinsorten kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-pizza-zutaten", "Wie viele Zutaten für eine Pizza kann dein Buddy nennen?"),
  q("essen-trinken", "candidate-essen-trinken-crepes-zutaten", "Wie viele Zutaten oder Beläge für Crêpes kann dein Buddy nennen?"),

  // Welt & Orte
  q("welt-orte", "q-geographie-bauwerke-wahrzeichen", "Wie viele bekannte Bauwerke oder Wahrzeichen kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-berge-gebirge", "Wie viele Berge oder Gebirge kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-autokennzeichen-orte", "Wie viele deutsche Autokennzeichen-Kürzel kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-bundeslaender", "Wie viele deutsche Bundesländer kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-stadtstaaten", "Wie viele deutsche Stadtstaaten kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-hauptstaedte-europa", "Wie viele europäische Hauptstädte kann dein Buddy nennen?"),
  q("welt-orte", "q-geschichte-feiertage-deutschland", "Wie viele Feiertage in Deutschland kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-flughaefen", "Wie viele Flughäfen kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-fluesse-deutschland", "Wie viele Flüsse in Deutschland kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-fluesse", "Wie viele Flüsse kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-fortbewegung-land", "Wie viele Fortbewegungsmittel an Land kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-fortbewegung-wasser", "Wie viele Fortbewegungsmittel auf dem Wasser kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-fortbewegung-luft", "Wie viele Fortbewegungsmittel in der Luft kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-griechische-inseln", "Wie viele griechische Inseln kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-hauptstaedte", "Wie viele Hauptstädte kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-hauptstaedte-b", "Wie viele Hauptstädte mit dem Anfangsbuchstaben B kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-inseln", "Wie viele Inseln kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-laender-ausserhalb-europas", "Wie viele Länder außerhalb Europas kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-laender-afrika", "Wie viele Länder in Afrika kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-laender-asien", "Wie viele Länder in Asien kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-laender-europa", "Wie viele Länder in Europa kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-laender-suedamerika", "Wie viele Länder in Südamerika kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-flagge-rot", "Wie viele Länder kann dein Buddy nennen, deren Nationalflagge sichtbar Rot enthält?"),
  q("welt-orte", "q-geographie-laender", "Wie viele Länder kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-laender-a", "Wie viele Länder mit dem Anfangsbuchstaben A kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-laender-b", "Wie viele Länder mit dem Anfangsbuchstaben B kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-laender-d", "Wie viele Länder mit dem Anfangsbuchstaben D kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-laender-k", "Wie viele Länder mit dem Anfangsbuchstaben K kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-laender-m", "Wie viele Länder mit dem Anfangsbuchstaben M kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-laender-n", "Wie viele Länder mit dem Anfangsbuchstaben N kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-laender-s", "Wie viele Länder mit dem Anfangsbuchstaben S kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-euro-laender", "Wie viele Länder mit dem Euro als Währung kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-landeshauptstaedte-bundeslaender", "Wie viele Landeshauptstädte deutscher Bundesländer kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-meere-ozeane", "Wie viele Meere oder Ozeane kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-seen", "Wie viele Seen kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-staedte-usa", "Wie viele Städte in den USA kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-staedte-deutschland", "Wie viele Städte in Deutschland kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-staedte-europa", "Wie viele Städte in Europa kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-staedte-b", "Wie viele Städte mit dem Anfangsbuchstaben B kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-staedte-h", "Wie viele Städte mit dem Anfangsbuchstaben H kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-staedte-k", "Wie viele Städte mit dem Anfangsbuchstaben K kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-staedte-l", "Wie viele Städte mit dem Anfangsbuchstaben L kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-staedte-m", "Wie viele Städte mit dem Anfangsbuchstaben M kann dein Buddy nennen?"),
  q("welt-orte", "review-geographie-staedte-s", "Wie viele Städte mit dem Anfangsbuchstaben S kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-us-bundesstaaten", "Wie viele US-Bundesstaaten kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-vulkane", "Wie viele Vulkane kann dein Buddy nennen?"),
  q("welt-orte", "q-allgemeinwissen-waehrungen", "Wie viele Währungen kann dein Buddy nennen?"),
  q("welt-orte", "candidate-geographie-stadt-wahrzeichen", "Wie viele Wahrzeichen kann dein Buddy nennen und die passende Stadt dazu sagen?"),
  q("welt-orte", "q-geographie-weltwunder", "Wie viele Weltwunder der Antike oder der Neuzeit kann dein Buddy nennen?"),
  q("welt-orte", "q-geographie-wuesten", "Wie viele Wüsten kann dein Buddy nennen?"),

  // Natur & Wissen
  q("natur-wissen", "candidate-allgemeinwissen-baumarten", "Wie viele Arten von Bäumen kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-blumenarten", "Wie viele Arten von Blumen kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-zimmerpflanzen", "Wie viele Arten von Zimmerpflanzen kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-chemische-elemente", "Wie viele chemische Elemente kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-dinosaurier", "Wie viele Dinosaurier kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-edelsteine", "Wie viele Edelsteine kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-haustierarten", "Wie viele Haustierarten kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-hunderassen", "Wie viele Hunderassen kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-insekten", "Wie viele Insekten kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-knochen", "Wie viele Knochen des menschlichen Körpers kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-masseinheiten", "Wie viele Maßeinheiten kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-medikamente", "Wie viele Medikamente oder Medikamentenarten kann dein Buddy nennen?"),
  q("natur-wissen", "candidate-allgemeinwissen-organe", "Wie viele Organe des menschlichen Körpers kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-planeten-zwergplaneten", "Wie viele Planeten oder Zwergplaneten kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-sternbilder", "Wie viele Sternbilder kann dein Buddy nennen?"),
  q("natur-wissen", "q-allgemeinwissen-sternzeichen", "Wie viele Sternzeichen kann dein Buddy nennen?"),
  q("natur-wissen", "q-kreativ-tiergeraeusche", "Wie viele Tiergeräusche kann dein Buddy vormachen?"),
  q("natur-wissen", "candidate-allgemeinwissen-vogelarten", "Wie viele Vogelarten kann dein Buddy nennen?"),

  // Sport & Freizeit
  q("sport-freizeit", "candidate-sport-freizeit-urlaub-aktivitaeten", "Wie viele Aktivitäten, die man im Urlaub machen kann, kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-allgemeinwissen-ballsportarten", "Wie viele Ballsportarten kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-allgemeinwissen-bekannte-fussballspieler", "Wie viele bekannte Fußballspielerinnen oder Fußballspieler kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-allgemeinwissen-bekannte-sportler", "Wie viele bekannte Sportlerinnen oder Sportler kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-sportveranstaltungen", "Wie viele bekannte Sportveranstaltungen kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-fitnessstudio-dinge", "Wie viele Dinge, die man im Fitnessstudio benutzt, kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-einzelsportarten", "Wie viele Einzelsportarten kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-allgemeinwissen-freizeitaktivitaeten", "Wie viele Freizeitaktivitäten kann dein Buddy nennen?"),
  q("sport-freizeit", "q-allgemeinwissen-fussballvereine-deutschland", "Wie viele Fußballvereine aus Deutschland kann dein Buddy nennen?"),
  q("sport-freizeit", "q-allgemeinwissen-fussballvereine-europa", "Wie viele Fußballvereine aus Europa kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-allgemeinwissen-hobbys", "Wie viele Hobbys kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-allgemeinwissen-junggesellenabschied-ideen", "Wie viele Ideen für einen Junggesellenabschied kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-kraftuebungen-fitnessstudio", "Wie viele Kraftübungen im Fitnessstudio kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-mannschaftssportarten", "Wie viele Mannschaftssportarten kann dein Buddy nennen?"),
  q("sport-freizeit", "q-allgemeinwissen-olympische-sportarten", "Wie viele olympische Sportarten kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-outdoor-aktivitaeten", "Wie viele Outdoor-Freizeitaktivitäten kann dein Buddy nennen?"),
  q("sport-freizeit", "q-allgemeinwissen-sportarten", "Wie viele Sportarten kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-sportgeraete", "Wie viele Sportgeräte kann dein Buddy nennen?"),
  q("sport-freizeit", "q-allgemeinwissen-taenze", "Wie viele Tänze kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-wassersportarten", "Wie viele Wassersportarten kann dein Buddy nennen?"),
  q("sport-freizeit", "candidate-sport-freizeit-wintersportarten", "Wie viele Wintersportarten kann dein Buddy nennen?"),

  // Beruf & Gesellschaft
  q("beruf-gesellschaft", "candidate-allgemeinwissen-kommunikationsarten", "Wie viele Arten von Kommunikation kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-steuerarten", "Wie viele Arten von Steuern kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-bankinstitute", "Wie viele Bankinstitute kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "q-allgemeinwissen-milliardaere", "Wie viele bekannte Milliardärinnen oder Milliardäre kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-politiker", "Wie viele bekannte Politikerinnen oder Politiker kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "q-allgemeinwissen-berufe", "Wie viele Berufe kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-fahrzeug-berufe", "Wie viele Berufe, in denen man ein Fahrzeug lenkt, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "review-allgemeinwissen-berufe-uniform", "Wie viele Berufe, in denen man eine Uniform trägt, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "review-allgemeinwissen-berufe-krankenhaus", "Wie viele Berufe, in denen man im Krankenhaus arbeitet, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "review-allgemeinwissen-berufe-kinder", "Wie viele Berufe, in denen man mit Kindern arbeitet, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "review-allgemeinwissen-berufe-werkzeug", "Wie viele Berufe, in denen man mit Werkzeugen arbeitet, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-schreibtischberufe", "Wie viele Berufe, in denen man viel am Schreibtisch sitzt, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "review-allgemeinwissen-berufe-draussen", "Wie viele Berufe, in denen man viel draußen arbeitet, kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-bezahlmoeglichkeiten", "Wie viele Bezahlmöglichkeiten kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-deutsche-gesetzestexte", "Wie viele deutsche Gesetzestexte kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-dienstgrade-bundeswehr", "Wie viele Dienstgrade der Bundeswehr kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-handwerksberufe", "Wie viele Handwerksberufe kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "q-allgemeinwissen-schulfaecher", "Wie viele Schulfächer kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-studiengaenge", "Wie viele Studiengänge kann dein Buddy nennen?"),
  q("beruf-gesellschaft", "candidate-allgemeinwissen-krimi-rollen", "Wie viele typische Rollen aus einem Krimi kann dein Buddy nennen?"),

  // Zuhause & Alltag
  q("zuhause-alltag", "candidate-allgemeinwissen-immobilienarten", "Wie viele Arten von Immobilien kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-jackenarten", "Wie viele Arten von Jacken kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-stiftarten", "Wie viele Arten von Stiften kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-unternehmen", "Wie viele bekannte Unternehmen kann dein Buddy nennen?"),
  q("zuhause-alltag", "q-kreativ-blaue-dinge", "Wie viele blaue Dinge kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-bodenbelaege", "Wie viele Bodenbeläge kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-buchgenres", "Wie viele Buchgenres kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-buerobedarf", "Wie viele Dinge aus dem Bürobedarf kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-hundezubehoer", "Wie viele Dinge aus dem Hundezubehör kann dein Buddy nennen?"),
  q("zuhause-alltag", "review-allgemeinwissen-dinge-im-auto", "Wie viele Dinge, die man in einem Auto finden kann, kann dein Buddy nennen?"),
  q("zuhause-alltag", "review-allgemeinwissen-dinge-im-rucksack", "Wie viele Dinge, die man in einem Rucksack haben kann, kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-strandgepaeck", "Wie viele Dinge, die man mit zum Strand nimmt, kann dein Buddy nennen?"),
  q("zuhause-alltag", "q-kreativ-strom-dinge", "Wie viele Dinge, die Strom brauchen, kann dein Buddy nennen?"),
  q("zuhause-alltag", "review-allgemeinwissen-dinge-im-wohnzimmer", "Wie viele Dinge, die typischerweise in einem Wohnzimmer stehen, kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-duefte", "Wie viele Düfte kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-farben", "Wie viele Farben kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-gartenwerkzeuge", "Wie viele Gartenwerkzeuge kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-geometrische-formen", "Wie viele geometrische Formen kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-holzarten", "Wie viele Holzarten kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-kleidungsstuecke", "Wie viele Kleidungsstücke kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-koerperpflegeprodukte", "Wie viele Körperpflegeprodukte kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-kostueme", "Wie viele Kostüme kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-luxusartikel", "Wie viele Luxusartikel kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-schlafzimmermoebel", "Wie viele Möbelstücke im Schlafzimmer kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-moebelstuecke", "Wie viele Möbelstücke kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-raeume-im-haus", "Wie viele Räume in einem Haus kann dein Buddy nennen?"),
  q("zuhause-alltag", "q-kreativ-runde-dinge", "Wie viele runde Dinge kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-schminkutensilien", "Wie viele Schminkutensilien kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-schmuckstuecke", "Wie viele Schmuckstücke kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-schreibwaren", "Wie viele Schreibwaren kann dein Buddy nennen?"),
  q("zuhause-alltag", "candidate-allgemeinwissen-werkzeuge", "Wie viele Werkzeuge kann dein Buddy nennen?"),

  // Marken & Technik
  q("marken-technik", "q-allgemeinwissen-automarken", "Wie viele Automarken kann dein Buddy nennen?"),
  q("marken-technik", "q-allgemeinwissen-betriebssysteme", "Wie viele Betriebssysteme kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-computerprogramme", "Wie viele Computerprogramme kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-computerzubehoer", "Wie viele Dinge aus dem Computerzubehör kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-handyzubehoer", "Wie viele Dinge aus dem Handyzubehör kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-elektronikmarken", "Wie viele Elektronikmarken kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-fahrradmarken", "Wie viele Fahrradmarken kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-airlines", "Wie viele Fluggesellschaften kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-handyapps", "Wie viele Handy-Apps kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-ikea-produktnamen", "Wie viele IKEA-Produktnamen kann dein Buddy nennen?"),
  q("marken-technik", "q-allgemeinwissen-kleidungsmarken", "Wie viele Kleidungsmarken kann dein Buddy nennen?"),
  q("marken-technik", "review-allgemeinwissen-luxusmarken", "Wie viele Luxusmarken kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-schuhmarken", "Wie viele Schuhmarken kann dein Buddy nennen?"),
  q("marken-technik", "q-allgemeinwissen-smartphone-marken", "Wie viele Smartphone-Marken kann dein Buddy nennen?"),
  q("marken-technik", "q-allgemeinwissen-suchmaschinen", "Wie viele Suchmaschinen kann dein Buddy nennen?"),
  q("marken-technik", "candidate-allgemeinwissen-uhrenmarken", "Wie viele Uhrenmarken kann dein Buddy nennen?"),

  // Geschichte & Kultur
  q("geschichte-kultur", "q-geschichte-antike-kulturen", "Wie viele antike Kulturen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-personen-altes-rom", "Wie viele bekannte Personen aus dem Alten Rom kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-autoren", "Wie viele Autorinnen oder Autoren kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-burgen-schloesser", "Wie viele bekannte Burgen oder Schlösser kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-allgemeinwissen-erfindungen", "Wie viele bekannte Erfindungen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-koeniginnen-koenige", "Wie viele bekannte Königinnen oder Könige kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-schlachten", "Wie viele bekannte Schlachten kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-buecher", "Wie viele berühmte Bücher kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-entdeckende", "Wie viele berühmte Entdeckerinnen oder Entdecker kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-malende", "Wie viele berühmte Malerinnen oder Maler kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-wissenschaft-erfindung", "Wie viele berühmte Personen aus Wissenschaft oder Erfindung kann dein Buddy nennen?"),
  q("geschichte-kultur", "candidate-allgemeinwissen-braeuche", "Wie viele Bräuche kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-bundeskanzler", "Wie viele deutsche Bundeskanzlerinnen oder Bundeskanzler kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-deutsche-dichtende", "Wie viele deutsche Dichterinnen oder Dichter kann dein Buddy nennen?"),
  q("geschichte-kultur", "candidate-allgemeinwissen-fabelwesen-mythen", "Wie viele Fabelwesen oder mythologische Kreaturen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-griechische-goetter", "Wie viele griechische Göttinnen oder Götter kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-griechische-philosophen", "Wie viele griechische Philosophinnen oder Philosophen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-epochen", "Wie viele historische Epochen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-historische-erfindungen", "Wie viele historische Erfindungen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-historische-herrschende", "Wie viele historische Herrscherinnen oder Herrscher kann dein Buddy nennen?"),
  q("geschichte-kultur", "candidate-allgemeinwissen-hochzeitsjubilaeen", "Wie viele Hochzeitsjubiläen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-komponierende", "Wie viele Komponistinnen oder Komponisten kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-kriege", "Wie viele Kriege kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-grimm-maerchen", "Wie viele Märchen der Brüder Grimm kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-allgemeinwissen-nobelpreistraeger", "Wie viele Nobelpreisträgerinnen oder Nobelpreisträger kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-pharaonen", "Wie viele Pharaoninnen oder Pharaonen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-religionen", "Wie viele Religionen kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-shakespeare-stuecke", "Wie viele Shakespeare-Stücke kann dein Buddy nennen?"),
  q("geschichte-kultur", "q-geschichte-us-praesidenten", "Wie viele US-Präsidenten kann dein Buddy nennen?"),

  // Spiele & Kreativität
  q("spiele-kreativitaet", "q-kreativ-zeichnen-kategorie", "Wie viele Begriffe aus der gezogenen Zeichen-Kategorie kann dein Buddy in 1 Minute so zeichnen, dass sein Team sie errät?", 60, "drawing", { drawingPrompt: "category" }),
  q("spiele-kreativitaet", "q-allgemeinwissen-brettspiele", "Wie viele Brettspiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-bastelmaterial", "Wie viele Dinge, die man zum Basteln braucht, kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-gesellschaftsspiele", "Wie viele Gesellschaftsspiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-handyspiele", "Wie viele Handyspiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "q-allgemeinwissen-kartenspiele", "Wie viele Kartenspiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-kinderspiele", "Wie viele Kinderspiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "q-kreativ-logos-zeichnen", "Wie viele Markenlogos kann dein Buddy so zeichnen, dass sein Team sie errät?", 60, "drawing"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-partyspiele", "Wie viele Partyspiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-sportunterricht", "Wie viele Spiele aus dem Sportunterricht kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-spiele-mit-karten", "Wie viele Spiele mit Karten kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-draussen-spielen", "Wie viele Spiele, die man draußen spielen kann, kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-ohne-material", "Wie viele Spiele, die man ohne Material spielen kann, kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-spielzeuge", "Wie viele Spielzeuge kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-videospiele", "Wie viele Videospiele kann dein Buddy nennen?"),
  q("spiele-kreativitaet", "candidate-spiele-kreativitaet-wuerfelspiele", "Wie viele Würfelspiele kann dein Buddy nennen?"),

  // Körperliche Challenges
  q("koerperlich", "q-koerperlich-hampelmaenner", "Wie viele Hampelmänner schafft dein Buddy in 30 Sekunden?"),
  q("koerperlich", "q-koerperlich-kniebeugen", "Wie viele Kniebeugen schafft dein Buddy in 30 Sekunden?"),
  q("koerperlich", "q-koerperlich-liegestuetze", "Wie viele Liegestütze schafft dein Buddy in 30 Sekunden?"),
  q("koerperlich", "q-koerperlich-muenzturm", "Wie viele Münzen kann dein Buddy mit einer Hand zu einem Turm stapeln?"),
  q("koerperlich", "q-koerperlich-ein-bein-augen-zu", "Wie viele Sekunden kann dein Buddy auf einem Bein stehen und dabei die Augen schließen?", 60, "duration"),
  q("koerperlich", "q-koerperlich-wand-sitzposition", "Wie viele Sekunden kann dein Buddy die Wand-Sitzposition halten?", 60, "duration"),
  q("koerperlich", "q-koerperlich-buch-balancieren", "Wie viele Sekunden kann dein Buddy ein Buch auf dem Kopf balancieren und dabei langsam im Kreis gehen?", 60, "duration"),
  q("koerperlich", "candidate-koerperlich-pfeifton-halten", "Wie viele Sekunden kann dein Buddy ein Pfeifgeräusch halten?", 60, "duration"),
  q("koerperlich", "q-koerperlich-wasserflasche-arm", "Wie viele Sekunden kann dein Buddy eine gefüllte 1-Liter-Wasserflasche mit ausgestrecktem Arm halten?", 60, "duration"),
  q("koerperlich", "q-koerperlich-loeffel-nase", "Wie viele Sekunden kann dein Buddy einen Löffel auf der Nase balancieren?", 60, "duration"),
  q("koerperlich", "q-koerperlich-luftballon-atem", "Wie viele Sekunden kann dein Buddy einen Luftballon nur mit dem Atem in der Luft halten?", 60, "duration"),
  q("koerperlich", "candidate-koerperlich-stift-finger-kreis", "Wie viele Sekunden kann dein Buddy einen Stift auf einem Finger balancieren und sich dabei langsam im Kreis bewegen?", 60, "duration"),
  q("koerperlich", "q-koerperlich-superman-hold", "Wie viele Sekunden kann dein Buddy einen Superman-Hold auf dem Bauch halten?", 60, "duration"),
  q("koerperlich", "q-koerperlich-unterarmstuetz", "Wie viele Sekunden kann dein Buddy einen Unterarmstütz halten?", 60, "duration"),
  q("koerperlich", "candidate-koerperlich-zehenspitzen-ein-bein-augen-zu", "Wie viele Sekunden kann dein Buddy sicher auf einem Bein auf den Zehenspitzen stehen, ohne sich festzuhalten und mit geschlossenen Augen?", 60, "duration"),
  q("koerperlich", "q-koerperlich-wurfgegenstand-korb", "Wie oft trifft dein Buddy nacheinander aus etwa zwei Metern mit einem weichen Wurfgegenstand in einen improvisierten Korb?", 60, "streak"),

];

export function getQuestionBank(): Question[] {
  return questionBank.map((question) => ({ ...question }));
}

export function filterQuestionsByCategories(
  questions: Question[],
  selectedCategories: CategoryId[],
  options: QuestionFilterOptions = {},
): Question[] {
  const selectedCategorySet = new Set(selectedCategories);

  return questions
    .filter(
      (question) =>
        selectedCategorySet.has(question.category) &&
        (options.includeSpecialQuestions === true || !question.isSpecial),
    )
    .map((question) => ({ ...question }));
}

export function filterQuestionsForReplay(
  questions: Question[],
  selectedCategories: CategoryId[],
  options: ReplayQuestionFilterOptions = {},
): Question[] {
  const filteredQuestions = filterQuestionsByCategories(questions, selectedCategories, options);
  const seenQuestionIds = new Set(options.seenQuestionIds ?? []);
  const minimumQuestionCount = options.minimumQuestionCount ?? 1;
  const unseenQuestions = filteredQuestions.filter((question) => !seenQuestionIds.has(question.id));

  if (unseenQuestions.length >= minimumQuestionCount) {
    return unseenQuestions.map((question) => ({ ...question }));
  }

  return filteredQuestions;
}

export function findNextPlayableQuestionIndex(
  questions: Question[],
  startIndex: number,
  skippedCategories: CategoryId[] = [],
): number | null {
  if (questions.length === 0) {
    return null;
  }

  const skippedCategorySet = new Set(skippedCategories);

  for (let offset = 0; offset < questions.length; offset += 1) {
    const candidateIndex = startIndex + offset;
    const question = questions[candidateIndex % questions.length];

    if (!skippedCategorySet.has(question.category)) {
      return candidateIndex;
    }
  }

  return null;
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
