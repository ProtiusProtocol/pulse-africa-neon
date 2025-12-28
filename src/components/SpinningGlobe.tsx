import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SpinningGlobeProps {
  size?: number;
  className?: string;
}

export const SpinningGlobe = ({ size = 300, className = "" }: SpinningGlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 2.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Create a simple wireframe globe with glow effect
    const material = new THREE.MeshBasicMaterial({
      color: 0x22c55e, // Primary green color
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add continent outlines using a second sphere
    const continentMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80, // Lighter green
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    
    const continentSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 32, 32),
      continentMaterial
    );
    scene.add(continentSphere);

    // Add glow effect using a larger transparent sphere
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    
    const glowSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 32, 32),
      glowMaterial
    );
    scene.add(glowSphere);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Slow rotation
      globe.rotation.y += 0.002;
      continentSphere.rotation.y += 0.002;
      glowSphere.rotation.y += 0.001;
      
      // Slight tilt animation
      globe.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1 + 0.3;
      continentSphere.rotation.x = globe.rotation.x;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      continentMaterial.dispose();
      glowMaterial.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div 
      ref={containerRef} 
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
