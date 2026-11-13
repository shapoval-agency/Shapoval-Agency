/**
 * Accordion (hover + click + keyboard)
 * Розмітка:
 *   [data-accordion]
 *     .problems__item
 *       button.problems__item-button[aria-expanded][aria-controls]
 *       .problems__item-panel#id
 *
 * Поведінка:
 *   - пристрої з мишею: розкриття при ховері (з невеликою затримкою), клік мишею лише відкриває;
 *   - тач-пристрої: розкриття / закриття по тапу;
 *   - клавіатура: Enter / Space на кнопці перемикає пункт;
 *   - одночасно відкритий лише один пункт.
 *
 * Клас при відкритті: .problems__item.is-open
 * Анімація висоти — через GSAP, CSS для роботи не потрібен.
 *
 * Вимкнений режим: якщо акордеон усередині staticSelector (за замовчуванням .process),
 * він не запускається — усі пункти відкриті (.is-open), кнопки стають span з тими ж класами
 * (без "кнопка, згорнуто" для скрінрідера), у панелей прибирається role="region".
 * Корінь отримує клас .is-static.
 */
function initAccordion(options = {}) {
  const {
    rootSelector = '[data-accordion]',
    itemSelector = '.problems__item',
    buttonSelector = '.problems__item-button',
    panelSelector = '.problems__item-panel',
    openClass = 'is-open',
    staticSelector = '.process', // усередині такого контейнера акордеон вимкнено
    initialOpen = 0, // індекс відкритого пункту при завантаженні, null — всі закриті
    hoverDelay = 120, // мс, щоб пункти не "блимали" при швидкому проведенні мишею
    duration = 0.45,
    ease = 'power2.out',
    onChange,
  } = options

  // усі акордеони на сторінці (напр. на marketing.html: process — вимкнений, faq — робочий)
  const controllers = [...document.querySelectorAll(rootSelector)]
    .map((root) => {
      if (staticSelector && root.closest(staticSelector)) {
        makeStatic(root, { itemSelector, buttonSelector, panelSelector, openClass })
        return null
      }
      return setupAccordion(root, { itemSelector, buttonSelector, panelSelector, openClass, initialOpen, hoverDelay, duration, ease, onChange })
    })
    .filter(Boolean)

  if (!controllers.length) return null

  // API першого акордеона (як було), решта — в .all
  return Object.assign(controllers[0], { all: controllers })
}

function setupAccordion(root, { itemSelector, buttonSelector, panelSelector, openClass, initialOpen, hoverDelay, duration, ease, onChange }) {
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  const items = [...root.querySelectorAll(itemSelector)]
    .map((el) => ({
      el,
      button: el.querySelector(buttonSelector),
      panel: el.querySelector(panelSelector),
      isOpen: false,
    }))
    .filter((item) => item.button && item.panel)

  let hoverTimer = null

  const setOpen = (item, next, animate = true) => {
    if (item.isOpen === next) return

    item.isOpen = next
    item.el.classList.toggle(openClass, next)
    item.button.setAttribute('aria-expanded', String(next))
    // закрита панель не отримує фокус і не читається скрінрідером
    item.panel.inert = !next

    gsap.killTweensOf(item.panel)
    gsap.to(item.panel, {
      height: next ? 'auto' : 0,
      duration: animate && !motionQuery.matches ? duration : 0,
      ease,
      overwrite: true,
      onComplete: () => onChange?.(item.el, next),
    })
  }

  const open = (target) => {
    items.forEach((item) => setOpen(item, item === target))
  }

  const toggle = (target) => {
    if (target.isOpen) setOpen(target, false)
    else open(target)
  }

  items.forEach((item, index) => {
    gsap.set(item.panel, { height: 0, overflow: 'hidden' })
    item.panel.inert = true
    item.button.setAttribute('aria-expanded', 'false')

    if (index === initialOpen) setOpen(item, true, false)

    item.el.addEventListener('mouseenter', () => {
      if (!hoverQuery.matches) return
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => open(item), hoverDelay)
    })

    item.el.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer)
    })

    item.button.addEventListener('click', (event) => {
      // event.detail === 0 — клік з клавіатури (Enter / Space)
      const isMouseClick = event.detail > 0

      if (hoverQuery.matches && isMouseClick) {
        clearTimeout(hoverTimer)
        open(item)
      } else {
        toggle(item)
      }
    })
  })

  return {
    open: (index) => items[index] && open(items[index]),
    close: (index) => items[index] && setOpen(items[index], false),
    closeAll: () => items.forEach((item) => setOpen(item, false)),
  }
}

// вимкнений акордеон: звичайний список, усе відкрито
function makeStatic(root, { itemSelector, buttonSelector, panelSelector, openClass }) {
  root.classList.add('is-static')

  root.querySelectorAll(itemSelector).forEach((item) => {
    item.classList.add(openClass)

    const button = item.querySelector(buttonSelector)
    if (button) {
      const span = document.createElement('span')
      span.className = button.className
      span.append(...button.childNodes)
      button.replaceWith(span)
    }

    const panel = item.querySelector(panelSelector)
    if (panel) {
      panel.removeAttribute('role')
      panel.removeAttribute('aria-labelledby')
      panel.inert = false
    }
  })
}

window.initAccordion = initAccordion
