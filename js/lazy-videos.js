/**
 * Lazy videos
 * Розмітка:
 *   video[data-lazy-video][muted][loop][playsinline][preload="none"]
 *
 * Поведінка:
 *   - відео не вантажиться, поки картка далеко від екрана;
 *   - підходить до екрана — вантажиться і грає; виходить — ставиться на паузу;
 *   - prefers-reduced-motion: показуємо лише poster, відео не вантажиться.
 */
function initLazyVideos(options = {}) {
  const { selector = '[data-lazy-video]', rootMargin = '200px 0px' } = options

  const videos = [...document.querySelectorAll(selector)]

  if (!videos.length) return null

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  const load = (video) => {
    if (video.dataset.loaded) return
    video.dataset.loaded = 'true'
    video.preload = 'auto'
    video.load()
  }

  const play = (video) => {
    // reduced motion: лишається постер, відео навіть не вантажимо
    if (motionQuery.matches) return

    load(video)

    // autoplay muted дозволений, але play() може бути відхилений (економія батареї тощо)
    video.play().catch(() => {})
  }

  // без IntersectionObserver просто вмикаємо всі
  if (!('IntersectionObserver' in window)) {
    videos.forEach(play)
    return null
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) play(target)
        else target.pause()
      })
    },
    { rootMargin },
  )

  videos.forEach((video) => observer.observe(video))

  motionQuery.addEventListener('change', () => {
    videos.forEach((video) => {
      if (motionQuery.matches) video.pause()
    })
  })

  return observer
}

window.initLazyVideos = initLazyVideos
