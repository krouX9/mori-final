import {
  makeTree,
  makeShrub,
  makeLamp,
  makeBench,
  makePole,
  makeSign,
  makeBuilding,
} from './placeholders.js';

const factories = new Map();

export function registerFactory(kind, factory) {
  factories.set(kind, factory);
}

export function createProp(kind, rng, opts) {
  const f = factories.get(kind);
  if (!f) throw new Error(`No factory registered for "${kind}"`);
  return f(rng, opts);
}

registerFactory('tree', makeTree);
registerFactory('shrub', makeShrub);
registerFactory('lamp', makeLamp);
registerFactory('bench', makeBench);
registerFactory('pole', makePole);
registerFactory('sign', makeSign);
registerFactory('building', makeBuilding);
