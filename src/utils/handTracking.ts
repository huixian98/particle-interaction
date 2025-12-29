import { Hands, type NormalizedLandmark, type Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export interface HandInfo {
  fingerCount: number
  state: 'fist' | 'open'
  center: { x: number; y: number; z: number }
}

export interface HandsFrame {
  left?: HandInfo
  right?: HandInfo
}

const fingerTips = [8, 12, 16, 20]

const distance = (
  a?: Results['multiHandLandmarks'][number][number],
  b?: Results['multiHandLandmarks'][number][number]
) => {
  if (!a || !b) return 0
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

const isFingerUp = (landmarks: NormalizedLandmark[], tip: number, base: number) => {
  const tipPoint = landmarks?.[tip]
  const basePoint = landmarks?.[base]
  if (!tipPoint || !basePoint) return false
  return tipPoint.y < basePoint.y - 0.02
}

const getFingerCount = (landmarks: NormalizedLandmark[]) =>
  fingerTips.reduce((count, tip) => count + (isFingerUp(landmarks, tip, tip - 2) ? 1 : 0), 0)

const getHandState = (landmarks: NormalizedLandmark[], fingerCount: number) => {
  if (fingerCount >= 3) return 'open'
  if (fingerCount <= 1) return 'fist'
  const palmWidth = distance(landmarks?.[5], landmarks?.[17]) || 1
  const avgTipCurl =
    fingerTips.reduce((sum, tip) => sum + distance(landmarks?.[tip], landmarks?.[tip - 2]), 0) / fingerTips.length

  return avgTipCurl < palmWidth * 0.35 ? 'fist' : 'open'
}

const getCenter = (landmarks: NormalizedLandmark[]) => {
  if (!landmarks.length) return { x: 0, y: 0, z: 0 }

  const center = landmarks.reduce(
    (sum, point) => {
      sum.x += point.x
      sum.y += point.y
      sum.z += point.z
      return sum
    },
    { x: 0, y: 0, z: 0 }
  )

  center.x /= landmarks.length
  center.y /= landmarks.length
  center.z /= landmarks.length

  return center
}

export async function startHandTracking(
  video: HTMLVideoElement,
  onFrame: (frame: HandsFrame) => void
): Promise<() => void> {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  })

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  })

  hands.onResults((results) => {
    const frame: HandsFrame = {}

    results.multiHandLandmarks?.forEach((landmarks, index) => {
      const label = results.multiHandedness?.[index]?.label
      const fingerCount = getFingerCount(landmarks)
      const info: HandInfo = {
        fingerCount,
        state: getHandState(landmarks, fingerCount),
        center: getCenter(landmarks),
      }

      if (label === 'Left') frame.left = info
      else if (label === 'Right') frame.right = info
    })

    onFrame(frame)
  })

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video })
    },
    width: 1280,
    height: 720,
  })

  await camera.start()

  return () => {
    camera.stop()
    hands.close()
  }
}
