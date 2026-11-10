/**
 * Cases — анімації карток кейсів
 *
 * 1. Поява при скролі: картка виринає знизу, обкладинка розкривається з scale(.92),
 *    відео всередині водночас стискається з scale(1.07) — ефект "вікна".
 *    Клас .is-visible на .cases__card (стилі — в CSS).
 * 2. Світіння: під обкладинкою розмитий canvas, на який при ховері малюються кадри відео
 *    (кольоровий ореол, як ambient-підсвітка). Canvas крихітний (32×18), тому це дешево.
 * 3. Курсор-плашка "Дивитись кейс": над обкладинкою системний курсор ховається,
 *    плашка плавно їде за мишею (gsap.quickTo).
 *
 * Пункти 2 і 3 — лише для пристроїв з мишею. prefers-reduced-motion: картки показуються
 * одразу, світіння і плашка вимкнені.
 */
function initCases(options = {}) {
  const {
    rootSelector = '.cases',
    cardSelector = '.cases__card',
    mediaSelector = '.cases__media',
    videoSelector = '.cases__video',
    cursorText = 'Дивитись кейс',
    visibleClass = 'is-visible',
    hoverClass = 'is-hovered',
  } = options

  const root = document.querySelector(rootSelector)

  if (!root) return null

  const cards = [...root.querySelectorAll(cardSelector)]

  if (!cards.length) return null

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')

  // без JS картки видно одразу; анімацію появи вмикаємо лише коли скрипт працює
  root.classList.add('is-ready')

  /* ---------- 1. Поява при скролі ---------- */

  // ховер вмикаємо лише коли картка доїхала, інакше він перебиває появу і блок смикається
  const revealDuration = 1300
  const reveal = (card, instant = false) => {
    card.classList.add(visibleClass)
    setTimeout(() => {
      card._revealed = true
      card.dispatchEvent(new Event('cases:revealed'))
    }, instant ? 0 : revealDuration)
  }

  if (motionQuery.matches || !('IntersectionObserver' in window)) {
    cards.forEach((card) => reveal(card, true))
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return
          reveal(target)
          observer.unobserve(target)
        })
      },
      { rootMargin: '0px 0px -15% 0px' },
    )

    cards.forEach((card) => revealObserver.observe(card))
  }

  if (!pointerQuery.matches || motionQuery.matches) return { cards }

  /* ---------- 2. Світіння ---------- */

  const glowLoop = (card) => {
    const { video, canvas, ctx } = card._cases

    const draw = () => {
      if (!card.classList.contains(hoverClass)) return

      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      card._cases.raf = requestAnimationFrame(draw)
    }

    draw()
  }

  /* ---------- 3. Курсор-плашка ---------- */

  const cursor = document.createElement('div')
  cursor.className = 'cases__cursor'
  cursor.setAttribute('aria-hidden', 'true')
  cursor.textContent = cursorText
  root.append(cursor)

  const moveX = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3.out' })
  const moveY = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3.out' })
  let cursorPlaced = false

  const placeCursor = (event) => {
    // перше наведення — ставимо одразу, без "підльоту" з кута екрана
    if (!cursorPlaced) {
      gsap.set(cursor, { x: event.clientX, y: event.clientY })
      cursorPlaced = true
    }

    moveX(event.clientX)
    moveY(event.clientY)
  }

  /* ---------- Події ---------- */

  cards.forEach((card) => {
    const media = card.querySelector(mediaSelector)
    const video = card.querySelector(videoSelector)

    if (!media) return

    let ctx = null
    const canvas = document.createElement('canvas')
    canvas.className = 'cases__glow'
    canvas.width = 32
    canvas.height = 18
    canvas.setAttribute('aria-hidden', 'true')
    media.before(canvas)

    try {
      ctx = canvas.getContext('2d')
    } catch {
      ctx = null
    }

    card._cases = { video, canvas, ctx, raf: 0 }

    let isPointerOver = false

    const activate = () => {
      if (!card._revealed || !isPointerOver || card.classList.contains(hoverClass)) return
      // світіння лежить рівно під обкладинкою
      canvas.style.height = `${media.offsetHeight}px`
      card.classList.add(hoverClass)
      if (video && ctx) glowLoop(card)
    }

    media.addEventListener('pointerenter', (event) => {
      isPointerOver = true
      root.classList.add('is-cursor-visible')
      placeCursor(event)
      activate()
    })

    media.addEventListener('pointermove', placeCursor)

    media.addEventListener('pointerleave', () => {
      isPointerOver = false
      card.classList.remove(hoverClass)
      root.classList.remove('is-cursor-visible')
      cancelAnimationFrame(card._cases.raf)
    })

    // курсор уже над карткою, коли вона доїхала — вмикаємо ховер м'яко
    card.addEventListener('cases:revealed', activate)
  })

  return { cards, cursor }
}

window.initCases = initCases
