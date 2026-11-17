/**
 * Custom select — кастомний випадаючий список поверх нативного <select>
 *
 * Розмітка (пишемо лише нативний select, решту будує скрипт):
 *   <label for="id">…</label>
 *   <select id="id" data-custom-select>…</select>
 *
 * Що будує:
 *   .custom-select                      (+ .is-open, коли список відкритий)
 *     select (hidden)                   — лишається джерелом значення
 *     button.custom-select__btn         — aria-haspopup="listbox", aria-expanded
 *       span.custom-select__value
 *       span.custom-select__icon.icon-namecaret-down
 *     ul.custom-select__list[role=listbox]
 *       li.custom-select__option[role=option]  (+ .is-selected, aria-selected)
 *
 * Вибір записується в нативний select і викликає на ньому подію change —
 * тому інші скрипти (сортування в load-more.js) працюють без змін.
 * Без JS лишається звичайний select.
 *
 * Клавіатура (патерн WAI-ARIA "select-only combobox"):
 *   закрито: Enter / Space / ↓ / ↑ — відкрити
 *   відкрито: ↑ ↓ Home End — пересунути, Enter / Space — вибрати, Esc — закрити, Tab — закрити
 * Клік поза списком закриває його.
 */
function initCustomSelects(options = {}) {
  const { selector = '[data-custom-select]' } = options

  return [...document.querySelectorAll(selector)].map((select, selectIndex) => {
    const uid = select.id || `custom-select-${selectIndex}`
    const label = document.querySelector(`label[for="${select.id}"]`)
    if (label && !label.id) label.id = `${uid}-label`

    const wrapper = document.createElement('div')
    wrapper.className = 'custom-select'

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'custom-select__btn'
    button.id = `${uid}-btn`
    button.setAttribute('aria-haspopup', 'listbox')
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-controls', `${uid}-list`)

    const value = document.createElement('span')
    value.className = 'custom-select__value'
    value.id = `${uid}-value`

    const icon = document.createElement('span')
    icon.className = 'custom-select__icon icon-namecaret-down'
    icon.setAttribute('aria-hidden', 'true')

    button.append(value, icon)
    // скрінрідер читає: "Сортування матеріалів, Спочатку нові"
    button.setAttribute('aria-labelledby', label ? `${label.id} ${value.id}` : value.id)

    const list = document.createElement('ul')
    list.className = 'custom-select__list'
    list.id = `${uid}-list`
    list.setAttribute('role', 'listbox')
    list.tabIndex = -1
    if (label) list.setAttribute('aria-labelledby', label.id)

    const items = [...select.options].map((option, index) => {
      const li = document.createElement('li')
      li.className = 'custom-select__option'
      li.id = `${uid}-option-${index}`
      li.setAttribute('role', 'option')
      li.dataset.value = option.value
      li.textContent = option.textContent
      list.append(li)
      return li
    })

    select.before(wrapper)
    wrapper.append(select, button, list)
    select.hidden = true
    select.tabIndex = -1
    // label тепер фокусує кнопку
    if (label) label.htmlFor = button.id

    let active = select.selectedIndex

    const sync = () => {
      items.forEach((li, index) => {
        const selected = index === select.selectedIndex
        li.classList.toggle('is-selected', selected)
        li.setAttribute('aria-selected', String(selected))
      })
      value.textContent = select.options[select.selectedIndex]?.textContent ?? ''
    }

    const setActive = (index) => {
      active = Math.max(0, Math.min(items.length - 1, index))
      items.forEach((li, i) => li.classList.toggle('is-active', i === active))
      list.setAttribute('aria-activedescendant', items[active].id)
      items[active].scrollIntoView({ block: 'nearest' })
    }

    const isOpen = () => wrapper.classList.contains('is-open')

    const open = () => {
      wrapper.classList.add('is-open')
      button.setAttribute('aria-expanded', 'true')
      setActive(select.selectedIndex)
      list.focus()
    }

    const close = (returnFocus = true) => {
      wrapper.classList.remove('is-open')
      button.setAttribute('aria-expanded', 'false')
      if (returnFocus) button.focus()
    }

    const choose = (index) => {
      if (index !== select.selectedIndex) {
        select.selectedIndex = index
        sync()
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
      close()
    }

    button.addEventListener('click', () => (isOpen() ? close() : open()))

    button.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault()
        open()
      }
    })

    list.addEventListener('keydown', (event) => {
      const keys = {
        ArrowDown: () => setActive(active + 1),
        ArrowUp: () => setActive(active - 1),
        Home: () => setActive(0),
        End: () => setActive(items.length - 1),
        Enter: () => choose(active),
        ' ': () => choose(active),
        Escape: () => close(),
      }
      if (event.key === 'Tab') return close(false)
      if (keys[event.key]) {
        event.preventDefault()
        keys[event.key]()
      }
    })

    list.addEventListener('click', (event) => {
      const li = event.target.closest('.custom-select__option')
      if (li) choose(items.indexOf(li))
    })

    list.addEventListener('pointermove', (event) => {
      const li = event.target.closest('.custom-select__option')
      if (li) setActive(items.indexOf(li))
    })

    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !wrapper.contains(event.target)) close(false)
    })

    // якщо значення змінили ззовні (скрипт / скидання форми)
    select.addEventListener('change', sync)

    sync()

    return { wrapper, open, close }
  })
}

window.initCustomSelects = initCustomSelects
