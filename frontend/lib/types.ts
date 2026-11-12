export interface Product {
  id: number;
  name: string;
  price: number;
  imgUrl: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface ProductItem {
  id?: number;
  productId?: number;
  product?: Product;
  price: number;
  quantity: number;
}

export type OrderStatus = 'CREATED' | 'PENDING' | 'DELIVERED' | 'CANCELED';

export interface Order {
  id: number;
  orderDate: string;
  orderStatus: OrderStatus;
  customerId: number;
  productItems: ProductItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  username: string;
  name: string;
  role: UserRole;
  customerId: number;
}
