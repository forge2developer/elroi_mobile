export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://13.232.98.34:5000';

/**
 * apiConfig.ts
 * 
 * Centralizes API configuration such as the base URL to ensure consistency across all service files.
 * It uses the environment variable EXPO_PUBLIC_API_URL if available, 
 * falling back to the local network IP provided for development.
 */
