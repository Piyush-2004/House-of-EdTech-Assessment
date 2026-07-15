"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ConstellationBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 250;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particle nodes settings
    const particleCount = 80;
    const maxDistance = 75;
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    // Randomize initial node coordinates
    const area = 300;
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * area;
      const y = (Math.random() - 0.5) * area;
      const z = (Math.random() - 0.5) * area;

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.4,
      });
    }

    particles.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    // Particle nodes material
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6366f1, // soft indigo
      size: 4,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });

    const pointCloud = new THREE.Points(particles, particleMaterial);
    scene.add(pointCloud);

    // Connecting grid lines material
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8, // slate-400
      transparent: true,
      opacity: 0.1,
    });

    let lineSegments = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
    scene.add(lineSegments);

    // Mouse movement interaction tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.15;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.15;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize viewport support
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Main animation updates loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Interpolate camera angle parallax on mouse hover
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x = targetX;
      camera.position.y = -targetY;
      camera.lookAt(scene.position);

      // Move particle nodes
      const positions = particles.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleVelocities[i].x;
        positions[i * 3 + 1] += particleVelocities[i].y;
        positions[i * 3 + 2] += particleVelocities[i].z;

        // Reset if particles float past bounds
        if (Math.abs(positions[i * 3]) > area / 2) particleVelocities[i].x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > area / 2) particleVelocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > area / 2) particleVelocities[i].z *= -1;
      }
      particles.attributes.position.needsUpdate = true;

      // Dynamically calculate and update connections
      const linePositions: number[] = [];
      for (let i = 0; i < particleCount; i++) {
        const x1 = positions[i * 3];
        const y1 = positions[i * 3 + 1];
        const z1 = positions[i * 3 + 2];

        for (let j = i + 1; j < particleCount; j++) {
          const x2 = positions[j * 3];
          const y2 = positions[j * 3 + 1];
          const z2 = positions[j * 3 + 2];

          const dist = Math.sqrt(
            (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2
          );

          if (dist < maxDistance) {
            linePositions.push(x1, y1, z1);
            linePositions.push(x2, y2, z2);
          }
        }
      }

      scene.remove(lineSegments);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
      lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineSegments);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden opacity-75"
    />
  );
}
