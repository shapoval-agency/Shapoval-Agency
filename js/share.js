/**
 * Share — кнопка "Поділитися" на сторінці статті
 *
 * Розмітка:
 *   button[data-share]
 *   [data-share-status][role="status"]  — повідомлення для скрінрідера (visually-hidden)
 *
 * Телефони / Safari: системне меню "Поділитися" (navigator.share).
 * Решта: посилання копіюється в буфер, кнопка на 2 с отримує клас is-copied,
 * скрінрідер чує "Посилання скопійовано".
 */
function initShare(options = {}) {
  const { selector = '[data-share]' } = options

  const button = document.querySelector(selector)

  if (!button) return null

  const status = document.querySelector('[data-share-status]')
  let timer

  const announce = (text) => {
    if (!status) return
    status.textContent = text
    clearTimeout(timer)
    timer = setTimeout(() => {
      status.textContent = ''
      button.classList.remove('is-copied')
    }, 2000)
  }

  // Clipboard API, а якщо недоступний (http, старий браузер) — через тимчасове поле
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const field = document.createElement('textarea')
      field.value = text
      field.setAttribute('readonly', '')
      field.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.append(field)
      field.select()
      const ok = document.execCommand('copy')
      field.remove()
      button.focus()
      return ok
    }
  }

  button.addEventListener('click', async () => {
    const data = { title: document.title, url: location.href }

    if (navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        // користувач закрив меню — нічого не робимо
      }
      return
    }

    if ((await copyText(data.url)) === false) {
      announce('Не вдалося скопіювати посилання')
      return
    }
    button.classList.add('is-copied')
    announce('Посилання скопійовано')
  })

  return button
}

window.initShare = initShare
