import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, Loader2, Globe, ChevronDown, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

type PaymentStatus = 'pending' | 'confirming' | 'completed';
type Language = 'zh' | 'en' | 'ja' | 'ko';

const translations = {
  zh: {
    paymentInfo: "支付信息",
    pending: "等待支付",
    confirming: "支付确认中",
    completed: "支付完成",
    orderId: "订单号",
    copy: "复制",
    expireTime: "订单有效时间",
    timeLeft: "剩余",
    currency: "收款币种",
    contractAddress: "合约地址",
    amount: "支付金额",
    network: "支付网络",
    address: "收款地址",
    networkAlert: "请务必使用",
    networkAlertSuffix: "网络",
    clickToCopy: "点击复制地址",
    onlySupport: "仅支持",
    onlySupportSuffix: "充值",
    paymentSuccess: "支付成功",
    depositConfirmed: "您的充值已到账",
    note: "注意:",
    note1: "请在有效时间内完成支付;",
    note2: "收款地址随时变化，请务保存收款信息;",
    note3: "请仔细核对充值金额;",
    note4: "转账完成后请耐心等待区块确认。",
    contactSupport: "有任何疑问，请随时联系在线支持!",
    copied: "已复制",
    min: "分",
    sec: "秒"
  },
  en: {
    paymentInfo: "Payment Info",
    pending: "Pending",
    confirming: "Confirming",
    completed: "Completed",
    orderId: "Order ID",
    copy: "Copy",
    expireTime: "Valid Until",
    timeLeft: "Time Left",
    currency: "Currency",
    contractAddress: "Contract",
    amount: "Amount",
    network: "Network",
    address: "Address",
    networkAlert: "Please use",
    networkAlertSuffix: "network",
    clickToCopy: "Click to copy",
    onlySupport: "Only support",
    onlySupportSuffix: "deposit",
    paymentSuccess: "Payment Successful",
    depositConfirmed: "Deposit confirmed successfully",
    note: "Note:",
    note1: "Please complete payment within valid time.",
    note2: "Address changes periodically, do not save.",
    note3: "Please check the amount carefully.",
    note4: "Please wait for block confirmation.",
    contactSupport: "Any questions? Contact online support!",
    copied: "Copied",
    min: "m",
    sec: "s"
  },
  ja: {
    paymentInfo: "支払い情報",
    pending: "支払い待ち",
    confirming: "確認中",
    completed: "完了",
    orderId: "注文ID",
    copy: "コピー",
    expireTime: "有効期限",
    timeLeft: "残り",
    currency: "通貨",
    contractAddress: "契約アドレス",
    amount: "金額",
    network: "ネットワーク",
    address: "アドレス",
    networkAlert: "必ず",
    networkAlertSuffix: "ネットワークを使用してください",
    clickToCopy: "クリックしてコピー",
    onlySupport: "",
    onlySupportSuffix: "のみ対応",
    paymentSuccess: "支払い成功",
    depositConfirmed: "入金が確認されました",
    note: "注意:",
    note1: "有効期限内に支払いを完了してください。",
    note2: "アドレスは変更されます。保存しないでください。",
    note3: "金額をよく確認してください。",
    note4: "ブロック確認をお待ちください。",
    contactSupport: "ご不明な点は、サポートまで！",
    copied: "コピーしました",
    min: "分",
    sec: "秒"
  },
  ko: {
    paymentInfo: "결제 정보",
    pending: "결제 대기",
    confirming: "확인 중",
    completed: "완료",
    orderId: "주문 ID",
    copy: "복사",
    expireTime: "유효 시간",
    timeLeft: "남은 시간",
    currency: "통화",
    contractAddress: "계약 주소",
    amount: "금액",
    network: "네트워크",
    address: "주소",
    networkAlert: "반드시",
    networkAlertSuffix: "네트워크를 사용하십시오",
    clickToCopy: "복사하려면 클릭",
    onlySupport: "",
    onlySupportSuffix: "입금만 지원",
    paymentSuccess: "결제 성공",
    depositConfirmed: "입금이 확인되었습니다",
    note: "주의:",
    note1: "유효 시간 내에 결제를 완료하십시오.",
    note2: "주소는 수시로 변경되므로 저장하지 마십시오.",
    note3: "입금 금액을 주의 깊게 확인하십시오.",
    note4: "송금 후 블록 확인을 기다려 주십시오.",
    contactSupport: "궁금한 점은 지원팀에 문의하세요!",
    copied: "복사됨",
    min: "분",
    sec: "초"
  }
};

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'zh', label: '简体中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

const PaymentCashier = () => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [lang, setLang] = useState<Language>('zh');

  const t = translations[lang];

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
    return `${m}${t.min} ${s < 10 ? '0' : ''}${s}${t.sec}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t.copied}`, {
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
    <div className="min-h-screen bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center relative">
      
      {/* Language Switcher - Absolute Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-gray-300 px-3 py-2 rounded-lg text-sm border border-white/10 transition-colors outline-none">
              <Globe size={16} />
              <span>{languages.find(l => l.code === lang)?.label}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="bg-[#2c2c2e] border border-white/10 rounded-lg shadow-xl p-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-200"
              sideOffset={5}
            >
              {languages.map((l) => (
                <DropdownMenu.Item 
                  key={l.code}
                  className="flex items-center justify-between text-sm text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md cursor-pointer outline-none"
                  onSelect={() => setLang(l.code)}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{l.flag}</span>
                    {l.label}
                  </span>
                  {lang === l.code && <Check size={14} className="text-blue-400" />}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Container - Scales up on Desktop */}
      <div className="w-full max-w-md md:max-w-4xl md:bg-[#2c2c2e]/20 md:backdrop-blur-xl md:p-8 md:rounded-3xl md:shadow-2xl md:border md:border-white/5 space-y-6">
        
        {/* Header - Centered */}
        <div className="pt-4 pb-4 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/20">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t.paymentInfo}</h1>
            <p className="text-sm text-gray-400">SkyPay</p>
          </div>
        </div>

        {/* Status Tracker - Centered, spanning full width */}
        <div className="bg-[#2c2c2e] p-4 rounded-xl flex justify-between items-start max-w-2xl mx-auto w-full shadow-inner shadow-black/20">
            {renderStatusStep('pending', t.pending, status, <Clock size={16} className="animate-pulse"/>)}
            {renderStatusStep('confirming', t.confirming, status, <Loader2 size={16} className="animate-spin"/>)}
            {renderStatusStep('completed', t.completed, status, <CheckCircle2 size={16}/>)}
        </div>

        {/* Desktop Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          
          {/* Left Column: Order Info */}
          <div className="space-y-6">
             <div className="space-y-4 text-sm bg-[#2c2c2e]/50 p-4 rounded-xl border border-white/5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t.orderId}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">{orderData.id}</span>
                    <button 
                      onClick={() => copyToClipboard(orderData.id, t.orderId)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      {t.copy}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400">{t.expireTime}:</span>
                  <span className="text-white">{orderData.expireTime}</span>
                  <span className="text-orange-400 text-xs bg-orange-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                    {t.timeLeft} {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t.currency}:</span>
                    <span className="text-white font-medium">{orderData.currency}</span>
                  </div>
                  <div className="flex items-start justify-between text-xs pt-1">
                    <span className="text-gray-500 shrink-0 mt-[2px]">{t.contractAddress}:</span>
                    <div className="flex items-start justify-end gap-1 min-w-0 flex-1">
                       <span className="text-gray-400 font-mono break-all text-right leading-relaxed">{orderData.contractAddress}</span>
                       <button 
                        onClick={() => copyToClipboard(orderData.contractAddress, t.contractAddress)}
                        className="text-blue-400 hover:text-blue-300 shrink-0 mt-[2px]"
                      >
                        {t.copy}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1 py-4 border-t border-white/5 mt-2">
                  <span className="text-gray-400">{t.amount}:</span>
                  <span className="text-3xl font-bold text-blue-400 tracking-tight">
                    {orderData.amount} <span className="text-lg text-white/80">{orderData.currency}</span>
                  </span>
                </div>

                {/* Network */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-gray-400">{t.network}:</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded text-xs">{orderData.network}</span>
                </div>
              </div>

              {/* Notes - Desktop Position */}
              <div className="space-y-3 text-xs text-gray-400 hidden md:block pl-2">
                <h3 className="text-sm font-medium text-gray-300">{t.note}</h3>
                <ol className="list-decimal pl-4 space-y-2 marker:text-gray-500">
                  <li>{t.note1}</li>
                  <li>{t.note2}</li>
                  <li>{t.note3}</li>
                  <li>{t.note4}</li>
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
                        onClick={() => copyToClipboard(orderData.address, t.address)}>
                       <span className="text-black font-medium text-sm">{t.clickToCopy}</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500">
                    {t.onlySupport} <span className="text-gray-300 font-medium">{orderData.currency}</span> {t.onlySupportSuffix}
                  </p>
                </div>

                 {/* Address Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-gray-400 text-sm">{t.address}:</span>
                    <button 
                      onClick={() => copyToClipboard(orderData.address, t.address)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      {t.copy}
                    </button>
                  </div>
                  <div className="bg-[#2c2c2e] p-4 rounded-lg break-all font-mono text-sm text-white relative group cursor-pointer hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-blue-500/30 shadow-inner"
                       onClick={() => copyToClipboard(orderData.address, t.address)}>
                    {orderData.address}
                  </div>
                  
                  <p className="text-xs text-yellow-500/80 flex items-center justify-center gap-1 mt-2 bg-yellow-500/10 py-2 rounded border border-yellow-500/20">
                    <AlertCircleIcon className="w-3 h-3" />
                    {t.networkAlert} {orderData.network} {t.networkAlertSuffix}
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
                        <h3 className="text-2xl font-bold text-white">{t.paymentSuccess}</h3>
                        <p className="text-green-400 text-base mt-2">{t.depositConfirmed}</p>
                    </div>
                 </motion.div>
            )}
          </div>
        </div>

        {/* Divider - Mobile Only */}
        <div className="border-t border-gray-700 my-6 md:hidden"></div>

        {/* Notes - Mobile Only */}
        <div className="space-y-3 text-xs text-gray-400 md:hidden">
          <h3 className="text-sm font-medium text-gray-300">{t.note}</h3>
          <ol className="list-decimal pl-4 space-y-2 marker:text-gray-500">
            <li>{t.note1}</li>
            <li>{t.note2}</li>
            <li>{t.note3}</li>
            <li>{t.note4}</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center border-t border-gray-700/50 md:border-transparent mt-4">
          <p className="text-sm text-gray-500">{t.contactSupport}</p>
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
