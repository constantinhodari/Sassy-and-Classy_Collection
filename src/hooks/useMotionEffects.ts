'use client';

import { useEffect, useRef } from 'react';

const MAGNETIC_SELECTOR =
  '.button-coral, .hero-explore, .product-order-button, .category-view-all, .newsletter-form button';

export function useMagneticButtons(trigger?: unknown) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const root = document;
    const buttons = Array.from(root.querySelectorAll<HTMLElement>(MAGNETIC_SELECTOR));

    const cleanups: (() => void)[] = [];

    buttons.forEach((button) => {
      if (button.dataset.magneticReady === 'true' || (button as HTMLButtonElement).disabled)
        return;
      button.dataset.magneticReady = 'true';
      button.classList.add('magnetic-ready');

      const onMove = (event: PointerEvent) => {
        const rect = button.getBoundingClientRect();
        const strength = button.classList.contains('product-order-button') ? 0.12 : 0.16;
        const x = (event.clientX - rect.left - rect.width / 2) * strength;
        const y = (event.clientY - rect.top - rect.height / 2) * strength;
        button.style.setProperty('--magnet-x', `${Math.max(-7, Math.min(7, x))}px`);
        button.style.setProperty('--magnet-y', `${Math.max(-5, Math.min(5, y))}px`);
      };

      const onLeave = () => {
        button.style.setProperty('--magnet-x', '0px');
        button.style.setProperty('--magnet-y', '0px');
      };

      button.addEventListener('pointermove', onMove as EventListener);
      button.addEventListener('pointerleave', onLeave);
      button.addEventListener('focus', onLeave);
      cleanups.push(() => {
        button.removeEventListener('pointermove', onMove as EventListener);
        button.removeEventListener('pointerleave', onLeave);
        button.removeEventListener('focus', onLeave);
        button.dataset.magneticReady = '';
        button.classList.remove('magnetic-ready');
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [trigger]);
}

export function useFluidCursor() {
  const auraRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number>(0);
  const posRef = useRef({ targetX: -400, targetY: -400, currentX: -400, currentY: -400 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const aura = document.createElement('div');
    aura.className = 'fluid-cursor-aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.appendChild(aura);
    auraRef.current = aura;

    const draw = () => {
      const pos = posRef.current;
      pos.currentX += (pos.targetX - pos.currentX) * 0.18;
      pos.currentY += (pos.targetY - pos.currentY) * 0.18;
      aura.style.transform = `translate3d(${pos.currentX}px, ${pos.currentY}px, 0) translate(-50%, -50%)`;
      if (
        Math.abs(pos.targetX - pos.currentX) > 0.5 ||
        Math.abs(pos.targetY - pos.currentY) > 0.5
      ) {
        frameRef.current = requestAnimationFrame(draw);
      } else {
        frameRef.current = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      posRef.current.targetX = event.clientX;
      posRef.current.targetY = event.clientY;
      aura.classList.add('is-active');
      if (!frameRef.current) frameRef.current = requestAnimationFrame(draw);
    };

    const onLeave = () => aura.classList.remove('is-active');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      aura.remove();
      auraRef.current = null;
    };
  }, []);
}
