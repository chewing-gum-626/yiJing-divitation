import { toPng } from 'html-to-image';

export function createShareImage(element: HTMLElement): Promise<string> {
  return toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
  });
}
