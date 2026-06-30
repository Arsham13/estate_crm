import { useEffect } from "react";

/**
 * useScrollAnimations
 * با استفاده از IntersectionObserver، المنت‌هایی که دارای
 * ویژگی data-animate هستند را هنگام ورود به viewport انیمیت می‌کند.
 *
 * کاربرد:
 *   <div data-animate="fade-up" data-animate-delay="200">...</div>
 *
 * مقادیر مجاز data-animate:
 *   fade | fade-up | fade-down | fade-left | fade-right | zoom-in
 */
export function useScrollAnimations() {
  useEffect(() => {
    const elements = document.querySelectorAll(
      "[data-animate]:not(.is-visible)",
    );

    if (!("IntersectionObserver" in window)) {
      // fallback: همه را فوراً نشان بده
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });
}
