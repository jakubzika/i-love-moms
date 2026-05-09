"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { FlowerCard, Flower } from "./schema";
import { CARD_SIZE } from "./constants";

function sizeScale(size: Flower["size"]): number {
  return size === "large" ? 1.4 : size === "small" ? 0.7 : 1;
}

function FlowerHead({ flower }: { flower: Flower }) {
  const scale = sizeScale(flower.size);
  switch (flower.type) {
    case "rose":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.45 * scale, 16, 16]} />
            <meshStandardMaterial color={flower.color} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <torusGeometry args={[0.32 * scale, 0.1 * scale, 8, 24]} />
            <meshStandardMaterial color={flower.color} />
          </mesh>
        </group>
      );
    case "tulip":
      return (
        <mesh>
          <coneGeometry args={[0.35 * scale, 0.7 * scale, 12]} />
          <meshStandardMaterial color={flower.color} />
        </mesh>
      );
    case "sunflower": {
      const r = 0.55 * scale;
      const petals = 14;
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[r * 0.5, r * 0.5, 0.12, 24]} />
            <meshStandardMaterial color="#5a3a1a" />
          </mesh>
          {Array.from({ length: petals }, (_, i) => {
            const a = (i / petals) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * r * 0.8, 0, Math.sin(a) * r * 0.8]}
                rotation={[0, -a, 0]}
              >
                <coneGeometry args={[0.12 * scale, 0.45 * scale, 6]} />
                <meshStandardMaterial color={flower.color} />
              </mesh>
            );
          })}
        </group>
      );
    }
    case "daisy": {
      const petals = 10;
      const r = 0.35 * scale;
      return (
        <group>
          <mesh>
            <sphereGeometry args={[r * 0.45, 12, 12]} />
            <meshStandardMaterial color="#f1c40f" />
          </mesh>
          {Array.from({ length: petals }, (_, i) => {
            const a = (i / petals) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * r * 0.9, 0, Math.sin(a) * r * 0.9]}
                rotation={[0, -a, 0]}
              >
                <boxGeometry args={[0.08 * scale, 0.04 * scale, 0.3 * scale]} />
                <meshStandardMaterial color={flower.color} />
              </mesh>
            );
          })}
        </group>
      );
    }
    case "lavender":
      return (
        <group>
          {[0, 0.15, 0.3, 0.45].map((y, i) => (
            <mesh key={i} position={[0, y * scale, 0]}>
              <sphereGeometry args={[(0.12 - i * 0.02) * scale, 8, 8]} />
              <meshStandardMaterial color={flower.color} />
            </mesh>
          ))}
        </group>
      );
    case "peony":
      return (
        <mesh>
          <icosahedronGeometry args={[0.5 * scale, 1]} />
          <meshStandardMaterial color={flower.color} roughness={0.4} />
        </mesh>
      );
    case "babys-breath":
      return (
        <group>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(a) * 0.18 * scale,
                  0,
                  Math.sin(a) * 0.18 * scale,
                ]}
              >
                <sphereGeometry args={[0.07 * scale, 8, 8]} />
                <meshStandardMaterial color={flower.color} />
              </mesh>
            );
          })}
        </group>
      );
    case "hydrangea":
      return (
        <group>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(a) * 0.25 * scale,
                  Math.sin(i * 0.7) * 0.05,
                  Math.sin(a) * 0.25 * scale,
                ]}
              >
                <sphereGeometry args={[0.16 * scale, 10, 10]} />
                <meshStandardMaterial color={flower.color} />
              </mesh>
            );
          })}
        </group>
      );
    case "carnation":
      return (
        <mesh>
          <dodecahedronGeometry args={[0.4 * scale, 0]} />
          <meshStandardMaterial color={flower.color} roughness={0.5} />
        </mesh>
      );
    case "lily":
      return (
        <group>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(a) * 0.25 * scale,
                  0,
                  Math.sin(a) * 0.25 * scale,
                ]}
                rotation={[Math.PI / 4, -a, 0]}
              >
                <coneGeometry args={[0.14 * scale, 0.5 * scale, 6]} />
                <meshStandardMaterial color={flower.color} />
              </mesh>
            );
          })}
        </group>
      );
    case "iris":
      return (
        <group>
          {[0, Math.PI / 1.5, -Math.PI / 1.5].map((a, i) => (
            <mesh key={i} rotation={[0, a, Math.PI / 6]}>
              <coneGeometry args={[0.18 * scale, 0.6 * scale, 6]} />
              <meshStandardMaterial color={flower.color} />
            </mesh>
          ))}
        </group>
      );
    case "chrysanthemum": {
      const petals = 18;
      const r = 0.4 * scale;
      return (
        <group>
          {Array.from({ length: petals }, (_, i) => {
            const a = (i / petals) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * r, 0, Math.sin(a) * r]}
                rotation={[0, -a, 0]}
              >
                <coneGeometry args={[0.07 * scale, 0.3 * scale, 6]} />
                <meshStandardMaterial color={flower.color} />
              </mesh>
            );
          })}
        </group>
      );
    }
  }
}

function Stem({ flower, x, z }: { flower: Flower; x: number; z: number }) {
  const stemH = (flower.stemLength ?? 1.2) * 1.2;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, stemH / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, stemH, 8]} />
        <meshStandardMaterial color="#3d7a3a" />
      </mesh>
      <group position={[0, stemH, 0]}>
        <FlowerHead flower={flower} />
      </group>
    </group>
  );
}

function Bouquet({ card }: { card: FlowerCard }) {
  const expanded = card.bouquet.flowers.flatMap((f, fi) =>
    Array.from({ length: Math.max(1, f.quantity ?? 1) }, (_, qi) => ({
      flower: f,
      key: `${fi}-${qi}`,
    })),
  );
  const total = Math.max(1, expanded.length);
  const radius = Math.min(2.2, 0.4 + total * 0.08);

  return (
    <group>
      {expanded.map(({ flower, key }, i) => {
        const a = (i / total) * Math.PI * 2;
        const r =
          i === 0 && total > 1 ? 0 : radius * (0.6 + 0.4 * ((i % 3) / 3));
        return (
          <Stem
            key={key}
            flower={flower}
            x={Math.cos(a) * r}
            z={Math.sin(a) * r}
          />
        );
      })}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[radius + 0.4, radius + 0.5, 0.4, 24]} />
        <meshStandardMaterial color="#caa472" />
      </mesh>
    </group>
  );
}

export function FlowerCardPreview({ card }: { card: FlowerCard }) {
  return (
    <div
      className="bg-pink-50 rounded-lg shadow-md mx-auto overflow-hidden border relative"
      style={{ width: CARD_SIZE.width, height: CARD_SIZE.height }}
    >
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[0, 1.4, 5.5]}
          fov={35}
          near={0.1}
          far={50}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
        <Bouquet card={card} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.26, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f5d6e1" />
        </mesh>
      </Canvas>
      <div
        className="prose prose-sm max-w-none absolute left-1/2 bottom-6 -translate-x-1/2 bg-white/90 backdrop-blur p-5 rounded-lg shadow-lg border pointer-events-none"
        style={{
          width: "min(80%, 420px)",
          fontFamily: "Georgia, serif",
        }}
        dangerouslySetInnerHTML={{ __html: card.content.htmlContent ?? "" }}
      />
    </div>
  );
}

export const FlowerRender = () => {
  return <div className="w-full h-full bg-pink-400">KYTKA</div>;
};
