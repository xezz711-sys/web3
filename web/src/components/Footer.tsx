'use client';

export function Footer() {
  return (
    <footer className="border-t border-neutral-900 mt-auto bg-black">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          {/* Logo & Description */}
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold mb-2">
              <span className="text-emerald-500">PBA</span>
              <span className="text-white">Lend</span>
            </h2>
            <p className="text-neutral-500 text-sm max-w-xs">
              Decentralized lending protocol on Ethereum Sepolia. Deposit, borrow, and earn yield.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="https://sepolia.etherscan.io/address/0x099F9845262efe02Db42472992dbE5dA3a952B7d" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-emerald-400 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 14.669a.75.75 0 01-.568.259H7a.75.75 0 01-.75-.75V9.822a.75.75 0 01.75-.75h10a.75.75 0 01.75.75v4.156a.75.75 0 01-.182.491z"/>
              </svg>
              Etherscan
            </a>
            <a 
              href="https://github.com/xezz711-sys/web3" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-emerald-400 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>

        {/* Network Status */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-neutral-400 text-xs">Connected to</span>
            <span className="text-emerald-400 text-xs font-medium">Ethereum Sepolia</span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-900 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-600 text-xs">
              © 2026 PBALend. All rights reserved.
            </p>
            <p className="text-neutral-500 text-xs flex items-center gap-2">
              Built with 
              <span className="text-red-500">♥</span> 
              by 
              <span className="text-emerald-400 font-medium">Hadi</span>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-600">PBA Cohort</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Next.js</span>
              <span className="text-neutral-700">•</span>
              <span>Wagmi</span>
              <span className="text-neutral-700">•</span>
              <span>Foundry</span>
              <span className="text-neutral-700">•</span>
              <span>Ponder</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
