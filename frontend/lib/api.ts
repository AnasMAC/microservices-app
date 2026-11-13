import { Product, Customer, Order } from './types';

// Generic fetcher calling the Next.js BFF proxy
// The proxy catches the cookie, verifies it with Keycloak public keys (jose), and injects Bearer token
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api/proxy${endpoint}`, {
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

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

// -------------------------------------------------------------
// Inventory Service APIs
// -------------------------------------------------------------
export async function getProducts(): Promise<Product[]> {
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
// Customer Service APIs (Only accessible to ADMIN)
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
