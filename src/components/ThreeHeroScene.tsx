import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Eye, EyeOff, RotateCcw, ShieldCheck, Globe } from "lucide-react";

interface ThreeHeroSceneProps {
  isDarkMode?: boolean;
}

export const ThreeHeroScene: React.FC<ThreeHeroSceneProps> = ({ isDarkMode = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // References for animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const docGroupRef = useRef<THREE.Group | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const wireframeMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const speedRef = useRef(1);
  speedRef.current = speedMultiplier;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 2. Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Lighting Rig (3-point studio lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    fillLight.position.set(-5, -3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.2);
    rimLight.position.set(0, 6, -4);
    scene.add(rimLight);

    // 4. Document Group
    const docGroup = new THREE.Group();
    docGroupRef.current = docGroup;
    scene.add(docGroup);

    // Document Plaque
    const docGeo = new THREE.BoxGeometry(2.3, 3.2, 0.12);
    const docMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const docMesh = new THREE.Mesh(docGeo, docMat);
    docGroup.add(docMesh);

    // Outer Tech Border
    const borderGeo = new THREE.BoxGeometry(2.4, 3.3, 0.1);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.9,
      roughness: 0.15,
      wireframe: true,
    });
    wireframeMatRef.current = borderMat;
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    docGroup.add(borderMesh);

    // Central Gold Cryptographic Seal
    const sealGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.14, 32);
    sealGeo.rotateX(Math.PI / 2);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.z = 0.08;
    docGroup.add(sealMesh);

    // Outer Torus Ring
    const ringGeo = new THREE.TorusGeometry(0.78, 0.035, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.z = 0.09;
    docGroup.add(ringMesh);

    // 5. Distributed IPFS Constellation Nodes
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    scene.add(nodesGroup);

    const nodeCount = 16;
    const nodeGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      metalness: 0.7,
      roughness: 0.2,
    });

    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.65 + Math.sin(i * 1.5) * 0.45;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.72);
      const z = Math.sin(i * 2.2) * 0.9;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, z);
      nodesGroup.add(node);
      positions.push(node.position);
    }

    // Dynamic Connection lines
    const lineGeo = new THREE.BufferGeometry().setFromPoints(positions);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
    });
    const lineLoop = new THREE.LineLoop(lineGeo, lineMat);
    nodesGroup.add(lineLoop);

    // Cross-links across diameter
    const crossPoints = [
      positions[0], positions[8],
      positions[4], positions[12],
      positions[2], positions[10],
      positions[6], positions[14]
    ];
    const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPoints);
    const crossLines = new THREE.LineSegments(crossGeo, lineMat);
    nodesGroup.add(crossLines);

    // Mouse Interaction
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.45;
      targetRotX = -y * 0.35;
    };

    container.addEventListener("mousemove", handleMouseMove);

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let isTabVisible = true;

    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime() * speedRef.current;

      // Exponential damping
      if (docGroup) {
        docGroup.rotation.y = THREE.MathUtils.damp(docGroup.rotation.y, targetRotY, 4, delta);
        docGroup.rotation.x = THREE.MathUtils.damp(docGroup.rotation.x, targetRotX, 4, delta);
        docGroup.position.y = Math.sin(time * 1.4) * 0.09;
      }

      if (nodesGroup) {
        nodesGroup.rotation.z = time * 0.16;
        nodesGroup.rotation.y = time * 0.12;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      docGeo.dispose();
      docMat.dispose();
      sealGeo.dispose();
      sealMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
    };
  }, []);

  const toggleWireframe = () => {
    setWireframeMode(prev => {
      const next = !prev;
      if (wireframeMatRef.current) {
        wireframeMatRef.current.wireframe = true;
        wireframeMatRef.current.color.setHex(next ? 0x10b981 : 0x0ea5e9);
      }
      return next;
    });
  };

  const resetCamera = () => {
    if (docGroupRef.current) {
      docGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div
      className={`relative w-full h-[400px] md:h-[460px] rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center transition-colors duration-200 border ${
        isDarkMode
          ? "bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-950/95 border-slate-800/80"
          : "bg-gradient-to-b from-slate-900/90 via-slate-850 to-slate-950/90 border-slate-300 shadow-xl"
      }`}
    >
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec Badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" />
          Mô hình 3D: IPFS Sharded Shield
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          16 Distributed Nodes
        </span>
      </div>

      {/* Collapsible Bottom Control Dock following Three.js Skill Directives */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 flex flex-col items-center">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsZenMode(!isZenMode)}
          className="mb-1 px-3 py-1 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-t-lg border-t border-x border-slate-700 shadow-md flex items-center gap-1.5 transition-colors"
        >
          {isZenMode ? (
            <>
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Hiện điều khiển 3D</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Ẩn điều khiển (Zen Mode)</span>
            </>
          )}
        </button>

        {/* Control Dock Panel */}
        <div
          className={`flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl transition-all duration-300 ${
            isZenMode ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          {/* Speed Preset Buttons */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
            {[0.5, 1, 2].map(speed => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  speedMultiplier === speed
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Wireframe toggle */}
          <button
            onClick={toggleWireframe}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              wireframeMode
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-700"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Lưới bảo vệ
          </button>

          {/* Reset position */}
          <button
            onClick={resetCamera}
            title="Đặt lại góc nhìn"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
