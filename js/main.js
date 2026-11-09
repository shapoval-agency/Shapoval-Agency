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

  window.app = {
    lenis,
    gsap,
    ScrollTrigger,
    burger,
    problemsAccordion,
    businessValueCards,
  }

  // Swiper — розкоментуй, коли буде розмітка .swiper
  // const swiper = new Swiper('.swiper', {
  //   slidesPerView: 1,
  //   spaceBetween: 20,
  //   loop: true,
  //   pagination: { el: '.swiper-pagination', clickable: true },
  //   navigation: {
  //     nextEl: '.swiper-button-next',
  //     prevEl: '.swiper-button-prev',
  //   },
  // })
})
