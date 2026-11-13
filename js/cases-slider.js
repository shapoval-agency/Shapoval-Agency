/**
 * Cases slider — Swiper для секції "Останні кейси" (cases-services)
 *
 * Розмітка:
 *   [data-cases-slider]
 *     button[data-cases-prev]  button[data-cases-next]
 *     .swiper[data-cases-swiper] > .swiper-wrapper > .swiper-slide
 *
 * Ширина слайда — у CSS (.cases-services__slide), Swiper бере її сам (slidesPerView: 'auto').
 * Відступи між слайдами — spaceBetween / breakpoints.
 * Кнопки поза .swiper, щоб їх не обрізав overflow контейнера.
 * Неактивна кнопка отримує клас is-disabled і атрибут disabled.
 * Якщо всі слайди вміщаються — Swiper вимикається (watchOverflow), кнопки ховаються (swiper-button-lock).
 * prefers-reduced-motion: перемикання без анімації.
 *
 * Ховер картки (десктоп, CSS у блоці (min-width: 1280px) and (hover: hover)):
 *   список послуг виїжджає, картинка зменшується на його висоту. Висота списку різна (1–3 рядки),
 *   тому перед показом міряємо її і передаємо в CSS як --cs-list-h на картці.
 */
function initCasesSlider(options = {}) {
  const { rootSelector = '[data-cases-slider]' } = options

  const root = document.querySelector(rootSelector)

  if (!root || typeof Swiper === 'undefined') return null

  const container = root.querySelector('[data-cases-swiper]')

  if (!container) return null

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // висота списку послуг для ховер-анімації картки (міряємо щоразу: шрифти, ширина могли змінитись)
  root.querySelectorAll('.cases-services__card').forEach((card) => {
    const list = card.querySelector('.cases-services__card-list')
    if (!list) return
    // offsetTop не враховує transform (пункти зсунуті на 10px для анімації) — висота без спотворень
    const measure = () => {
      const bottom = Math.max(...[...list.children].map((item) => item.offsetTop + item.offsetHeight))
      card.style.setProperty('--cs-list-h', `${Math.ceil(bottom - list.offsetTop)}px`)
    }
    card.addEventListener('pointerenter', measure)
    card.addEventListener('focus', measure)
  })

  return new Swiper(container, {
    slidesPerView: 'auto',
    spaceBetween: 12,
    speed: reducedMotion ? 0 : 600,
    grabCursor: true,
    watchOverflow: true,
    // клавіатура — лише коли слайдер у полі зору
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: {
      prevEl: root.querySelector('[data-cases-prev]'),
      nextEl: root.querySelector('[data-cases-next]'),
      disabledClass: 'is-disabled',
    },
    breakpoints: {
      768: { spaceBetween: 16 },
      1280: { spaceBetween: 24 },
    },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Попередній кейс',
      nextSlideMessage: 'Наступний кейс',
      firstSlideMessage: 'Це перший кейс',
      lastSlideMessage: 'Це останній кейс',
      slideLabelMessage: '{{index}} з {{slidesLength}}',
      containerRoleDescriptionMessage: 'карусель',
      itemRoleDescriptionMessage: 'кейс',
    },
  })
}

window.initCasesSlider = initCasesSlider
