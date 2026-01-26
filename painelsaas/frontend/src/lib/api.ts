/// <reference types="vite/client" />
export const API_URL = import.meta.env.VITE_API_URL || 'http://apisaas.localhost/api/v1';

interface FetchOptions extends RequestInit {
    token?: string | null;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Determine if we should redirect to login or just throw
        // For now throw, usage site handles redirect
        // localStorage.removeItem('token');
        // window.location.href = '/login';
    }

    return response;
}
