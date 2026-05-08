import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const LOGO_TEAL = new THREE.Color('#0A7D7D')
const LOGO_LIGHT_BLUE = new THREE.Color('#9FC3DD')
const LOGO_INDIGO = new THREE.Color('#4540A4')

const HELIX_RADIUS = 2.8
const HELIX_HEIGHT = 24
const TURNS = 4
const POINTS_PER_TURN = 20
const TOTAL_POINTS = TURNS * POINTS_PER_TURN
const BASE_PAIR_FREQUENCY = 3
const TUBE_RADIUS = 0.06

function buildDnaGroup() {
  const dnaGroup = new THREE.Group()

  const strand1Material = new THREE.MeshPhongMaterial({
    color: LOGO_TEAL,
    emissive: LOGO_TEAL,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.72,
  })
  const strand2Material = new THREE.MeshPhongMaterial({
    color: LOGO_LIGHT_BLUE,
    emissive: LOGO_LIGHT_BLUE,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.72,
  })

  const basePairColors = [LOGO_TEAL, LOGO_LIGHT_BLUE, LOGO_INDIGO]

  const sphereGeo = new THREE.SphereGeometry(0.18, 12, 12)

  const strand1Points: Array<THREE.Vector3> = []
  const strand2Points: Array<THREE.Vector3> = []

  for (let i = 0; i <= TOTAL_POINTS; i++) {
    const t = i / TOTAL_POINTS
    const angle = t * TURNS * Math.PI * 2
    const y = (t - 0.5) * HELIX_HEIGHT

    const x1 = Math.cos(angle) * HELIX_RADIUS
    const z1 = Math.sin(angle) * HELIX_RADIUS
    strand1Points.push(new THREE.Vector3(x1, y, z1))

    const x2 = Math.cos(angle + Math.PI) * HELIX_RADIUS
    const z2 = Math.sin(angle + Math.PI) * HELIX_RADIUS
    strand2Points.push(new THREE.Vector3(x2, y, z2))

    const sphere1 = new THREE.Mesh(sphereGeo, strand1Material)
    sphere1.position.set(x1, y, z1)
    dnaGroup.add(sphere1)

    const sphere2 = new THREE.Mesh(sphereGeo, strand2Material)
    sphere2.position.set(x2, y, z2)
    dnaGroup.add(sphere2)

    if (i % BASE_PAIR_FREQUENCY === 0 && i > 0 && i < TOTAL_POINTS) {
      const start = new THREE.Vector3(x1, y, z1)
      const end = new THREE.Vector3(x2, y, z2)
      const mid = new THREE.Vector3().lerpVectors(start, end, 0.5)
      const direction = new THREE.Vector3().subVectors(end, start)
      const length = direction.length()

      const pairGeo = new THREE.CylinderGeometry(TUBE_RADIUS * 0.8, TUBE_RADIUS * 0.8, length, 6)
      const colorIdx = (i / BASE_PAIR_FREQUENCY) % basePairColors.length
      const pairMat = new THREE.MeshPhongMaterial({
        color: basePairColors[colorIdx],
        emissive: basePairColors[colorIdx],
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.32,
      })

      const pair = new THREE.Mesh(pairGeo, pairMat)
      pair.position.copy(mid)

      const axis = new THREE.Vector3(0, 1, 0)
      const dir = direction.normalize()
      const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir)
      pair.setRotationFromQuaternion(quaternion)
      dnaGroup.add(pair)

      const midSphereGeo = new THREE.SphereGeometry(0.1, 8, 8)
      const midSphereMat = new THREE.MeshPhongMaterial({
        color: basePairColors[colorIdx],
        emissive: basePairColors[colorIdx],
        emissiveIntensity: 0.22,
        transparent: true,
        opacity: 0.42,
      })
      const midSphere = new THREE.Mesh(midSphereGeo, midSphereMat)
      midSphere.position.copy(mid)
      dnaGroup.add(midSphere)
    }
  }

  const curve1 = new THREE.CatmullRomCurve3(strand1Points)
  const curve2 = new THREE.CatmullRomCurve3(strand2Points)

  const tubeGeo1 = new THREE.TubeGeometry(curve1, TOTAL_POINTS * 4, TUBE_RADIUS, 8, false)
  const tubeGeo2 = new THREE.TubeGeometry(curve2, TOTAL_POINTS * 4, TUBE_RADIUS, 8, false)
  dnaGroup.add(new THREE.Mesh(tubeGeo1, strand1Material))
  dnaGroup.add(new THREE.Mesh(tubeGeo2, strand2Material))

  dnaGroup.rotation.x = 0.12
  dnaGroup.rotation.z = 0.08
  return dnaGroup
}

function buildLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
  const pointLight1 = new THREE.PointLight(LOGO_TEAL, 1.15, 50)
  pointLight1.position.set(8, 5, 8)
  const pointLight2 = new THREE.PointLight(LOGO_INDIGO, 0.85, 50)
  pointLight2.position.set(-8, -5, 8)
  const pointLight3 = new THREE.PointLight(LOGO_LIGHT_BLUE, 0.6, 50)
  pointLight3.position.set(0, 0, 12)
  return { ambientLight, pointLight1, pointLight2, pointLight3 }
}

function buildParticles() {
  const particleCount = 36
  const particleGeo = new THREE.BufferGeometry()
  const particlePositions = new Float32Array(particleCount * 3)
  const particleVelocities: Array<number> = []
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 24
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 22
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16
    particleVelocities.push(
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004,
    )
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: LOGO_INDIGO,
    size: 0.06,
    transparent: true,
    opacity: 0.22,
    sizeAttenuation: true,
  })
  const particles = new THREE.Points(particleGeo, particleMat)
  return { particles, particleGeo, particleMat, particleVelocities, particleCount }
}

function tickParticles(
  particleGeo: THREE.BufferGeometry,
  particleVelocities: Array<number>,
  particleCount: number,
) {
  const positions = particleGeo.attributes.position.array as Float32Array
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] += particleVelocities[i * 3]
    positions[i * 3 + 1] += particleVelocities[i * 3 + 1]
    positions[i * 3 + 2] += particleVelocities[i * 3 + 2]
    if (Math.abs(positions[i * 3]) > 12) particleVelocities[i * 3] *= -1
    if (Math.abs(positions[i * 3 + 1]) > 11) particleVelocities[i * 3 + 1] *= -1
    if (Math.abs(positions[i * 3 + 2]) > 8) particleVelocities[i * 3 + 2] *= -1
  }
  particleGeo.attributes.position.needsUpdate = true
}

function disposeScene(
  scene: THREE.Scene,
  particleGeo: THREE.BufferGeometry,
  particleMat: THREE.Material,
) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (obj.material instanceof THREE.Material) obj.material.dispose()
    }
  })
  particleGeo.dispose()
  particleMat.dispose()
}

export function DnaHelix() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 0, 18)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const dnaGroup = buildDnaGroup()
    scene.add(dnaGroup)

    const { ambientLight, pointLight1, pointLight2, pointLight3 } = buildLights()
    scene.add(ambientLight, pointLight1, pointLight2, pointLight3)

    const { particles, particleGeo, particleMat, particleVelocities, particleCount } =
      buildParticles()
    scene.add(particles)

    const mouseTarget = new THREE.Vector2(0, 0)
    const mouseCurrent = new THREE.Vector2(0, 0)
    const handlePointerMove = (event: MouseEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = (event.clientY / window.innerHeight) * 2 - 1
      mouseTarget.set(nx, ny)
    }
    const handlePointerLeave = () => mouseTarget.set(0, 0)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseleave', handlePointerLeave)

    const clock = new THREE.Clock()
    let animationId = 0
    function animate() {
      animationId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      if (!prefersReducedMotion) {
        mouseCurrent.lerp(mouseTarget, 0.045)
        dnaGroup.rotation.y = elapsed * 0.065 + mouseCurrent.x * 0.18
        dnaGroup.rotation.x = 0.12 + mouseCurrent.y * 0.1
        dnaGroup.rotation.z = 0.08 + mouseCurrent.x * 0.05
        dnaGroup.position.y = Math.sin(elapsed * 0.22) * 0.24 + mouseCurrent.y * 0.35
        dnaGroup.position.x = mouseCurrent.x * 0.5
        tickParticles(particleGeo, particleVelocities, particleCount)
        pointLight1.position.x = Math.sin(elapsed * 0.3) * 6 + mouseCurrent.x * 3
        pointLight2.position.x = Math.cos(elapsed * 0.22) * 6 - mouseCurrent.x * 2
        pointLight1.position.y = 5 + mouseCurrent.y * 2
      }
      renderer.render(scene, camera)
    }
    animate()

    function handleResize() {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseleave', handlePointerLeave)
      disposeScene(scene, particleGeo, particleMat)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1] print:hidden [&>canvas]:h-full [&>canvas]:w-full [&>canvas]:opacity-85"
      aria-hidden="true"
    />
  )
}
