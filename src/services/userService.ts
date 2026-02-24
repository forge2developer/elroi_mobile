import { apiRequest } from './api';

export interface User {
    id: string; // Depending on backend, might be _id
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    organization: string;
}

export interface GetUsersResponse {
    users: User[];
    // Include pagination fields if returned by the backend
    total?: number;
    page?: number;
    limit?: number;
}

export interface GetUsersParams {
    organization: string;
    page?: number;
    limit?: number;
}

/**
 * Fetches the user list for a specific organization with optional pagination.
 *
 * @param params Query parameters including organization, page, and limit.
 * @returns An object containing the users array and pagination details.
 */
export const getUsers = async (params: GetUsersParams): Promise<GetUsersResponse> => {
    const { organization, page = 1, limit = 50 } = params;

    const query = new URLSearchParams({
        organization,
        page: page.toString(),
        limit: limit.toString(),
    }).toString();

    const endpoint = `/api/users?${query}`;

    // A generic call passing 'GetUsersResponse' structure
    // We omit 'token' here because apiRequest() automatically extracts it 
    // from AuthStorage under the hood!
    return apiRequest<GetUsersResponse>(endpoint, {
        method: 'GET',
    });
};

/**
 * userService.ts
 * 
 * Demonstrates a modular service structure for user-related API calls.
 * Reuses the centralized apiRequest logic so it doesn't duplicate auth/headers overhead.
 */
