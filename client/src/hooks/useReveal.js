import { useEffect, useRef } from 'react';

// Adds `is-in` to every [data-reveal] element inside the returned ref once it scrolls into view.
export function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    root.classList.add('lp-animate');
    return () => observer.disconnect();
  }, []);

  return ref;
}
