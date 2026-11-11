document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger)

  const lenis = new Lenis({
    autoRaf: false,
  })

  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })

  gsap.ticker.lagSmoothing(0)

  Fancybox.bind('[data-fancybox]', {})

  const burger = initBurger({
    onOpen: () => {
      lenis.stop()
    },
    onClose: () => {
      lenis.start()
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

  window.app = {
    lenis,
    gsap,
    ScrollTrigger,
    burger,
    problemsAccordion,
    businessValueCards,
    cases,
    valueChain,
    teamSlider,
    reviewsSlider,
  }
})
