import { BASE_URL } from '../config/apiConfig';
import { getAuth } from '../storage/authStorage';

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
    body?: any;
    token?: string;
}

/**
 * Centralized API request function.
 * Automatically attaches Authorization header and parsed JSON response.
 * Handles common HTTP errors elegantly.
 * 
 * @param endpoint The API endpoint path (e.g., '/api/users')
 * @param options RequestInit options plus optional custom token or body
 * @returns Parsed JSON response
 */
export const apiRequest = async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers, token, ...rest } = options;

    let authToken = token;
    if (!authToken) {
        const authData = await getAuth();
        if (authData?.token) {
            authToken = authData.token;
        }
    }

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...headers,
        },
        ...rest,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const url = `${BASE_URL}${endpoint}`;
    console.log(`[API Request] ${method} ${url}`);

    try {
        const response = await fetch(url, config);

        // Handle 204 No Content explicitly if needed
        if (response.status === 204) {
            return {} as T;
        }

        const data = await response.json();

        if (!response.ok) {
            // Include backend error message if available
            const errorMessage = data?.message || data?.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        return data as T;
    } catch (error: any) {
        console.error(`[API Error] ${method} ${url}:`, error.message);
        throw error;
    }
};

/**
 * api.ts
 * 
 * Extracts fetch boilerplate into a single, reusable utility.
 * Automatically handles auth token injection and JSON parsing securely.
 * Typed as a generic so consumers can specify expected response shapes.
 */
