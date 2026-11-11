/**
 * Reveal — поява елементів при скролі, як на clay.global
 *
 * Як на clay: елемент проявляється (opacity 0 → 1, 0.9s) і піднімається на 15px (1.2s),
 * крива cubic-bezier(0.16, 1, 0.3, 1). Елементи, що з'явились разом, ідуть по черзі (stagger).
 *
 * Які елементи анімувати — селектори нижче (REVEAL_UP / REVEAL_FADE), а не атрибути в HTML:
 * розмітку не треба чіпати, і анімації не зникнуть, якщо HTML перезберуть.
 * Кейси сюди не входять — у них своя поява (js/cases.js).
 *
 * Анімація через Web Animations API (element.animate):
 *   - не перебиває власні transition елементів (ховери, розгортання карток);
 *   - зсув через властивість translate з composite: 'add' — не конфліктує з transform і translate елемента.
 *
 * До появи елемент прихований лише коли JS увімкнув html.reveal-ready —
 * без JS і з prefers-reduced-motion усе видно одразу.
 * Якщо сторінку відкрили посередині — елементи вище екрана показуються без анімації.
 */
const REVEAL_UP = [
  // hero (перший екран — з'являються одразу після завантаження)
  '.hero__content > *',
  // problems
  '.problems__label', '.problems__title', '.problems__text', '.problems__card', '.problems__item',
  // business-value
  '.business-value__label', '.business-value__title', '.business-value__text', '.business-value__item',
  // working-model
  '.working-model__title', '.working-model__card', '.working-model__figure',
  // service
  '.service__label', '.service__title', '.service__text', '.service__card',
  // value-chain
  '.value-chain__top-label', '.value-chain__title', '.value-chain__text', '.value-chain__link', '.value-chain__diagram',
  // about
  '.about__left-top', '.about__left-step-heading', '.about__left-step-item', '.about__right-item',
  // team
  '.team__label', '.team__title', '.team__text', '.team__slider', '.team__all-link',
  // reviews
  '.reviews__label', '.reviews__title', '.reviews__all-link', '.reviews__slider', '.reviews__cta',
  // footer
  '.footer__logo', '.footer__title', '.footer__cta-link', '.footer__text', '.footer__contacts',
  '.footer__menu-item', '.footer__social', '.footer__copyright', '.footer__legal-item', '.footer__lang',
]

// лише проявлення, без зсуву
const REVEAL_FADE = []

function initReveal(options = {}) {
  const {
    up = REVEAL_UP,
    fade = REVEAL_FADE,
    distance = 15, // px
    stagger = 0.06, // s між елементами, що з'явились разом
    maxDelay = 0.36, // s — щоб довгий список не чекав
    // поріг від висоти самого елемента, а не від'ємний rootMargin: інакше низ сторінки (футер) ніколи не спрацює
    threshold = 0.1,
  } = options

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const supported = 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function'

  // клас reveal-ready ставиться ще в <head> — без анімації знімаємо його, щоб нічого не лишилось прозорим
  const cancel = () => {
    document.documentElement.classList.remove('reveal-ready')
    return null
  }

  if (reducedMotion || !supported) return cancel()

  // приховані для очей заголовки (visually-hidden) не анімуємо — їх і так не видно
  const pick = (list) =>
    list.length ? [...document.querySelectorAll(list.join(','))].filter((el) => !el.matches('.visually-hidden')) : []
  const items = new Map()

  pick(up).forEach((el) => items.set(el, distance))
  pick(fade).forEach((el) => items.set(el, 0))

  if (!items.size) return cancel()

  items.forEach((_, el) => el.setAttribute('data-reveal', ''))
  document.documentElement.classList.add('reveal-ready')

  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)'

  const reveal = (el, delay = 0, instant = false) => {
    el.classList.add('is-revealed')
    if (instant) return

    const timing = { delay: delay * 1000, easing: ease, fill: 'backwards' }
    el.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, duration: 900 })

    const y = items.get(el)
    if (y) {
      el.animate([{ translate: `0 ${y}px` }, { translate: '0 0' }], { ...timing, duration: 1200, composite: 'add' })
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      // ті, що з'явились разом, — по черзі зверху вниз, зліва направо
      entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left,
        )
        .forEach((entry, index) => {
          observer.unobserve(entry.target)
          reveal(entry.target, Math.min(index * stagger, maxDelay))
        })

      // вище екрана (сторінку відкрили посередині) — одразу, без анімації
      entries
        .filter((entry) => !entry.isIntersecting && entry.boundingClientRect.bottom < 0)
        .forEach((entry) => {
          observer.unobserve(entry.target)
          reveal(entry.target, 0, true)
        })
    },
    { threshold },
  )

  items.forEach((_, el) => observer.observe(el))

  return observer
}

/**
 * Hero zoom — відео в hero плавно збільшується при скролі (1 → 1.1), як на clay.global.
 * Прив'язка до скролу через ScrollTrigger (scrub). prefers-reduced-motion: без зуму.
 */
function initHeroZoom(options = {}) {
  const { triggerSelector = '.hero', targetSelector = '.hero__video', scale = 1.1 } = options

  const trigger = document.querySelector(triggerSelector)
  const target = document.querySelector(targetSelector)

  if (!trigger || !target || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return null

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(
      target,
      { scale: 1 },
      {
        scale,
        ease: 'none',
        scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true },
      },
    )
  })

  return mm
}

window.initReveal = initReveal
window.initHeroZoom = initHeroZoom
