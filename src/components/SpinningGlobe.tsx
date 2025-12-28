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


    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Slow rotation
      globe.rotation.y += 0.001;
      
      // Slight tilt for realistic Earth angle
      globe.rotation.x = 0.4;
      
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
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div 
      ref={containerRef} 
      className={`pointer-events-none ${className}`}
      style={{ 
        width: size, 
        height: size,
        filter: 'drop-shadow(0 0 20px hsl(142 71% 45% / 0.3)) drop-shadow(0 0 40px hsl(142 71% 45% / 0.15))'
      }}
    />
  );
};
