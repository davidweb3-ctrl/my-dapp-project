'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnectButton from '../components/WalletConnectButton';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../utils/wagmiConfig';
import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/token', label: 'Token' },
    { href: '/bank', label: 'Bank' },
    { href: '/nft', label: 'NFT' },
    { href: '/market', label: 'Market' },
  ];

  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                {/* Navigation Bar */}
                <nav className="bg-white shadow-lg">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                      <div className="flex space-x-8">
                        <div className="flex items-center">
                          <h1 className="text-2xl font-bold text-indigo-600">
                            My DApp
                          </h1>
                        </div>
                        <div className="hidden sm:flex sm:space-x-8">
                          {navLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                pathname === link.href
                                  ? 'border-indigo-500 text-gray-900'
                                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                              }`}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <WalletConnectButton />
                      </div>
                    </div>
                  </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                  {children}
                </main>

                {/* Footer */}
                <footer className="bg-white mt-12">
                  <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 text-sm">
                      © 2025 My DApp. Built with Next.js, Wagmi, Viem & RainbowKit
                    </p>
                  </div>
                </footer>
              </div>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

