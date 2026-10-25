'use client';

import { useEffect, useRef, useCallback } from 'react';

const REVEAL_SELECTORS = [
  '.hero-copy',
  '.hero-art-reference',
  '.hero-benefit',
  '.category-heading-reference',
  '.category-card',
  '.shop-section .section-heading',
  '.shop-toolbar',
  '.editorial-image',
  '.editorial-copy',
  '.story-image-wrap',
  '.story-copy',
  '.service-item',
  '.instagram-heading',
  '.instagram-grid a',
  '.newsletter-inner',
];

/**
 * Sets up scroll-reveal IntersectionObserver on elements matching the given
 * selectors. Mirrors the original setupScrollReveal() in script.js, including
 * reveal direction and stagger groups.
 *
 * A single observer is kept alive for the lifetime of the page. Re-running the
 * setup (after filters change or products render) only registers newly found
 * elements, so sections that have not been revealed yet are never orphaned.
 */
export function useScrollReveal(hydrated: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedRef = useRef<WeakSet<Element>>(new WeakSet());

  const setup = useCallback(() => {
    if (typeof window === 'undefined') return;

    const targets = REVEAL_SELECTORS.flatMap((sel) =>
      Array.from(document.querySelectorAll(sel))
    );

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      targets.forEach((el) => el.classList.add('scroll-reveal', 'is-visible'));
      return;
    }

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observerRef.current?.unobserve(entry.target);
            }
          }),
        { threshold: 0.12, rootMargin: '0px 0px -35px 0px' }
      );
    }

    const staggerCounts = new Map<string, number>();

    targets.forEach((element) => {
      if (observedRef.current.has(element)) return;
      observedRef.current.add(element);

      element.classList.add('scroll-reveal');

      const group = element.matches('.category-card')
        ? 'category-card'
        : element.matches('.instagram-grid a')
        ? 'instagram-card'
        : element.matches('.hero-benefit')
        ? 'hero-benefit'
        : element.matches('.service-item')
        ? 'service-item'
        : 'standard';

      const groupIndex = staggerCounts.get(group) || 0;
      staggerCounts.set(group, groupIndex + 1);
      (element as HTMLElement).style.setProperty(
        '--reveal-delay',
        `${Math.min(groupIndex, 5) * 85}ms`
      );

      if (element.matches('.hero-art-reference, .story-image-wrap, .editorial-image')) {
        element.classList.add('reveal-from-right');
      } else if (element.matches('.hero-copy, .story-copy, .editorial-copy')) {
        element.classList.add('reveal-from-left');
      } else if (element.matches('.category-card, .instagram-grid a')) {
        element.classList.add('reveal-soft-scale');
      }

      observerRef.current?.observe(element);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Slight delay so React has rendered all DOM
    const timeout = setTimeout(setup, 100);
    return () => {
      clearTimeout(timeout);
      observerRef.current?.disconnect();
      observerRef.current = null;
      observedRef.current = new WeakSet();
    };
  }, [hydrated, setup]);

  // Re-run when filter changes (new product cards enter the DOM)
  const reobserve = useCallback(() => {
    if (!hydrated) return;
    setTimeout(setup, 50);
  }, [hydrated, setup]);

  return { reobserve };
}
