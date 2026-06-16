'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
uniform float uMouseSpeed;
uniform vec3 uMouseHistory[50];

attribute vec3 aColor;
attribute float aSize;
attribute float aRandomFactor;
attribute float aDelay;

varying vec3 vColor;
varying float vAlpha;

// FAST TRIGONOMETRIC TURBULENCE
vec3 trigNoise(vec3 p) {
    float x = sin(p.x * 1.5 + p.y * 2.3 + p.z * 1.1);
    float y = sin(p.y * 1.2 + p.z * 2.1 + p.x * 1.4);
    float z = sin(p.z * 1.7 + p.x * 1.9 + p.y * 2.5);
    return vec3(x, y, z);
}

vec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    return 0.5 * (
        (2.0 * p1) +
        (-p0 + p2) * t +
        (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +
        (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    );
}

vec3 getHistoryPos(float delay) {
    float fIndex = delay * 49.0;
    int idx1 = int(floor(fIndex));
    int idx2 = int(ceil(fIndex));
    int idx0 = max(0, idx1 - 1);
    int idx3 = min(49, idx2 + 1);
    float mixVal = fract(fIndex);
    
    vec3 v0 = uMouseHistory[0];
    vec3 v1 = uMouseHistory[0];
    vec3 v2 = uMouseHistory[0];
    vec3 v3 = uMouseHistory[0];
    
    for(int i = 0; i < 50; i++) {
        if(i == idx0) v0 = uMouseHistory[i];
        if(i == idx1) v1 = uMouseHistory[i];
        if(i == idx2) v2 = uMouseHistory[i];
        if(i == idx3) v3 = uMouseHistory[i];
    }
    
    return catmullRom(v0, v1, v2, v3, mixVal);
}

void main() {
    vColor = aColor;
    
    vec3 dir = position; // Random normalized direction from attribute
    vec3 centerPos = getHistoryPos(aDelay);
    
    // Scale properties
    float isMoving = uMouseSpeed;
    
    // Spread calculation - tighter core, more elegant tail
    float coreSpread = mix(0.01, 1.0, aDelay); 
    
    // Wavy tail effect
    float tailWave = sin(uTime * 15.0 - aDelay * 25.0) * 0.5 + 0.5;
    float tailSpread = mix(coreSpread, 10.0 * tailWave, aDelay); 
    
    float actualSpread = mix(coreSpread, tailSpread, isMoving);
    
    // Turbulence added in the middle
    float time = uTime * 0.8;
    vec3 noiseDisp = trigNoise(dir * 2.0 + vec3(time, -time, time * 0.5));
    
    // Add swirl to the tail when moving
    float swirlAngle = aDelay * 10.0 - uTime * 5.0;
    float s = sin(swirlAngle);
    float c = cos(swirlAngle);
    vec3 swirlDir = dir;
    swirlDir.xy *= mat2(c, -s, s, c);
    
    vec3 finalPos = centerPos + mix(dir, swirlDir + noiseDisp * 0.8, isMoving * aDelay) * actualSpread;
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Alpha Logic
    float coreVsTail = smoothstep(0.01, 0.05, aDelay); // 0 = core, 1 = tail
    float tailFade = mix(1.0, 0.0, aDelay); // Fades out towards the end of tail
    
    float activeAlpha = mix(1.0, isMoving * tailFade, coreVsTail);
    
    vAlpha = activeAlpha;
    
    // Pulse
    float pulse = sin(uTime * 8.0 + aRandomFactor * 20.0) * 0.3 + 0.7;
    
    gl_PointSize = aSize * pulse * (40.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float distanceToCenter = length(xy);
    
    if (distanceToCenter > 0.5) {
        discard;
    }
    
    float edge = smoothstep(0.5, 0.1, distanceToCenter);
    float core = smoothstep(0.15, 0.0, distanceToCenter);
    
    vec3 finalColor = mix(vColor, vec3(1.0), core * 0.7);
    
    gl_FragColor = vec4(finalColor, edge * vAlpha);
}
`;

const PARTICLES_COUNT = 150000;

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const mouseVelocityRef = useRef(0);
  const isPausedRef = useRef(false);
  const timeAccRef = useRef(0);
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
        // Normalize mouse coordinates to -1 to 1
        const nx = (event.clientX / window.innerWidth) * 2 - 1;
        const ny = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Accumulate velocity based on distance moved in screen space
        const dx = nx - mouseRef.current.x;
        const dy = ny - mouseRef.current.y;
        mouseVelocityRef.current += Math.sqrt(dx*dx + dy*dy) * 50.0;
        
        mouseRef.current.x = nx;
        mouseRef.current.y = ny;
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
            event.preventDefault(); // Prevent page scrolling
            isPausedRef.current = !isPausedRef.current;
        }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Initialize particles in a spherical/disk shape using lazy state
  const [{ positions, colors, sizes, randomFactors, delays }] = useState(() => {
    const p = new Float32Array(PARTICLES_COUNT * 3);
    const c = new Float32Array(PARTICLES_COUNT * 3);
    const s = new Float32Array(PARTICLES_COUNT);
    const rf = new Float32Array(PARTICLES_COUNT);
    const d = new Float32Array(PARTICLES_COUNT);
    
    const colorCore = new THREE.Color('#3b82f6'); // blue
    const colorMid = new THREE.Color('#a855f7');  // purple
    const colorEdge = new THREE.Color('#06b6d4'); // cyan
    const colorWhite = new THREE.Color('#ffffff');
    
    for (let i = 0; i < PARTICLES_COUNT; i++) {
        // Random direction for dispersion (normalized sphere)
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        p[i * 3 + 0] = Math.sin(phi) * Math.cos(theta);
        p[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
        p[i * 3 + 2] = Math.cos(phi);
        
        // Distribution of delay - push heavy majority to head (<= 0.1)
        let delayRaw = Math.pow(Math.random(), 3.0); 
        
        // Pin the core perfectly to 0 delay
        if (delayRaw < 0.05) {
            delayRaw = 0.0;
        }
        
        d[i] = delayRaw;
        
        const color = new THREE.Color();
        
        if (Math.random() > 0.98) {
            color.copy(colorWhite);
        } else if (delayRaw < 0.05) {
            color.lerpColors(colorCore, colorWhite, Math.random() * 0.5); // BRIGHT CORE
        } else if (delayRaw < 0.4) {
            color.lerpColors(colorCore, colorMid, Math.random());
        } else {
            color.lerpColors(colorMid, colorEdge, Math.random());
        }
        
        c[i * 3 + 0] = color.r;
        c[i * 3 + 1] = color.g;
        c[i * 3 + 2] = color.b;
        
        s[i] = Math.random() * 3.5 + 0.5;
        rf[i] = Math.random();
    }
    
    return { positions: p, colors: c, sizes: s, randomFactors: rf, delays: d };
  });

  const historyBuffer = useMemo(() => {
    return Array.from({ length: 50 }, () => new THREE.Vector3(0, 0, 0));
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uMouseSpeed: { value: 0.0 },
      uMouseHistory: { value: historyBuffer },
    }),
    [historyBuffer]
  );

  useFrame((state, delta) => {
    if (pointsRef.current) {
        if (isPausedRef.current) return;

        const material = pointsRef.current.material as THREE.ShaderMaterial;
        timeAccRef.current += delta;
        material.uniforms.uTime.value = timeAccRef.current;
        
        // Decay and map mouse velocity
        mouseVelocityRef.current *= 0.9;
        const speedVal = THREE.MathUtils.clamp(mouseVelocityRef.current, 0, 1.5);
        material.uniforms.uMouseSpeed.value = THREE.MathUtils.lerp(
            material.uniforms.uMouseSpeed.value,
            THREE.MathUtils.smoothstep(speedVal, 0.01, 1.0),
            0.1
        );
        
        // 1. Raycast mouse to find exact 3D position
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouseRef.current, state.camera);
        
        // Create a plane facing the camera, passing through the origin (0,0,0)
        const cameraDir = state.camera.getWorldDirection(new THREE.Vector3());
        const plane = new THREE.Plane(cameraDir.negate(), 0);
        
        let targetPos = new THREE.Vector3();
        const intersected = raycaster.ray.intersectPlane(plane, targetPos);
        
        if (!intersected) {
             const dir = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5).unproject(state.camera).sub(state.camera.position).normalize();
             targetPos = state.camera.position.clone().add(dir.multiplyScalar(state.camera.position.length()));
        }

        // 2. Update history buffer
        for (let i = 49; i > 0; i--) {
            historyBuffer[i].copy(historyBuffer[i - 1]);
        }
        
        // Push precise target to the head
        historyBuffer[0].copy(targetPos);

        // 3. Keep mesh static! The vertex shader does all the positioning based on history array.
        pointsRef.current.position.set(0, 0, 0);
        pointsRef.current.rotation.set(0, 0, 0);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aRandomFactor"
          args={[randomFactors, 1]}
        />
        <bufferAttribute
          attach="attributes-aDelay"
          args={[delays, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function PointCloudScene() {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 60, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: false }}
      >
        <color attach="background" args={['#000000']} />
        <Particles />
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          maxDistance={100}
          minDistance={25}
          autoRotate={true}
          autoRotateSpeed={3.5}
        />
        
        <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
            <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
      
      {/* HUD overlays */}
      <div className="pointer-events-none absolute inset-0 border-[40px] border-white/5 opacity-20" />
      <div className="pointer-events-none absolute top-8 left-8 font-mono text-2xl font-bold text-white/20 uppercase tracking-[0.2em]">
        MK
      </div>
      <div className="pointer-events-none absolute bottom-8 left-8 font-mono text-xs text-white/60 uppercase tracking-[0.1em]">
        Press Spacebar to freeze the Particles
      </div>
      <div className="pointer-events-none absolute top-8 right-8 font-mono text-xs text-white/60 uppercase tracking-[0.2em] text-right">
        MIRHAZAR KHAN
      </div>
    </div>
  );
}
