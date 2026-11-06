import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

function makeSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 128, 6, 64, 128, 68);
  gradient.addColorStop(0, 'rgba(255,250,238,0.30)');
  gradient.addColorStop(0.28, 'rgba(255,248,236,0.17)');
  gradient.addColorStop(0.65, 'rgba(255,248,236,0.055)');
  gradient.addColorStop(1, 'rgba(255,248,236,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 256);
  return new THREE.CanvasTexture(canvas);
}

function makeCurvedGeometry(width, height) {
  const geometry = new THREE.PlaneGeometry(width, height, 48, 64);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const nx = x / (width / 2);
    const ny = y / (height / 2);
    const bulge = 0.075 * (1 - nx * nx) * (1 - ny * ny);
    positions.setZ(i, bulge);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

const PlateViewer = forwardRef(function PlateViewer({ image, autoRotate }, ref) {
  const hostRef = useRef(null);
  const apiRef = useRef({ zoom: () => {}, reset: () => {} });
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  useImperativeHandle(ref, () => ({
    zoom: (amount) => apiRef.current.zoom(amount),
    reset: () => apiRef.current.reset(),
  }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let frameId = 0;
    let isDragging = false;
    let previousPointer = { x: 0, y: 0 };
    let pointerMoved = false;
    let pinchDistance = null;
    const pointers = new Map();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'food-canvas';
    renderer.domElement.setAttribute('aria-label', 'Plato interactivo: arrastra para girar y usa la rueda para acercar');
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffe6c5, 0x24150c, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffd59a, 2.4);
    keyLight.position.set(-3, 5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xd98a32, 34, 14);
    rimLight.position.set(3, -2, 3);
    scene.add(rimLight);

    const dishGroup = new THREE.Group();
    scene.add(dishGroup);

    const smokeGroup = new THREE.Group();
    dishGroup.add(smokeGroup);
    const smokeTexture = makeSmokeTexture();
    const smokeParticles = [];
    for (let i = 0; i < 17; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 0.22 + Math.random() * 0.15,
        depthWrite: false,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.74), material);
      const x = (Math.random() - 0.5) * 2.15;
      const y = (Math.random() - 0.5) * 0.75;
      mesh.position.set(x, y, 0.25 + Math.random() * 0.08);
      mesh.rotation.z = (Math.random() - 0.5) * 0.35;
      mesh.userData = {
        baseX: x,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.28,
        drift: 0.08 + Math.random() * 0.13,
      };
      smokeGroup.add(mesh);
      smokeParticles.push(mesh);
    }

    let imageWidth = 3.55;
    let imageHeight = 4.7;
    let photoMesh = null;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(image, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const aspect = texture.image.width / texture.image.height;
      imageWidth = 3.72;
      imageHeight = imageWidth / aspect;

      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(imageWidth + 0.10, imageHeight + 0.10, 0.15),
        [
          new THREE.MeshStandardMaterial({ color: 0x4a2b15, metalness: 0.68, roughness: 0.3 }),
          new THREE.MeshStandardMaterial({ color: 0x4a2b15, metalness: 0.68, roughness: 0.3 }),
          new THREE.MeshStandardMaterial({ color: 0xb88948, metalness: 0.72, roughness: 0.28 }),
          new THREE.MeshStandardMaterial({ color: 0x3b2414, metalness: 0.45, roughness: 0.4 }),
          new THREE.MeshStandardMaterial({ color: 0x21150f, metalness: 0.32, roughness: 0.45 }),
          new THREE.MeshStandardMaterial({ color: 0x21150f, metalness: 0.32, roughness: 0.45 }),
        ]
      );
      backing.position.z = -0.015;
      dishGroup.add(backing);

      const photoMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.76,
        metalness: 0.0,
        side: THREE.FrontSide,
      });
      photoMesh = new THREE.Mesh(makeCurvedGeometry(imageWidth, imageHeight), photoMaterial);
      photoMesh.position.z = 0.07;
      dishGroup.add(photoMesh);

      // Keep the smoke in the foreground of the pictured food.
      smokeGroup.position.set(0, 0.10, 0.05);
      smokeParticles.forEach((particle) => {
        particle.userData.baseX *= imageWidth / 3.55;
        particle.position.x = particle.userData.baseX;
      });
      fitCamera();
    }, undefined, (error) => {
      console.error('No se pudo cargar la fotografía del plato:', error);
    });

    function fitCamera() {
      const width = host.clientWidth || 600;
      const height = host.clientHeight || 520;
      camera.aspect = width / height;
      camera.fov = width < 600 ? 39 : 36;
      camera.position.z = Math.max(7.8, imageHeight * 1.58);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    const resizeObserver = new ResizeObserver(fitCamera);
    resizeObserver.observe(host);
    fitCamera();

    const reset = () => {
      dishGroup.rotation.set(-0.055, 0.14, 0);
      camera.position.z = Math.max(7.8, imageHeight * 1.58);
    };
    const zoom = (amount) => {
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + amount, 5.25, 12.5);
    };
    apiRef.current = { zoom, reset };
    reset();

    const onPointerDown = (event) => {
      renderer.domElement.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        isDragging = true;
        pointerMoved = false;
        previousPointer = { x: event.clientX, y: event.clientY };
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        isDragging = false;
      }
    };

    const onPointerMove = (event) => {
      if (!pointers.has(event.pointerId)) return;
      const old = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const nextDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDistance !== null) zoom((pinchDistance - nextDistance) * 0.012);
        pinchDistance = nextDistance;
        return;
      }
      if (!isDragging) return;
      const dx = event.clientX - old.x;
      const dy = event.clientY - old.y;
      if (Math.abs(dx) + Math.abs(dy) > 0) pointerMoved = true;
      dishGroup.rotation.y += dx * 0.008;
      dishGroup.rotation.x = THREE.MathUtils.clamp(dishGroup.rotation.x + dy * 0.006, -0.85, 0.85);
    };

    const onPointerUp = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDistance = null;
      if (pointers.size === 0) isDragging = false;
    };

    const onWheel = (event) => {
      event.preventDefault();
      zoom(event.deltaY * 0.006);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (!isDragging && autoRotateRef.current) dishGroup.rotation.y += 0.0022;
      smokeParticles.forEach((particle) => {
        const { baseX, baseY, phase, speed, drift } = particle.userData;
        const life = (elapsed * speed + phase) % 1;
        particle.position.y = baseY + life * 0.78;
        particle.position.x = baseX + Math.sin(elapsed * 1.35 + phase) * drift;
        const spread = 0.75 + life * 0.9;
        particle.scale.set(spread, 0.7 + life * 0.65, 1);
        particle.material.opacity = (1 - life) * 0.22;
        particle.rotation.z += 0.0015;
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material.map && material.map !== smokeTexture) material.map.dispose();
            material.dispose();
          });
        }
      });
      smokeTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [image]);

  return <div className="plate-viewer" ref={hostRef} />;
});

export default PlateViewer;
