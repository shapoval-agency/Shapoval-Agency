/**
 * Value chain — підсвітка результатів, пов'язаних з послугою
 *
 * Розмітка:
 *   [data-value-chain]
 *     button[data-value-chain-service][data-value-chain-targets="awareness trust ..."]
 *     [data-value-chain-outcome="awareness"]
 *
 * Зв'язки задаються лише в data-value-chain-targets (ключі через пробіл).
 *
 * Поведінка:
 *   - ховер / фокус на кнопці — попередній перегляд зв'язків;
 *   - клік (тап) — закріплює вибір (aria-pressed), повторний клік або Esc — знімає;
 *   - для скрінрідера кожна кнопка отримує опис "Впливає на: …" (aria-describedby).
 *
 * Класи:
 *   [data-value-chain].is-active          — є активна послуга
 *   .value-chain__service.is-active        — активна послуга
 *   .value-chain__outcome.is-highlighted   — пов'язаний результат
 */
function initValueChain(options = {}) {
  const {
    rootSelector = '[data-value-chain]',
    serviceSelector = '[data-value-chain-service]',
    outcomeSelector = '[data-value-chain-outcome]',
    describePrefix = 'Впливає на:',
  } = options

  const root = document.querySelector(rootSelector)

  if (!root) return null

  const services = [...root.querySelectorAll(serviceSelector)]
  const outcomes = new Map(
    [...root.querySelectorAll(outcomeSelector)].map((el) => [el.dataset.valueChainOutcome, el]),
  )

  const targetsOf = (service) =>
    (service.dataset.valueChainTargets || '').split(/\s+/).filter((key) => outcomes.has(key))

  // описи для скрінрідера
  services.forEach((service, index) => {
    const names = targetsOf(service).map((key) => outcomes.get(key).textContent.trim())
    if (!names.length) return

    const description = document.createElement('span')
    description.className = 'visually-hidden'
    description.id = `value-chain-desc-${index + 1}`
    description.textContent = `${describePrefix} ${names.join(', ')}`
    service.after(description)
    service.setAttribute('aria-describedby', description.id)
  })

  let pinned = null

  const show = (service) => {
    const targets = service ? new Set(targetsOf(service)) : new Set()

    root.classList.toggle('is-active', Boolean(service))
    services.forEach((item) => item.classList.toggle('is-active', item === service))
    outcomes.forEach((el, key) => el.classList.toggle('is-highlighted', targets.has(key)))
  }

  const pin = (service) => {
    pinned = service
    services.forEach((item) => item.setAttribute('aria-pressed', String(item === pinned)))
    show(pinned)
  }

  services.forEach((service) => {
    service.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') show(service)
    })
    service.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') show(pinned)
    })
    service.addEventListener('focus', () => show(service))
    service.addEventListener('blur', () => show(pinned))
    service.addEventListener('click', () => pin(pinned === service ? null : service))
  })

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && pinned) pin(null)
  })

  return {
    select: (key) => pin(services.find((item) => item.dataset.valueChainService === key) || null),
    clear: () => pin(null),
  }
}

window.initValueChain = initValueChain
