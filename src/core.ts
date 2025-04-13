import { 
    HttpMethod, 
    RequestOptions, 
    HttpConfig, 
    HttpResponse, 
    HttpError 
  } from './types';
  import { SimpleHttpError, TimeoutError } from './errors';
  import { VERSION } from './version';
  
  /**
   * Creates aasdas asd a query string from a parameters object.asd asd asd asd asd as asd asd asd asdasda das das
   */
  function createQueryString(params: Record<string, string | number | boolean>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    
    return searchParams.toString();
  }
  
  /**
   * Creates the full URL by combining baseUrl, path, and query parameters.
   */
  function createUrl(path: string, options: RequestOptions): string {
    const baseUrl = options.baseUrl || '';
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    
    if (options.params) {
      const queryString = createQueryString(options.params);
      url.search = queryString;
    }
    
    return url.toString();
  }
  
  /**
   * Creates a request with timeout capability.
   */
  async function fetchWithTimeout(
    url: string, 
    options: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const { timeout, ...fetchOptions } = options;
    
    if (!timeout) {
      return fetch(url, fetchOptions);
    }
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(timeout, fetchOptions);
      }
      throw error;
    } finally {
      clearTimeout(id);
    }
  }
  
  /**
   * Processes the response based on Content-Type header.
   */
  async function processResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType.includes('text/')) {
      return await response.text() as unknown as T;
    }
    
    return await response.blob() as unknown as T;
  }
  
  /**
   * Makes an HTTP request and returns the response.
   */
  export async function request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    // Prepare the request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': `SimpleHttp/${VERSION}`,
        ...options.headers
      }
    };
    
    // Add JSON body if data is provided
    if (options.data !== undefined) {
      if (typeof options.data === 'object' && options.data !== null) {
        requestOptions.body = JSON.stringify(options.data);
        (requestOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      } else {
        requestOptions.body = options.data;
      }
    }
    
    try {
      // Make the request
      const url = createUrl(path, options);
      const response = await fetchWithTimeout(url, {
        ...requestOptions,
        timeout: options.timeout
      });
      
      // Process the response
      const data = await processResponse<T>(response);
      
      // Check if the response is successful
      if (!response.ok) {
        throw new SimpleHttpError(`HTTP Error: ${response.status} ${response.statusText}`, {
          status: response.status,
          data,
          response,
          request: requestOptions
        });
      }
      
      // Return the successful response
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        response
      };
    } catch (error) {
      // Handle errors
      if (error instanceof SimpleHttpError) {
        throw error;
      }
      
      // Convert other errors to SimpleHttpError
      throw new SimpleHttpError(
        `Request failed: ${(error as Error).message}`,
        { request: requestOptions }
      );
    }
  }
  
  /**
   * Creates a configured HTTP client.
   */
  export function createClient(config: HttpConfig = {}) {
    return {
      /**
       * Makes a GET request.
       */
      get<T = any>(path: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
        return request<T>('GET', path, {
          ...config,
          ...options,
          baseUrl: options.baseUrl || config.baseUrl,
          headers: { ...config.headers, ...options.headers }
        });
      },
      
      /**
       * Makes a POST request.
       */
      post<T = any>(path: string, data?: any, options: RequestOptions = {}): Promise<HttpResponse<T>> {
        return request<T>('POST', path, {
          ...config,
          ...options,
          data,
          baseUrl: options.baseUrl || config.baseUrl,
          headers: { ...config.headers, ...options.headers }
        });
      },
      
      /**
       * Makes a PUT request.
       */
      put<T = any>(path: string, data?: any, options: RequestOptions = {}): Promise<HttpResponse<T>> {
        return request<T>('PUT', path, {
          ...config,
          ...options,
          data,
          baseUrl: options.baseUrl || config.baseUrl,
          headers: { ...config.headers, ...options.headers }
        });
      },
      
      /**
       * Makes a DELETE request.
       */
      delete<T = any>(path: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
        return request<T>('DELETE', path, {
          ...config,
          ...options,
          baseUrl: options.baseUrl || config.baseUrl,
          headers: { ...config.headers, ...options.headers }
        });
      },
      
      /**
       * Makes a PATCH request.
       */
      patch<T = any>(path: string, data?: any, options: RequestOptions = {}): Promise<HttpResponse<T>> {
        return request<T>('PATCH', path, {
          ...config,
          ...options,
          data,
          baseUrl: options.baseUrl || config.baseUrl,
          headers: { ...config.headers, ...options.headers }
        });
      }
    };
  }