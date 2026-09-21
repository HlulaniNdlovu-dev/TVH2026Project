import { createContext, useContext, useEffect, useState } from 'react';
import { getMeta } from '../../services/metaService.js';

const MetaContext = createContext(null);

const EMPTY = { reportCategories: [], pauseReasons: [], declineReasons: [], priorityLevels: [], areas: [] };

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(EMPTY);
  useEffect(() => {
    getMeta().then(setMeta).catch(() => {});
  }, []);
  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export const useMeta = () => useContext(MetaContext);
