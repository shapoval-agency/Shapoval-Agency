/**
 * Services hero 3D — жива 3D-версія картинки services-hero (Three.js r180)
 *
 * Основа — набір hero-3d-developer (рушій, світло, orbit-physics, пауза, економія ресурсів),
 * сцена зібрана під нашу картинку: 5 білих матових куль по колу + 3 рожеві глянцеві супутники.
 *
 * Розмітка:
 *   [data-hero-3d]                      — контейнер (сюди додається canvas)
 *     img                               — картинка: показується першою (LCP) і лишається, якщо 3D немає
 *     button[data-hero-3d-pause]        — необов'язково: кнопка паузи / відтворення (зараз у розмітці немає)
 *
 * Класи:
 *   [data-hero-3d].is-3d-ready          — 3D відмалювалось, canvas проявляється поверх картинки
 *
 * Швидкість сторінки:
 *   Three.js вантажиться лише після події load і коли браузер вільний (requestIdleCallback).
 *   prefers-reduced-motion — Three.js не вантажиться взагалі, лишається картинка.
 *   Рендер зупиняється, коли сцена поза екраном або вкладка прихована.
 *   Немає WebGL або помилка — лишається картинка.
 */
const host = document.querySelector('[data-hero-3d]')

if (host && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
  const boot = () => idle(() => initScene(host), { timeout: 2000 })

  if (document.readyState === 'complete') boot()
  else window.addEventListener('load', boot, { once: true })
}

async function initScene(host) {
  let THREE, stepOrbits

  try {
    THREE = await import('./libs/three/three.module.js')
    ;({ stepOrbits } = await import('./orbit-physics.js'))
  } catch (error) {
    console.error('Services hero 3D: не вдалося завантажити Three.js', error)
    return
  }

  const button = host.querySelector('[data-hero-3d-pause]')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')

  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.75))
    renderer.setClearColor(0xffffff, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Neutral — білі кулі лишаються білими (ACES з набору робив би їх сіруватими)
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.append(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40)

    // дрібне зерно на поверхні, як у наборі (детерміноване, без окремої картинки)
    const size = 256
    const data = new Uint8Array(size * size * 4)
    let seed = 54831
    for (let i = 0; i < size * size; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const v = 55 + (seed >>> 24) * 0.62
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v
      data[i * 4 + 3] = 255
    }
    const grain = new THREE.DataTexture(data, size, size)
    grain.needsUpdate = true
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.repeat.set(2, 1.5)

    // білі матові кулі — кільце з 5 штук
    const pearl = new THREE.MeshPhysicalMaterial({
      color: 0xf1f0f1,
      roughness: 0.88,
      metalness: 0,
      bumpMap: grain,
      bumpScale: 0.035,
      sheen: 0.18,
      sheenColor: 0xf3d2e3,
      sheenRoughness: 0.8,
    })
    const ring = new THREE.Group()
    const ringRadius = 1.3
    const ballGeometry = new THREE.SphereGeometry(0.68, 72, 48)
    const balls = Array.from({ length: 5 }, (_, i) => {
      const mesh = new THREE.Mesh(ballGeometry, pearl)
      const angle = Math.PI / 2 + 0.35 + (i * Math.PI * 2) / 5
      mesh.userData.angle = angle
      mesh.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0)
      ring.add(mesh)
      return mesh
    })
    ring.position.set(-0.55, -0.3, 0)
    scene.add(ring)

    // світло: білий ключ зверху зліва, рожевий відбитий знизу — як на картинці
    scene.add(new THREE.HemisphereLight(0xffffff, 0xf4dbe7, 1.6))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(-3, 4, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffeef6, 0.55)
    fill.position.set(3, -1, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffe3f0, 0.7)
    rim.position.set(2, -3, -3)
    scene.add(rim)

    // рожеві глянцеві супутники; від кожного рожеве світло — відблиски на білих кулях рухаються разом із ними
    const pink = new THREE.MeshPhysicalMaterial({
      color: 0xf7d6e7,
      roughness: 0.4,
      metalness: 0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.35,
      sheen: 0.4,
      sheenColor: 0xffffff,
    })
    const orbit = { x: -0.1, y: 0, rx: 2.2, ry: 1.85, depth: 1.1 }
    const satellites = [0.24, 0.32, 0.32].map((radius, i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 28), pink)
      const light = new THREE.PointLight(0xffa8d2, 1.1, 2.4, 2)
      scene.add(mesh, light)
      // стартові кути ≈ як на картинці: зверху зліва, справа, знизу зліва
      return { mesh, light, angle: [2.25, -0.15, 3.95][i], velocity: [0.19, 0.14, 0.11][i] }
    })

    let time = 0
    let last = performance.now()
    let paused = reduced.matches
    let visible = true
    let frame = 0
    const pointer = new THREE.Vector2()
    const smooth = new THREE.Vector2()

    function resize() {
      const rect = host.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      renderer.setSize(rect.width, rect.height, false)
      camera.aspect = rect.width / rect.height
      camera.position.z = Math.max(9, 7.2 / camera.aspect)
      camera.updateProjectionMatrix()
      draw()
    }

    function draw() {
      const float = Math.sin(time * 0.45) * 0.07
      smooth.lerp(pointer, 0.03)

      // кільце повільно обертається, трохи хитається і реагує на курсор
      ring.position.y = -0.3 + float
      ring.rotation.z = time * 0.06
      ring.rotation.x = Math.sin(time * 0.17) * 0.12 - smooth.y * 0.18
      ring.rotation.y = Math.sin(time * 0.13) * 0.1 + smooth.x * 0.22
      balls.forEach((ball, i) => {
        ball.position.z = Math.sin(time * 0.5 + i * 1.3) * 0.14
        ball.rotation.y = time * 0.05
      })

      for (const s of satellites) {
        const a = s.angle
        s.mesh.position.set(
          orbit.x + Math.cos(a) * orbit.rx,
          orbit.y + Math.sin(a) * orbit.ry + float,
          Math.sin(a + 0.6) * orbit.depth,
        )
        s.light.position.copy(s.mesh.position)
        s.mesh.rotation.y = time * 0.12
      }

      camera.position.x = smooth.x * 0.12
      camera.position.y = smooth.y * 0.09
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }

    const running = () => !paused && visible && !document.hidden

    function tick(now) {
      frame = 0
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (running()) {
        time += dt
        for (let n = 0; n < 4; n++) stepOrbits(satellites, dt / 4)
      }
      draw()
      if (running()) frame = requestAnimationFrame(tick)
    }

    function start() {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      last = performance.now()
      if (running()) frame = requestAnimationFrame(tick)
      else draw()
    }

    function label() {
      if (!button) return
      button.textContent = paused ? 'Відтворити анімацію' : 'Пауза анімації'
    }

    if (button) {
      button.hidden = false
      button.addEventListener('click', () => {
        paused = !paused
        label()
        start()
      })
    }

    reduced.addEventListener('change', () => {
      paused = reduced.matches
      label()
      start()
    })
    document.addEventListener('visibilitychange', start)
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    }).observe(host)
    new ResizeObserver(resize).observe(host)

    host.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || paused) return
      const rect = host.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1))
    })
    host.addEventListener('pointerleave', () => pointer.set(0, 0))

    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      paused = true
      if (frame) cancelAnimationFrame(frame)
      host.classList.remove('is-3d-ready')
      if (button) button.hidden = true
    })

    resize()
    host.classList.add('is-3d-ready')
    label()
    start()
  } catch (error) {
    // немає WebGL — лишається картинка
    console.error('Services hero 3D: fallback на картинку', error)
  }
}
