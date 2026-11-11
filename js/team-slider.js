/**
 * Team slider — Swiper для секції "Команда"
 *
 * Розмітка:
 *   [data-team-slider]
 *     button[data-team-prev]  button[data-team-next]
 *     .swiper[data-team-swiper] > .swiper-wrapper > .swiper-slide
 *
 * Ширина слайда — у CSS (.team__slide), Swiper бере її сам (slidesPerView: 'auto').
 * Відступи між слайдами — spaceBetween / breakpoints.
 * Кнопки поза .swiper, щоб їх не обрізав overflow контейнера.
 * Неактивна кнопка отримує клас is-disabled і атрибут disabled.
 * Якщо всі слайди вміщаються — Swiper вимикається (watchOverflow), кнопки ховаються (swiper-button-lock).
 * prefers-reduced-motion: перемикання без анімації.
 */
function initTeamSlider(options = {}) {
  const { rootSelector = '[data-team-slider]' } = options

  const root = document.querySelector(rootSelector)

  if (!root || typeof Swiper === 'undefined') return null

  const container = root.querySelector('[data-team-swiper]')

  if (!container) return null

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return new Swiper(container, {
    slidesPerView: 'auto',
    spaceBetween: 12,
    speed: reducedMotion ? 0 : 600,
    grabCursor: true,
    watchOverflow: true,
    // клавіатура — лише коли слайдер у полі зору
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: {
      prevEl: root.querySelector('[data-team-prev]'),
      nextEl: root.querySelector('[data-team-next]'),
      disabledClass: 'is-disabled',
    },
    breakpoints: {
      768: { spaceBetween: 16 },
      1280: { spaceBetween: 48 },
    },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Попередній слайд',
      nextSlideMessage: 'Наступний слайд',
      firstSlideMessage: 'Це перший слайд',
      lastSlideMessage: 'Це останній слайд',
      slideLabelMessage: '{{index}} з {{slidesLength}}',
      containerRoleDescriptionMessage: 'карусель',
      itemRoleDescriptionMessage: 'слайд',
    },
  })
}

window.initTeamSlider = initTeamSlider
