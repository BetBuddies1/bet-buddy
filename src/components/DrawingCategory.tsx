export function DrawingCategory({ category }: { category?: string }) {
  return category ? (
    <p className="round-meta drawing-round-category">
      Zeichen-Kategorie: <strong>{category}</strong>
    </p>
  ) : null;
}
