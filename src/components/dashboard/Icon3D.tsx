import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { Suspense } from "react";

interface Icon3DProps {
  color: string;
  shape: "box" | "sphere" | "torus" | "cone" | "octahedron" | "dodecahedron";
}

const Shape3D = ({ shape, color }: Icon3DProps) => {
  const shapes = {
    box: <boxGeometry args={[1.5, 1.5, 1.5]} />,
    sphere: <sphereGeometry args={[0.9, 32, 32]} />,
    torus: <torusGeometry args={[0.7, 0.3, 16, 100]} />,
    cone: <coneGeometry args={[0.8, 1.5, 32]} />,
    octahedron: <octahedronGeometry args={[1]} />,
    dodecahedron: <dodecahedronGeometry args={[0.9]} />,
  };

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <mesh>
        {shapes[shape]}
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
};

export const Icon3D = ({ color, shape }: Icon3DProps) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          <Shape3D color={color} shape={shape} />
        </Suspense>
      </Canvas>
    </div>
  );
};
