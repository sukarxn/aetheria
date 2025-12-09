import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, Stars, Text, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { X } from 'lucide-react';

// --- CONFIGURATION ---
const ATOM_SCALE = 0.38;
const COLORS = {
  C: "#14b8a6", // Teal Carbon
  O: "#ef4444", // Red Oxygen
  N: "#3b82f6", // Blue Nitrogen
  DoubleBond: "#94a3b8"
};

// --- ATOM COMPONENT ---
const Atom = ({ position, size = ATOM_SCALE, color, label }: any) => (
  <group position={position}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[size, 64, 64]} />
      <meshPhysicalMaterial 
        color={color}
        roughness={0.2}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.1}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
    {label && (
      <Text
        position={[0, 0, size + 0.1]} 
        fontSize={0.25}
        fontWeight={800}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        {label}
      </Text>
    )}
  </group>
);

// --- BOND COMPONENTS ---
const SingleBond = ({ start, end }: any) => {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const distance = startVec.distanceTo(endVec);
  const position = startVec.clone().add(endVec).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), endVec.clone().sub(startVec).normalize());

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.06, 0.06, distance - 0.3, 32]} />
      <meshStandardMaterial color="#64748b" roughness={0.4} />
    </mesh>
  );
};

const DoubleBond = ({ start, end }: any) => {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const distance = startVec.distanceTo(endVec);
  const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
  const direction = endVec.clone().sub(startVec).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  
  const offsetAmount = 0.08;
  const randomVec = new THREE.Vector3(0, 0, 1); 
  const offsetVec = new THREE.Vector3().crossVectors(direction, randomVec).normalize().multiplyScalar(offsetAmount);

  return (
    <group position={mid} quaternion={quaternion}>
      <mesh position={[offsetVec.x, offsetVec.y, offsetVec.z]}>
        <cylinderGeometry args={[0.03, 0.03, distance - 0.2, 32]} />
        <meshStandardMaterial color={COLORS.DoubleBond} />
      </mesh>
      <mesh position={[-offsetVec.x, -offsetVec.y, -offsetVec.z]}>
        <cylinderGeometry args={[0.03, 0.03, distance - 0.2, 32]} />
        <meshStandardMaterial color={COLORS.DoubleBond} />
      </mesh>
    </group>
  );
};

// --- MINOCYCLINE STRUCTURE ---
const MinocyclineModel = (props: any) => {
  const structure = useMemo(() => {
    const C = COLORS.C;
    const O = COLORS.O;
    const N = COLORS.N;

    const atoms = [
      // --- Ring D (Right) ---
      { position: [3.0, -0.5, 0], color: C, label: "C", id: "D1" },
      { position: [4.0, 0.0, 0.2], color: C, label: "C", id: "D2" },
      { position: [4.0, 1.2, 0], color: C, label: "C", id: "D3" },
      { position: [3.0, 1.7, -0.2], color: C, label: "C", id: "D4" },
      { position: [2.0, 1.2, -0.2], color: C, label: "C", id: "D5" },
      { position: [2.0, 0.0, 0], color: C, label: "C", id: "D6" },

      // --- Ring C (Middle Right) ---
      { position: [1.0, -0.5, 0.2], color: C, label: "C", id: "C1" },
      { position: [1.0, 0.8, 0], color: C, label: "C", id: "C2" }, 

      // --- Ring B (Middle Left) ---
      { position: [0.0, -0.5, 0], color: C, label: "C", id: "B1" },
      { position: [0.0, 0.8, 0.2], color: C, label: "C", id: "B2" }, 
      
      // --- Ring A (Left) ---
      { position: [-1.0, -0.5, 0.2], color: C, label: "C", id: "A1" },
      { position: [-2.0, -0.5, 0], color: C, label: "C", id: "A2" },
      { position: [-2.5, 0.5, -0.2], color: C, label: "C", id: "A3" },
      { position: [-1.5, 1.2, 0], color: C, label: "C", id: "A4" },
      { position: [-1.0, 0.8, 0.2], color: C, label: "C", id: "A5" },

      // --- Functional Groups ---
      { position: [4.9, 1.7, 0.2], color: N, label: "N", id: "N_D" }, // N on D
      { position: [5.6, 1.2, 0.5], color: C, label: "C", id: "Me_D1" },
      { position: [5.4, 2.5, -0.3], color: C, label: "C", id: "Me_D2" },

      { position: [-1.8, 2.2, 0.1], color: N, label: "N", id: "N_A" }, // N on A
      { position: [-1.2, 3.0, 0.5], color: C, label: "C", id: "Me_A1" },
      { position: [-2.8, 2.8, -0.2], color: C, label: "C", id: "Me_A2" },

      { position: [-3.5, 0.3, -0.2], color: C, label: "C", id: "Amide_C" }, // Amide
      { position: [-4.0, 1.0, 0.2], color: O, label: "O", id: "Amide_O" },
      { position: [-4.0, -0.8, -0.5], color: N, label: "N", id: "Amide_N" },

      // --- Oxygens ---
      { position: [4.8, -0.5, 0.4], color: O, label: "OH", id: "OH_D" },
      { position: [1.0, -1.5, 0.4], color: O, label: "OH", id: "OH_C" },
      { position: [-1.0, -1.5, 0.4], color: O, label: "OH", id: "OH_B" },
      { position: [-2.5, -1.3, -0.2], color: O, label: "O", id: "O_A" },
      { position: [0.0, 1.8, 0.4], color: O, label: "OH", id: "OH_Top" },
    ];

    const singleBonds = [
      ["D1", "D2"], ["D2", "D3"], ["D4", "D5"], ["D5", "D6"],
      ["C1", "D6"], ["C2", "D5"], ["C1", "C2"], ["C1", "B1"], ["C2", "B2"],
      ["B1", "A1"], ["B2", "A5"], ["B1", "B2"],
      ["A1", "A2"], ["A2", "A3"], ["A3", "A4"], ["A4", "A5"], ["A5", "A1"],
      ["D3", "N_D"], ["N_D", "Me_D1"], ["N_D", "Me_D2"], 
      ["A4", "N_A"], ["N_A", "Me_A1"], ["N_A", "Me_A2"],
      ["A3", "Amide_C"], ["Amide_C", "Amide_N"],
      ["D2", "OH_D"], ["C1", "OH_C"], ["B1", "OH_B"], ["B2", "OH_Top"]
    ];

    const doubleBonds = [
      ["D3", "D4"], ["D6", "D1"], ["Amide_C", "Amide_O"], ["A2", "O_A"],
    ];

    return { atoms, singleBonds, doubleBonds };
  }, []);

  return (
    <group {...props}>
      {/* 1. Render Atoms */}
      {structure.atoms.map((atom: any) => (
        <Atom key={atom.id} {...atom} />
      ))}

      {/* 2. Render Single Bonds */}
      {structure.singleBonds.map(([startId, endId]: any, i: number) => {
        const start = structure.atoms.find(a => a.id === startId)?.position;
        const end = structure.atoms.find(a => a.id === endId)?.position;
        if (start && end) return <SingleBond key={`s-${i}`} start={start} end={end} />;
        return null;
      })}

      {/* 3. Render Double Bonds */}
      {structure.doubleBonds.map(([startId, endId]: any, i: number) => {
        const start = structure.atoms.find(a => a.id === startId)?.position;
        const end = structure.atoms.find(a => a.id === endId)?.position;
        if (start && end) return <DoubleBond key={`d-${i}`} start={start} end={end} />;
        return null;
      })}
    </group>
  );
};

// --- MOLECULE VIEWER MODAL COMPONENT ---
interface MoleculeViewerProps {
  onClose?: () => void;
}

const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 z-50 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        aria-label="Close molecular viewer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 3D Canvas */}
      <Canvas 
        dpr={[1, 2]} 
        gl={{ antialias: true, alpha: false }} 
        camera={{ position: [0, 2, 14], fov: 45 }}
        shadows
        className="w-full h-full"
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 10, 40]} />
        
        {/* --- LIGHTING --- */}
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2dd4bf" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="white" />

        {/* --- CONTROLS --- */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          autoRotate 
          autoRotateSpeed={0.8} 
          minDistance={5}
          maxDistance={30}
        />

        {/* --- THE MOLECULE & LABEL --- */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <group>
             <MinocyclineModel position={[0, 0, 0]} />
             
             {/* 3D LABEL */}
             <Text
                position={[0, -2.8, 0]}
                fontSize={0.8}
                fontWeight={800}
                letterSpacing={0.1}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#000000"
              >
                MINOCYCLINE
              </Text>
          </group>
        </Float>
        
        {/* --- ENVIRONMENT --- */}
        <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />
      </Canvas>
      
      {/* Top Left Info Overlay */}
      <div className="absolute top-8 left-8 pointer-events-none select-none">
        <h1 className="text-xl font-bold text-slate-400 tracking-tight uppercase">Structure View</h1>
        <p className="text-teal-400 font-mono mt-1 text-sm">C₂₃H₂₇N₃O₇</p>
      </div>
      
      {/* Bottom Center Instruction */}
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none select-none">
        <span className="text-slate-500 text-xs font-mono uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
           Interactive 3D Model • Drag to Rotate
        </span>
      </div>
    </div>
  );
};

export default MoleculeViewer;
