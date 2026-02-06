import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';

type PaymentStatus = 'pending' | 'confirming' | 'completed';

const PaymentCashier = () => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [status, setStatus] = useState<PaymentStatus>('pending');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate status changes for demonstration
  useEffect(() => {
    // Demo: Change status to 'confirming' after 5 seconds, and 'completed' after 10 seconds
    const t1 = setTimeout(() => setStatus('confirming'), 5000);
    const t2 = setTimeout(() => setStatus('completed'), 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}min ${s < 10 ? '0' : ''}${s}s`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制`, {
      description: text,
      duration: 2000,
    });
  };

  const orderData = {
    id: "00001413410001ABa",
    expireTime: "2026-02-06 18:00:00",
    currency: "USDT",
    contractAddress: "0x55d398326f99059fF775485246999027B3197955", // Mock USDT BEP20 contract
    network: "BNB Smart Chain",
    amount: "100.01",
    address: "0xCF1439F146F9D9C53bb9A65Dfd0AF5A7b8418AFb"
  };

  const renderStatusStep = (stepStatus: PaymentStatus, label: string, currentStatus: PaymentStatus, icon: React.ReactNode) => {
    const steps = ['pending', 'confirming', 'completed'];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(stepStatus);
    
    let isActive = stepIndex === currentIndex;
    let isCompleted = stepIndex < currentIndex;
    
    // Color logic
    let colorClass = "text-gray-500 bg-gray-800 border-gray-700";
    if (isActive) {
      colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/50";
    } else if (isCompleted) {
      colorClass = "text-green-400 bg-green-500/10 border-green-500/50";
    }

    return (
      <div className={`flex flex-col items-center gap-2 flex-1 relative`}>
         {/* Connecting Line */}
        {stepIndex < 2 && (
             <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                currentIndex > stepIndex ? 'bg-green-500/50' : 'bg-gray-700'
             }`} />
        )}
        
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${colorClass}`}>
          {isCompleted ? <CheckCircle2 size={16} /> : isActive ? icon : <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        <span className={`text-xs ${isActive ? 'text-white font-medium' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center">
      {/* Container - Scales up on Desktop */}
      <div className="w-full max-w-md md:max-w-4xl md:bg-[#2c2c2e]/20 md:backdrop-blur-xl md:p-8 md:rounded-3xl md:shadow-2xl md:border md:border-white/5 space-y-6">
        
        {/* Header - Centered */}
        <div className="pt-4 pb-4 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/20">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">支付信息</h1>
            <p className="text-sm text-gray-400">SkyPay</p>
          </div>
        </div>

        {/* Status Tracker - Centered, spanning full width */}
        <div className="bg-[#2c2c2e] p-4 rounded-xl flex justify-between items-start max-w-2xl mx-auto w-full shadow-inner shadow-black/20">
            {renderStatusStep('pending', '等待支付', status, <Clock size={16} className="animate-pulse"/>)}
            {renderStatusStep('confirming', '支付确认中', status, <Loader2 size={16} className="animate-spin"/>)}
            {renderStatusStep('completed', '支付完成', status, <CheckCircle2 size={16}/>)}
        </div>

        {/* Desktop Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          
          {/* Left Column: Order Info */}
          <div className="space-y-6">
             <div className="space-y-4 text-sm bg-[#2c2c2e]/50 p-4 rounded-xl border border-white/5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">订单号:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">{orderData.id}</span>
                    <button 
                      onClick={() => copyToClipboard(orderData.id, "订单号")}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      复制
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400">订单有效时间:</span>
                  <span className="text-white">{orderData.expireTime}</span>
                  <span className="text-orange-400 text-xs bg-orange-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                    剩余 {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">收款币种:</span>
                    <span className="text-white font-medium">{orderData.currency}</span>
                  </div>
                  <div className="flex items-start justify-between text-xs pt-1">
                    <span className="text-gray-500 shrink-0 mt-[2px]">合约地址:</span>
                    <div className="flex items-start justify-end gap-1 min-w-0 flex-1">
                       <span className="text-gray-400 font-mono break-all text-right leading-relaxed">{orderData.contractAddress}</span>
                       <button 
                        onClick={() => copyToClipboard(orderData.contractAddress, "合约地址")}
                        className="text-blue-400 hover:text-blue-300 shrink-0 mt-[2px]"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1 py-4 border-t border-white/5 mt-2">
                  <span className="text-gray-400">支付金额:</span>
                  <span className="text-3xl font-bold text-blue-400 tracking-tight">
                    {orderData.amount} <span className="text-lg text-white/80">{orderData.currency}</span>
                  </span>
                </div>

                {/* Network */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-gray-400">支付网络:</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded text-xs">{orderData.network}</span>
                </div>
              </div>

              {/* Notes - Desktop Position */}
              <div className="space-y-3 text-xs text-gray-400 hidden md:block pl-2">
                <h3 className="text-sm font-medium text-gray-300">注意:</h3>
                <ol className="list-decimal pl-4 space-y-2 marker:text-gray-500">
                  <li>请在有效时间内完成支付;</li>
                  <li>收款地址随时变化，请务保存收款信息;</li>
                  <li>请仔细核对充值金额;</li>
                  <li>转账完成后请耐心等待区块确认。</li>
                </ol>
              </div>
          </div>

          {/* Right Column: Payment Actions */}
          <div className="space-y-6">
            
            {status !== 'completed' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                 {/* QR Code Section */}
                <div className="space-y-2 text-center">
                  <div className="bg-white p-4 rounded-xl w-fit mx-auto relative group shadow-lg shadow-black/30">
                    <QRCodeSVG 
                      value={orderData.address} 
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                    {/* Scan Hint Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl cursor-pointer"
                        onClick={() => copyToClipboard(orderData.address, "地址")}>
                       <span className="text-black font-medium text-sm">点击复制地址</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500">
                     仅支持 <span className="text-gray-300 font-medium">{orderData.currency}</span> 充值
                  </p>
                </div>

                 {/* Address Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-gray-400 text-sm">收款地址:</span>
                    <button 
                      onClick={() => copyToClipboard(orderData.address, "地址")}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      复制
                    </button>
                  </div>
                  <div className="bg-[#2c2c2e] p-4 rounded-lg break-all font-mono text-sm text-white relative group cursor-pointer hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-blue-500/30 shadow-inner"
                       onClick={() => copyToClipboard(orderData.address, "地址")}>
                    {orderData.address}
                  </div>
                  
                  <p className="text-xs text-yellow-500/80 flex items-center justify-center gap-1 mt-2 bg-yellow-500/10 py-2 rounded border border-yellow-500/20">
                    <AlertCircleIcon className="w-3 h-3" />
                    请务必使用 {orderData.network} 网络
                  </p>
                </div>
              </motion.div>
            )}
            
            {status === 'completed' && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center space-y-4 h-full flex flex-col justify-center items-center min-h-[300px]"
                 >
                    <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg shadow-green-900/20 animate-bounce-short">
                        <CheckCircle2 size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">支付成功</h3>
                        <p className="text-green-400 text-base mt-2">您的充值已到账</p>
                    </div>
                 </motion.div>
            )}
          </div>
        </div>

        {/* Divider - Mobile Only */}
        <div className="border-t border-gray-700 my-6 md:hidden"></div>

        {/* Notes - Mobile Only */}
        <div className="space-y-3 text-xs text-gray-400 md:hidden">
          <h3 className="text-sm font-medium text-gray-300">注意:</h3>
          <ol className="list-decimal pl-4 space-y-2 marker:text-gray-500">
            <li>请在有效时间内完成支付;</li>
            <li>收款地址随时变化，请务保存收款信息;</li>
            <li>请仔细核对充值金额;</li>
            <li>转账完成后请耐心等待区块确认。</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center border-t border-gray-700/50 md:border-transparent mt-4">
          <p className="text-sm text-gray-500">有任何疑问，请随时联系在线支持!</p>
        </div>
      </div>
    </div>
  );
};

// Simple Icon component for the alert
const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default PaymentCashier;
