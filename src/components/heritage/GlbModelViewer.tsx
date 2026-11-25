import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  RotateCw,
  Maximize2,
  Minimize2,
  Loader2,
  Box,
  Sparkles,
} from 'lucide-react';

interface GlbModelViewerProps {
  modelUrl: string;
  altModelUrl?: string;
  title?: string;
  className?: string;
}

export const GlbModelViewer: React.FC<GlbModelViewerProps> = ({
  modelUrl,
  altModelUrl,
  title = 'مجسم ثلاثي الأبعاد تفاعلي',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [useAltModel, setUseAltModel] = useState<boolean>(false);

  const controlsRef = useRef<OrbitControls | null>(null);
  const activeUrl = useAltModel && altModelUrl ? altModelUrl : modelUrl;

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setErrorMsg(null);

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 320;

    // Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d121c);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 200);
    camera.position.set(2.4, 1.7, 2.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment for rich PBR textures
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    // Warm Golden-Hour Sahara Lighting
    const ambientLight = new THREE.AmbientLight(0xfff1dc, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffd79a, 2.4);
    sunLight.position.set(5, 8, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x88b4e6, 0.75);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.1;
    controls.minDistance = 1.1;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 1.95;
    controlsRef.current = controls;

    // Load GLB
    let disposed = false;
    const loader = new GLTFLoader();
    loader.load(
      activeUrl,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;

        // Normalize model center & scale to fit cleanly in view
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.6 / maxDim;
        root.scale.setScalar(scale);

        // Recompute centered position
        root.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale
        );

        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        scene.add(root);
        controls.target.set(0, 0, 0);
        controls.update();
        setIsLoading(false);
      },
      (xhr) => {
        if (disposed) return;
        if (xhr.total > 0) {
          setLoadingProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
        }
      },
      (err) => {
        if (disposed) return;
        console.error('Failed to load GLB model:', err);
        setErrorMsg('تعذر تحميل المجسم ثلاثي الأبعاد. تأكد من وجود الملف.');
        setIsLoading(false);
      }
    );

    // Animation loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container || disposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      controlsRef.current = null;
      pmrem.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [activeUrl]);

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[150] bg-[#0a0e17] p-3 sm:p-5 flex flex-col'
          : `relative rounded-2xl overflow-hidden bg-[#0d121c] ring-1 ring-amber-400/25 ${className}`
      }`}
    >
      {/* شريط التحكم العلوي للمجسم */}
      <div className="absolute top-2.5 right-2.5 left-2.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-thmanyah font-bold text-amber-300 ring-1 ring-white/10">
          <Box className="w-3.5 h-3.5" />
          <span className="truncate max-w-[180px] sm:max-w-xs">{title}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          {altModelUrl && (
            <button
              type="button"
              onClick={() => setUseAltModel((v) => !v)}
              className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-[10px] font-thmanyah font-bold text-stone-200 ring-1 ring-white/15 flex items-center gap-1 cursor-pointer transition-colors"
              title="تبديل نمط الخامات"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{useAltModel ? 'خامات Shaded' : 'خامات PBR'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className={`p-1.5 rounded-xl backdrop-blur-md ring-1 ring-white/15 cursor-pointer transition-colors ${
              autoRotate
                ? 'bg-amber-400 text-stone-950'
                : 'bg-black/60 text-stone-300 hover:text-white'
            }`}
            title={autoRotate ? 'إيقاف الدوران التلقائي' : 'تفعيل الدوران 360°'}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-stone-200 hover:text-white ring-1 ring-white/15 cursor-pointer transition-colors"
            title={isFullscreen ? 'إنهاء ملء الشاشة' : 'عرض بملء الشاشة'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* مساحة الكانفاس */}
      <div
        ref={mountRef}
        className={`w-full cursor-grab active:cursor-grabbing ${
          isFullscreen ? 'flex-1 rounded-2xl overflow-hidden' : 'h-64 sm:h-72'
        }`}
      />

      {/* شاشة التحميل التفاعلية */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-[#0d121c]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          <div className="text-center space-y-1.5 w-56">
            <p className="text-xs font-thmanyah font-bold text-stone-200">
              جاري تحميل المجسم ثلاثي الأبعاد... {loadingProgress}%
            </p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-150"
                style={{ width: `${Math.max(8, loadingProgress)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* رسالة خطأ في حال فشل التحميل */}
      {errorMsg && (
        <div className="absolute inset-0 z-10 bg-[#0d121c]/95 flex items-center justify-center p-4 text-center">
          <p className="text-xs font-thmanyah font-bold text-rose-300">{errorMsg}</p>
        </div>
      )}

      {/* تلميح سفلي */}
      {!isLoading && !errorMsg && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none bg-black/55 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-thmanyah text-stone-300 whitespace-nowrap">
          اسحب للتدوير 360° • عجلة الماوس للتقريب
        </div>
      )}
    </div>
  );
};
