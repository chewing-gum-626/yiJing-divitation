import { gsap } from 'gsap';

export function useAnimation() {
  function fadeIn(target: gsap.TweenTarget) {
    return gsap.fromTo(target, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 });
  }

  return {
    fadeIn,
  };
}
