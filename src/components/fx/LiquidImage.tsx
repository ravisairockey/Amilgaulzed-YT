import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { artSource, type ArtKind, type Game } from "@/data/games";
import { hasWebGL, useFinePointer, useReducedMotion } from "@/lib/hooks";
import { PALETTE, spring, stepSpring } from "@/lib/fx";

/* ------------------------------------------------------------------ */
/* WebGL liquid distortion                                             */
/* ------------------------------------------------------------------ */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;
uniform float u_strength;
uniform float u_time;
uniform float u_canvasAspect;
uniform float u_imgAspect;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y);
}
vec2 cover(vec2 uv){
  vec2 s = vec2(1.0);
  if (u_canvasAspect > u_imgAspect) s.y = u_imgAspect / u_canvasAspect; else s.x = u_canvasAspect / u_imgAspect;
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_canvasAspect, 1.0);
  vec2 d = (uv - u_mouse) * aspect;
  float dist = length(d);
  float infl = smoothstep(0.6, 0.0, dist) * u_strength;
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
  vec2 warp = -dir * infl * 0.055 / aspect;
  float n = noise(uv * 5.0 + u_time * 0.5) - 0.5;
  warp += vec2(n, noise(uv * 5.0 - u_time * 0.4) - 0.5) * infl * 0.028;
  float zoom = 1.0 + 0.06 * u_strength;
  vec2 zuv = (uv - 0.5) / zoom + 0.5;
  float ca = infl * 0.010;
  float r = texture2D(u_tex, cover(zuv + warp * 1.2 + dir * ca / aspect)).r;
  float g = texture2D(u_tex, cover(zuv + warp)).g;
  float b = texture2D(u_tex, cover(zuv + warp * 0.8 - dir * ca / aspect)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`;

interface GLState {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  uMouse: WebGLUniformLocation | null;
  uStrength: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
}

function createGL(host: HTMLElement, img: HTMLImageElement): GLState | null {
  const canvas = document.createElement("canvas");
  const rect = host.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(2, Math.round(rect.width * dpr));
  canvas.height = Math.max(2, Math.round(rect.height * dpr));
  canvas.style.zIndex = "1";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  try {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Throws SecurityError for cross-origin images without CORS: caller falls back.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    gl.uniform1f(gl.getUniformLocation(prog, "u_canvasAspect"), canvas.width / canvas.height);
    gl.uniform1f(gl.getUniformLocation(prog, "u_imgAspect"), img.naturalWidth / img.naturalHeight);
    gl.viewport(0, 0, canvas.width, canvas.height);
    host.appendChild(canvas);
    return {
      canvas,
      gl,
      uMouse: gl.getUniformLocation(prog, "u_mouse"),
      uStrength: gl.getUniformLocation(prog, "u_strength"),
      uTime: gl.getUniformLocation(prog, "u_time"),
    };
  } catch {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
}

function useLiquid(hostRef: RefObject<HTMLDivElement | null>, imgRef: RefObject<HTMLImageElement | null>, enabled: boolean, cors: boolean) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) return;
    let mode: "gl" | "css" | "unknown" = hasWebGL() && cors ? "unknown" : "css";
    let state: GLState | null = null;
    let raf = 0;
    let hovered = false;
    const s = spring(0);
    const mouse = { x: 0.5, y: 0.5 };
    const tmouse = { x: 0.5, y: 0.5 };
    let last = 0;
    let t0 = performance.now();

    const cleanupGL = () => {
      if (!state) return;
      state.gl.getExtension("WEBGL_lose_context")?.loseContext();
      state.canvas.remove();
      state = null;
      host.classList.remove("is-liquid");
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      mouse.x += (tmouse.x - mouse.x) * 0.18;
      mouse.y += (tmouse.y - mouse.y) * 0.18;
      const moving = stepSpring(s, dt, 90, 13);
      if (state) {
        const { gl } = state;
        gl.uniform2f(state.uMouse, mouse.x, 1 - mouse.y);
        gl.uniform1f(state.uStrength, s.value);
        gl.uniform1f(state.uTime, (now - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      if (hovered || moving || Math.abs(mouse.x - tmouse.x) > 0.001) raf = requestAnimationFrame(frame);
      else cleanupGL();
    };

    const cssMove = (e: PointerEvent) => {
      const img = imgRef.current;
      if (!img) return;
      const r = host.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = `perspective(900px) rotateX(${(-ny * 4).toFixed(2)}deg) rotateY(${(nx * 4).toFixed(2)}deg) scale(1.07) translate(${(nx * 6).toFixed(1)}px, ${(ny * 6).toFixed(1)}px)`;
    };
    const cssLeave = () => {
      const img = imgRef.current;
      if (img) img.style.transform = "";
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      hovered = true;
      const img = imgRef.current;
      if (mode === "unknown" && img && img.complete && img.naturalWidth > 0) {
        state = createGL(host, img);
        mode = state ? "gl" : "css";
        if (state) host.classList.add("is-liquid");
      } else if (mode === "gl" && img && !state) {
        state = createGL(host, img);
        if (!state) mode = "css";
        else host.classList.add("is-liquid");
      }
      if (mode === "gl" && state) {
        s.target = 1;
        last = performance.now();
        t0 = last;
        const r = host.getBoundingClientRect();
        tmouse.x = (e.clientX - r.left) / r.width;
        tmouse.y = (e.clientY - r.top) / r.height;
        mouse.x = tmouse.x;
        mouse.y = tmouse.y;
        if (!raf) raf = requestAnimationFrame(frame);
      } else {
        cssMove(e);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!hovered) return;
      if (mode === "gl" && state) {
        const r = host.getBoundingClientRect();
        tmouse.x = (e.clientX - r.left) / r.width;
        tmouse.y = (e.clientY - r.top) / r.height;
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (mode === "css") cssMove(e);
    };
    const onLeave = () => {
      hovered = false;
      if (mode === "gl" && state) {
        s.target = 0;
        if (!raf) raf = requestAnimationFrame(frame);
      } else cssLeave();
    };

    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      cleanupGL();
      cssLeave();
    };
  }, [hostRef, imgRef, enabled, cors]);
}

/* ------------------------------------------------------------------ */
/* Artwork with graceful fallbacks                                     */
/* ------------------------------------------------------------------ */

const ACCENT: Record<string, string> = { lime: PALETTE.lime, peach: PALETTE.peach, mint: PALETTE.mint };

export function ArtFallback({ game, showTitle = true }: { game: Game; showTitle?: boolean }) {
  const letter = game.title.replace(/^(the|a)\s+/i, "").charAt(0).toUpperCase();
  return (
    <div
      className="art-fallback"
      data-letter={letter}
      role="img"
      aria-label={`${game.title} artwork unavailable`}
      style={{ "--acc": ACCENT[game.accent ?? "lime"] } as CSSProperties}
    >
      {showTitle && <span>{game.title}</span>}
    </div>
  );
}

interface ArtworkProps {
  game: Game;
  kind: ArtKind;
  width?: number;
  sizes?: string;
  priority?: boolean;
  liquid?: boolean;
  className?: string;
  alt?: string;
}

/**
 * Responsive artwork with a three-step source chain. Never shows a broken image:
 * if every source fails, it renders the atmospheric typographic fallback.
 */
export function Artwork({ game, kind, width = 600, sizes, priority = false, liquid = false, className = "", alt }: ArtworkProps) {
  const source = useMemo(() => artSource(game, kind, width), [game, kind, width]);
  const attempts = useMemo(() => {
    if (!source) return [];
    const list = [{ src: source.src, srcSet: source.srcSet, cors: source.cors }];
    for (const f of source.fallbacks) list.push({ src: f, srcSet: undefined, cors: false });
    return list;
  }, [source]);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const current = attempts[idx];
  const failed = !current;

  useEffect(() => {
    setIdx(0);
    setReady(false);
  }, [game.slug, kind]);

  useLiquid(hostRef, imgRef, liquid && fine && !reduce && !failed && ready, current?.cors ?? false);

  return (
    <div ref={hostRef} className={`absolute inset-0 ${className}`}>
      {failed ? (
        <ArtFallback game={game} />
      ) : (
        <img
          key={current.src}
          ref={imgRef}
          src={current.src}
          srcSet={current.srcSet}
          sizes={current.srcSet ? sizes ?? "(max-width: 767px) 50vw, 33vw" : undefined}
          alt={alt ?? `${game.title} key art`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          crossOrigin={current.cors ? "anonymous" : undefined}
          onLoad={() => setReady(true)}
          onError={() => setIdx((i) => i + 1)}
          style={{ opacity: ready ? 1 : 0 }}
          draggable={false}
        />
      )}
    </div>
  );
}
