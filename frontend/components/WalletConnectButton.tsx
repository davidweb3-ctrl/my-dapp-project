'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * WalletConnectButton Component
 * Uses RainbowKit's ConnectButton for a beautiful wallet connection experience
 */
export default function WalletConnectButton() {
  return (
    <ConnectButton 
      accountStatus="address"
      chainStatus="icon"
      showBalance={true}
    />
  );
}

