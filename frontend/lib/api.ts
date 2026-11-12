import { Product, Customer, Order, OrderStatus } from './types';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8888';
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';

// In-memory token storage (also saved to localStorage if available)
let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (currentToken) return currentToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Keycloak direct grant authentication
export async function loginWithKeycloak(username: string, password: string): Promise<string> {
  const params = new URLSearchParams();
  params.append('client_id', 'nextjs-client');
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const res = await fetch(`${KEYCLOAK_URL}/realms/microservices-realm/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Authentication failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const token = data.access_token;
  setAuthToken(token);
  return token;
}

// Generic fetcher with automatic Bearer token injection
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      // not JSON
    }
    const err = new Error(errorDetail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

// -------------------------------------------------------------
// Inventory Service APIs
// -------------------------------------------------------------
export async function getProducts(): Promise<Product[]> {
  // Spring Data REST /products?projection=fullProduct returns _embedded.products
  const data = await apiFetch<any>('/inventory-service/products?projection=fullProduct&size=50');
  if (data?._embedded?.products) {
    return data._embedded.products;
  }
  if (Array.isArray(data)) return data;
  if (data?.content) return data.content;
  return [];
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  return apiFetch<Product>('/inventory-service/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

// -------------------------------------------------------------
// Customer Service APIs (ADMIN only)
// -------------------------------------------------------------
export async function getCustomers(): Promise<Customer[]> {
  const data = await apiFetch<any>('/customer-service/customers?projection=fullCustomer&size=50');
  if (data?._embedded?.customers) {
    return data._embedded.customers;
  }
  if (Array.isArray(data)) return data;
  if (data?.content) return data.content;
  return [];
}

export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  return apiFetch<Customer>('/customer-service/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

// -------------------------------------------------------------
// Order Service APIs
// -------------------------------------------------------------
export async function getOrders(page: number = 0, size: number = 20): Promise<{ content: Order[]; totalPages: number }> {
  const data = await apiFetch<any>(`/order-service/orders?page=${page}&size=${size}`);
  if (data?.content) {
    return {
      content: data.content,
      totalPages: data.totalPages ?? 1,
    };
  }
  if (Array.isArray(data)) {
    return { content: data, totalPages: 1 };
  }
  return { content: [], totalPages: 1 };
}

export async function getOrderById(id: number): Promise<Order> {
  return apiFetch<Order>(`/order-service/orders/${id}`);
}

export async function createOrder(customerId: number, productItems: { productId: number; quantity: number }[]): Promise<Order> {
  return apiFetch<Order>('/order-service/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerId,
      productItems,
    }),
  });
}

export async function advanceOrderStatus(id: number): Promise<Order> {
  return apiFetch<Order>(`/order-service/orders/${id}`, {
    method: 'PUT',
  });
}

export async function cancelOrder(id: number): Promise<void> {
  return apiFetch<void>(`/order-service/orders/${id}`, {
    method: 'DELETE',
  });
}
