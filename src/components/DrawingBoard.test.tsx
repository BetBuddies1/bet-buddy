import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DrawingBoard } from './DrawingBoard';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('DrawingBoard', () => {
  let container: HTMLDivElement;
  let root: Root;
  let captured: Set<number>;
  let release: ReturnType<typeof vi.fn<(pointerId: number) => void>>;

  function render(disabled = false, rotated = false, resetKey = 0) {
    act(() => root.render(<DrawingBoard disabled={disabled} rotated={rotated} resetKey={resetKey} />));
    const surface = container.querySelector('svg')!;
    surface.getBoundingClientRect = () => ({ left: 20, top: 40, width: 200, height: 400 } as DOMRect);
    surface.setPointerCapture = (id) => { captured.add(id); };
    surface.hasPointerCapture = (id) => captured.has(id);
    surface.releasePointerCapture = release;
    return surface;
  }

  function pointer(type: string, x: number, y: number, pointerId = 1) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
    Object.defineProperty(event, 'pointerId', { value: pointerId });
    act(() => container.querySelector('svg')!.dispatchEvent(event));
  }

  function click(label: string) {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label)!;
    act(() => button.click());
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    captured = new Set();
    release = vi.fn((id: number) => { captured.delete(id); });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('captures a pointer, scales its coordinates and stops when it leaves contact', () => {
    render();
    pointer('pointerdown', 70, 140);
    expect(captured.has(1)).toBe(true);
    pointer('pointermove', 120, 240);
    pointer('pointerup', 170, 340);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M 250 250 L 500 500 L 750 750');
    expect(release).toHaveBeenCalledWith(1);
    pointer('pointermove', 200, 400);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M 250 250 L 500 500 L 750 750');
  });

  it('maps touches correctly when the whole screen faces the opposite team', () => {
    render(false, true);
    pointer('pointerdown', 70, 140);
    pointer('pointerup', 120, 240);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M 750 750 L 500 500');
  });

  it('ignores extra fingers and preserves the active stroke when another pointer is cancelled', () => {
    render();
    pointer('pointerdown', 70, 140);
    pointer('pointerdown', 170, 340, 2);
    pointer('pointermove', 170, 340, 2);
    pointer('pointercancel', 170, 340, 2);
    pointer('pointerup', 120, 240);
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M 250 250 L 500 500');
  });

  it('keeps strokes through resize, supports undo and clears only on an explicit reset', () => {
    const surface = render();
    pointer('pointerdown', 70, 140);
    pointer('pointerup', 120, 240);
    const originalPath = container.querySelector('path')?.getAttribute('d');
    surface.getBoundingClientRect = () => ({ left: 20, top: 40, width: 400, height: 200 } as DOMRect);
    act(() => window.dispatchEvent(new Event('resize')));
    expect(container.querySelector('path')?.getAttribute('d')).toBe(originalPath);
    pointer('pointerdown', 220, 140);
    pointer('pointerup', 420, 240);
    expect(container.querySelectorAll('path')).toHaveLength(2);
    click('Rückgängig');
    expect(container.querySelector('path')?.getAttribute('d')).toBe(originalPath);
    click('Alles löschen');
    expect(container.querySelectorAll('path')).toHaveLength(0);
    pointer('pointerdown', 220, 140);
    pointer('pointerup', 420, 240);
    render(false, false, 1);
    expect(container.querySelectorAll('path')).toHaveLength(0);
  });

  it('locks editing before start and terminates an active pointer as soon as time ends', () => {
    render(true);
    pointer('pointerdown', 70, 140);
    expect(container.querySelectorAll('path')).toHaveLength(0);
    render(false);
    pointer('pointerdown', 70, 140);
    render(true);
    expect(release).toHaveBeenCalledWith(1);
    pointer('pointermove', 120, 240);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M 250 250 l 0.1 0.1');
    expect([...container.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
  });
});
