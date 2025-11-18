/**
 * Debug utilities for the FlexAGE application
 */

// Debug configuration
const DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

/**
 * Enhanced debug logger that provides more context than console.log
 * @param area - The area of the application that's logging
 * @param message - The message to log
 * @param data - Optional data to log
 */
export function debugLog(area: string, message: string, data?: any) {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  
  if (data) {
    console.log(`[${timestamp}][${area}] ${message}`, data);
  } else {
    console.log(`[${timestamp}][${area}] ${message}`);
  }
}

/**
 * Log API responses for debugging
 * @param endpoint - The API endpoint that was called
 * @param response - The response data
 */
export function logApiResponse(endpoint: string, response: any) {
  debugLog('API', `Response from ${endpoint}:`, response);
}

/**
 * Log API errors for debugging
 * @param endpoint - The API endpoint that was called
 * @param error - The error object
 */
export function logApiError(endpoint: string, error: any) {
  debugLog('API-ERROR', `Error calling ${endpoint}:`, {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    stack: error.stack
  });
}

/**
 * Format a FlexAGE error for display
 * @param error - The error object
 * @returns A user-friendly error message
 */
export function formatApiError(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  if (error.response?.data?.detail) {
    return `Error: ${error.response.data.detail}`;
  }
  
  if (Array.isArray(error.response?.data)) {
    return `Error: ${error.response.data.map((err: any) => err.detail || err.msg).join(', ')}`;
  }
  
  return error.message || 'An unexpected error occurred';
}

/**
 * Utility to help diagnose props and state
 * @param componentName - The name of the component
 * @param props - The component props
 */
export function logComponentData(componentName: string, data: Record<string, any>) {
  debugLog('Component', `${componentName} data:`, data);
}
