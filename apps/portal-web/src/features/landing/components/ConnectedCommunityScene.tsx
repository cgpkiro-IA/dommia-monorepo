'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DataPacket = {
  curve: THREE.QuadraticBezierCurve3;
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  offset: number;
  speed: number;
};

const homes = [
  { x: -3.2, z: -1.55, wall: 0xd7e8f0, roof: 0x327db8, light: 0x37d9e8 },
  { x: -1.05, z: -1.55, wall: 0xe0e7e7, roof: 0x21699d, light: 0x24d8b0 },
  { x: 1.05, z: -1.55, wall: 0xd9e5ee, roof: 0x2676ad, light: 0x37d9e8 },
  { x: 3.2, z: -1.55, wall: 0xe5e8dd, roof: 0x8f7138, light: 0xf2b84b },
  { x: -3.2, z: 1.55, wall: 0xe0e8e7, roof: 0x2a739f, light: 0x24d8b0 },
  { x: -1.05, z: 1.55, wall: 0xd8e6ef, roof: 0x2478ac, light: 0x37d9e8 },
  { x: 1.05, z: 1.55, wall: 0xe5e9df, roof: 0x8b7138, light: 0xf2b84b },
  { x: 3.2, z: 1.55, wall: 0xd5e5ec, roof: 0x327db8, light: 0x24d8b0 },
];

export function ConnectedCommunityScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      mount.dataset.sceneState = 'unavailable';
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = 'portal-network-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);
    mount.dataset.sceneState = 'ready';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 60);
    camera.position.set(8.5, 10, 13);
    camera.lookAt(0, 0.25, 0);

    scene.add(new THREE.HemisphereLight(0xd5edff, 0x102033, 2.2));
    const keyLight = new THREE.DirectionalLight(0xc2e3ff, 2.4);
    keyLight.position.set(-4, 9, 6);
    scene.add(keyLight);
    const gateLight = new THREE.PointLight(0x2bd8e8, 3.5, 8);
    gateLight.position.set(0, 1.6, 2.65);
    scene.add(gateLight);

    const district = new THREE.Group();
    scene.add(district);

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.14, 7.15),
      new THREE.MeshStandardMaterial({ color: 0x0b1a2b, roughness: 0.72, metalness: 0.18 }),
    );
    ground.position.y = -0.14;
    district.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x19334a,
      roughness: 0.62,
      metalness: 0.2,
      emissive: 0x061723,
    });
    const crossStreet = new THREE.Mesh(new THREE.BoxGeometry(8.85, 0.025, 0.38), roadMaterial);
    crossStreet.position.y = -0.055;
    district.add(crossStreet);
    const gateStreet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.025, 6.75), roadMaterial);
    gateStreet.position.y = -0.054;
    district.add(gateStreet);

    const laneMaterial = new THREE.MeshBasicMaterial({ color: 0x4b8797, transparent: true, opacity: 0.45 });
    for (const x of [-0.23, 0.23]) {
      const lane = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 6.4), laneMaterial);
      lane.position.set(x, -0.034, -0.05);
      district.add(lane);
    }
    for (const z of [-0.23, 0.23]) {
      const lane = new THREE.Mesh(new THREE.BoxGeometry(8.45, 0.012, 0.018), laneMaterial);
      lane.position.set(0, -0.033, z);
      district.add(lane);
    }

    const padGeometry = new THREE.BoxGeometry(1.35, 0.045, 0.95);
    const wallGeometry = new THREE.BoxGeometry(0.72, 0.52, 0.62);
    const roofGeometry = new THREE.ConeGeometry(0.59, 0.42, 4);
    const windowGeometry = new THREE.BoxGeometry(0.14, 0.15, 0.035);
    const doorGeometry = new THREE.BoxGeometry(0.15, 0.29, 0.04);
    const beaconGeometry = new THREE.SphereGeometry(0.075, 12, 10);
    const houseMaterials = homes.map((home) => ({
      pad: new THREE.MeshStandardMaterial({ color: 0x142b40, roughness: 0.8 }),
      wall: new THREE.MeshStandardMaterial({ color: home.wall, roughness: 0.78 }),
      roof: new THREE.MeshStandardMaterial({ color: home.roof, roughness: 0.52, metalness: 0.12 }),
      window: new THREE.MeshStandardMaterial({
        color: home.light,
        emissive: home.light,
        emissiveIntensity: 0.55,
        roughness: 0.32,
      }),
      door: new THREE.MeshStandardMaterial({ color: 0x234158, roughness: 0.72 }),
      beacon: new THREE.MeshBasicMaterial({ color: home.light }),
    }));
    const beacons: THREE.Mesh[] = [];

    homes.forEach((home, index) => {
      const materials = houseMaterials[index];
      const house = new THREE.Group();
      house.position.set(home.x, 0, home.z);

      const plot = new THREE.Mesh(padGeometry, materials.pad);
      plot.position.y = -0.025;
      house.add(plot);

      const walls = new THREE.Mesh(wallGeometry, materials.wall);
      walls.position.y = 0.25;
      house.add(walls);

      const roof = new THREE.Mesh(roofGeometry, materials.roof);
      roof.position.y = 0.72;
      roof.rotation.y = Math.PI / 4;
      house.add(roof);

      for (const x of [-0.19, 0.19]) {
        const window = new THREE.Mesh(windowGeometry, materials.window);
        window.position.set(x, 0.28, 0.323);
        house.add(window);
      }

      const door = new THREE.Mesh(doorGeometry, materials.door);
      door.position.set(0, 0.13, 0.325);
      house.add(door);

      const beacon = new THREE.Mesh(beaconGeometry, materials.beacon);
      beacon.position.set(0, 1.02, 0);
      house.add(beacon);
      beacons.push(beacon);
      district.add(house);
    });

    const postGeometry = new THREE.BoxGeometry(0.16, 0.62, 0.18);
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x9dd2e1,
      roughness: 0.34,
      metalness: 0.36,
      emissive: 0x123747,
    });
    for (const x of [-0.47, 0.47]) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, 0.31, 2.68);
      district.add(post);
    }

    const armPivot = new THREE.Group();
    armPivot.position.set(-0.47, 0.55, 2.68);
    const gateArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.055, 0.075),
      new THREE.MeshStandardMaterial({ color: 0xe6f5f6, roughness: 0.38, metalness: 0.18 }),
    );
    gateArm.position.x = 0.47;
    armPivot.add(gateArm);
    const armTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.07, 0.09),
      new THREE.MeshBasicMaterial({ color: 0xf4ad43 }),
    );
    armTip.position.set(0.91, 0, 0);
    armPivot.add(armTip);
    district.add(armPivot);

    const routeMaterials = [
      new THREE.LineBasicMaterial({ color: 0x36d5e6, transparent: true, opacity: 0.55 }),
      new THREE.LineBasicMaterial({ color: 0x2ac99a, transparent: true, opacity: 0.42 }),
    ];
    const packetMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x67f2ff }),
      new THREE.MeshBasicMaterial({ color: 0x60efb4 }),
      new THREE.MeshBasicMaterial({ color: 0xffc15a }),
    ];
    const packetGeometry = new THREE.SphereGeometry(0.075, 12, 10);
    const packets: DataPacket[] = [];

    homes.forEach((home, index) => {
      const start = new THREE.Vector3(0, 0.08, 2.26);
      const end = new THREE.Vector3(home.x, 0.55, home.z);
      const control = new THREE.Vector3(home.x * 0.4, 1.08, 0.7);
      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      const route = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)),
        routeMaterials[index % routeMaterials.length],
      );
      route.renderOrder = 1;
      district.add(route);

      if (index % 2 === 0) {
        const mesh = new THREE.Mesh(packetGeometry, packetMaterials[index % packetMaterials.length]);
        mesh.renderOrder = 2;
        district.add(mesh);
        packets.push({ curve, mesh, offset: index * 0.13, speed: 0.055 + (index % 3) * 0.012 });
      }
    });

    const pulseGeometry = new THREE.TorusGeometry(0.55, 0.018, 8, 48);
    const pulses = [0, 0.5].map((offset) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0x49e7ef,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(pulseGeometry, material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.025, 2.42);
      district.add(ring);
      return { ring, material, offset };
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canParallax = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let frame = 0;
    let isVisible = true;
    let startTime = 0;

    const renderFrame = (now: number) => {
      const elapsed = Math.max(0, (now - startTime) / 1000);
      const delta = Math.min(0.05, elapsed || 0.016);

      if (!reduceMotion.matches) {
        armPivot.rotation.z = Math.sin(elapsed * 0.48) * 0.34;
        district.rotation.x += (targetRotationY * 0.035 - district.rotation.x) * Math.min(1, delta * 2.5);
        district.rotation.y += (0.08 + targetRotationX * 0.075 - district.rotation.y) * Math.min(1, delta * 2.5);

        pulses.forEach(({ ring, material, offset }) => {
          const phase = (elapsed / 2.4 + offset) % 1;
          const scale = 0.75 + phase * 1.9;
          ring.scale.set(scale, scale, scale);
          material.opacity = (1 - phase) * 0.42;
        });

        packets.forEach(({ curve, mesh, offset, speed }) => {
          const progress = (elapsed * speed + offset) % 1;
          mesh.position.copy(curve.getPoint(progress));
        });

        beacons.forEach((beacon, index) => {
          const pulse = 0.86 + (Math.sin(elapsed * 2.2 + index * 0.75) + 1) * 0.14;
          beacon.scale.setScalar(pulse);
        });
      }

      renderer.render(scene, camera);
    };

    const animate = (now: number) => {
      frame = 0;
      if (!isVisible || document.hidden || reduceMotion.matches) {
        renderFrame(now);
        return;
      }
      if (!startTime) startTime = now;
      renderFrame(now);
      frame = window.requestAnimationFrame(animate);
    };

    const syncAnimation = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (reduceMotion.matches || !isVisible || document.hidden) {
        renderFrame(performance.now());
      } else {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const viewHeight = 8.4;
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderFrame(performance.now());
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!canParallax || reduceMotion.matches) return;
      const bounds = mount.getBoundingClientRect();
      targetRotationX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      targetRotationY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onPointerLeave = () => {
      targetRotationX = 0;
      targetRotationY = 0;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncAnimation();
    });
    visibilityObserver.observe(mount);
    mount.addEventListener('pointermove', onPointerMove, { passive: true });
    mount.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', syncAnimation);
    reduceMotion.addEventListener('change', syncAnimation);
    resize();
    syncAnimation();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', syncAnimation);
      reduceMotion.removeEventListener('change', syncAnimation);

      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        geometries.add(mesh.geometry);
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="portal-community-scene"
      role="img"
      aria-label="Maqueta 3D de una comunidad residencial conectada a su caseta de acceso"
      data-scene-state="loading"
    />
  );
}