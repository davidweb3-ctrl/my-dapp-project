'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import TokenBalance from '../components/TokenBalance';

/**
 * Home Page
 * Welcome page with overview of the DApp features
 */
export default function HomePage() {
  const { isConnected } = useAccount();

  const features = [
    {
      title: 'MyERC20 Token',
      description: 'Interact with your ERC20 tokens. Transfer, approve, and manage your MERC20 balance.',
      link: '/token',
      icon: '🪙',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      title: 'Token Bank',
      description: 'Deposit and withdraw tokens safely. Earn interest and manage your savings.',
      link: '/bank',
      icon: '🏦',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
    },
    {
      title: 'NFT Collection',
      description: 'Mint and manage your unique NFTs. View your collection and metadata.',
      link: '/nft',
      icon: '🎨',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    },
    {
      title: 'NFT Marketplace',
      description: 'Trade NFTs with ERC20 tokens. List, buy, and sell with whitelist support.',
      link: '/market',
      icon: '🛒',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    },
  ];

  return (
    <div className="px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-indigo-600">My DApp</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A complete blockchain application with ERC20 tokens, NFTs, and marketplace
          </p>
          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-yellow-800">
                👆 Connect your wallet to get started
              </p>
            </div>
          )}
        </div>

        {/* Balance Display for Connected Users */}
        {isConnected && (
          <div className="mb-12 max-w-2xl mx-auto">
            <TokenBalance />
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => (
            <Link
              key={feature.link}
              href={feature.link}
              className={`${feature.color} border-2 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h2>
              <p className="text-gray-600">{feature.description}</p>
              <div className="mt-4 text-indigo-600 font-semibold">
                Explore →
              </div>
            </Link>
          ))}
        </div>

        {/* Features Overview */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Can Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">Token Operations</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ View token balance</li>
                <li>✓ Transfer tokens to others</li>
                <li>✓ Approve spending allowances</li>
                <li>✓ EIP-2612 permit signatures</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">Banking Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Deposit tokens securely</li>
                <li>✓ Withdraw anytime</li>
                <li>✓ Track your savings</li>
                <li>✓ Gasless deposits with permit</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-600 mb-2">NFT Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Mint unique NFTs</li>
                <li>✓ View your collection</li>
                <li>✓ Check metadata URIs</li>
                <li>✓ Track total supply</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-2">Marketplace</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ List NFTs for sale</li>
                <li>✓ Buy with ERC20 tokens</li>
                <li>✓ EIP-712 whitelist signatures</li>
                <li>✓ Secure trading</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Built With</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-gray-900">Next.js 14</div>
              <div className="text-xs text-gray-600">React Framework</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">🔗</div>
              <div className="font-semibold text-gray-900">Wagmi</div>
              <div className="text-xs text-gray-600">React Hooks</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="font-semibold text-gray-900">Viem</div>
              <div className="text-xs text-gray-600">TypeScript Client</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">🌈</div>
              <div className="font-semibold text-gray-900">RainbowKit</div>
              <div className="text-xs text-gray-600">Wallet UI</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">⛏️</div>
              <div className="font-semibold text-gray-900">Foundry</div>
              <div className="text-xs text-gray-600">Smart Contracts</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-semibold text-gray-900">OpenZeppelin</div>
              <div className="text-xs text-gray-600">Security</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold text-gray-900">EIP-2612</div>
              <div className="text-xs text-gray-600">Permit</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl mb-2">✍️</div>
              <div className="font-semibold text-gray-900">EIP-712</div>
              <div className="text-xs text-gray-600">Signatures</div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        {isConnected && (
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
            <div className="flex justify-center space-x-4">
              <Link
                href="/token"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Manage Tokens
              </Link>
              <Link
                href="/market"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Explore Market
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

