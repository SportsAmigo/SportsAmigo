import { useMemo } from 'react';
import Fuse from 'fuse.js';

export default function useFuseSearch(items = [], query = '', options = {}) {
    return useMemo(() => {
        const list = Array.isArray(items) ? items : [];
        const term = String(query || '').trim();

        if (!term) {
            return list;
        }

        const fuse = new Fuse(list, {
            includeScore: true,
            threshold: 0.35,
            ignoreLocation: true,
            minMatchCharLength: 2,
            ...options
        });

        return fuse.search(term).map((entry) => entry.item);
    }, [items, query, options]);
}
