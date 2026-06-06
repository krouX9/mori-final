import * as THREE from 'three';
import { CONFIG } from '../config.js';

const ZONE_STYLES = {
  garden:     { color: new THREE.Color('#82a85a'), height: 0.05 },
  playground: { color: new THREE.Color('#d8a064'), height: 0.05 },
  assembly:   { color: new THREE.Color('#c4ad84'), height: 0.04 },
};

const textureLoader = new THREE.TextureLoader();

function loadTilingTexture(cfg, onReady) {
  if (!cfg?.url) return;
  const base = import.meta.env?.BASE_URL || '/';
  const url = base + cfg.url.split('/').map((s) => encodeURIComponent(s)).join('/');
  textureLoader.load(
    url,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      onReady(tex, cfg.repeat ?? 8);
    },
    undefined,
    () => {},
  );
}

export function buildZones(layout, sampleHeight) {
  const group = new THREE.Group();
  group.name = 'zones';

  for (const zone of layout.zones) {
    if (!zone.polygon || zone.polygon.length < 3) continue;
    const style = ZONE_STYLES[zone.type] || ZONE_STYLES.assembly;
    const shape = new THREE.Shape();
    const poly = zone.polygon;
    shape.moveTo(poly[0].x, poly[0].z);
    for (let i = 1; i < poly.length; i++) shape.lineTo(poly[i].x, poly[i].z);

    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2);

    // Re-UV based on world XZ so a tiling texture lines up across the zone
    // (the default UVs from ShapeGeometry stretch a single tile to fit the
    // shape, which looks terrible for grass / sand patterns).
    remapUVsToWorld(geo);

    let cx = 0, cz = 0;
    for (const p of poly) { cx += p.x; cz += p.z; }
    cx /= poly.length;
    cz /= poly.length;

    const mat = new THREE.MeshStandardMaterial({
      color: style.color,
      roughness: 0.95,
      side: THREE.DoubleSide,
      // Pull the zone *forward* (negative offset) so it consistently wins
      // the depth fight against the terrain underneath. Paths use a stronger
      // negative offset, so they still layer on top of zones.
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    // Optional zone-specific texture. If the file is missing the zone stays
    // its solid style colour.
    const texCfg = CONFIG.textures?.[zone.type];
    if (texCfg) {
      loadTilingTexture(texCfg, (tex, repeat) => {
        // The UVs are world coords; texture.repeat scales those so 1 unit
        // of world covers `1/repeat` of the texture (i.e. tiles every
        // `repeat` metres).
        tex.repeat.set(1 / repeat, 1 / repeat);
        mat.map = tex;
        mat.needsUpdate = true;
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    // Bump up a touch above terrain so the polygon offset has air to breathe.
    mesh.position.y = sampleHeight(cx, cz) + style.height + 0.06;
    mesh.receiveShadow = true;
    mesh.renderOrder = 1; // draw after terrain so blending reads cleanly
    mesh.name = `zone:${zone.name}`;
    group.add(mesh);
  }
  return group;
}

function remapUVsToWorld(geo) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    // After rotateX(PI/2): X stays, Z stays, Y becomes 0.
    uv[i * 2 + 0] = pos.getX(i);
    uv[i * 2 + 1] = pos.getZ(i);
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
