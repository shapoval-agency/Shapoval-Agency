/**
 * Load more — "Показати ще" для секції "Нові матеріали" (new-materials)
 *
 * Розмітка:
 *   [data-load-more]
 *     [data-load-more-total]        — лічильник "Знайдено матеріалів"
 *     select[data-load-more-sort]   — сортування за датою (new / old)
 *     [data-load-more-list] > article  — картки (дата береться з time[datetime])
 *     button[data-load-more-btn]
 *
 * Фільтр (необов'язково, зараз лише на сторінці кейсів; кнопки можуть бути будь-де на сторінці):
 *   button[data-load-more-filter="brand"][aria-pressed]  — "all" показує всі
 *   article[data-direction="brand"]
 *
 * Спочатку видно перші 6 карток, кожен клік показує ще одну.
 * Решта отримує атрибут hidden (JS додає його сам — без скрипту видно всі картки).
 * Коли показано все — кнопка ховається.
 * Після кліку фокус переходить на посилання нової картки (клавіатура, скрінрідер).
 * Сортування переставляє картки, кількість видимих зберігається.
 * Фільтр показує лише картки напряму і знову починає з 6, лічильник рахує знайдені.
 */
function initLoadMore(options = {}) {
  const { rootSelector = '[data-load-more]', initial = 6, step = 1 } = options

  const root = document.querySelector(rootSelector)

  if (!root) return null

  const list = root.querySelector('[data-load-more-list]')
  const button = root.querySelector('[data-load-more-btn]')
  const sort = root.querySelector('[data-load-more-sort]')
  const total = root.querySelector('[data-load-more-total]')
  const filters = [...document.querySelectorAll('[data-load-more-filter]')]

  if (!list || !button) return null

  let visible = initial
  let filter = 'all'

  const getItems = () => [...list.children]
  const getMatching = () => getItems().filter((item) => filter === 'all' || item.dataset.direction === filter)

  const render = () => {
    const matching = getMatching()
    getItems().forEach((item) => {
      const index = matching.indexOf(item)
      item.hidden = index === -1 || index >= visible
    })
    button.hidden = visible >= matching.length
    if (total) total.textContent = matching.length
  }

  const showMore = () => {
    const first = visible
    visible += step
    render()
    getMatching()[first]?.querySelector('a')?.focus()
  }

  const getTime = (item) => new Date(item.querySelector('time')?.dateTime || 0).getTime()

  const sortItems = (order) => {
    const items = getItems().sort((a, b) => (order === 'old' ? getTime(a) - getTime(b) : getTime(b) - getTime(a)))
    list.append(...items)
    render()
  }

  const setFilter = (value) => {
    filter = value
    visible = initial
    filters.forEach((btn) => {
      const active = btn.dataset.loadMoreFilter === value
      btn.classList.toggle('is-active', active)
      btn.setAttribute('aria-pressed', String(active))
    })
    render()
  }

  button.addEventListener('click', showMore)
  sort?.addEventListener('change', () => sortItems(sort.value))
  filters.forEach((btn) => btn.addEventListener('click', () => setFilter(btn.dataset.loadMoreFilter)))

  render()

  return { showMore, sortItems, setFilter }
}

window.initLoadMore = initLoadMore
