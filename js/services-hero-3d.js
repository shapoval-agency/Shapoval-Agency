/**
 * Services hero 3D — жива 3D-версія картинки services-hero (Three.js r180)
 *
 * Основа — набір hero-3d-developer (рушій, світло, orbit-physics, пауза, економія ресурсів),
 * сцена зібрана під нашу картинку: 5 білих матових куль по колу + 3 рожеві глянцеві супутники.
 *
 * Розмітка (контейнерів може бути кілька — у кожного своя сцена):
 *   [data-hero-3d]                      — контейнер (сюди додається canvas), картинки-заглушки немає
 *   [data-hero-3d="hex"]                — варіант сцени: шестикутники (digital)
 *   [data-hero-3d="asterisk"]           — варіант сцени: зірочки (content); порожньо — кулі (marketing)
 *     button[data-hero-3d-pause]        — необов'язково: кнопка паузи / відтворення (зараз у розмітці немає)
 *
 * Класи:
 *   [data-hero-3d].is-3d-ready          — 3D відмалювалось, canvas плавно проявляється
 *
 * Виліт за межі блоку:
 *   [data-hero-3d-bleed="0.5"]          — canvas більший за блок на 50% з кожного боку, камера відсувається
 *                                         так само (кулі того ж розміру). Обрізає вже секція (overflow: hidden)
 *
 * Швидкість сторінки:
 *   Three.js вантажиться лише після події load, коли браузер вільний (requestIdleCallback),
 *   і коли блок підходить до екрана.
 *   prefers-reduced-motion — сцена вантажиться, але показує один статичний кадр (без руху).
 *   Рендер зупиняється, коли сцена поза екраном або вкладка прихована.
 *   Немає WebGL або помилка — блок лишається порожнім.
 */
// може бути кілька сцен на сторінці (services-hero, application) — Three.js вантажиться один раз
const hosts = [...document.querySelectorAll('[data-hero-3d]')]

if (hosts.length) {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))

  // кожна сцена стартує, коли її блок підходить до екрана (hero — одразу, application — біля форми)
  const boot = () =>
    idle(
      () => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(({ target, isIntersecting }) => {
              if (!isIntersecting) return
              observer.unobserve(target)
              initScene(target)
            })
          },
          { rootMargin: '300px 0px' },
        )
        hosts.forEach((host) => observer.observe(host))
      },
      { timeout: 2000 },
    )

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

    // виліт canvas за межі блоку (частка розміру з кожного боку)
    // getAttribute, а не dataset: дефіс перед цифрою (-3d) dataset не перетворює на camelCase
    const bleed = Math.max(0, parseFloat(host.getAttribute('data-hero-3d-bleed')) || 0)
    if (bleed) {
      // width/height теж задаємо: у CSS canvas має 100%, і це перебило б розтягування через inset
      Object.assign(renderer.domElement.style, {
        top: `-${bleed * 100}%`,
        left: `-${bleed * 100}%`,
        width: `${(1 + bleed * 2) * 100}%`,
        height: `${(1 + bleed * 2) * 100}%`,
        maxWidth: 'none', // reset.css обмежує canvas до 100% ширини
      })
    }

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

    // вміст сцени (об'єкти, світло, супутники, рух) — за варіантом: data-hero-3d="hex" або порожньо (кулі)
    const build = SCENES[host.getAttribute('data-hero-3d')] || SCENES.balls
    const { satellites, orbit, update } = build(THREE, scene, grain)

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
      const scale = 1 + bleed * 2
      renderer.setSize(rect.width * scale, rect.height * scale, false)
      camera.aspect = rect.width / rect.height
      // з вильотом canvas більший — камера далі на стільки ж, щоб кулі лишились того ж розміру
      camera.position.z = Math.max(9, 7.2 / camera.aspect) * scale
      camera.updateProjectionMatrix()
      draw()
    }

    function draw() {
      const float = Math.sin(time * 0.45) * 0.07
      smooth.lerp(pointer, 0.03)

      // головний об'єкт: обертається, хитається, реагує на курсор
      update(time, float, smooth)

      for (const s of satellites) {
        const a = s.angle
        s.mesh.position.set(
          orbit.x + Math.cos(a) * orbit.rx,
          orbit.y + Math.sin(a) * orbit.ry + float,
          Math.sin(a + 0.6) * orbit.depth,
        )
        s.light.position.copy(s.mesh.position)
        s.mesh.rotation.y = time * 0.12 + (s.phase || 0)
        s.mesh.rotation.x = s.tilt ? Math.sin(time * 0.2 + s.angle) * s.tilt : 0
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
    // немає WebGL — блок лишається порожнім
    console.error('Services hero 3D: WebGL недоступний', error)
  }
}

/* ==================== Варіанти сцени ====================
   Кожен збирач додає в сцену об'єкти й світло і повертає:
   satellites — супутники для orbit-physics, orbit — форма орбіти, update(time, float, smooth) — рух головного об'єкта */
const SCENES = {
  // marketing: 5 білих матових куль по колу + 3 рожеві глянцеві кулі-супутники
  balls(THREE, scene, grain) {
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
      mesh.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0)
      ring.add(mesh)
      return mesh
    })
    ring.position.set(-0.55, -0.3, 0)
    scene.add(ring)

    // світло: білий ключ зверху зліва, рожевий відбитий знизу — як на картинці
    addLights(THREE, scene, { ground: 0xf4dbe7, fill: 0xffeef6, rim: 0xffe3f0 })

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
    const satellites = [0.24, 0.32, 0.32].map((radius, i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 28), pink)
      const light = new THREE.PointLight(0xffa8d2, 1.1, 2.4, 2)
      scene.add(mesh, light)
      // стартові кути ≈ як на картинці: зверху зліва, справа, знизу зліва
      return { mesh, light, angle: [2.25, -0.15, 3.95][i], velocity: [0.19, 0.14, 0.11][i] }
    })

    return {
      satellites,
      orbit: { x: -0.1, y: 0, rx: 2.2, ry: 1.85, depth: 1.1 },
      update(time, float, smooth) {
        // кільце повільно обертається, трохи хитається і реагує на курсор
        ring.position.y = -0.3 + float
        ring.rotation.z = time * 0.06
        ring.rotation.x = Math.sin(time * 0.17) * 0.12 - smooth.y * 0.18
        ring.rotation.y = Math.sin(time * 0.13) * 0.1 + smooth.x * 0.22
        balls.forEach((ball, i) => {
          ball.position.z = Math.sin(time * 0.5 + i * 1.3) * 0.14
          ball.rotation.y = time * 0.05
        })
      },
    }
  },

  // digital: великий білий матовий шестикутник із заокругленими гранями + 3 лавандові шестикутники-супутники
  hex(THREE, scene, grain) {
    const white = new THREE.MeshPhysicalMaterial({
      color: 0xf6f6f7,
      roughness: 0.86,
      metalness: 0,
      bumpMap: grain,
      bumpScale: 0.03,
      sheen: 0.12,
      sheenColor: 0xe2dcff,
      sheenRoughness: 0.8,
    })
    const main = new THREE.Mesh(roundedHexGeometry(THREE, { radius: 2.05, corner: 0.42, depth: 0.5, bevel: 0.16 }), white)
    main.position.set(-0.6, -0.25, 0)
    scene.add(main)

    // світло: білий ключ зверху зліва, лавандовий відбитий знизу й по краю
    addLights(THREE, scene, { ground: 0xf0eefa, fill: 0xf4f2ff, rim: 0xd8d0ff, sky: 1.95 })

    // лавандові напівглянцеві супутники; від кожного лавандове світло ковзає гранями великого шестикутника
    const lavender = new THREE.MeshPhysicalMaterial({
      color: 0xd8d2fb,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.4,
      sheen: 0.3,
      sheenColor: 0xffffff,
    })
    const satellites = [0.22, 0.28, 0.28].map((radius, i) => {
      const geometry = roundedHexGeometry(THREE, { radius, corner: radius * 0.22, depth: radius * 0.55, bevel: radius * 0.12 })
      const mesh = new THREE.Mesh(geometry, lavender)
      const light = new THREE.PointLight(0xb7a8ff, 0.9, 2.4, 2)
      scene.add(mesh, light)
      // стартові кути ≈ як на картинці: зверху зліва, справа, знизу зліва
      return { mesh, light, angle: [2.3, -0.1, 3.95][i], velocity: [0.19, 0.14, 0.11][i], tilt: 0.35 }
    })

    return {
      satellites,
      orbit: { x: -0.1, y: 0, rx: 2.35, ry: 2.0, depth: 1.4 },
      update(time, float, smooth) {
        // повернутий трохи боком (видно товщину праворуч, як на картинці), повільно хитається і реагує на курсор
        main.position.y = -0.25 + float
        main.rotation.y = -0.38 + Math.sin(time * 0.2) * 0.14 + smooth.x * 0.22
        main.rotation.x = 0.12 + Math.sin(time * 0.17) * 0.08 - smooth.y * 0.18
        main.rotation.z = Math.sin(time * 0.11) * 0.05
      },
    }
  },

  // content: велика біла матова зірочка (6 заокруглених променів) + 3 м'ятні зірочки-супутники
  asterisk(THREE, scene, grain) {
    const white = new THREE.MeshPhysicalMaterial({
      color: 0xf7f8f7,
      roughness: 0.86,
      metalness: 0,
      bumpMap: grain,
      bumpScale: 0.03,
      sheen: 0.08,
      sheenColor: 0xd3f3e2,
      sheenRoughness: 0.8,
    })
    const main = new THREE.Mesh(asteriskGeometry(THREE, { length: 1.9, width: 1.14, tip: 0.24, depth: 0.55, bevel: 0.16 }), white)
    main.position.set(0, -0.32, 0)
    scene.add(main)

    // світло: білий ключ зверху зліва, м'ятний відбитий знизу й по краю
    addLights(THREE, scene, { ground: 0xf2f9f5, fill: 0xf4fbf7, rim: 0xc9efdb, sky: 1.95 })

    // м'ятні напівглянцеві супутники; від кожного м'ятне світло ковзає променями великої зірочки
    const mint = new THREE.MeshPhysicalMaterial({
      color: 0xb4ecd0,
      roughness: 0.45,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.45,
      sheen: 0.3,
      sheenColor: 0xffffff,
    })
    const satellites = [0.3, 0.24, 0.34].map((length, i) => {
      const geometry = asteriskGeometry(THREE, { length, width: length * 0.6, tip: length * 0.13, depth: length * 0.4, bevel: length * 0.09 })
      const mesh = new THREE.Mesh(geometry, mint)
      const light = new THREE.PointLight(0x8fe3b8, 0.9, 2.4, 2)
      scene.add(mesh, light)
      // стартові кути ≈ як на картинці: зверху (ребром), зліва, знизу праворуч
      return {
        mesh,
        light,
        angle: [1.35, 3.35, 5.15][i],
        velocity: [0.19, 0.14, 0.11][i],
        tilt: 0.3,
        phase: [1.35, 0, 0.5][i],
      }
    })

    return {
      satellites,
      // орбіта витягнута вертикально — супутники зверху й знизу, як на картинці
      orbit: { x: 0, y: -0.3, rx: 2.35, ry: 2.45, depth: 1.4 },
      update(time, float, smooth) {
        // повернута трохи боком (видно товщину праворуч), повільно хитається і реагує на курсор
        main.position.y = -0.32 + float
        main.rotation.y = -0.34 + Math.sin(time * 0.2) * 0.14 + smooth.x * 0.22
        main.rotation.x = 0.1 + Math.sin(time * 0.17) * 0.08 - smooth.y * 0.18
        main.rotation.z = Math.sin(time * 0.11) * 0.05
      },
    }
  },
}

// спільне світло сцен: м'яке небо/земля, білий ключ зверху зліва, заповнення і контурне
function addLights(THREE, scene, { ground, fill, rim, sky = 1.6 }) {
  scene.add(new THREE.HemisphereLight(0xffffff, ground, sky))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(-3, 4, 5)
  scene.add(key)
  const fillLight = new THREE.DirectionalLight(fill, 0.55)
  fillLight.position.set(3, -1, 3)
  scene.add(fillLight)
  const rimLight = new THREE.DirectionalLight(rim, 0.7)
  rimLight.position.set(2, -3, -3)
  scene.add(rimLight)
}

// заокруглений багатокутник, видавлений у 3D: points — вершини по колу, radii — радіус заокруглення кожної вершини
function roundedPolygonGeometry(THREE, points, radii, { depth, bevel }) {
  const shape = new THREE.Shape()
  const n = points.length
  points.forEach((p, i) => {
    const prev = points[(i + n - 1) % n]
    const next = points[(i + 1) % n]
    // радіус не більший за половину сусідніх ребер — щоб заокруглення не перехльостувались
    const r = Math.min(radii[i], prev.distanceTo(p) / 2, next.distanceTo(p) / 2)
    const from = p.clone().add(prev.clone().sub(p).setLength(r))
    const to = p.clone().add(next.clone().sub(p).setLength(r))
    if (i === 0) shape.moveTo(from.x, from.y)
    else shape.lineTo(from.x, from.y)
    shape.quadraticCurveTo(p.x, p.y, to.x, to.y)
  })
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 8,
  })
  geometry.center()
  return geometry
}

// шестикутна "таблетка": вершиною догори, заокруглені кути (corner) і м'яка фаска граней (bevel)
function roundedHexGeometry(THREE, { radius, corner, depth, bevel }) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 3
    return new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius)
  })
  return roundedPolygonGeometry(THREE, points, points.map(() => corner), { depth, bevel })
}

// зірочка з 6 променів (як іконка Asterisk): length — від центру до краю променя, width — ширина променя,
// tip — заокруглення кінчиків; внутрішні кути між променями заокруглені трохи
function asteriskGeometry(THREE, { length, width, tip, depth, bevel }) {
  const w = width / 2
  const points = []
  const radii = []
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 3
    const dir = new THREE.Vector2(Math.cos(a), Math.sin(a))
    const side = new THREE.Vector2(-dir.y, dir.x)
    // внутрішній кут між попереднім і цим променем: на бісектрисі, на відстані w / sin(30°) = 2w
    const inner = a - Math.PI / 6
    points.push(new THREE.Vector2(Math.cos(inner) * 2 * w, Math.sin(inner) * 2 * w))
    radii.push(w * 0.18)
    // кінчик променя: два кути
    points.push(dir.clone().multiplyScalar(length).add(side.clone().multiplyScalar(-w)))
    radii.push(tip)
    points.push(dir.clone().multiplyScalar(length).add(side.clone().multiplyScalar(w)))
    radii.push(tip)
  }
  return roundedPolygonGeometry(THREE, points, radii, { depth, bevel })
}
