/**
 * DocSeal 3D Hero Scene - Three.js
 * Visualizes a tamper-resistant digital document shielded by IPFS distributed nodes
 * Optimized for standard laptops (RAM 8GB), smooth damping, zero-pill discipline
 */

(function () {
  const container = document.getElementById("three-canvas-container");
  if (!container || typeof THREE === "undefined") {
    console.log("Three.js not loaded or container not found. Running in fallback mode.");
    return;
  }

  let scene, camera, renderer, documentGroup, nodesGroup;
  let isRunning = true;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;

  function init() {
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 3. Renderer with SRGB color space & tone mapping
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.5);
    dirLight2.position.set(-5, -3, 3);
    scene.add(dirLight2);

    // 5. Document & Shield Hierarchy
    documentGroup = new THREE.Group();
    scene.add(documentGroup);

    // Digital Document Plaque (Rounded rectangle simulation)
    const docGeo = new THREE.BoxGeometry(2.4, 3.2, 0.1);
    const docMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.25,
    });
    const docMesh = new THREE.Mesh(docGeo, docMat);
    documentGroup.add(docMesh);

    // Outer Glowing Border Ring
    const borderGeo = new THREE.BoxGeometry(2.48, 3.28, 0.08);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    documentGroup.add(borderMesh);

    // Golden Cryptographic Seal in Center
    const sealGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.15, 32);
    sealGeo.rotateX(Math.PI / 2);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.2,
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.z = 0.08;
    documentGroup.add(sealMesh);

    // Shield Emblem Ring
    const ringGeo = new THREE.TorusGeometry(0.75, 0.03, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.z = 0.09;
    documentGroup.add(ringMesh);

    // 6. IPFS Orbiting Distributed Network Nodes
    nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    const nodeCount = 14;
    const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2
    });

    const nodePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.6 + Math.sin(i * 1.5) * 0.4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.7);
      const z = Math.sin(i * 2) * 0.8;

      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, z);
      nodesGroup.add(node);
      nodePositions.push(node.position);
    }

    // Connect nodes with dynamic line constellation
    const lineGeo = new THREE.BufferGeometry().setFromPoints(nodePositions);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45
    });
    const lineMesh = new THREE.LineLoop(lineGeo, lineMat);
    nodesGroup.add(lineMesh);

    // 7. Event Listeners
    window.addEventListener("resize", onWindowResize);
    container.addEventListener("mousemove", onMouseMove);

    // Handle tab visibility to save CPU
    document.addEventListener("visibilitychange", () => {
      isRunning = !document.hidden;
      if (isRunning) animate();
    });

    animate();
  }

  function onMouseMove(event) {
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    targetRotationY = x * 0.4;
    targetRotationX = -y * 0.3;
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  let clock = new THREE.Clock();

  function animate() {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Smooth damping for mouse orientation
    if (documentGroup) {
      documentGroup.rotation.y += (targetRotationY - documentGroup.rotation.y) * 0.05;
      documentGroup.rotation.x += (targetRotationX - documentGroup.rotation.x) * 0.05;
      // Gentle floating oscillation
      documentGroup.position.y = Math.sin(time * 1.2) * 0.08;
    }

    // Orbiting IPFS network nodes
    if (nodesGroup) {
      nodesGroup.rotation.z = time * 0.15;
      nodesGroup.rotation.y = time * 0.1;
    }

    renderer.render(scene, camera);
  }

  // Safe bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
