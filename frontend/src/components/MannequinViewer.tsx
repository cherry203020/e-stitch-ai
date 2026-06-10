import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Phase 3 – Basic 3D mannequin to display a design image.
 * Assistive/conceptual only. Rotate and zoom via OrbitControls.
 */
function MannequinTorso({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.5, 0.55, 1.4, 32]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FallbackTorso() {
  return (
    <mesh>
      <cylinderGeometry args={[0.5, 0.55, 1.4, 32]} />
      <meshStandardMaterial color="#e8e0db" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

export default function MannequinViewer({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="mannequin-viewer-wrap">
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 2]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-2, 2, 1]} intensity={0.4} />
        <Suspense fallback={<FallbackTorso />}>
          {imageUrl ? <MannequinTorso imageUrl={imageUrl} /> : <FallbackTorso />}
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.2}
          maxDistance={4}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI - 0.2}
        />
      </Canvas>
      <p className="mannequin-viewer-hint">Drag to rotate · Scroll to zoom</p>
    </div>
  );
}
