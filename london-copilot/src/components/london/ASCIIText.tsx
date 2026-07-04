'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { LED_CREAM, LED_CREAM_RGB } from '@/components/london/londonTheme'

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uWaveStrength;

void main() {
    vUv = uv;
    float time = uTime * 4.5;

    vec3 transformed = position;

    transformed.x += sin(time + position.y * 1.4) * 0.55 * uWaveStrength;
    transformed.y += cos(time * 0.9 + position.z * 1.2) * 0.18 * uWaveStrength;
    transformed.z += sin(time * 1.1 + position.x * 1.3) * 0.9 * uWaveStrength;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    vec4 tex = texture2D(uTexture, vUv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

    float shimmer = sin(vUv.x * 16.0 + uTime * 2.8) * sin(vUv.y * 11.0 - uTime * 2.1) * 0.18;
    float pulse = 0.9 + sin(uTime * 2.0) * 0.1;

    vec3 ink = vec3(0.04, 0.04, 0.035);
    vec3 cream = vec3(0.992, 0.984, 0.831);
    vec3 white = vec3(1.0, 1.0, 0.98);

    vec3 mid = mix(cream, white, smoothstep(0.4, 0.88, lum + shimmer));
    vec3 col = mix(ink, mid, smoothstep(0.06, 0.58, lum + shimmer * 0.65));

    gl_FragColor = vec4(col * pulse, tex.a);
}
`

class AsciiFilter {
  renderer: THREE.WebGLRenderer
  domElement: HTMLDivElement
  pre: HTMLPreElement
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  invert: boolean
  fontSize: number
  fontFamily: string
  charset: string
  accentColor: string
  accentColorRgb: string
  animationTime = 0
  width = 0
  height = 0
  cols = 0
  rows = 0

  constructor(
    renderer: THREE.WebGLRenderer,
    { fontSize, fontFamily, charset, invert, accentColor, accentColorRgb }: {
      fontSize?: number
      fontFamily?: string
      charset?: string
      invert?: boolean
      accentColor?: string
      accentColorRgb?: string
    } = {},
  ) {
    this.renderer = renderer
    this.domElement = document.createElement('div')
    this.domElement.style.position = 'absolute'
    this.domElement.style.top = '0'
    this.domElement.style.left = '0'
    this.domElement.style.width = '100%'
    this.domElement.style.height = '100%'

    this.pre = document.createElement('pre')
    this.domElement.appendChild(this.pre)

    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2d context')
    this.context = ctx
    this.domElement.appendChild(this.canvas)

    this.invert = invert ?? true
    this.fontSize = fontSize ?? 12
    this.fontFamily = fontFamily ?? "'Courier New', monospace"
    this.charset =
      charset ?? ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
    this.accentColor = accentColor ?? LED_CREAM
    this.accentColorRgb = accentColorRgb ?? LED_CREAM_RGB

    this.context.imageSmoothingEnabled = false
  }

  setSize(width: number, height: number) {
    this.width = width
    this.height = height
    this.renderer.setSize(width, height)
    this.reset()
  }

  reset() {
    this.context.font = `${this.fontSize}px ${this.fontFamily}`
    const charWidth = this.context.measureText('A').width

    this.cols = Math.floor(this.width / (this.fontSize * (charWidth / this.fontSize)))
    this.rows = Math.floor(this.height / this.fontSize)

    this.canvas.width = this.cols
    this.canvas.height = this.rows
    this.pre.style.fontFamily = this.fontFamily
    this.pre.style.fontSize = `${this.fontSize}px`
    this.pre.style.margin = '0'
    this.pre.style.padding = '0'
    this.pre.style.lineHeight = '1em'
    this.pre.style.position = 'absolute'
    this.pre.style.left = '0'
    this.pre.style.top = '0'
    this.pre.style.zIndex = '9'
    this.pre.style.color = '#fdfbd4'
  }

  private colorForCell(gray: number, x: number, y: number, time: number): string {
    const wave =
      Math.sin(time * 2.2 + x * 0.42 + y * 0.31) * 0.5 +
      Math.sin(time * 1.6 - x * 0.2 + y * 0.45) * 0.25 +
      0.5

    if (gray < 0.34) {
      const v = 0.03 + wave * 0.09
      return `rgb(${Math.floor(v * 255)}, ${Math.floor(v * 250)}, ${Math.floor(v * 230)})`
    }

    if (gray < 0.68) {
      const pulse = 0.78 + wave * 0.22
      return `rgb(${Math.floor(253 * pulse)}, ${Math.floor(251 * pulse)}, ${Math.floor(212 * pulse)})`
    }

    const pulse = 0.85 + wave * 0.15
    return `rgb(${Math.floor(255 * pulse)}, ${Math.floor(255 * pulse)}, ${Math.floor(248 * pulse)})`
  }

  render(scene: THREE.Scene, camera: THREE.Camera, time = 0) {
    this.animationTime = time
    this.renderer.render(scene, camera)

    const w = this.canvas.width
    const h = this.canvas.height
    this.context.clearRect(0, 0, w, h)
    if (w && h) {
      this.context.drawImage(this.renderer.domElement, 0, 0, w, h)
    }

    this.asciify(this.context, w, h)
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!w || !h) return

    const imgData = ctx.getImageData(0, 0, w, h).data
    const time = this.animationTime
    let html = ''
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = x * 4 + y * 4 * w
        const r = imgData[i] ?? 0
        const g = imgData[i + 1] ?? 0
        const b = imgData[i + 2] ?? 0
        const a = imgData[i + 3] ?? 0

        if (a === 0) {
          html += ' '
          continue
        }

        const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255
        let idx = Math.floor((1 - gray) * (this.charset.length - 1))
        if (this.invert) idx = this.charset.length - idx - 1
        const ch = this.charset[idx] ?? ' '
        const color = this.colorForCell(gray, x, y, time)
        const shadow =
          gray > 0.55
            ? 'text-shadow:0 0 6px rgba(253,251,212,0.35),0 0 14px rgba(255,255,255,0.2);'
            : ''
        html += `<span style="color:${color};${shadow}">${ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch}</span>`
      }
      html += '\n'
    }
    this.pre.innerHTML = html
  }
}

class CanvasTxt {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  txt: string
  fontSize: number
  fontFamily: string
  color: string
  font: string

  constructor(
    txt: string,
    { fontSize = 200, fontFamily = 'Arial', color = '#fdf9f3' }: {
      fontSize?: number
      fontFamily?: string
      color?: string
    } = {},
  ) {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2d context')
    this.context = ctx
    this.txt = txt
    this.fontSize = fontSize
    this.fontFamily = fontFamily
    this.color = color
    this.font = `600 ${this.fontSize}px ${this.fontFamily}`
  }

  resize() {
    this.context.font = this.font
    const metrics = this.context.measureText(this.txt)

    const textWidth = Math.ceil(metrics.width) + 20
    const textHeight =
      Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 20

    this.canvas.width = textWidth
    this.canvas.height = textHeight
  }

  render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.fillStyle = this.color
    this.context.font = this.font

    const metrics = this.context.measureText(this.txt)
    const yPos = 10 + metrics.actualBoundingBoxAscent

    this.context.fillText(this.txt, 10, yPos)
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  get texture() {
    return this.canvas
  }
}

type CanvAsciiOptions = {
  text: string
  asciiFontSize: number
  textFontSize: number
  textColor: string
  planeBaseHeight: number
  enableWaves: boolean
  waveStrength: number
}

class CanvAscii {
  textString: string
  asciiFontSize: number
  textFontSize: number
  textColor: string
  planeBaseHeight: number
  container: HTMLElement
  width: number
  height: number
  enableWaves: boolean
  waveStrength: number

  camera: THREE.PerspectiveCamera
  scene: THREE.Scene

  textCanvas!: CanvasTxt
  texture!: THREE.CanvasTexture
  geometry!: THREE.PlaneGeometry
  material!: THREE.ShaderMaterial
  mesh!: THREE.Mesh
  renderer!: THREE.WebGLRenderer
  filter!: AsciiFilter
  animationFrameId = 0
  planeWidth = 0
  planeHeight = 0
  fitScale = 1

  constructor(
    { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves, waveStrength }: CanvAsciiOptions,
    containerElem: HTMLElement,
    width: number,
    height: number,
  ) {
    this.textString = text
    this.asciiFontSize = asciiFontSize
    this.textFontSize = textFontSize
    this.textColor = textColor
    this.planeBaseHeight = planeBaseHeight
    this.container = containerElem
    this.width = width
    this.height = height
    this.enableWaves = enableWaves
    this.waveStrength = waveStrength

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.camera.position.z = 30

    this.scene = new THREE.Scene()
  }

  async init() {
    try {
      await document.fonts.load('600 200px "IBM Plex Mono"')
      await document.fonts.load('500 12px "IBM Plex Mono"')
    } catch {
      /* fallback fonts */
    }
    await document.fonts.ready

    this.setMesh()
    this.setRenderer()
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: 'IBM Plex Mono',
      color: this.textColor,
    })
    this.textCanvas.resize()
    this.textCanvas.render()

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture)
    this.texture.minFilter = THREE.NearestFilter

    const textAspect = this.textCanvas.width / this.textCanvas.height
    const baseH = this.planeBaseHeight
    this.planeWidth = baseH * textAspect
    this.planeHeight = baseH

    this.geometry = new THREE.PlaneGeometry(this.planeWidth, this.planeHeight, 36, 36)
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: this.texture },
        uWaveStrength: { value: this.enableWaves ? this.waveStrength : 0.0 },
      },
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.rotation.set(0, 0, 0)
    this.scene.add(this.mesh)
    this.fitMeshToView()
  }

  /** Scale text plane so the full string fits inside the camera frustum. */
  fitMeshToView() {
    if (!this.mesh || this.planeWidth <= 0 || this.planeHeight <= 0) return

    const vFovRad = (this.camera.fov * Math.PI) / 180
    const dist = this.camera.position.z
    const visibleH = 2 * Math.tan(vFovRad / 2) * dist
    const visibleW = visibleH * this.camera.aspect

    const waveMargin = this.enableWaves ? 0.84 : 0.94
    const scaleW = (visibleW * waveMargin) / this.planeWidth
    const scaleH = (visibleH * 0.9) / this.planeHeight
    this.fitScale = Math.min(1, scaleW, scaleH)
    this.mesh.scale.set(this.fitScale, this.fitScale, 1)
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    this.renderer.setPixelRatio(1)
    this.renderer.setClearColor(0x000000, 0)

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: 'IBM Plex Mono',
      fontSize: this.asciiFontSize,
      invert: true,
      accentColor: this.textColor,
    })

    this.container.appendChild(this.filter.domElement)
    this.setSize(this.width, this.height)
  }

  setSize(w: number, h: number) {
    this.width = w
    this.height = h

    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()

    this.fitMeshToView()
    this.filter.setSize(w, h)
  }

  load() {
    this.animate()
  }

  animate() {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame)
      this.render()
    }
    animateFrame()
  }

  render() {
    const time = Date.now() * 0.001

    this.textCanvas.render()
    this.texture.needsUpdate = true
    this.material.uniforms.uTime!.value = time

    if (this.enableWaves) {
      const breathe = 1 + Math.sin(time * 1.2) * 0.012
      const s = this.fitScale * breathe
      this.mesh.scale.set(s, s, 1)
    } else {
      this.mesh.scale.set(this.fitScale, this.fitScale, 1)
    }

    this.filter.render(this.scene, this.camera, time)
  }

  clear() {
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.material.dispose()
        obj.geometry.dispose()
      }
    })
    this.scene.clear()
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId)
    if (this.filter) {
      if (this.filter.domElement.parentNode) {
        this.container.removeChild(this.filter.domElement)
      }
    }
    this.clear()
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.forceContextLoss()
    }
  }
}

export interface ASCIITextProps {
  text?: string
  asciiFontSize?: number
  textFontSize?: number
  textColor?: string
  planeBaseHeight?: number
  enableWaves?: boolean
  waveStrength?: number
}

export default function ASCIIText({
  text = 'London Copilot',
  asciiFontSize = 8,
  textFontSize = 200,
  textColor = '#ffffff',
  planeBaseHeight = 8,
  enableWaves = true,
  waveStrength = 0.38,
}: ASCIITextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const asciiRef = useRef<CanvAscii | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let observer: IntersectionObserver | null = null
    let ro: ResizeObserver | null = null

    const attachResizeObserver = (container: HTMLElement, instance: CanvAscii) => {
      const ro = new ResizeObserver(entries => {
        if (!entries[0] || !asciiRef.current) return
        const { width: w, height: h } = entries[0].contentRect
        if (w > 0 && h > 0) {
          asciiRef.current.setSize(w, h)
        }
      })
      ro.observe(container)
      return ro
    }

    const createAndInit = async (container: HTMLElement, w: number, h: number) => {
      const instance = new CanvAscii(
        { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves, waveStrength },
        container,
        w,
        h,
      )
      await instance.init()
      return instance
    }

    const setup = async () => {
      const container = containerRef.current
      if (!container) return

      const { width, height } = container.getBoundingClientRect()

      if (width === 0 || height === 0) {
        observer = new IntersectionObserver(
          async ([entry]) => {
            if (cancelled || !entry) return
            if (entry.isIntersecting && entry.boundingClientRect.width > 0 && entry.boundingClientRect.height > 0) {
              const { width: w, height: h } = entry.boundingClientRect
              observer?.disconnect()
              observer = null

              if (!cancelled) {
                asciiRef.current = await createAndInit(container, w, h)
                if (!cancelled && asciiRef.current) {
                  asciiRef.current.load()
                  ro = attachResizeObserver(container, asciiRef.current)
                }
              }
            }
          },
          { threshold: 0.1 },
        )
        observer.observe(container)
        return
      }

      asciiRef.current = await createAndInit(container, width, height)
      if (!cancelled && asciiRef.current) {
        asciiRef.current.load()
        ro = attachResizeObserver(container, asciiRef.current)
      }
    }

    setup()

    return () => {
      cancelled = true
      observer?.disconnect()
      ro?.disconnect()
      if (asciiRef.current) {
        asciiRef.current.dispose()
        asciiRef.current = null
      }
    }
  }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves, waveStrength])

  return (
    <div
      ref={containerRef}
      className="ascii-text-container"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&display=swap');

        .ascii-text-container canvas {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          image-rendering: optimizeSpeed;
          image-rendering: -moz-crisp-edges;
          image-rendering: -o-crisp-edges;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }

        .ascii-text-container pre {
          margin: 0;
          user-select: none;
          padding: 0;
          line-height: 1em;
          text-align: left;
          position: absolute;
          left: 0;
          top: 0;
          z-index: 9;
          white-space: pre;
        }
      `}</style>
    </div>
  )
}
