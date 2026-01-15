import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Coins, ArrowRightLeft, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';
import PBALendABI from './abis/PBALend.json';

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // REPLACE WITH DEPLOYED ADDRESS

// Mock data for display before connection/fetching
const MOCK_MARKETS = [
  {
    loanToken: "USDC",
    collateralToken: "ETH",
    interestRate: "5.00%",
    ltv: "80%",
    totalDeposited: "1,250,000",
    totalBorrowed: "850,000"
  },
  {
    loanToken: "DAI",
    collateralToken: "WBTC",
    interestRate: "4.50%",
    ltv: "75%",
    totalDeposited: "500,000",
    totalBorrowed: "120,000"
  }
];

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setProvider(provider);
        
        // Initialize contract
        const contract = new ethers.Contract(CONTRACT_ADDRESS, PBALendABI, signer);
        setContract(contract);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleMarketClick = (market) => {
    setSelectedMarket(market);
    setIsModalOpen(true);
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    // Logic for deposit/borrow/etc would go here
    // Example: await contract.deposit(selectedMarket.loanTokenAddr, selectedMarket.collatTokenAddr, parsedAmount);
    console.log(`Executing ${activeTab} for ${amount} on ${selectedMarket.loanToken}/${selectedMarket.collateralToken}`);
    alert("Functionality would trigger transaction here. Ensure contract address is set.");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              PBALend
            </span>
          </div>
          
          <button
            onClick={connectWallet}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
              account 
                ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Next Gen <span className="text-indigo-500">DeFi Lending</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience seamless dual-token lending markets with real-time oracle integration and share-based accounting.
          </p>
          <div className="flex justify-center gap-8 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Audited Security
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Real-time Oracles
            </div>
          </div>
        </div>
      </header>

      {/* Markets Grid */}
      <main className="container mx-auto px-6 -mt-20 relative z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_MARKETS.map((market, idx) => (
            <div 
              key={idx}
              onClick={() => handleMarketClick(market)}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs ring-2 ring-slate-800">
                    {market.loanToken}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs ring-2 ring-slate-800">
                    {market.collateralToken}
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
                  Active
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-sm">Net APY</span>
                  <span className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {market.interestRate}
                  </span>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Max LTV</span>
                    <span className="text-slate-300 font-medium">{market.ltv}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Supplied</span>
                    <span className="text-slate-300 font-medium">${market.totalDeposited}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Borrowed</span>
                    <span className="text-slate-300 font-medium">${market.totalBorrowed}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Market Card Placeholder */}
          <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800/40 hover:border-slate-600 transition-all cursor-not-allowed">
            <div className="bg-slate-800 p-3 rounded-full mb-3">
              <ArrowRightLeft className="w-6 h-6 opacity-50" />
            </div>
            <span className="font-medium">More Markets Coming Soon</span>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {isModalOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl shadow-indigo-500/20">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-800/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {selectedMarket.loanToken} / {selectedMarket.collateralToken} Market
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-950/50 p-1 rounded-lg">
                {['deposit', 'borrow', 'repay', 'withdraw'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleAction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400 font-medium">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      {(activeTab === 'deposit' || activeTab === 'repay' || activeTab === 'withdraw') ? selectedMarket.loanToken : selectedMarket.collateralToken}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3 text-sm text-indigo-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>
                    {activeTab === 'deposit' && "You will receive deposit shares in exchange appropriately."}
                    {activeTab === 'borrow' && "Ensure you have sufficient collateral deposited first."}
                    {activeTab === 'repay' && "Repaying will reduce your debt balance."}
                    {activeTab === 'withdraw' && "Withdrawing may affect your health factor if you have active loans."}
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
                >
                  {activeTab === 'deposit' && 'Deposit Assets'}
                  {activeTab === 'borrow' && 'Borrow Tokens'}
                  {activeTab === 'repay' && 'Repay Loan'}
                  {activeTab === 'withdraw' && 'Withdraw Assets'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
