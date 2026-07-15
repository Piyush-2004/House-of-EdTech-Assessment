"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";

interface ThreeScoreGaugeProps {
  score: number;
}

export default function ThreeScoreGauge({ score }: ThreeScoreGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 200;
    const height = 200;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 100);
    camera.position.z = 10;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Ambient & Directional Lights (Crucial for glass reflections)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.8); // soft blue-indigo highlight
    dirLight2.position.set(-5, -5, 2);
    scene.add(dirLight2);

    // 1. Backing Glass Ring (The full torus track)
    const trackGeometry = new THREE.TorusGeometry(2.6, 0.35, 16, 100);
    const trackMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf1f5f9, // slate-100 base
      roughness: 0.15,
      transparent: true,
      opacity: 0.45,
      transmission: 0.85,
      thickness: 1.0,
      clearcoat: 1.0,
    });
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    scene.add(trackMesh);

    // 2. Score Progress segment setup (Dynamic Torus)
    const fillGroup = new THREE.Group();
    scene.add(fillGroup);

    // Select color based on performance level
    const progressColor = score >= 75 ? 0x059669 : score >= 50 ? 0x4f46e5 : 0xe11d48;

    const fillMaterial = new THREE.MeshPhysicalMaterial({
      color: progressColor,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    // Mouse movement interaction tracking variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      
      mouseX = (x / rect.width) * 0.8;
      mouseY = (y / rect.height) * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // GSAP Timeline animation target object
    const animationObj = { val: 0 };
    
    const countTimeline = gsap.to(animationObj, {
      val: score,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayScore(Math.round(animationObj.val));

        // Rebuild segments geometry dynamically on updating value
        fillGroup.clear();
        const percent = animationObj.val / 100;
        
        if (percent > 0.01) {
          // Render Segment Torus: start angle at PI/2 (top of the clock)
          const fillGeometry = new THREE.TorusGeometry(
            2.6, 
            0.38, 
            16, 
            100, 
            percent * Math.PI * 2
          );
          const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
          fillMesh.rotation.z = Math.PI / 2; // Start from top
          fillMesh.rotation.y = Math.PI; // Face outwards
          fillGroup.add(fillMesh);
        }
      }
    });

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera tilt parallax matching mouse positions
      targetX += (mouseX - targetX) * 0.08;
      targetY += (mouseY - targetY) * 0.08;

      trackMesh.rotation.x = -targetY;
      trackMesh.rotation.y = targetX;
      fillGroup.rotation.x = -targetY;
      fillGroup.rotation.y = targetX;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      countTimeline.kill();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [score]);

  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px] mx-auto select-none">
      {/* Three.js canvas container mounting layer */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* HTML text overlay for the score value in center */}
      <div className="flex flex-col items-center justify-center text-center z-10">
        <span className="text-4xl font-extrabold tracking-tight text-slate-800 animate-fade-in">
          {displayScore}%
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
          Match Score
        </span>
      </div>
    </div>
  );
}
