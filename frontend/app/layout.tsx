import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/AppContext';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';



export const metadata: Metadata = {
  title: 'MicroStore • Cloud Microservices Hub',
  description: 'Full-stack Microservices E-Commerce with Keycloak, Spring Cloud Gateway, and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
    >
      <body className="min-h-full flex flex-col bg-zinc-50/50 text-zinc-950">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            <main className="flex-1 pb-16">{children}</main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
