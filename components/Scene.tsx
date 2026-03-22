'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Line, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { ENTRIES, W, RA, NOISE_FLOOR, META, REG, CURRENT, TOTAL_LOST, GOAL_PCT } from '@/lib/data'
import { playTone, weightToFreq } from '@/lib/sound'

const SAGE = new THREE.Color('#4a7c59')
const SAGE_B = new THREE.Color('#6adc89')
const AMBER = new THREE.Color('#c8793a')

const wMin = Math.min(...W) - 0.5, wMax = Math.max(...W) + 0.5
const mapW = (w: number) => ((w - wMin) / (wMax - wMin)) * 14 - 7
const mapRA = (w: number) => ((w - wMin) / (wMax - wMin)) * 14 - 7
const SPREAD = 2.2
const N = ENTRIES.length

// ── DATA POINTS ───────────────────────────────────────────────────────────────
function DataPoints({ scrollT, cameraX }: { scrollT: number; cameraX: number }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const lastPinged = useRef<Set<number>>(new Set())

  const spikes = useMemo(() => {
    const s = new Set<number>()
    for (let i = 1; i < N; i++) if (W[i] - W[i-1] > NOISE_FLOOR) s.add(i)
    return s
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const baseScale = 0.1
      mesh.scale.setScalar(baseScale + Math.sin(t * 1.2 + i * 0.4) * 0.018)
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.sin(t * 0.8 + i * 0.3) * 0.2

      // Sonification — ping as camera passes nearby
      const x = (i / (N-1)) * (N * SPREAD) - (N * SPREAD) / 2
      const dist = Math.abs(cameraX - x)
      if (dist < 1.5 && !lastPinged.current.has(i)) {
        lastPinged.current.add(i)
        const freq = weightToFreq(W[i])
        playTone(freq, 0.2, spikes.has(i) ? 0.05 : 0.04)
      } else if (dist > 4) {
        lastPinged.current.delete(i)
      }
    })
  })

  return (
    <group>
      {ENTRIES.map((entry, i) => {
        const x = (i / (N-1)) * (N * SPREAD) - (N * SPREAD) / 2
        const y = mapW(entry.weight)
        const isSpike = spikes.has(i)
        const color = isSpike ? AMBER : SAGE

        return (
          <group key={i} position={[x, y, 0]}>
            <mesh ref={el => { meshRefs.current[i] = el }}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.2} metalness={0.8} />
            </mesh>
            <line>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[new Float32Array([0,0,0,0,-y-8,0]),3]} />
              </bufferGeometry>
              <lineBasicMaterial color={isSpike ? '#c8793a' : '#1a3a2a'} transparent opacity={0.2} />
            </line>
          </group>
        )
      })}
    </group>
  )
}

// ── SIGNAL CURVE ──────────────────────────────────────────────────────────────
function SignalCurve() {
  const points = useMemo(() => RA.map((ra, i) => {
    const x = (i / (N-1)) * (N * SPREAD) - (N * SPREAD) / 2
    return new THREE.Vector3(x, mapRA(ra), 0)
  }), [])

  const noiseUpper = useMemo(() => RA.map((ra, i) => new THREE.Vector3((i/(N-1))*(N*SPREAD)-(N*SPREAD)/2, mapRA(ra+NOISE_FLOOR), 0)), [])
  const noiseLower = useMemo(() => RA.map((ra, i) => new THREE.Vector3((i/(N-1))*(N*SPREAD)-(N*SPREAD)/2, mapRA(ra-NOISE_FLOOR), 0)), [])

  const earlySlope = (W[6]-W[0])/6
  const ghostPoints = useMemo(() => W.map((_, i) => new THREE.Vector3((i/(N-1))*(N*SPREAD)-(N*SPREAD)/2, mapW(W[0]+earlySlope*i), 0)), [])

  return (
    <group>
      <Line points={noiseUpper} color="#2a4a3a" lineWidth={1} transparent opacity={0.35} />
      <Line points={noiseLower} color="#2a4a3a" lineWidth={1} transparent opacity={0.35} />
      <Line points={ghostPoints} color="#c8793a" lineWidth={1.5} transparent opacity={0.3} dashed dashScale={0.5} dashSize={0.3} gapSize={0.2} />
      <Line points={points} color="#6adc89" lineWidth={3} transparent opacity={0.95} />
    </group>
  )
}

// ── GOAL LINE ─────────────────────────────────────────────────────────────────
function GoalLine() {
  const goalY = mapW(META.goal)
  const xStart = -(N*SPREAD)/2-5, xEnd = (N*SPREAD)/2+5
  const points = [new THREE.Vector3(xStart, goalY, 0), new THREE.Vector3(xEnd, goalY, 0)]
  const ref = useRef<any>(null)
  useFrame(state => { if (ref.current) ref.current.material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime()*1.5)*0.15 })
  return (
    <group>
      <Line ref={ref} points={points} color="#4a7c59" lineWidth={1.5} transparent opacity={0.4} dashed dashScale={0.3} dashSize={0.4} gapSize={0.3} />
      <Billboard position={[xEnd+1.5, goalY, 0]}>
        <mesh>
          <planeGeometry args={[3.5, 0.6]} />
          <meshBasicMaterial color="#04060a" transparent opacity={0} />
        </mesh>
      </Billboard>
    </group>
  )
}

// ── GROUND GRID ───────────────────────────────────────────────────────────────
function GroundGrid() {
  return <gridHelper args={[N*SPREAD+20, 40, '#1a3a2a', '#0d2218']} position={[0,-8,0]} />
}

// ── ANNOTATIONS ───────────────────────────────────────────────────────────────
function Annotations({ scrollT }: { scrollT: number }) {
  const anns = useMemo(() => [
    { idx:0, label:'Start · '+W[0]+' kg', sub:'05 Nov 2025' },
    { idx:7, label:'↑ Spike', sub:'Low steps prior' },
    { idx:16, label:'Plateau broken', sub:'Signal resumed' },
    { idx:33, label:'Best phase', sub:'Feb momentum' },
    { idx:N-1, label:`Now · ${CURRENT.toFixed(2)} kg`, sub:`−${TOTAL_LOST} kg total` },
  ], [])

  return (
    <group>
      {anns.map((a, ai) => {
        const x = (a.idx/(N-1))*(N*SPREAD)-(N*SPREAD)/2
        const y = mapW(W[a.idx]) + 0.8
        const vis = Math.max(0, Math.min(1, (scrollT*3 - ai*0.15)))
        return (
          <Billboard key={ai} position={[x, y+0.4, 0.5]}>
            <group>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[3.5, 0.9]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </group>
          </Billboard>
        )
      })}
    </group>
  )
}

// ── EQUATION FLOAT ────────────────────────────────────────────────────────────
function EquationFloat({ scrollT }: { scrollT: number }) {
  const vis = Math.max(0, Math.min(1, (scrollT - 0.45) * 4))
  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.3}>
      <group position={[0, 4, -2]}>
        <mesh>
          <planeGeometry args={[12, 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </Float>
  )
}

// ── PARTICLES ─────────────────────────────────────────────────────────────────
function Particles({ count = 200 }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const positions = useMemo(() => Array.from({length: count}, () => ({
    x: (Math.random()-0.5)*N*SPREAD*1.5, y: (Math.random()-0.5)*20, z: (Math.random()-0.5)*20,
    speed: 0.1+Math.random()*0.3, offset: Math.random()*Math.PI*2
  })), [count])

  useFrame(state => {
    if (!mesh.current) return
    const t = state.clock.getElapsedTime()
    positions.forEach((p,i) => {
      dummy.position.set(p.x, p.y+Math.sin(t*p.speed+p.offset)*0.3, p.z)
      dummy.scale.setScalar(0.02+Math.sin(t*p.speed+p.offset)*0.008)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1,4,4]} />
      <meshBasicMaterial color="#1a3a2a" transparent opacity={0.5} />
    </instancedMesh>
  )
}

// ── SCROLL CAMERA ─────────────────────────────────────────────────────────────
function ScrollCamera({ scrollT, onCameraX }: { scrollT: number; onCameraX: (x: number) => void }) {
  const { camera } = useThree()

  useFrame(() => {
    const t = scrollT
    let tx, ty, tz, lx, ly, lz

    if (t < 0.2) {
      const p = t/0.2
      tx = -N*SPREAD*0.5+8; ty = 4+p*-2; tz = 22-p*4
      lx = 0; ly = 0; lz = 0
    } else if (t < 0.5) {
      const p = (t-0.2)/0.3
      tx = -N*SPREAD*0.5+8+p*N*SPREAD*0.6; ty = 2-p*1; tz = 18-p*10
      lx = tx+10; ly = 0; lz = 0
    } else if (t < 0.7) {
      const p = (t-0.5)/0.2
      tx = N*SPREAD*0.1; ty = 1+p*2; tz = 8+p*4
      lx = 0; ly = 2; lz = -5
    } else {
      const p = (t-0.7)/0.3
      tx = N*SPREAD*0.3; ty = 8-p*6; tz = 14+p*4
      lx = N*SPREAD*0.1; ly = mapW(META.goal); lz = 0
    }

    camera.position.x += (tx - camera.position.x) * 0.06
    camera.position.y += (ty - camera.position.y) * 0.06
    camera.position.z += (tz - camera.position.z) * 0.06
    camera.lookAt(new THREE.Vector3(lx, ly, lz))
    camera.position.y += Math.sin(Date.now()*0.0005)*0.02
    camera.position.x += Math.cos(Date.now()*0.0003)*0.01

    onCameraX(camera.position.x)
  })
  return null
}

// ── LIGHTING ──────────────────────────────────────────────────────────────────
function Lighting() {
  const l1 = useRef<THREE.PointLight>(null)
  useFrame(state => {
    if (l1.current) {
      l1.current.intensity = 1.5 + Math.sin(state.clock.getElapsedTime()*0.4)*0.3
      l1.current.position.x = Math.sin(state.clock.getElapsedTime()*0.2)*10
    }
  })
  return (
    <>
      <ambientLight intensity={0.15} color="#0a1a0f" />
      <pointLight ref={l1} position={[0,8,10]} intensity={1.5} color="#4a7c59" distance={60} />
      <pointLight position={[-20,0,5]} intensity={0.8} color="#1a3a5a" distance={80} />
      <pointLight position={[20,-5,8]} intensity={0.6} color="#2a1a0a" distance={60} />
      <directionalLight position={[0,20,10]} intensity={0.4} color="#c8e8d0" />
    </>
  )
}

// ── SCENE CONTENTS ────────────────────────────────────────────────────────────
function SceneContents({ scrollT }: { scrollT: number }) {
  const [camX, setCamX] = useState(0)
  return (
    <>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#04060a', 30, 90]} />
      <Lighting />
      <ScrollCamera scrollT={scrollT} onCameraX={setCamX} />
      <GroundGrid />
      <GoalLine />
      <SignalCurve />
      <DataPoints scrollT={scrollT} cameraX={camX} />
      <Annotations scrollT={scrollT} />
      <EquationFloat scrollT={scrollT} />
      <Particles count={200} />
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} blendFunction={BlendFunction.ADD} />
        <Vignette eskil={false} offset={0.3} darkness={0.8} />
        <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  )
}

// ── EXPORTED CANVAS ───────────────────────────────────────────────────────────
export default function Scene({ scrollT }: { scrollT: number }) {
  return (
    <Canvas
      camera={{ position: [-N*SPREAD*0.5+8, 4, 22], fov: 55, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <SceneContents scrollT={scrollT} />
    </Canvas>
  )
}
