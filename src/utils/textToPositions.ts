const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!

canvas.width = 1024
canvas.height = 256

interface TextToPositionsOptions {
  fontSize?: number
  fontFamily?: string
  density?: number
}

export function textToPositions(
  text: string,
  { fontSize = 200, fontFamily = '600 sans-serif', density = 4 }: TextToPositionsOptions = {}
): Float32Array {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const positions: number[] = []
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  for (let y = 0; y < canvas.height; y += density) {
    for (let x = 0; x < canvas.width; x += density) {
      const alpha = data[(y * canvas.width + x) * 4 + 3] ?? 0
      if (alpha > 32) {
        positions.push((x - canvas.width / 2) * 0.6)
        positions.push((canvas.height / 2 - y) * 0.6)
        positions.push((Math.random() - 0.5) * 6)
      }
    }
  }

  return new Float32Array(positions)
}
