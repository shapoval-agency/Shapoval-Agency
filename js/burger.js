/**
 * Burger menu
 * Розмітка:
 *   button.burger[aria-controls="menu"]
 *   #menu.menu  — верстай сам (100vh / 100%)
 *
 * Класи при відкритті:
 *   body.is-menu-open
 *   .menu.is-open
 *   .burger.is-active
 *
 * .header__actions лишається поверх меню (z-index).
 * .header ховається через body.is-menu-open.
 */
function initBurger(options = {}) {
  const {
    burgerSelector = '.burger',
    menuSelector = '#menu',
    openClass = 'is-open',
    bodyClass = 'is-menu-open',
    activeClass = 'is-active',
    onOpen,
    onClose,
  } = options

  const burger = document.querySelector(burgerSelector)
  const menu = document.querySelector(menuSelector)

  if (!burger || !menu) {
    console.warn('[burger] не знайдено .burger або #menu')
    return null
  }

  const labelOpen = burger.getAttribute('aria-label') || 'Відкрити меню'
  const labelClose = burger.dataset.labelClose || 'Закрити меню'

  let isOpen = false

  const setOpen = (next) => {
    isOpen = next

    burger.classList.toggle(activeClass, isOpen)
    burger.setAttribute('aria-expanded', String(isOpen))
    burger.setAttribute('aria-label', isOpen ? labelClose : labelOpen)

    menu.classList.toggle(openClass, isOpen)
    menu.setAttribute('aria-hidden', String(!isOpen))
    document.body.classList.toggle(bodyClass, isOpen)

    if (isOpen) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }

  const open = () => setOpen(true)
  const close = () => setOpen(false)
  const toggle = () => setOpen(!isOpen)

  burger.addEventListener('click', (event) => {
    event.preventDefault()
    toggle()
  })

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) close()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      close()
      burger.focus()
    }
  })

  setOpen(false)

  return {
    open,
    close,
    toggle,
    get isOpen() {
      return isOpen
    },
  }
}

window.initBurger = initBurger
