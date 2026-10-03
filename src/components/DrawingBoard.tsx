import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

type Point = { x: number; y: number };
type Stroke = Point[];

type DrawingBoardProps = {
  disabled: boolean;
  rotated?: boolean;
  resetKey?: string | number;
};

/** Strokes use normalized coordinates, so resizing never clears the picture. */
export function DrawingBoard({ disabled, rotated = false, resetKey }: DrawingBoardProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const surfaceRef = useRef<SVGSVGElement>(null);
  const activePointer = useRef<number | null>(null);

  function stopStroke() {
    const pointerId = activePointer.current;
    activePointer.current = null;
    if (pointerId !== null && surfaceRef.current?.hasPointerCapture?.(pointerId)) {
      surfaceRef.current.releasePointerCapture(pointerId);
    }
  }

  useLayoutEffect(() => {
    if (disabled) stopStroke();
  }, [disabled]);

  useLayoutEffect(() => {
    stopStroke();
    setStrokes([]);
  }, [resetKey]);

  useLayoutEffect(() => () => stopStroke(), []);

  function position(event: PointerEvent<SVGSVGElement>): Point | null {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    return {
      x: Math.round((rotated ? 1 - x : x) * 1000),
      y: Math.round((rotated ? 1 - y : y) * 1000),
    };
  }

  function startStroke(event: PointerEvent<SVGSVGElement>) {
    if (disabled || activePointer.current !== null || event.button !== 0) return;
    const point = position(event);
    if (!point) return;
    event.preventDefault();
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setStrokes((current) => [...current, [point]]);
  }

  function extendStroke(event: PointerEvent<SVGSVGElement>) {
    if (disabled || event.pointerId !== activePointer.current) return;
    const point = position(event);
    if (!point) return;
    event.preventDefault();
    setStrokes((current) => {
      const last = current.at(-1);
      if (!last) return current;
      return [...current.slice(0, -1), [...last, point]];
    });
  }

  function finishStroke(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerId !== activePointer.current) return;
    extendStroke(event);
    stopStroke();
  }

  return (
    <div className="drawing-board">
      <svg
        ref={surfaceRef}
        className="drawing-board__surface"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        role="img"
        aria-label={disabled ? 'Zeichenfläche gesperrt' : 'Zeichenfläche: mit Finger oder Stift zeichnen'}
        aria-disabled={disabled}
        onPointerDown={startStroke}
        onPointerMove={extendStroke}
        onPointerUp={finishStroke}
        onPointerCancel={(event) => { if (event.pointerId === activePointer.current) stopStroke(); }}
        onLostPointerCapture={(event) => { if (event.pointerId === activePointer.current) stopStroke(); }}
      >
        {strokes.map((stroke, index) => (
          <path
            key={index}
            d={stroke.length === 1
              ? `M ${stroke[0].x} ${stroke[0].y} l 0.1 0.1`
              : stroke.map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="drawing-board__tools">
        <button
          className="secondary-action"
          type="button"
          disabled={disabled || strokes.length === 0}
          onClick={() => { stopStroke(); setStrokes((current) => current.slice(0, -1)); }}
        >
          Rückgängig
        </button>
        <button
          className="secondary-action"
          type="button"
          disabled={disabled || strokes.length === 0}
          onClick={() => { stopStroke(); setStrokes([]); }}
        >
          Alles löschen
        </button>
      </div>
    </div>
  );
}
