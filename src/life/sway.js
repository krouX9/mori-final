export function createSwaySystem(treeGroup) {
  const trees = [];
  treeGroup.traverse((child) => {
    if (child.userData?.kind === 'tree') {
      trees.push({
        tree: child,
        baseRotX: child.rotation.x,
        baseRotZ: child.rotation.z,
        phase: Math.random() * Math.PI * 2,
        freq: 0.45 + Math.random() * 0.35,
        amp: 0.015 + Math.random() * 0.018,
      });
    }
  });

  return (dt, elapsed) => {
    for (const t of trees) {
      const a = Math.sin(elapsed * t.freq + t.phase) * t.amp;
      const b = Math.cos(elapsed * t.freq * 0.7 + t.phase * 1.3) * t.amp * 0.85;
      t.tree.rotation.x = t.baseRotX + a;
      t.tree.rotation.z = t.baseRotZ + b;
    }
  };
}
