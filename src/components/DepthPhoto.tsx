import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import { cn } from '../lib/utils'

/**
 * A real photograph that "turns" in 3D.
 * Each pixel is displaced by its depth (from a depth map estimated with Depth Anything V2),
 * so near parts (bun, lettuce) and far parts (table, background) move differently —
 * the way a real object does when you walk around it.
 */

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() {
  vUv = vec2((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uOffset;
uniform float uFocus;
uniform float uMask;
uniform vec2 uLight;
uniform float uZoom;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) / uZoom + 0.5;
  vec2 s = uv;
  for (int i = 0; i < 7; i++) {
    float d = texture2D(uDepth, s).r;
    s = uv - uOffset * (d - uFocus);
  }
  vec3 col = texture2D(uImg, s).rgb;

  // surface normal from the depth map → a soft highlight that slides with the tilt
  float e = 1.5 / 512.0;
  float dx = texture2D(uDepth, s + vec2(e, 0.0)).r - texture2D(uDepth, s - vec2(e, 0.0)).r;
  float dy = texture2D(uDepth, s + vec2(0.0, e)).r - texture2D(uDepth, s - vec2(0.0, e)).r;
  vec3 n = normalize(vec3(-dx * 9.0, dy * 9.0, 1.0));
  vec3 L = normalize(vec3(uLight, 0.9));
  float d0 = texture2D(uDepth, s).r;
  float spec = pow(max(dot(n, L), 0.0), 22.0) * smoothstep(0.35, 0.75, d0);
  col += spec * 0.16 * vec3(1.0, 0.86, 0.62);

  float a = 1.0;
  if (uMask > 0.5) {
    float r = distance(vUv, vec2(0.5, 0.53));
    a = 1.0 - smoothstep(0.36, 0.5, r);
  }
  gl_FragColor = vec4(col * a, a);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader error')
  return sh
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image()
    im.decoding = 'async'
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = src
  })
}

export interface DepthPhotoProps {
  src: string
  depth: string
  alt: string
  className?: string
  /** max displacement in UV units */
  strength?: number
  /** depth value (0..1) that stays still */
  focus?: number
  /** circular soft vignette instead of a full rectangle */
  mask?: boolean
  /** perspective rotation of the whole card, degrees */
  turn?: number
  /** follow the mouse anywhere on the page (desktop) */
  followPointer?: boolean
  zoom?: number
  onInteract?: () => void
  fallbackClassName?: string
}

export function DepthPhoto({
  src,
  depth,
  alt,
  className,
  strength = 0.045,
  focus = 0.55,
  mask = false,
  turn = 8,
  followPointer = true,
  zoom = 1.06,
  onInteract,
  fallbackClassName,
}: DepthPhotoProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const tiltBox = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const state = useRef({ tx: 0, ty: 0, x: 0, y: 0, last: -1e9, dragging: false, dragX: 0, dragY: 0, baseX: 0, baseY: 0 })
  const onInteractRef = useRef(onInteract)
  useEffect(() => {
    onInteractRef.current = onInteract
  }, [onInteract])

  useEffect(() => {
    const cv = canvas.current
    const box = wrap.current
    if (!cv || !box) return
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) return
    let disposed = false
    let raf = 0
    let visible = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const prog = gl.createProgram()!
    try {
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    } catch {
      return
    }
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uOffset = u('uOffset')
    const uLight = u('uLight')
    gl.uniform1i(u('uImg'), 0)
    gl.uniform1i(u('uDepth'), 1)
    gl.uniform1f(u('uFocus'), focus)
    gl.uniform1f(u('uMask'), mask ? 1 : 0)
    gl.uniform1f(u('uZoom'), zoom)

    const texture = (unit: number, im: HTMLImageElement) => {
      const t = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(box.clientWidth * dpr)
      const h = Math.round(box.clientHeight * dpr)
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(frame)
    })
    io.observe(box)

    const st = state.current
    const frame = (now: number) => {
      raf = 0
      if (disposed || !visible) return
      const idle = now - st.last > 2200
      if (idle && !st.dragging && !reduce) {
        // slow figure-eight so the burger feels alive on its own
        const t = now / 1000
        st.tx = Math.sin(t * 0.55) * 0.55
        st.ty = Math.sin(t * 0.8) * 0.25
      }
      const k = st.dragging ? 0.35 : 0.075
      st.x += (st.tx - st.x) * k
      st.y += (st.ty - st.y) * k
      gl.uniform2f(uOffset, -st.x * strength, -st.y * strength * 0.8)
      gl.uniform2f(uLight, st.x * 0.9 + 0.25, -st.y * 0.9 + 0.35)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      if (tiltBox.current) {
        tiltBox.current.style.transform = `perspective(1100px) rotateY(${st.x * turn}deg) rotateX(${-st.y * turn * 0.7}deg)`
      }
      if (!reduce) raf = requestAnimationFrame(frame)
    }

    Promise.all([loadImage(src), loadImage(depth)])
      .then(([im, dm]) => {
        if (disposed) return
        texture(0, im)
        texture(1, dm)
        resize()
        setReady(true)
        raf = requestAnimationFrame(frame)
      })
      .catch(() => {
        /* keep the plain photo */
      })

    const onMove = (e: PointerEvent) => {
      if (!followPointer || e.pointerType !== 'mouse' || st.dragging) return
      const r = box.getBoundingClientRect()
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.75)
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height * 0.75)
      if (Math.abs(nx) > 2.2 || Math.abs(ny) > 2.2) return // too far away — keep idle sway
      st.tx = Math.max(-1, Math.min(1, nx))
      st.ty = Math.max(-1, Math.min(1, ny))
      st.last = performance.now()
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [src, depth, strength, focus, mask, turn, followPointer, zoom])

  // drag / swipe to turn (works with fingers too; vertical swipes still scroll the page)
  const handlers = {
    onPointerDown: (e: RPointerEvent) => {
      const st = state.current
      st.dragging = true
      st.dragX = e.clientX
      st.dragY = e.clientY
      st.baseX = st.x
      st.baseY = st.y
      st.last = performance.now()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      onInteractRef.current?.()
    },
    onPointerMove: (e: RPointerEvent) => {
      const st = state.current
      if (!st.dragging) return
      st.tx = Math.max(-1, Math.min(1, st.baseX + (e.clientX - st.dragX) / 140))
      if (e.pointerType === 'mouse') st.ty = Math.max(-1, Math.min(1, st.baseY + (e.clientY - st.dragY) / 160))
      st.last = performance.now()
    },
    onPointerUp: () => {
      state.current.dragging = false
      state.current.last = performance.now()
    },
  }

  const fallbackStyle: CSSProperties | undefined = mask
    ? { maskImage: 'radial-gradient(circle at 50% 53%, black 52%, transparent 71%)', WebkitMaskImage: 'radial-gradient(circle at 50% 53%, black 52%, transparent 71%)' }
    : undefined

  return (
    <div
      ref={wrap}
      className={cn('relative select-none', className)}
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
      {...handlers}
      onPointerCancel={handlers.onPointerUp}
    >
      <div ref={tiltBox} className="absolute inset-0 will-change-transform" style={{ transformStyle: 'preserve-3d' }}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn('absolute inset-0 size-full object-cover transition-opacity duration-700', ready && 'opacity-0', fallbackClassName)}
          style={{ ...fallbackStyle, transform: `scale(${zoom})` }}
        />
        <canvas
          ref={canvas}
          aria-hidden
          className={cn('absolute inset-0 size-full transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
        />
      </div>
    </div>
  )
}

