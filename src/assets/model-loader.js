import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Discover GLBs at build time. Files that don't exist in src/assets/models/
// simply don't appear in `modelGlob` — no failed imports and no 500s if
// you've stripped the folder for a fast dev iteration.
const modelGlob = import.meta.glob('./models/*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
});

// Build basename → URL map for whatever's present right now.
const MODEL_URLS = {};
for (const [path, url] of Object.entries(modelGlob)) {
  const m = path.match(/\/([^/]+)\.glb$/);
  if (m) MODEL_URLS[m[1]] = url;
}

// Map a normalized GeoJSON building name → GLB basename.
const NAME_MATCH = {
  amydancestudio:       'AmyDanceStudio',
  school:               'School',
  conferencecenter:     'ConferenceCenter',
  hebronvilla:          'HebronVilla',
  mikevandaelehall:     'MikeVanDaeleHall',
  subbammahouse:        'SubbammaHouse',
  hospitalstaffquaters: 'HospitalStaffQuarters',
  subbammahospital:     'Hospital',
  subbammachapel:       'ChapelofHope',
  happinessandpeace:    'AnandResidency',
  jessyfloracenter:     'Auditorium',
  wephelvilla:          'BethelVilla',
  teachersquaters:      'IsaacHall',
  chairmanresidence:    'PenielVilla',
  w:                    'SchoolWashrooms',
};

function slug(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const loader = new GLTFLoader();

// Draco-compressed GLBs need the Draco decoder. We point at Google's
// gstatic CDN — it's served with the right CORS headers and is the same
// version Three.js's official examples use, so the WASM binary it fetches
// matches the encoder.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
dracoLoader.setDecoderConfig({ type: 'js' }); // fall back to JS if WASM blocked
loader.setDRACOLoader(dracoLoader);

const loadedModels = new Map(); // basename → THREE.Group (template)

// Cap on the longest edge of any GLB texture. PBR maps from Blender are often
// 2K–4K; for a stylised city-block view 512 reads fine and slashes memory by
// 64× per texture relative to a 4K source (4× vs 1024).
const TEXTURE_MAX = 512;

const TEXTURE_SLOTS = [
  'map', 'normalMap', 'roughnessMap', 'metalnessMap',
  'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap',
  'alphaMap', 'specularMap',
];

function shrinkTexture(texture) {
  const img = texture.image;
  if (!img) return false;
  const w = img.width || img.naturalWidth || 0;
  const h = img.height || img.naturalHeight || 0;
  if (!w || !h) return false;
  const maxDim = Math.max(w, h);
  if (maxDim <= TEXTURE_MAX) return false;

  const scale = TEXTURE_MAX / maxDim;
  const newW = Math.max(1, Math.round(w * scale));
  const newH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  try {
    ctx.drawImage(img, 0, 0, newW, newH);
  } catch (e) {
    console.warn('[models] downscale failed:', e?.message || e);
    return false;
  }
  if (typeof img.close === 'function') img.close();
  texture.image = canvas;
  texture.needsUpdate = true;
  return true;
}

function optimizeTextures(model) {
  const seen = new Set();
  let shrunk = 0;
  let kept = 0;
  model.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const slot of TEXTURE_SLOTS) {
        const tex = mat[slot];
        if (!tex || seen.has(tex)) continue;
        seen.add(tex);
        if (shrinkTexture(tex)) shrunk++; else kept++;
      }
    }
  });
  return { shrunk, kept };
}

export async function loadAllModels() {
  const entries = Object.entries(MODEL_URLS);
  if (entries.length === 0) {
    console.log('[models] No GLB files in src/assets/models/ — every building will render as a placeholder.');
    return loadedModels;
  }
  console.log(`[models] Loading ${entries.length} GLBs…`);
  const results = await Promise.all(
    entries.map(async ([name, url]) => {
      try {
        const gltf = await loader.loadAsync(url);
        const stats = optimizeTextures(gltf.scene);
        return { name, scene: gltf.scene, stats, ok: true };
      } catch (e) {
        console.warn(`[models] ✗ ${name}:`, e?.message || e);
        return { name, ok: false };
      }
    }),
  );
  let okCount = 0;
  let totalShrunk = 0;
  for (const r of results) {
    if (r.ok) {
      loadedModels.set(r.name, r.scene);
      totalShrunk += r.stats?.shrunk || 0;
      okCount++;
    }
  }
  console.log(`[models] Loaded ${okCount}/${entries.length}, downscaled ${totalShrunk} textures to ${TEXTURE_MAX}px.`);
  return loadedModels;
}

export function getModelForBuilding(name) {
  const key = slug(name);
  const basename = NAME_MATCH[key];
  if (!basename) {
    console.log(`[models] No match for "${name}" (slug "${key}") → placeholder`);
    return null;
  }
  const template = loadedModels.get(basename);
  if (!template) {
    console.warn(`[models] Match found for "${name}" → ${basename}, but GLB didn't load`);
    return null;
  }
  console.log(`[models] ✓ "${name}" → ${basename}`);
  return cloneInstance(template, basename);
}

export function listLoadedModels() {
  return [...loadedModels.keys()];
}

export function listUnmatchedModels() {
  const matched = new Set(Object.values(NAME_MATCH));
  const unmatched = [];
  for (const [basename, template] of loadedModels.entries()) {
    if (matched.has(basename)) continue;
    unmatched.push({ basename, scene: cloneInstance(template, basename) });
  }
  return unmatched;
}

/**
 * Clone a GLB template and normalize its origin so:
 *   - the bbox base sits at outer-group y = 0   (no half-buried buildings)
 *   - the XZ centre is at outer-group origin   (positioning is predictable)
 *
 * The cloned scene becomes a child of a wrapper Group. External code sets
 * the wrapper's position/rotation/scale; the wrapper is what carries
 * userData (info, buildingId, etc.) so click handlers continue to work.
 */
function cloneInstance(template, basename) {
  const cloned = template.clone(true);

  // Update world matrices so setFromObject sees the right bounds.
  cloned.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(cloned);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());

  // Re-centre and ground the clone within its parent's frame.
  cloned.position.x -= center.x;
  cloned.position.y -= bbox.min.y;
  cloned.position.z -= center.z;

  cloned.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const wrapper = new THREE.Group();
  wrapper.name = `model:${basename || 'unknown'}`;
  wrapper.add(cloned);
  wrapper.userData.modelBasename = basename;
  wrapper.userData.modelSize = { w: size.x, h: size.y, d: size.z };

  if (basename) {
    const w = size.x.toFixed(1);
    const h = size.y.toFixed(1);
    const d = size.z.toFixed(1);
    let warn = '';
    if (size.y < 1.5) warn = ' ⚠ very short — likely scale issue';
    else if (size.y > 80) warn = ' ⚠ very tall — likely scale issue';
    console.log(`[models]    ${basename} bbox: ${w} × ${h} × ${d} m${warn}`);
  }

  return wrapper;
}
