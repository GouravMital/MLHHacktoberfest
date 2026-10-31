import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Agent, FactionId, TradeFlow } from '../types/aetheria';

interface CityCanvasProps {
  agents: Agent[];
  tradeFlows: TradeFlow[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  weather: string;
}

// Terminal-aligned distinct faction palettes and visual geometries
export const FACTION_CONFIG: Record<
  FactionId,
  { name: string; tag: string; color: number; hex: string; geomType: 'cube' | 'octa' | 'dodeca' | 'tetra' | 'cone' }
> = {
  silicon_cartel: {
    name: 'SILICON CARTEL',
    tag: 'SC',
    color: 0x38e894, // Terminal Seafoam Green
    hex: '#38e894',
    geomType: 'cube',
  },
  bio_synthetics: {
    name: 'BIO-SYNTHETICS',
    tag: 'BS',
    color: 0x66ff66, // Pure Phosphor Ink Green
    hex: '#66ff66',
    geomType: 'octa',
  },
  void_monks: {
    name: 'VOID MONKS',
    tag: 'VM',
    color: 0x9eff49, // Chartreuse Green
    hex: '#9eff49',
    geomType: 'dodeca',
  },
  neo_meritocrats: {
    name: 'NEO-MERITOCRATS',
    tag: 'NM',
    color: 0xe6ff66, // Light Amber Phosphor
    hex: '#e6ff66',
    geomType: 'tetra',
  },
  sol_arbiters: {
    name: 'SOL ARBITERS',
    tag: 'SA',
    color: 0xffffff, // Pure Emphasis White
    hex: '#ffffff',
    geomType: 'cone',
  },
};

export const CityCanvas: React.FC<CityCanvasProps> = ({
  agents,
  tradeFlows,
  selectedAgentId,
  onSelectAgent,
  weather,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const hoveredAgentRef = useRef<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    id: string;
    name: string;
    factionId: FactionId;
    factionName: string;
    tag: string;
    thought: string;
    district: string;
    action: string;
    x: number;
    y: number;
  } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const tradeParticlesRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup - Pure Black Ground (Terminal Design System: #000000)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    // 2. Camera setup - Isometric Orthographic View
    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 44;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      -200,
      1000
    );
    camera.position.set(40, 40, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup - Crisp, Flat, No blur, 0 radius
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights - Minimal, Clean, Flat
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x66ff66, 0.6);
    dirLight.position.set(25, 45, 25);
    scene.add(dirLight);

    // 5. Wireframe Grid Floor - Terminal Rule Green (#255325) on Ground (#000000)
    const primaryGrid = new THREE.GridHelper(56, 28, 0x58ca58, 0x255325);
    primaryGrid.position.y = 0;
    scene.add(primaryGrid);

    // 6. District Spires - Clean Geometric Wireframe Monuments
    const districts = [
      { name: 'SEC_01:SILICON_CARTEL', pos: [-16, 0, -12], color: 0x38e894, height: 12, tag: 'SC' },
      { name: 'SEC_02:BIO_SYNTHETICS', pos: [14, 0, 10], color: 0x66ff66, height: 11, tag: 'BS' },
      { name: 'SEC_03:VOID_MONOLITH', pos: [0, 0, -18], color: 0x9eff49, height: 15, tag: 'VM' },
      { name: 'SEC_04:CIVIC_AGORA', pos: [16, 0, -12], color: 0xe6ff66, height: 9, tag: 'NM' },
      { name: 'SEC_05:SOL_CONSENSUS', pos: [-10, 0, 15], color: 0xffffff, height: 14, tag: 'SA' },
    ];

    districts.forEach((d) => {
      const group = new THREE.Group();
      group.position.set(d.pos[0], 0, d.pos[2]);

      // Wireframe Spire Body
      const spireGeo = new THREE.CylinderGeometry(0.8, 2.2, d.height, 4, 3, false);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x255325,
        wireframe: true,
      });
      const spire = new THREE.Mesh(spireGeo, wireMat);
      spire.position.y = d.height / 2;
      group.add(spire);

      // District Apex Terminal Beacon
      const apexGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const apexMat = new THREE.MeshBasicMaterial({
        color: d.color,
        wireframe: true,
      });
      const apex = new THREE.Mesh(apexGeo, apexMat);
      apex.position.y = d.height + 1.2;
      apex.name = `apex_${d.tag}`;
      group.add(apex);

      // Baseline Boundary Footprint
      const footGeo = new THREE.RingGeometry(2.6, 2.8, 4);
      const footMat = new THREE.MeshBasicMaterial({
        color: 0x255325,
        side: THREE.DoubleSide,
      });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.rotation.x = Math.PI / 2;
      foot.rotation.z = Math.PI / 4;
      foot.position.y = 0.02;
      group.add(foot);

      scene.add(group);
    });

    // 7. Interaction: Mouse Hover & Selection
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const clickableObjects: THREE.Object3D[] = [];
      agentMeshesRef.current.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) clickableObjects.push(child);
        });
      });

      const intersects = raycasterRef.current.intersectObjects(clickableObjects);
      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        while (parent && !parent.name.startsWith('agent_')) {
          parent = parent.parent;
        }
        if (parent && parent.name.startsWith('agent_')) {
          const agentId = parent.name.replace('agent_', '');
          hoveredAgentRef.current = agentId;
          const found = agents.find((a) => a.id === agentId);
          if (found) {
            const config = FACTION_CONFIG[found.factionId];
            setHoveredInfo({
              id: found.id,
              name: found.name,
              factionId: found.factionId,
              factionName: config.name,
              tag: config.tag,
              thought: found.currentThought,
              district: found.district,
              action: found.currentAction,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
            container.style.cursor = 'crosshair';
            return;
          }
        }
      }
      hoveredAgentRef.current = null;
      setHoveredInfo(null);
      container.style.cursor = 'default';
    };

    const handleClick = () => {
      if (hoveredAgentRef.current) {
        onSelectAgent(hoveredAgentRef.current);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newAspect = w / h;
      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate apex beacons
      districts.forEach((d) => {
        const beacon = scene.getObjectByName(`apex_${d.tag}`);
        if (beacon) {
          beacon.rotation.y = elapsedTime * 0.4;
          beacon.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
        }
      });

      // Animate agent wireframe geometries
      agentMeshesRef.current.forEach((group, agId) => {
        const marker = group.getObjectByName('faction_marker');
        if (marker) {
          marker.rotation.y = elapsedTime * 1.2;
          marker.position.y = 2.4 + Math.sin(elapsedTime * 2.5 + parseInt(agId.replace(/\D/g, '') || '1')) * 0.25;
        }

        const reticle = group.getObjectByName('selection_reticle');
        if (reticle) {
          reticle.rotation.z = -elapsedTime * 0.8;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Agent Meshes with unique faction markers and wireframes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    agents.forEach((agent) => {
      let group = agentMeshesRef.current.get(agent.id);
      const config = FACTION_CONFIG[agent.factionId] || FACTION_CONFIG.bio_synthetics;

      if (!group) {
        group = new THREE.Group();
        group.name = `agent_${agent.id}`;

        // 1. Base pedestal wireframe
        const baseGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 8);
        const baseMat = new THREE.MeshBasicMaterial({
          color: 0x255325,
          wireframe: true,
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        group.add(base);

        // 2. Faction-Specific Unique 3D Wireframe Geometry Marker
        let markerGeo: THREE.BufferGeometry;
        switch (config.geomType) {
          case 'cube':
            markerGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            break;
          case 'octa':
            markerGeo = new THREE.OctahedronGeometry(1.0, 0);
            break;
          case 'dodeca':
            markerGeo = new THREE.DodecahedronGeometry(0.9, 0);
            break;
          case 'tetra':
            markerGeo = new THREE.TetrahedronGeometry(1.2, 0);
            break;
          case 'cone':
          default:
            markerGeo = new THREE.ConeGeometry(0.9, 1.8, 6);
            break;
        }

        const markerMat = new THREE.MeshBasicMaterial({
          color: config.color,
          wireframe: true,
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.y = 2.4;
        marker.name = 'faction_marker';
        group.add(marker);

        // 3. Inner Solid Nucleus Core (Faction Accent)
        const coreGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({
          color: config.color,
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 2.4;
        core.name = 'faction_core';
        group.add(core);

        // 4. Ground Crosshair Anchor
        const crossGeo = new THREE.RingGeometry(1.4, 1.5, 4);
        const crossMat = new THREE.MeshBasicMaterial({
          color: 0x255325,
          side: THREE.DoubleSide,
        });
        const cross = new THREE.Mesh(crossGeo, crossMat);
        cross.rotation.x = Math.PI / 2;
        cross.rotation.z = Math.PI / 4;
        cross.position.y = 0.05;
        cross.name = 'ground_anchor';
        group.add(cross);

        // 5. Selection Square Bracket Box (Hidden by default, shown when selected)
        const reticleGeo = new THREE.RingGeometry(2.0, 2.15, 4);
        const reticleMat = new THREE.MeshBasicMaterial({
          color: 0xffffff, // White emphasis
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.0,
        });
        const reticle = new THREE.Mesh(reticleGeo, reticleMat);
        reticle.rotation.x = Math.PI / 2;
        reticle.rotation.z = Math.PI / 4;
        reticle.position.y = 0.08;
        reticle.name = 'selection_reticle';
        group.add(reticle);

        // 6. Vertical Telemetry Line
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 4.5, 0),
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x255325,
          transparent: true,
          opacity: 0.6,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);

        scene.add(group);
        agentMeshesRef.current.set(agent.id, group);
      }

      // Smooth coordinate positioning
      const targetPos = new THREE.Vector3(agent.position[0], agent.position[1], agent.position[2]);
      group.position.lerp(targetPos, 0.25);

      // Update Selection Highlight
      const isSelected = selectedAgentId === agent.id;
      const reticle = group.getObjectByName('selection_reticle') as THREE.Mesh;
      if (reticle && reticle.material instanceof THREE.MeshBasicMaterial) {
        reticle.material.opacity = isSelected ? 1.0 : 0.0;
      }

      const marker = group.getObjectByName('faction_marker') as THREE.Mesh;
      if (marker && marker.material instanceof THREE.MeshBasicMaterial) {
        marker.material.color.setHex(isSelected ? 0xffffff : config.color);
      }
    });

    // Remove obsolete agents
    const currentAgentIds = new Set(agents.map((a) => a.id));
    agentMeshesRef.current.forEach((group, id) => {
      if (!currentAgentIds.has(id)) {
        scene.remove(group);
        agentMeshesRef.current.delete(id);
      }
    });
  }, [agents, selectedAgentId]);

  // Update Trade Vector Flow Particles
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (tradeParticlesRef.current) {
      scene.remove(tradeParticlesRef.current);
      tradeParticlesRef.current = null;
    }

    if (tradeFlows.length === 0) return;

    const particleCount = tradeFlows.length * 12;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    let idx = 0;
    tradeFlows.forEach((flow) => {
      const p1 = new THREE.Vector3(...flow.startPos);
      const p2 = new THREE.Vector3(...flow.endPos);

      for (let i = 0; i < 12; i++) {
        const ratio = (flow.progress + i * 0.08) % 1.0;
        const currentPos = new THREE.Vector3().lerpVectors(p1, p2, ratio);
        currentPos.y += Math.sin(ratio * Math.PI) * 2;

        positions[idx * 3] = currentPos.x;
        positions[idx * 3 + 1] = currentPos.y;
        positions[idx * 3 + 2] = currentPos.z;
        idx++;
      }
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x66ff66,
      size: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    tradeParticlesRef.current = particles;
  }, [tradeFlows]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black">
      <div ref={mountRef} className="w-full h-full" />

      {/* Terminal Viewport Header Indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 px-2 py-1 bg-black border border-[#255325] text-xs font-mono text-[#66ff66]">
        <span className="text-[#58ca58]">03.01</span>
        <span>GRID: 56x56 WIREFRAME</span>
        <span className="text-[#255325]">|</span>
        <span className="text-[#ffffff]">STATUS: {weather}</span>
      </div>

      {/* Faction Visual Legend Bar */}
      <div className="absolute top-2 right-2 z-10 hidden sm:flex items-center gap-3 px-2 py-1 bg-black border border-[#255325] text-[11px] font-mono">
        <span className="text-[#58ca58]">FACTIONS:</span>
        {Object.entries(FACTION_CONFIG).map(([key, f]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-2 h-2 inline-block border border-current" style={{ color: f.hex }} />
            <span style={{ color: f.hex }}>[{f.tag}]</span>
          </span>
        ))}
      </div>

      {/* Character-Aligned Terminal Hover Tooltip */}
      {hoveredInfo && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-black border border-[#255325] p-2 text-xs font-mono text-[#66ff66] max-w-sm"
          style={{ left: hoveredInfo.x, top: hoveredInfo.y }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#255325] pb-1 mb-1">
            <span className="text-white font-bold">{hoveredInfo.name}</span>
            <span
              className="px-1 text-[10px] border border-current font-bold"
              style={{ color: FACTION_CONFIG[hoveredInfo.factionId]?.hex || '#66ff66' }}
            >
              [{hoveredInfo.tag}] {hoveredInfo.factionName}
            </span>
          </div>
          <div className="text-[11px] text-[#58ca58]">DISTRICT: {hoveredInfo.district}</div>
          <div className="text-[11px] text-[#58ca58]">ACTION: {hoveredInfo.action}</div>
          <div className="mt-1 pt-1 border-t border-[#255325] text-[11px] text-[#66ff66] leading-snug">
            "{hoveredInfo.thought}"
          </div>
          <div className="mt-1 text-[10px] text-[#58ca58] text-right">[CLICK_TO_LOCK_TARGET]</div>
        </div>
      )}
    </div>
  );
};

export default CityCanvas;
