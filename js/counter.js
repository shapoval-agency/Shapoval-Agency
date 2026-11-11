/**
 * Counter — числа рахують від 0 до значення, коли з'являються на екрані
 *
 * Розмітка:
 *   <span data-counter="300" data-counter-suffix="+" aria-hidden="true">300+</span>
 *   <span class="visually-hidden">300+</span>
 *
 *   data-counter         — кінцеве число (обов'язково)
 *   data-counter-prefix  — текст перед числом (необов'язково)
 *   data-counter-suffix  — текст після числа, напр. "+" (необов'язково)
 *   data-counter-duration — тривалість у секундах (необов'язково, за замовчуванням 2)
 *
 * У HTML одразу стоїть кінцеве значення: без JS, для пошуковиків і скрінрідерів
 * (вони читають прихований дублікат, тому не чують проміжних чисел).
 * prefers-reduced-motion: число одразу кінцеве, без анімації.
 */
function initCounters(options = {}) {
  // threshold, а не від'ємний rootMargin: інакше лічильник у самому низу сторінки ніколи не стартує
  const { selector = '[data-counter]', duration = 2, threshold = 0.6 } = options

  const counters = [...document.querySelectorAll(selector)]

  if (!counters.length) return null

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const formatter = new Intl.NumberFormat('uk-UA')

  const render = (el, value) => {
    const { counterPrefix = '', counterSuffix = '' } = el.dataset
    el.textContent = `${counterPrefix}${formatter.format(value)}${counterSuffix}`
  }

  const run = (el) => {
    const target = Number(el.dataset.counter) || 0
    const time = Number(el.dataset.counterDuration) || duration
    const state = { value: 0 }

    gsap.to(state, {
      value: target,
      duration: time,
      ease: 'expo.out',
      onUpdate: () => render(el, Math.round(state.value)),
      onComplete: () => render(el, target),
    })
  }

  if (motionQuery.matches || !('IntersectionObserver' in window)) {
    counters.forEach((el) => render(el, Number(el.dataset.counter) || 0))
    return null
  }

  // до появи на екрані показуємо 0, щоб рахунок почався з нуля
  counters.forEach((el) => render(el, 0))

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return
        observer.unobserve(target)
        run(target)
      })
    },
    { threshold },
  )

  counters.forEach((el) => observer.observe(el))

  return observer
}

window.initCounters = initCounters
