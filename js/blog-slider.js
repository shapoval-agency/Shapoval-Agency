/**
 * Blog slider — Swiper для рубрик блогу (block-slider)
 *
 * Розмітка (секцій може бути кілька — кожна ініціалізується окремо):
 *   [data-blog-slider]
 *     button[data-blog-prev]  button[data-blog-next]
 *     .swiper[data-blog-swiper] > .swiper-wrapper > .swiper-slide
 *
 * Ширина слайда — у CSS (.block-slider__slide), Swiper бере її сам (slidesPerView: 'auto').
 * Неактивна кнопка отримує клас is-disabled і атрибут disabled.
 * Якщо всі слайди вміщаються — Swiper вимикається (watchOverflow), кнопки ховаються (swiper-button-lock).
 * prefers-reduced-motion: перемикання без анімації.
 */
function initBlogSliders(options = {}) {
  const { rootSelector = '[data-blog-slider]' } = options

  if (typeof Swiper === 'undefined') return []

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return [...document.querySelectorAll(rootSelector)]
    .map((root) => {
      const container = root.querySelector('[data-blog-swiper]')

      if (!container) return null

      return new Swiper(container, {
        slidesPerView: 'auto',
        spaceBetween: 12,
        speed: reducedMotion ? 0 : 600,
        grabCursor: true,
        watchOverflow: true,
        keyboard: { enabled: true, onlyInViewport: true },
        navigation: {
          prevEl: root.querySelector('[data-blog-prev]'),
          nextEl: root.querySelector('[data-blog-next]'),
          disabledClass: 'is-disabled',
        },
        breakpoints: {
          768: { spaceBetween: 16 },
          1280: { spaceBetween: 24 },
        },
        a11y: {
          enabled: true,
          prevSlideMessage: 'Попередня стаття',
          nextSlideMessage: 'Наступна стаття',
          firstSlideMessage: 'Це перша стаття',
          lastSlideMessage: 'Це остання стаття',
          slideLabelMessage: '{{index}} з {{slidesLength}}',
          containerRoleDescriptionMessage: 'карусель',
          itemRoleDescriptionMessage: 'стаття',
        },
      })
    })
    .filter(Boolean)
}

window.initBlogSliders = initBlogSliders
