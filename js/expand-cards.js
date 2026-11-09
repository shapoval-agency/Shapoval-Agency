/**
 * Expand cards (горизонтальний "акордеон" карток зі скролом)
 * Розмітка:
 *   [data-expand-cards]        — контейнер зі скролом (overflow-x: auto)
 *     .business-value__item    (.is-active — розгорнута картка)
 *
 * Поведінка:
 *   - миша: картка розгортається при ховері, інші згортаються;
 *   - клавіатура: розгортається картка, всередину якої потрапив фокус (Tab на посилання);
 *   - тач: перший тап розгортає картку, посилання спрацьовує лише в розгорнутій.
 *   Одна картка завжди розгорнута.
 *   Після розгортання з клавіатури / тапом картка докручується в зону видимості,
 *   якщо вона вилазить за край контейнера (при ховері — ні, щоб блок не "їхав" під курсором).
 *
 * Скрипт лише перемикає клас. Анімацію (width, opacity) робить CSS.
 */
function initExpandCards(options = {}) {
  const {
    rootSelector = '[data-expand-cards]',
    itemSelector = '.business-value__item',
    activeClass = 'is-active',
    hoverDelay = 80, // мс, щоб картки не "смикались" при швидкому проведенні мишею
    onChange,
  } = options

  const root = document.querySelector(rootSelector)

  if (!root) return null

  const items = [...root.querySelectorAll(itemSelector)]

  if (!items.length) return null

  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  let active = items.find((item) => item.classList.contains(activeClass)) || items[0]
  let hoverTimer = null

  // докручує контейнер, щоб картка була видна повністю
  const revealItem = (item) => {
    const rootRect = root.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const style = getComputedStyle(root)
    const paddingStart = parseFloat(style.paddingLeft) || 0
    const paddingEnd = parseFloat(style.paddingRight) || 0
    let delta = 0

    if (itemRect.left < rootRect.left + paddingStart) {
      delta = itemRect.left - rootRect.left - paddingStart
    } else if (itemRect.right > rootRect.right - paddingEnd) {
      delta = itemRect.right - rootRect.right + paddingEnd
    }

    if (delta) {
      root.scrollBy({ left: delta, behavior: motionQuery.matches ? 'auto' : 'smooth' })
    }
  }

  const setActive = (next, { reveal = false } = {}) => {
    if (next === active) {
      if (reveal) revealItem(next)
      return
    }

    active = next
    items.forEach((item) => item.classList.toggle(activeClass, item === active))
    onChange?.(active)

    if (!reveal) return

    // чекаємо, поки картка розкриється до кінцевої ширини
    const onEnd = (event) => {
      if (event.target !== next || event.propertyName !== 'width') return
      next.removeEventListener('transitionend', onEnd)
      revealItem(next)
    }

    if (motionQuery.matches) revealItem(next)
    else next.addEventListener('transitionend', onEnd)
  }

  items.forEach((item) => item.classList.toggle(activeClass, item === active))

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      if (!hoverQuery.matches) return
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => setActive(item), hoverDelay)
    })

    item.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer)
    })

    item.addEventListener('focusin', (event) => {
      // лише фокус з клавіатури: при тапі focusin приходить раніше за click
      if (!event.target.matches(':focus-visible')) return
      clearTimeout(hoverTimer)
      setActive(item, { reveal: true })
    })

    item.addEventListener('click', (event) => {
      if (item === active) return

      // тап по згорнутій картці: спершу розгортаємо, не переходимо за посиланням
      if (event.target.closest('a[href]')) event.preventDefault()
      setActive(item, { reveal: !hoverQuery.matches })
    })
  })

  return {
    setActive: (index) => items[index] && setActive(items[index], { reveal: true }),
    get active() {
      return active
    },
  }
}

window.initExpandCards = initExpandCards
