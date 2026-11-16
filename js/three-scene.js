/**
 * ResumeX AI - Interactive Three.js 3D Resume Document & Scene
 * Features: Realistic 3D floating document, procedural canvas texture,
 * orbiting geometric accents, mouse-follow parallax, and WebGL fallback.
 */

(function () {
  'use strict';

  // Check WebGL availability
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  const container = document.getElementById('three-canvas-container');
  const fallback = document.querySelector('.webgl-fallback');

  if (!container) return;

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    if (fallback) fallback.classList.add('active');
    console.warn('ResumeX AI: WebGL is not supported or Three.js failed to load. Falling back to CSS preview.');
    return;
  }

  // Scene variables
  let scene, camera, renderer, clock;
  let resumeGroup;
  const floatingObjects = [];
  let isVisible = true;

  // Mouse interaction state
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  init();

  function init() {
    // 1. Clock
    clock = new THREE.Clock();

    // 2. Scene
    scene = new THREE.Scene();

    // 3. Camera
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // 4. Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 5. Lighting
    setupLighting();

    // 6. Build 3D Resume Document
    buildResumeDocument();

    // 7. Add Floating Geometric Accents
    buildGeometricAccents();

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 9. Intersection Observer for battery/performance savings
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      observer.observe(container);
    }

    // 10. Start Animation Loop
    animate();
  }

  /**
   * Sets up studio lighting with soft indigo and cyan rim lights
   */
  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Main key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    // Soft Indigo fill light
    const indigoLight = new THREE.DirectionalLight(0x6366f1, 0.7);
    indigoLight.position.set(-4, 3, 2);
    scene.add(indigoLight);

    // Soft Cyan rim light
    const rimLight = new THREE.PointLight(0x06b6d4, 0.9, 12);
    rimLight.position.set(3, -3, 3);
    scene.add(rimLight);

    // Purple accent light
    const purpleLight = new THREE.PointLight(0x8b5cf6, 0.6, 10);
    purpleLight.position.set(-2, -3, 2);
    scene.add(purpleLight);
  }

  /**
   * Generates a high-resolution 2D canvas texture resembling a clean ATS resume
   */
  function createResumeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');

    // White paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle paper edge border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Top Header Banner with soft gradient
    const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    headerGrad.addColorStop(0, '#4f46e5');
    headerGrad.addColorStop(1, '#7c3aed');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(40, 40, canvas.width - 80, 140);

    // Profile photo placeholder
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(110, 110, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    ctx.arc(110, 110, 38, 0, Math.PI * 2);
    ctx.fill();

    // Name & Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SARAH CHEN', 180, 95);

    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#c7d2fe';
    ctx.fillText('Senior Full-Stack Engineer | Cloud Architecture', 180, 130);

    // ATS Match Seal in Top Corner
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(920, 110, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('96%', 920, 108);
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ATS PASS', 920, 126);
    ctx.textAlign = 'left';

    // Helper to draw simulated resume text lines
    function drawSectionHeader(title, y) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(title, 50, y);

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, y + 10);
      ctx.lineTo(240, y + 10);
      ctx.stroke();
    }

    function drawLine(x, y, w, h = 8, color = '#cbd5e1') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
    }

    // Section 1: Executive Summary
    drawSectionHeader('PROFESSIONAL SUMMARY', 230);
    drawLine(50, 260, 920, 10, '#64748b');
    drawLine(50, 282, 880, 9, '#94a3b8');
    drawLine(50, 302, 750, 9, '#94a3b8');

    // Section 2: Experience
    drawSectionHeader('WORK EXPERIENCE', 360);
    
    // Job 1
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Lead Software Engineer • CloudScale Solutions', 50, 395);
    ctx.fillStyle = '#64748b';
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('2021 — PRESENT', 800, 395);

    drawLine(50, 415, 900, 8, '#94a3b8');
    drawLine(50, 433, 850, 8, '#94a3b8');
    drawLine(50, 451, 820, 8, '#94a3b8');
    drawLine(50, 469, 640, 8, '#94a3b8');

    // Job 2
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Senior Full Stack Developer • NexaTech Labs', 50, 520);
    ctx.fillStyle = '#64748b';
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('2018 — 2021', 820, 520);

    drawLine(50, 540, 890, 8, '#94a3b8');
    drawLine(50, 558, 860, 8, '#94a3b8');
    drawLine(50, 576, 780, 8, '#94a3b8');

    // Section 3: Technical Skills (Pills)
    drawSectionHeader('TECHNICAL SKILLS & KEYWORDS', 635);
    const skills = [
      'TypeScript', 'React.js', 'Node.js', 'Python', 'AWS Cloud',
      'Docker', 'GraphQL', 'Kubernetes', 'PostgreSQL', 'Microservices',
      'System Architecture', 'CI/CD Pipelines', 'REST APIs', 'TailwindCSS'
    ];

    let pillX = 50;
    let pillY = 665;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';

    skills.forEach(skill => {
      const textWidth = ctx.measureText(skill).width;
      const pillWidth = textWidth + 24;

      if (pillX + pillWidth > 950) {
        pillX = 50;
        pillY += 40;
      }

      // Pill background
      ctx.fillStyle = '#eef2ff';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, 30, 15);
      ctx.fill();

      // Pill border
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pill text
      ctx.fillStyle = '#4338ca';
      ctx.fillText(skill, pillX + 12, pillY + 21);

      pillX += pillWidth + 12;
    });

    // Section 4: Education & Certifications
    drawSectionHeader('EDUCATION & CERTIFICATIONS', 830);
    drawLine(50, 860, 880, 9, '#64748b');
    drawLine(50, 882, 700, 8, '#94a3b8');
    drawLine(50, 910, 850, 9, '#64748b');
    drawLine(50, 932, 620, 8, '#94a3b8');

    // Section 5: Key Achievements
    drawSectionHeader('KEY METRICS & IMPACT', 990);
    drawLine(50, 1020, 900, 8, '#10b981');
    drawLine(50, 1040, 860, 8, '#94a3b8');
    drawLine(50, 1060, 780, 8, '#94a3b8');
    drawLine(50, 1080, 840, 8, '#94a3b8');

    // Subtle bottom watermark
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Verified with ResumeX AI Engine', 50, 1340);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  /**
   * Constructs the 3D Resume Document Mesh
   */
  function buildResumeDocument() {
    resumeGroup = new THREE.Group();

    // Document Dimensions (aspect ratio 1 : 1.38 like letter paper)
    const docWidth = 2.45;
    const docHeight = 3.35;
    const docThickness = 0.035;

    // Front face with crisp canvas texture
    const frontTexture = createResumeTexture();

    // Materials for 6 faces of box
    const paperWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05
    });

    const frontFaceMat = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.3,
      metalness: 0.05
    });

    // Order: +X, -X, +Y, -Y, +Z (front), -Z (back)
    const materials = [
      paperWhiteMat,
      paperWhiteMat,
      paperWhiteMat,
      paperWhiteMat,
      frontFaceMat,
      paperWhiteMat
    ];

    const docGeometry = new THREE.BoxGeometry(docWidth, docHeight, docThickness);
    const resumeMesh = new THREE.Mesh(docGeometry, materials);
    resumeGroup.add(resumeMesh);

    // Subtle edge highlight frame (gives realistic paper depth)
    const edgeGeo = new THREE.EdgesGeometry(docGeometry);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.35,
      linewidth: 1
    });
    const edgeWireframe = new THREE.LineSegments(edgeGeo, edgeMat);
    resumeGroup.add(edgeWireframe);

    // Initial slight angled tilt
    resumeGroup.rotation.x = 0.12;
    resumeGroup.rotation.y = -0.22;
    resumeGroup.position.set(0, 0, 0);

    scene.add(resumeGroup);
  }

  /**
   * Adds floating geometric shapes around the resume for depth
   */
  function buildGeometricAccents() {
    // 1. Floating Icosahedron (Lavender / Glass)
    const icoGeo = new THREE.IcosahedronGeometry(0.38, 0);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.4
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.position.set(-2.0, 1.4, 0.5);
    scene.add(icosahedron);
    floatingObjects.push({ mesh: icosahedron, rotSpeedX: 0.008, rotSpeedY: 0.012, floatSpeed: 1.4, floatAmp: 0.15, initialY: 1.4 });

    // 2. Floating Torus (Cyan / Indigo ring)
    const torusGeo = new THREE.TorusGeometry(0.42, 0.07, 16, 36);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.2,
      metalness: 0.4
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(2.1, -1.2, 0.7);
    torus.rotation.x = Math.PI / 4;
    scene.add(torus);
    floatingObjects.push({ mesh: torus, rotSpeedX: 0.015, rotSpeedY: 0.009, floatSpeed: 1.8, floatAmp: 0.12, initialY: -1.2 });

    // 3. Floating Sphere (Indigo accent)
    const sphereGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x4f46e5,
      roughness: 0.2,
      metalness: 0.3,
      clearcoat: 0.6
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(1.9, 1.6, -0.2);
    scene.add(sphere);
    floatingObjects.push({ mesh: sphere, rotSpeedX: 0.005, rotSpeedY: 0.007, floatSpeed: 1.2, floatAmp: 0.18, initialY: 1.6 });

    // 4. Floating Small Ring (Pastel Violet)
    const miniRingGeo = new THREE.TorusGeometry(0.22, 0.04, 16, 28);
    const miniRingMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      roughness: 0.3,
      metalness: 0.2
    });
    const miniRing = new THREE.Mesh(miniRingGeo, miniRingMat);
    miniRing.position.set(-1.8, -1.4, 0.2);
    scene.add(miniRing);
    floatingObjects.push({ mesh: miniRing, rotSpeedX: 0.01, rotSpeedY: 0.016, floatSpeed: 2.0, floatAmp: 0.1, initialY: -1.4 });
  }

  /**
   * Tracks mouse movements with smooth damping coordinates
   */
  function onMouseMove(event) {
    mouse.targetX = (event.clientX - windowHalfX) / windowHalfX;
    mouse.targetY = (event.clientY - windowHalfY) / windowHalfY;
  }

  /**
   * Window resize handler
   */
  function onWindowResize() {
    if (!container || !renderer || !camera) return;

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * Animation & Render Loop
   */
  function animate() {
    requestAnimationFrame(animate);

    if (!isVisible) return; // Save resources when offscreen

    const elapsedTime = clock.getElapsedTime();

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    // Animate 3D Resume Document
    if (resumeGroup) {
      // Floating sinusoidal bobbing
      resumeGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.1;

      // Mouse-follow parallax tilt + base oscillation
      const targetRotY = -0.22 + mouse.x * 0.45;
      const targetRotX = 0.12 - mouse.y * 0.35;

      resumeGroup.rotation.y += (targetRotY - resumeGroup.rotation.y) * 0.06;
      resumeGroup.rotation.x += (targetRotX - resumeGroup.rotation.x) * 0.06;
      resumeGroup.rotation.z = Math.sin(elapsedTime * 1.2) * 0.025;
    }

    // Animate Floating Geometric Shapes
    floatingObjects.forEach((item, index) => {
      item.mesh.rotation.x += item.rotSpeedX;
      item.mesh.rotation.y += item.rotSpeedY;
      item.mesh.position.y = item.initialY + Math.sin(elapsedTime * item.floatSpeed + index) * item.floatAmp;
    });

    renderer.render(scene, camera);
  }
})();
