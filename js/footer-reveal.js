/**
 * Footer reveal — футер "виїжджає" з-під контенту при скролі (як на awsmd.com)
 *
 * Розмітка:
 *   [data-footer-reveal]                 — обгортка, overflow: hidden
 *     [data-footer-reveal-inner]         — шар, який зсуваємо
 *       footer
 *
 * Як працює:
 *   коли обгортка з'являється знизу екрана, футер усередині зсунутий вгору на shift %
 *   своєї висоти (його верх схований за обрізанням). До кінця сторінки зсув плавно
 *   доходить до 0 — футер рухається повільніше за скрол і ніби виїжджає з-під контенту.
 *   Прив'язка до скролу через ScrollTrigger (scrub), плавність дає Lenis.
 *
 * prefers-reduced-motion: без зсуву, футер стоїть на місці.
 */
function initFooterReveal(options = {}) {
  const { rootSelector = '[data-footer-reveal]', shift = 40 } = options

  const root = document.querySelector(rootSelector)

  if (!root || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return null

  const inner = root.querySelector('[data-footer-reveal-inner]')

  if (!inner) return null

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(
      inner,
      { yPercent: -shift },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    )
  })

  // висота футера змінилась (довантажилось відео, шрифти, ресайз) — перераховуємо тригери,
  // інакше анімація закінчиться раніше, ніж сторінка дійде до низу
  if ('ResizeObserver' in window) {
    let lastHeight = inner.offsetHeight
    let timer = null

    new ResizeObserver(() => {
      const height = inner.offsetHeight
      if (height === lastHeight) return
      lastHeight = height
      clearTimeout(timer)
      timer = setTimeout(() => ScrollTrigger.refresh(), 150)
    }).observe(inner)
  }

  // повертає matchMedia: mm.revert() прибирає анімацію і тригер
  return mm
}

window.initFooterReveal = initFooterReveal
