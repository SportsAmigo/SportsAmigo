import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for API fetching with loading and error states
 * @param {string} url - API endpoint URL
 * @param {Object} options - Axios options
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} Data, loading, error, and refetch function
 */
export const useFetch = (url, options = {}, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!url) return;

        try {
            setLoading(true);
            setError(null);
            
            const response = await axios({
                url,
                method: options.method || 'GET',
                withCredentials: true,
                ...options,
            });
            
            setData(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, options]);

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [immediate, fetchData]);

    const refetch = useCallback(async () => {
        return await fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch };
};

export default useFetch;

