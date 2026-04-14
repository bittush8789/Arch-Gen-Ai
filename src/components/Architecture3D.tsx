import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float, ContactShadows, Environment } from '@react-three/drei';
import { ArchitectureJSON } from '../lib/gemini';

interface Props {
  data: ArchitectureJSON;
}

const ComponentBox = ({ position, name, color, type }: any) => {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position}>
        <boxGeometry args={[1.5, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
        <Text
          position={[0, 0, 0.51]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
        <Text
          position={[0, -0.7, 0]}
          fontSize={0.12}
          color="#666"
          anchorX="center"
          anchorY="middle"
        >
          {type}
        </Text>
      </mesh>
    </Float>
  );
};

const Connection = ({ start, end }: any) => {
  const points = useMemo(() => [start, end], [start, end]);
  return (
    <line>
      <bufferGeometry attach="geometry" onUpdate={(self) => self.setFromPoints(points)} />
      <lineBasicMaterial attach="material" color="#999" linewidth={1} transparent opacity={0.5} />
    </line>
  );
};

export const Architecture3D: React.FC<Props> = ({ data }) => {
  const nodes = useMemo(() => {
    const allNodes = [
      ...data.services.map((s, i) => ({ ...s, group: 'service', color: '#3b82f6', index: i })),
      ...data.databases.map((d, i) => ({ ...d, group: 'database', color: '#ef4444', index: i })),
      ...data.apis.map((a, i) => ({ ...a, group: 'api', color: '#10b981', index: i }))
    ];

    return allNodes.map((node, i) => {
      const angle = (i / allNodes.length) * Math.PI * 2;
      const radius = 5;
      return {
        ...node,
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
      };
    });
  }, [data]);

  const links = useMemo(() => {
    return data.flows.map(f => {
      const startNode = nodes.find(n => n.name === f.from);
      const endNode = nodes.find(n => n.name === f.to);
      if (startNode && endNode) {
        return { start: startNode.position, end: endNode.position };
      }
      return null;
    }).filter(Boolean);
  }, [data, nodes]);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-xl border border-gray-200 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
        
        {nodes.map((node, i) => (
          <ComponentBox 
            key={i} 
            position={node.position} 
            name={node.name} 
            color={node.color} 
            type={node.group}
          />
        ))}

        {links.map((link: any, i) => (
          <Connection key={i} start={link.start} end={link.end} />
        ))}

        <OrbitControls makeDefault />
        <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
