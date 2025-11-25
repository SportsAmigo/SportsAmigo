import { useState, useCallback } from 'react';

/**
 * Custom hook for toggle state
 * @param {boolean} initialValue - Initial toggle value
 * @returns {Array} [value, toggle, setTrue, setFalse]
 */
export const useToggle = (initialValue = false) => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => {
        setValue(v => !v);
    }, []);

    const setTrue = useCallback(() => {
        setValue(true);
    }, []);

    const setFalse = useCallback(() => {
        setValue(false);
    }, []);

    return [value, toggle, setTrue, setFalse];
};

export default useToggle;

