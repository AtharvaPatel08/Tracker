import * as THREE from 'three';
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// Import our downloaded local assets
// @ts-ignore
import cardGlb from './card.glb';
// @ts-ignore
import lanyardPng from './lanyard.png';

// Extend fiber with MeshLine elements
extend({ MeshLineGeometry, MeshLineMaterial });

// Declare types for custom extended JSX elements in React Three Fiber
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}

// Preload the assets
useGLTF.preload(cardGlb);
useTexture.preload(lanyardPng);

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  frontImage?: string;
  backImage?: string;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string;
  lanyardWidth?: number;
  textColor?: string;
  cardName?: string;
}

export default function Lanyard({
  position = [0, 4, 0],
  gravity = [0, -40, 0],
  frontImage = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop',
  backImage = 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?q=80&w=800&auto=format&fit=crop',
  imageFit = 'cover',
  lanyardImage,
  lanyardWidth = 1,
  textColor = '#ffffff',
  cardName = 'SCRTH'
}: LanyardProps) {
  return (
    <div className="w-full h-full relative" id="lanyard-canvas-container">
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
        <ambientLight intensity={Math.PI} />
        <Physics interpolate gravity={gravity} timeStep={1 / 60}>
          <Band 
            position={position}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            textColor={textColor}
            cardName={cardName}
          />
        </Physics>
        <Environment background blur={0.75}>
          <color attach="background" args={['#070707']} />
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

interface BandProps {
  position: [number, number, number];
  frontImage: string;
  backImage: string;
  imageFit: 'cover' | 'contain';
  lanyardImage?: string;
  lanyardWidth: number;
  textColor: string;
  cardName: string;
}

function Band({
  position,
  frontImage,
  backImage,
  imageFit,
  lanyardImage,
  lanyardWidth,
  textColor,
  cardName
}: BandProps) {
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: any = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 };

  // Load 3D assets
  const { nodes, materials } = useGLTF(cardGlb) as any;

  // Load band texture
  const bandTexture = useTexture(lanyardImage || lanyardPng);
  bandTexture.wrapS = bandTexture.wrapT = THREE.RepeatWrapping;

  // Load card face textures
  const cardFrontTexture = useTexture(frontImage);
  cardFrontTexture.flipY = false;
  cardFrontTexture.colorSpace = THREE.SRGBColorSpace;
  cardFrontTexture.anisotropy = 16;

  const cardBackTexture = useTexture(backImage);
  cardBackTexture.flipY = false;
  cardBackTexture.colorSpace = THREE.SRGBColorSpace;
  cardBackTexture.anisotropy = 16;

  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3()
  ]));

  const [dragged, drag] = useState<any>(false);
  const [hovered, hover] = useState(false);

  // Joints for physical lanyard movement
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }

    if (fixed.current) {
      // Fix jitter when dragging over long distances
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        }
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (10 + clampedDistance * 40));
      });

      // Update band CatmullRom curve points
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      
      if (band.current?.geometry) {
        band.current.geometry.setPoints(curve.getPoints(32));
      }

      // Smooth tilt logic to keep the card oriented nicely
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={position}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        
        <RigidBody 
          position={[2, 0, 0]} 
          ref={card} 
          {...segmentProps} 
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              // @ts-ignore
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              // @ts-ignore
              e.target.setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            {/* The Badge/Card itself */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial 
                map={cardFrontTexture} 
                map-anisotropy={16} 
                clearcoat={1} 
                clearcoatRoughness={0.15} 
                roughness={0.3} 
                metalness={0.5} 
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial 
          color={textColor} 
          depthTest={false} 
          resolution={[width, height]} 
          useMap 
          map={bandTexture} 
          repeat={[-3, 1]} 
          lineWidth={lanyardWidth} 
        />
      </mesh>
    </>
  );
}
