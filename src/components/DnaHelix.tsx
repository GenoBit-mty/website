import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function DnaHelix() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 0, 18)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // Colors aligned to the original GenoBit logo mark
    const logoTeal = new THREE.Color('#0A7D7D')
    const logoLightBlue = new THREE.Color('#9FC3DD')
    const logoIndigo = new THREE.Color('#4540A4')

    // DNA parameters
    const helixRadius = 2.8
    const helixHeight = 24
    const turns = 4
    const pointsPerTurn = 20
    const totalPoints = turns * pointsPerTurn
    const basePairFrequency = 3 // every N points

    // Create backbone strand materials
    const strand1Material = new THREE.MeshPhongMaterial({
      color: logoTeal,
      emissive: logoTeal,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.72,
    })

    const strand2Material = new THREE.MeshPhongMaterial({
      color: logoLightBlue,
      emissive: logoLightBlue,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.72,
    })

    // Base pair colors (cycle through logo palette)
    const basePairColors = [logoTeal, logoLightBlue, logoIndigo]

    // DNA group
    const dnaGroup = new THREE.Group()
    scene.add(dnaGroup)

    // Generate helix points and create spheres
    const sphereGeo = new THREE.SphereGeometry(0.18, 12, 12)
    const tubeRadius = 0.06

    const strand1Points: THREE.Vector3[] = []
    const strand2Points: THREE.Vector3[] = []

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints
      const angle = t * turns * Math.PI * 2
      const y = (t - 0.5) * helixHeight

      // Strand 1
      const x1 = Math.cos(angle) * helixRadius
      const z1 = Math.sin(angle) * helixRadius
      strand1Points.push(new THREE.Vector3(x1, y, z1))

      // Strand 2 (offset by PI)
      const x2 = Math.cos(angle + Math.PI) * helixRadius
      const z2 = Math.sin(angle + Math.PI) * helixRadius
      strand2Points.push(new THREE.Vector3(x2, y, z2))

      // Backbone spheres (nucleotide nodes)
      const sphere1 = new THREE.Mesh(sphereGeo, strand1Material)
      sphere1.position.set(x1, y, z1)
      dnaGroup.add(sphere1)

      const sphere2 = new THREE.Mesh(sphereGeo, strand2Material)
      sphere2.position.set(x2, y, z2)
      dnaGroup.add(sphere2)

      // Base pairs (horizontal connections)
      if (i % basePairFrequency === 0 && i > 0 && i < totalPoints) {
        const start = new THREE.Vector3(x1, y, z1)
        const end = new THREE.Vector3(x2, y, z2)
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5)
        const direction = new THREE.Vector3().subVectors(end, start)
        const length = direction.length()

        // Base pair as thin cylinder
        const pairGeo = new THREE.CylinderGeometry(tubeRadius * 0.8, tubeRadius * 0.8, length, 6)
        const colorIdx = (i / basePairFrequency) % basePairColors.length
        const pairMat = new THREE.MeshPhongMaterial({
          color: basePairColors[colorIdx],
          emissive: basePairColors[colorIdx],
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.32,
        })

        const pair = new THREE.Mesh(pairGeo, pairMat)
        pair.position.copy(mid)

        // Orient cylinder to connect the two strands
        const axis = new THREE.Vector3(0, 1, 0)
        const dir = direction.normalize()
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir)
        pair.setRotationFromQuaternion(quaternion)

        dnaGroup.add(pair)

        // Small sphere at midpoint
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

    // Create backbone tubes (smooth curves between spheres)
    const curve1 = new THREE.CatmullRomCurve3(strand1Points)
    const curve2 = new THREE.CatmullRomCurve3(strand2Points)

    const tubeGeo1 = new THREE.TubeGeometry(curve1, totalPoints * 4, tubeRadius, 8, false)
    const tubeGeo2 = new THREE.TubeGeometry(curve2, totalPoints * 4, tubeRadius, 8, false)

    const tube1 = new THREE.Mesh(tubeGeo1, strand1Material)
    const tube2 = new THREE.Mesh(tubeGeo2, strand2Material)

    dnaGroup.add(tube1)
    dnaGroup.add(tube2)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(logoTeal, 1.15, 50)
    pointLight1.position.set(8, 5, 8)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(logoIndigo, 0.85, 50)
    pointLight2.position.set(-8, -5, 8)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(logoLightBlue, 0.6, 50)
    pointLight3.position.set(0, 0, 12)
    scene.add(pointLight3)

    // Floating particles
    const particleCount = 36
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleVelocities: number[] = []

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 24
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 22
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16
      particleVelocities.push(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.004
      )
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: logoIndigo,
      size: 0.06,
      transparent: true,
      opacity: 0.22,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Base orientation
    dnaGroup.rotation.x = 0.12
    dnaGroup.rotation.z = 0.08

    // Mouse interaction state
    const mouseTarget = new THREE.Vector2(0, 0)
    const mouseCurrent = new THREE.Vector2(0, 0)

    const handlePointerMove = (event: MouseEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = (event.clientY / window.innerHeight) * 2 - 1
      mouseTarget.set(nx, ny)
    }

    const handlePointerLeave = () => {
      mouseTarget.set(0, 0)
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseleave', handlePointerLeave)

    // Animation
    const clock = new THREE.Clock()
    let animationId: number

    function animate() {
      animationId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      if (!prefersReducedMotion) {
        // Smoothly follow pointer without abrupt movement
        mouseCurrent.lerp(mouseTarget, 0.045)

        // Keep motion subtle and integrated with the page
        dnaGroup.rotation.y = elapsed * 0.065 + mouseCurrent.x * 0.18
        dnaGroup.rotation.x = 0.12 + mouseCurrent.y * 0.1
        dnaGroup.rotation.z = 0.08 + mouseCurrent.x * 0.05

        // Breathing motion with slight pointer parallax
        dnaGroup.position.y = Math.sin(elapsed * 0.22) * 0.24 + mouseCurrent.y * 0.35
        dnaGroup.position.x = mouseCurrent.x * 0.5

        // Animate particles
        const positions = particleGeo.attributes.position.array as Float32Array
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += particleVelocities[i * 3]
          positions[i * 3 + 1] += particleVelocities[i * 3 + 1]
          positions[i * 3 + 2] += particleVelocities[i * 3 + 2]

          // Wrap around
          if (Math.abs(positions[i * 3]) > 12) particleVelocities[i * 3] *= -1
          if (Math.abs(positions[i * 3 + 1]) > 11) particleVelocities[i * 3 + 1] *= -1
          if (Math.abs(positions[i * 3 + 2]) > 8) particleVelocities[i * 3 + 2] *= -1
        }
        particleGeo.attributes.position.needsUpdate = true

        // Sync lights gently with movement
        pointLight1.position.x = Math.sin(elapsed * 0.3) * 6 + mouseCurrent.x * 3
        pointLight2.position.x = Math.cos(elapsed * 0.22) * 6 - mouseCurrent.x * 2
        pointLight1.position.y = 5 + mouseCurrent.y * 2
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    function handleResize() {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseleave', handlePointerLeave)

      // Dispose geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose()
          }
        }
      })
      particleGeo.dispose()
      particleMat.dispose()

      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="hero-canvas-container"
      aria-hidden="true"
    />
  )
}
