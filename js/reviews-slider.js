/**
 * Reviews slider — Swiper у режимі fade для секції "Відгуки"
 *
 * Розмітка:
 *   [data-reviews-slider]
 *     button[data-reviews-prev]  [data-reviews-counter]  button[data-reviews-next]
 *     .swiper[data-reviews-swiper] > .swiper-wrapper > .swiper-slide
 *
 * Лічильник "01 / 15" рахується сам з кількості слайдів.
 * Для скрінрідера він прихований: слайди і так підписані "1 з 15" (a11y Swiper).
 * Неактивні слайди отримують inert: у fade вони лише прозорі,
 * і без цього Tab потрапляв би на невидимі посилання.
 * Неактивна кнопка отримує клас is-disabled і атрибут disabled.
 * prefers-reduced-motion: перемикання без анімації.
 */
function initReviewsSlider(options = {}) {
  const { rootSelector = '[data-reviews-slider]' } = options

  const root = document.querySelector(rootSelector)

  if (!root || typeof Swiper === 'undefined') return null

  const container = root.querySelector('[data-reviews-swiper]')

  if (!container) return null

  const counter = root.querySelector('[data-reviews-counter]')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pad = (n) => String(n).padStart(2, '0')

  const sync = (swiper) => {
    swiper.slides.forEach((slide, index) => {
      slide.inert = index !== swiper.activeIndex
    })

    if (counter) counter.textContent = `${pad(swiper.activeIndex + 1)} / ${pad(swiper.slides.length)}`
  }

  return new Swiper(container, {
    effect: 'fade',
    // crossFade: старий слайд зникає, а не лишається під новим
    fadeEffect: { crossFade: true },
    slidesPerView: 1,
    speed: reducedMotion ? 0 : 600,
    watchOverflow: true,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: {
      prevEl: root.querySelector('[data-reviews-prev]'),
      nextEl: root.querySelector('[data-reviews-next]'),
      disabledClass: 'is-disabled',
    },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Попередній відгук',
      nextSlideMessage: 'Наступний відгук',
      firstSlideMessage: 'Це перший відгук',
      lastSlideMessage: 'Це останній відгук',
      slideLabelMessage: '{{index}} з {{slidesLength}}',
      containerRoleDescriptionMessage: 'карусель',
      itemRoleDescriptionMessage: 'відгук',
    },
    on: {
      init: sync,
      slideChange: sync,
      slidesLengthChange: sync,
    },
  })
}

window.initReviewsSlider = initReviewsSlider
