import * as THREE from 'three'
import { textToPositions } from '@/utils/textToPositions'

const gestureTextMap: Record<number, string> = {
  1: 'hello',
  2: '北航',
  3: 'I Love You',
}

interface Options {
  particleCount?: number
}

export interface ParticleExperienceControls {
  setGesture(gesture: number): void
  updateRightHand(hand?: { state: 'fist' | 'open'; center: { x: number; y: number; z: number } }): void
  dispose(): void
}

export function createParticleExperience(container: HTMLElement, options: Options = {}): ParticleExperienceControls {
  const particleCount = options.particleCount ?? 22000

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1500)
  camera.position.z = 420

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)
  const targets = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const idx = i * 3
    positions[idx] = (Math.random() - 0.5) * 600
    positions[idx + 1] = (Math.random() - 0.5) * 600
    positions[idx + 2] = (Math.random() - 0.5) * 600

    targets[idx] = positions[idx] ?? 0
    targets[idx + 1] = positions[idx + 1] ?? 0
    targets[idx + 2] = positions[idx + 2] ?? 0
  }

  const positionAttribute = new THREE.BufferAttribute(positions, 3)
  geometry.setAttribute('position', positionAttribute)

  const material = new THREE.PointsMaterial({
    size: 3,
    transparent: true,
    opacity: 0.85,
    color: new THREE.Color(0x66ccff),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener('resize', resize)

  let animationFrame = 0
  let contraction = 1
  let rightHandCenter: { x: number; y: number; z: number } | null = null
  const clock = new THREE.Clock()

  const retarget = (source: Float32Array) => {
    if (source.length === 0) return
    const chunk = Math.max(1, Math.floor(source.length / 3))
    for (let i = 0; i < particleCount; i++) {
      const srcIdx = (i % chunk) * 3
      const dst = i * 3
      const sx = source[srcIdx] ?? 0
      const sy = source[srcIdx + 1] ?? 0
      const sz = source[srcIdx + 2] ?? 0
      targets[dst] = sx
      targets[dst + 1] = sy
      targets[dst + 2] = sz
    }
  }

  const setGesture = (gesture: number) => {
    const text = gestureTextMap[gesture]
    if (!text) return
    const data = textToPositions(text)
    retarget(data)
  }

  const updateRightHand = (hand?: { state: 'fist' | 'open'; center: { x: number; y: number; z: number } }) => {
    if (!hand) {
      contraction = 1
      rightHandCenter = null
      return
    }

    contraction = hand.state === 'fist' ? 0.4 : 1.25
    rightHandCenter = hand.center
  }

  const animate = () => {
    const dt = Math.min(clock.getDelta(), 0.05)
    const positionArray = positionAttribute.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3
      const targetX = targets[idx] ?? 0
      const targetY = targets[idx + 1] ?? 0
      const targetZ = targets[idx + 2] ?? 0
      const currentX = positionArray[idx] ?? 0
      const currentY = positionArray[idx + 1] ?? 0
      const currentZ = positionArray[idx + 2] ?? 0

      const tx = targetX * contraction
      const ty = targetY * contraction
      const tz = targetZ * contraction

      let vx = (velocities[idx] ?? 0) + (tx - currentX) * 0.18 * dt
      let vy = (velocities[idx + 1] ?? 0) + (ty - currentY) * 0.18 * dt
      let vz = (velocities[idx + 2] ?? 0) + (tz - currentZ) * 0.18 * dt

      if (rightHandCenter) {
        const hx = (rightHandCenter.x - 0.5) * 700
        const hy = (0.5 - rightHandCenter.y) * 500
        const hz = (0.5 - rightHandCenter.z) * 800

        const dx = currentX - hx
        const dy = currentY - hy
        const dz = currentZ - hz
        const distSq = dx * dx + dy * dy + dz * dz + 0.5
        const force = 2000 / distSq
        const invLen = 1 / Math.sqrt(distSq)

        vx += (dx * invLen) * force * dt
        vy += (dy * invLen) * force * dt
        vz += (dz * invLen) * force * dt
      }

      vx *= 0.88
      vy *= 0.88
      vz *= 0.88

      velocities[idx] = vx
      velocities[idx + 1] = vy
      velocities[idx + 2] = vz

      positionArray[idx] = currentX + vx
      positionArray[idx + 1] = currentY + vy
      positionArray[idx + 2] = currentZ + vz
    }

    positionAttribute.needsUpdate = true
    renderer.render(scene, camera)
    animationFrame = requestAnimationFrame(animate)
  }

  animationFrame = requestAnimationFrame(animate)

  return {
    setGesture,
    updateRightHand,
    dispose: () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      renderer.domElement.parentNode?.removeChild(renderer.domElement)
    },
  }
}
