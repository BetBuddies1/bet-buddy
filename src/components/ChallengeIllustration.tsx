import type { Question } from '../game/types';

const physicalChallengeIllustrations = [
  {
    idPart: 'kniebeugen',
    label: 'Kniebeugen Illustration',
    fileName: 'kniebeugen.png',
  },
  {
    idPart: 'hampelmaenner',
    label: 'Hampelmänner Illustration',
    fileName: 'hampelmaenner.png',
  },
  {
    idPart: 'liegestuetze',
    label: 'Liegestütze Illustration',
    fileName: 'liegestuetze.png',
  },
  {
    idPart: 'wand-sitzposition',
    label: 'Wand-Sitzposition Illustration',
    fileName: 'wand-sitzposition.png',
  },
  {
    idPart: 'buch-balancieren',
    label: 'Buch balancieren Illustration',
    fileName: 'buch-balancieren.png',
  },
  {
    idPart: 'loeffel-nase',
    label: 'Löffel balancieren Illustration',
    fileName: 'loeffel-nase.png',
  },
  {
    idPart: 'wurfgegenstand-korb',
    label: 'Wurf in Korb Illustration',
    fileName: 'wurfgegenstand-korb.png',
  },
  {
    idPart: 'wasserflasche-arm',
    label: 'Wasserflasche halten Illustration',
    fileName: 'wasserflasche-arm.png',
  },
  {
    idPart: 'ein-bein-augen-zu',
    label: 'Einbeinstand Illustration',
    fileName: 'ein-bein-augen-zu.png',
  },
  {
    idPart: 'unterarmstuetz',
    label: 'Unterarmstütz Illustration',
    fileName: 'unterarmstuetz.png',
  },
  {
    idPart: 'superman-hold',
    label: 'Superman-Hold Illustration',
    fileName: 'superman-hold.png',
  },
  {
    idPart: 'muenzturm',
    label: 'Münzturm Illustration',
    fileName: 'muenzturm.png',
  },
  {
    idPart: 'luftballon-atem',
    label: 'Luftballon mit Atem Illustration',
    fileName: 'luftballon-atem.png',
  },
] as const;

export function ChallengeIllustration({ question }: { question: Question }) {
  const physicalIllustration = physicalChallengeIllustrations.find((illustration) =>
    question.id.includes(illustration.idPart),
  );

  if (physicalIllustration) {
    return (
      <figure
        className="challenge-illustration challenge-illustration--bitmap"
        aria-label={physicalIllustration.label}
      >
        <img
          alt=""
          decoding="async"
          loading="lazy"
          src={`${import.meta.env.BASE_URL}challenges/physical/${physicalIllustration.fileName}`}
        />
      </figure>
    );
  }

  // New physical challenges can still render a simple fallback before a custom PNG exists.
  if (question.category === 'koerperlich') {
    return (
      <figure className="challenge-illustration" aria-label="Körperliche Challenge Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M42 96h196" />
          <circle className="illustration-head" cx="142" cy="33" r="15" />
          <path className="illustration-body" d="M142 49v32" />
          <path className="illustration-limb" d="M140 58 108 75" />
          <path className="illustration-limb" d="M144 58 176 75" />
          <path className="illustration-limb" d="M140 80 116 101" />
          <path className="illustration-limb" d="M145 80 168 101" />
        </svg>
      </figure>
    );
  }

  return null;
}
