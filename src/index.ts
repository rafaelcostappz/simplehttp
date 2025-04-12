import { createClient } from './core';
import { SimpleHttpError, TimeoutError } from './errors';
import { VERSION } from './version';

// Export types
export * from './types';
export { SimpleHttpError, TimeoutError };

// Create a default client
const http = createClient();

// Export all methods from the default client
export const { get, post, put, delete: del, patch } = http;

// Export the client creator function
export { createClient };

// Export the library version
export { VERSION };

// Export the default client as the default export
export default http;