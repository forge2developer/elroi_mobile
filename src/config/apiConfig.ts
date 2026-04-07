export const BASE_URL = 'http://192.168.1.3:5000'; // Updated to literal IP for reliability

/**
 * apiConfig.ts
 * 
 * Centralizes API configuration such as the base URL to ensure consistency across all service files.
 * It uses the environment variable EXPO_PUBLIC_API_URL if available, 
 * falling back to the local network IP provided for development.
 */
