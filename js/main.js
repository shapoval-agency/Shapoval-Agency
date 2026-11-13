document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger)

  // Lenis — лише на десктопі з мишею і не в Safari:
  //   - мобілки / планшети (тач): нативний скрол із інерцією кращий;
  //   - Safari: власний плавний скрол трекпада, з Lenis він "пливе" і смикається;
  //   - prefers-reduced-motion: без згладжування.
  // Без Lenis ScrollTrigger працює на нативному скролі, нічого більше не треба.
  const isSafari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent)
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const lenis = isSafari || isTouch || reducedMotion ? null : new Lenis({ autoRaf: false })

  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
  }

  gsap.ticker.lagSmoothing(0)

  // поява елементів при скролі + зум відео в hero (як на clay.global).
  // На самому початку: hero прихований з <head>, тож reveal має запуститись, навіть якщо щось нижче впаде
  const reveal = initReveal()
  const heroZoom = initHeroZoom()

  const burger = initBurger({
    // без Lenis скрол блокує body.is-menu-open { overflow: hidden }
    onOpen: () => {
      lenis?.stop()
    },
    onClose: () => {
      lenis?.start()
    },
  })

  const problemsAccordion = initAccordion({
    rootSelector: '.problems__accordion',
    // висота секції змінилась — перераховуємо тригери нижче по сторінці
    onChange: () => ScrollTrigger.refresh(),
  })

  const businessValueCards = initExpandCards({
    rootSelector: '.business-value__list',
  })

  // кейси: відео вантажаться і грають лише біля екрана
  initLazyVideos()

  // кейси: поява при скролі, світіння і курсор-плашка (як у clay.global)
  const cases = initCases()

  // value-chain: підсвітка результатів, пов'язаних з послугою
  const valueChain = initValueChain()

  // about: лічильники рахують від 0, коли з'являються на екрані
  initCounters()

  // team: слайдер команди
  const teamSlider = initTeamSlider()

  // reviews: слайдер відгуків (fade)
  const reviewsSlider = initReviewsSlider()

  // footer: виїжджає з-під контенту при скролі (як на awsmd.com)
  const footerReveal = initFooterReveal()

  // кейси на сторінках послуг (скрипт підключений лише там, де є секція)
  const casesSlider = window.initCasesSlider?.() ?? null

  // маска телефону у формі заявки (скрипт підключений лише там, де є форма)
  const phoneMask = window.initPhoneMask?.() ?? null

  window.app = {
    lenis,
    phoneMask,
    casesSlider,
    gsap,
    ScrollTrigger,
    burger,
    problemsAccordion,
    businessValueCards,
    cases,
    valueChain,
    teamSlider,
    reviewsSlider,
    footerReveal,
    reveal,
    heroZoom,
  }
})
