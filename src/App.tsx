export default function App() {
  return (
    <main className="app-shell">
      <section className="start-screen" aria-labelledby="app-title">
        <p className="eyebrow">Partyspiel</p>
        <h1 id="app-title">Bet Buddy</h1>
        <p className="intro">
          Setzt Teams, bietet mutig und zeigt, wie gut ihr eure Buddies einschätzen könnt.
        </p>
        <button type="button" className="primary-action">
          Neues Spiel
        </button>
      </section>
    </main>
  );
}
