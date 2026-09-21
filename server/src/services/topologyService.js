// Pure helpers for walking the grid tree (substation -> transformer -> house).
import { haversine } from '../utils/geo.js';

export function indexNodes(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map();
  nodes.forEach((n) => {
    if (!n.parentId) return;
    if (!children.has(n.parentId)) children.set(n.parentId, []);
    children.get(n.parentId).push(n);
  });
  return { nodes, byId, children };
}

export function ancestorsOf(idx, node) {
  const out = [];
  let cur = node.parentId ? idx.byId.get(node.parentId) : null;
  while (cur) {
    out.push(cur);
    cur = cur.parentId ? idx.byId.get(cur.parentId) : null;
  }
  return out;
}

export function descendantsOf(idx, nodeId) {
  const out = [];
  const stack = [...(idx.children.get(nodeId) ?? [])];
  while (stack.length) {
    const n = stack.pop();
    out.push(n);
    stack.push(...(idx.children.get(n.id) ?? []));
  }
  return out;
}

// All houses served by a node (the node itself if it is a house).
export function housesUnder(idx, nodeId) {
  const node = idx.byId.get(nodeId);
  if (!node) return [];
  if (node.type === 'house') return [node];
  return descendantsOf(idx, nodeId).filter((n) => n.type === 'house');
}

// Walk up while the parent is also off: the highest failed node is the root cause.
export function topmostOffAncestor(idx, node) {
  let cur = node;
  while (cur.parentId) {
    const parent = idx.byId.get(cur.parentId);
    if (!parent || parent.state !== 'OFF') break;
    cur = parent;
  }
  return cur;
}

export const isAncestor = (idx, ancestorId, nodeId) => {
  const node = idx.byId.get(nodeId);
  return node ? ancestorsOf(idx, node).some((a) => a.id === ancestorId) : false;
};

export function nearestNode(nodes, type, point) {
  let best = null;
  let bestDist = Infinity;
  nodes.filter((n) => n.type === type).forEach((n) => {
    const d = haversine(point, n);
    if (d < bestDist) {
      best = n;
      bestDist = d;
    }
  });
  return best;
}
