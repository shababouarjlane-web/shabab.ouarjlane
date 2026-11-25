import * as maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface MapLibre3DModelOptions {
  id: string;
  modelUrl: string;
  lng: number;
  lat: number;
  altitude?: number;
  /** العرض المستهدف للمجسم بالأمتار فوق سطح الخريطة */
  sizeMeters?: number;
  /** زاوية دوران أفقية بالدرجات لتوجيه المجسم فوق الأرض */
  rotationDeg?: number;
  onLoadStart?: () => void;
  onProgress?: (percent: number) => void;
  onLoadComplete?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * ينشئ طبقة WebGL ثلاثية الأبعاد مخصصة في MapLibre GL باستخدام Three.js + GLTFLoader
 * لتثبيت مجسم .glb حقيقي مباشرة فوق إحداثيات المعلم على صور الأقمار الصناعية.
 */
export function createMapLibre3DModelLayer(
  opts: MapLibre3DModelOptions
): maplibregl.CustomLayerInterface {
  const {
    id,
    modelUrl,
    lng,
    lat,
    altitude = 0,
    sizeMeters = 220,
    rotationDeg = 20,
    onLoadStart,
    onProgress,
    onLoadComplete,
    onError,
  } = opts;

  const mercator = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], altitude);
  const meterScale = mercator.meterInMercatorCoordinateUnits();

  const modelTransform = {
    translateX: mercator.x,
    translateY: mercator.y,
    translateZ: mercator.z ?? 0,
    rotateX: Math.PI / 2,
    rotateY: (rotationDeg * Math.PI) / 180,
    rotateZ: 0,
    scale: meterScale,
  };

  let camera: THREE.Camera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let mapInstance: maplibregl.Map | null = null;
  let isDisposed = false;

  const customLayer: maplibregl.CustomLayerInterface = {
    id,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
      mapInstance = map;
      camera = new THREE.Camera();
      scene = new THREE.Scene();

      // إضاءة صحراوية دافئة متناسقة مع صور الأقمار الصناعية
      const hemiLight = new THREE.HemisphereLight(0xfff4e0, 0x7c542e, 1.35);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xffdfb0, 2.2);
      sunLight.position.set(140, 260, 180).normalize();
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0x9ec5f0, 0.7);
      fillLight.position.set(-120, 140, -140).normalize();
      scene.add(fillLight);

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;

      onLoadStart?.();
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (isDisposed) return;
          const root = gltf.scene;

          // توسيط المجسم وضبط أبعاده بالمتر بحيث تستقر قاعدته تماماً على سطح الأرض
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxHoriz = Math.max(size.x, size.z) || 1;
          const normScale = sizeMeters / maxHoriz;
          root.scale.setScalar(normScale);

          root.position.set(
            -center.x * normScale,
            -box.min.y * normScale,
            -center.z * normScale
          );

          scene.add(root);
          onLoadComplete?.();
          map.triggerRepaint();
        },
        (xhr) => {
          if (isDisposed) return;
          if (xhr.total > 0) {
            onProgress?.(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
          }
        },
        (err) => {
          if (isDisposed) return;
          console.error('MapLibre 3D model load error:', err);
          onError?.(err);
        }
      );
    },

    render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: any) {
      if (!renderer || !scene || !camera) return;

      const rawMatrix: number[] | Float32Array | undefined = Array.isArray(options)
        ? options
        : options?.defaultProjectionData?.mainMatrix;

      if (!rawMatrix) return;

      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(rawMatrix as number[]);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      camera.projectionMatrix = m.multiply(l);
      renderer.resetState();
      renderer.render(scene, camera);
    },

    onRemove() {
      isDisposed = true;
      if (renderer) {
        renderer.dispose();
      }
      mapInstance = null;
    },
  };

  // Prevent unused lint warning
  void mapInstance;

  return customLayer;
}
