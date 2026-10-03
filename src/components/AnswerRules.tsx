export function AnswerRules() {
  return (
    <details className="answer-rules">
      <summary>Was zählt als Antwort?</summary>
      <div className="answer-rules__content">
        <p>Für Aufzählungs- und Wortfragen:</p>
        <ol>
          <li>
            <strong>Jede unterschiedliche, passende Antwort zählt einmal.</strong>{' '}
            Bei Bürobedarf zählen Kugelschreiber und Büroklammer als zwei Antworten.
          </li>
          <li>
            <strong>Andere Bezeichnungen für dieselbe Sache zählen gemeinsam einmal.</strong>{' '}
            „Kuli“ und „Kugelschreiber“ ergeben bei Bürobedarf eine Antwort.
          </li>
          <li>
            <strong>Bei Wortaufgaben zählen die gesuchten unterschiedlichen Wörter.</strong>{' '}
            Bei „Synonyme für Chef“ dürfen „Boss“ und „Vorgesetzter“ jeweils zählen.
          </li>
          <li>
            <strong>Der genaue Fragetext bestimmt, was gezählt wird.</strong>{' '}
            Bei Videospielreihen zählt „Mario“ einmal; bei einzelnen Videospieltiteln können
            mehrere unterschiedliche Mario-Spiele zählen.
          </li>
          <li>
            <strong>Prüft unklare oder doppelt gezählte Antworten gemeinsam.</strong>{' '}
            Korrigiert den Zähler vor dem Bestätigen mit +1 / −1. Ist von acht gezählten
            Antworten eine doppelt, korrigiert ihr auf sieben.
          </li>
        </ol>
      </div>
    </details>
  );
}
