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
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.z = 3.5;

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

    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'
    );
    
    // Create textured globe material
    const material = new THREE.MeshBasicMaterial({
      map: earthTexture,
      transparent: true,
      opacity: 0.9,
    });

    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add atmosphere glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    
    const glowSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 32),
      glowMaterial
    );
    scene.add(glowSphere);

    // Add subtle outer glow
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    
    const outerGlowSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 32, 32),
      outerGlowMaterial
    );
    scene.add(outerGlowSphere);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Slow rotation
      globe.rotation.y += 0.001;
      glowSphere.rotation.y += 0.0008;
      outerGlowSphere.rotation.y += 0.0005;
      
      // Slight tilt for realistic Earth angle
      globe.rotation.x = 0.4;
      glowSphere.rotation.x = 0.4;
      outerGlowSphere.rotation.x = 0.4;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      earthTexture.dispose();
      glowMaterial.dispose();
      outerGlowMaterial.dispose();
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
