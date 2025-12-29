<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

import { createParticleExperience, type ParticleExperienceControls } from '@/composables/useParticleExperience'
import { startHandTracking, type HandsFrame } from '@/utils/handTracking'

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
const statusText = ref('正在初始化摄像头...')

let experience: ParticleExperienceControls | null = null
let stopTracking: (() => void) | null = null

const handleHands = (frame: HandsFrame) => {
  if (frame.left && frame.left.fingerCount >= 1 && frame.left.fingerCount <= 3) {
    experience?.setGesture(frame.left.fingerCount)
  }
  experience?.updateRightHand(frame.right)
}

const init = async () => {
  if (!videoRef.value || !canvasContainer.value) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    videoRef.value.srcObject = stream

    experience = createParticleExperience(canvasContainer.value)
    stopTracking = await startHandTracking(videoRef.value, handleHands)
    statusText.value = '举起左手做 1/2/3 手势切换文字'
  } catch (error) {
    console.error(error)
    statusText.value = '摄像头访问失败，请检查权限'
  }
}

onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  stopTracking?.()
  experience?.dispose()
  const stream = videoRef.value?.srcObject as MediaStream | null
  stream?.getTracks().forEach((track) => track.stop())
})
</script>

<template>
  <section class="experience">
    <video ref="videoRef" class="experience__camera" autoplay playsinline muted></video>
    <div ref="canvasContainer" class="experience__canvas"></div>
    <div class="experience__hud">
      <p class="status">{{ statusText }}</p>
      <ul>
        <li>左手手指数量：1 → hello，2 → 北航，3 → I Love You</li>
        <li>右手握拳让粒子收缩，张开则扩散</li>
        <li>右手经过粒子，可推拉粒子形成流动</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.experience {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.experience__camera {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.2) blur(1px);
  transform: scaleX(-1);
}

.experience__canvas {
  position: absolute;
  inset: 0;
}

.experience__hud {
  position: absolute;
  bottom: 32px;
  left: 32px;
  max-width: min(480px, 80vw);
  padding: 16px 20px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.55);
  color: #f2f6ff;
  backdrop-filter: blur(10px);
  line-height: 1.6;
}

.experience__hud ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.experience__hud li {
  font-size: 14px;
  margin-bottom: 4px;
}

.status {
  font-size: 16px;
  font-weight: 600;
}
</style>
