import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, Loader2, Globe, ChevronDown, Check, Zap, AlertTriangle, CircleDollarSign, Copy, ExternalLink, CircleX, CloudOff } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { queryOrder, QueryOrderResponse } from "../../services/index"
import { formatTime, remainingSeconds, formatDuration, remainingSecondsWithFormat } from "../../utils/TimeUtils"
import { templateReplace, isValidString, cutNumberStr } from "../../utils/StringUtils"
import { paymentCashierTranslations, paymentLanguages, type Language } from "../../i18n/paymentCashier";
import Loading from "../../svg/Loading.svg";

type PaymentStatus = 'pending' | 'confirming' | 'completed' | 'error';

type PaymentCashierProps = {
  orderId: string;
  e: string;
  language: string;
};

const PaymentCashier = ({ orderId, e, language }: PaymentCashierProps) => {
  const loadingPrimarySrc = typeof window !== 'undefined'
    ? `${window.location.origin}/Loading.svg`
    : Loading;
  const initialLanguage: Language = language in paymentCashierTranslations
    ? (language as Language)
    : 'en_US';

  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [orderInfo, setOrderInfo] = useState<QueryOrderResponse | undefined>(undefined);
  const [isRequestData, setIsRequestData] = useState(false)
  const [orderExpiredTime, setOrderExpiredTime] = useState<number | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [errorInfo, setErrorInfo] = useState("");
  const intervalRef = useRef<number | null>(null);
  const intervalTimerRef = useRef<number | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const interval = 4000;

  const t = paymentCashierTranslations[lang] ?? paymentCashierTranslations['en_US'];

  // Simulate status changes for demonstration
  // useEffect(() => {
  //   // Demo: Change status to 'confirming' after 5 seconds, and 'completed' after 10 seconds
  //   const t1 = setTimeout(() => setStatus('confirming'), 5000);
  //   const t2 = setTimeout(() => setStatus('completed'), 10000);
  //   return () => {
  //     clearTimeout(t1);
  //     clearTimeout(t2);
  //   };
  // }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang)
  }, [lang])

  useEffect(() => {
    const cStatus = Number(orderInfo?.status ?? 0)
    if (cStatus === 0) {
      setStatus('pending')
    } else if (cStatus === 1 || cStatus === 2) {
      setStatus('completed')
    } else if (cStatus === -1) {
      setStatus('error')
    } else {
      setStatus('pending')
    }
  }, [orderInfo])

  useEffect(() => {
    const fetch = async () => {
      await queryOrderInfo();

      if (status === 'completed' || status === 'error') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    fetch();

    intervalRef.current = window.setInterval(fetch, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, status, interval, orderId, e]);

  useEffect(() => {
    if (orderInfo) {
      intervalTimerRef.current = setInterval(() => {
        const expiredTime = orderExpiredTime ?? 0
        let remaining = remainingSeconds(expiredTime)
        if (remaining >= 0) {
          remaining -= 1;
          setSeconds(remaining)
        } else {
          if (intervalTimerRef.current) {
            clearInterval(intervalTimerRef.current)
            intervalTimerRef.current = null;
          }
        }
      }, 1000)
    }

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [orderExpiredTime])

  // useEffect(()=>{
  //   queryOrderInfo();
  // }, [orderId,e])

  const queryOrderInfo = async () => {
    if (!isValidString(orderId) || !isValidString(e)) {
      return
    }
    const data = await queryOrder({
      orderId,
      e
    })
    const result = data.data;
    const code = data.code;
    const msg = data.msg;
    setIsRequestData(true)
    if (code === 1) {
      setErrorInfo("")
      setOrderInfo(result)
      if (orderExpiredTime === null && result && result.expiredTime) {
        setOrderExpiredTime(result?.expiredTime ?? 0)
      }
    } else {
      setErrorInfo(msg)
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }

  const lookScanWithTxHash = () => {
    window.open(orderInfo?.scanUrl, "_blank")
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t.copied}`, {
      description: text,
      duration: 2000,
    });
  };

  const renderStatusStep = (stepStatus: PaymentStatus, label: string, currentStatus: PaymentStatus, icon: React.ReactNode) => {
    const steps = ['pending', 'confirming', 'completed'];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(stepStatus);

    let isActive = stepIndex === currentIndex;
    let isCompleted = stepIndex <= currentIndex;
    // Color logic
    let colorClass = "text-gray-500 bg-gray-800 border-gray-700";
    if (isActive && !isCompleted) {
      colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/50";
    } else if (isCompleted) {
      colorClass = "text-green-400 bg-green-500/10 border-green-500/50";
    }

    return (
      <div className={`flex flex-col items-center gap-2 flex-1 relative`}>
        {/* Connecting Line */}
        {stepIndex < 2 && (
          <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${currentIndex > stepIndex ? 'bg-green-500/50' : 'bg-gray-700'
            }`} />
        )}

        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${colorClass}`}>
          {isCompleted ? <CheckCircle2 size={16} /> : isActive ? icon : <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        <span className={`text-xs ${isActive && !isCompleted ? 'text-white font-medium' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
    );
  };

  if (isValidString(errorInfo) && isRequestData) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center">
        <div className="flex w-full flex-col items-center justify-center gap-3">
          <CloudOff size={80} className='text-red-400' />
          <span>{errorInfo}</span>
        </div>
      </div>
    )
  } else if (orderInfo === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center">
        <div className="flex w-full flex-col items-center justify-center">
          <img
            src={loadingPrimarySrc}
            alt="loading"
            className="block max-w-full"
            onError={(e) => {
              if (!e.currentTarget.dataset.fallbackApplied) {
                e.currentTarget.dataset.fallbackApplied = '1';
                e.currentTarget.src = Loading;
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center relative">

      {/* Language Switcher - Absolute Top Right */}
      <div className="absolute top-4 right-4 z-50 space-y-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-gray-300 px-3 py-2 rounded-lg text-sm border border-white/10 transition-colors outline-none">
              <Globe size={16} />
              <span>{paymentLanguages.find(l => l.code === lang)?.label}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-[120] bg-[#2c2c2e] border border-white/10 rounded-lg shadow-xl p-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-200"
              sideOffset={5}
            >
              {paymentLanguages.map((l) => (
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
      <div className="w-full max-w-lg md:max-w-5xl md:bg-[#2c2c2e]/20 md:backdrop-blur-xl md:p-8 md:rounded-3xl md:shadow-2xl md:border md:border-white/5 space-y-6">

        {/* Header - Centered */}
        <div className="pt-4 pb-4 flex flex-col items-center gap-2 text-center">
          <img src={orderInfo?.logo} alt="" className='w-12 h-12 items-center justify-center' />
          <div>
            <h1 className="text-2xl font-bold text-white">{orderInfo?.partnerName}</h1>
            <p className="text-sm text-gray-400">{orderInfo?.remark}</p>
          </div>
        </div>

        {/* Status Tracker - Centered, spanning full width */}
        {
          status !== 'error' ?
            <div className="bg-[#2c2c2e] p-4 rounded-xl flex justify-between items-start max-w-2xl mx-auto w-full shadow-inner shadow-black/20">
              {renderStatusStep('pending', t.pending, status, <Clock size={16} className="animate-pulse" />)}
              {renderStatusStep('confirming', t.confirming, status, <Loader2 size={16} className="animate-spin" />)}
              {renderStatusStep('completed', t.completed, status, <CheckCircle2 size={16} />)}
            </div>
            :
            null
        }


        {/* Desktop Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 items-start">

          {/* Left Column: Order Info */}
          <div className="space-y-6">
            <div className="space-y-4 text-sm bg-[#2c2c2e]/50 p-4 rounded-xl border border-white/5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t.orderId}:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono break-all text-right leading-relaxed">{orderInfo?.outOrderId}</span>
                  <button
                    onClick={() => copyToClipboard(orderInfo?.outOrderId ?? "", t.orderId)}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    {/* {t.copy} */}
                    <Copy size={14} className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between">
                <span className="text-gray-400">{t.expireTime}:</span>
                <div className='flex gap-2 items-center'>
                  <span className="text-white">{formatTime(orderInfo?.expiredTime)}</span>
                  {
                    seconds > 0 && status !== 'completed' && status !== 'error' ?
                      <span className="text-orange-400 text-xs bg-orange-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                        {t.timeLeft} {formatDuration(seconds)}
                      </span>
                      : null
                  }
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t.currency}:</span>
                  <div className="flex items-center gap-1.5">
                    {/* <CircleDollarSign size={16} className="text-green-500" /> */}
                    <span className="text-white font-medium">{orderInfo?.tokenName}</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1 py-4 border-t border-white/5 mt-2">
                <span className="text-gray-400">{t.amount}:</span>
                <span className="text-3xl font-bold text-blue-400 tracking-tight">
                  {orderInfo?.quantity} <span className="text-lg text-white/80">{orderInfo?.tokenName}</span>
                </span>

                {/* Exchange Rate */}
                <span className="text-xs text-gray-500">{t.exchangeRate} {`1 ${orderInfo?.tokenName} = ${cutNumberStr(String(orderInfo?.tokenPrice ?? 0), 4)} USD`}</span>

                {/* Amount Warning */}
                <div className="flex items-start gap-2 mt-2 text-yellow-500/90 text-xs bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>{t.amountWarning}</p>
                </div>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-gray-400">{t.network}:</span>
                <span className="text-white bg-white/10 px-2 py-1 rounded text-xs">{orderInfo?.chainName}</span>
              </div>

              {/* Payment Address */}
              {/* <div className="flex items-start justify-between text-xs pt-3 border-t border-white/5">
                <span className="text-gray-500 shrink-0 mt-[2px]">{t.paymentAddress}:</span>
                <div className="flex items-start justify-end gap-1 min-w-0 flex-1">
                  <span className="text-gray-400 font-mono break-all text-right leading-relaxed">{orderInfo?.address}</span>
                  <button
                    onClick={() => copyToClipboard(orderInfo?.address ?? "", t.paymentAddress)}
                    className="text-blue-400 hover:text-blue-300 shrink-0 mt-[2px]"
                  >
                    <Copy size={14} className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                  </button>
                </div>
              </div> */}
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

            {status !== 'completed' && status !== 'error' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* QR + Address Side-by-Side Layout */}
                <div className="bg-[#2c2c2e]/50 rounded-xl border border-white/5 p-4 space-y-3">
                  <div className="flex gap-4 items-start">
                    {/* Left: QR Code */}
                    <div ref={qrRef} className="bg-white p-2.5 rounded-xl shrink-0 shadow-lg shadow-black/30">
                      <QRCodeSVG
                        value={orderInfo?.address ?? ""}
                        size={110}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* Right: Address + Buttons */}
                    <div className="flex flex-col justify-between flex-1 min-w-0 gap-3">
                      {/* Address Text */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t.paymentAddress}</p>
                        <p className="text-sm font-mono break-all leading-relaxed text-gray-200">
                          {orderInfo?.address}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          className="flex-1 text-xs text-gray-300 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg py-2 px-2 transition-colors"
                          onClick={() => {
                            const svg = qrRef.current?.querySelector('svg');
                            if (!svg) return;
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                            const svgUrl = URL.createObjectURL(svgBlob);
                            const img = new Image();
                            img.onload = () => {
                              const scale = 2;
                              const size = (img.width || 110) * scale;
                              const canvas = document.createElement('canvas');
                              canvas.width = size;
                              canvas.height = size;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, size, size);
                              URL.revokeObjectURL(svgUrl);
                              const pngUrl = canvas.toDataURL('image/png');
                              const a = document.createElement('a');
                              a.href = pngUrl;
                              a.download = 'qrcode.png';
                              a.click();
                            };
                            img.src = svgUrl;
                          }}
                        >
                          {t.saveQrCode}
                        </button>
                        <button
                          className="flex-1 text-xs text-blue-400 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-lg py-2 px-2 transition-colors font-medium"
                          onClick={() => copyToClipboard(orderInfo?.address ?? "", t.paymentAddress)}
                        >
                          {t.copyAddress}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Token hint */}
                  <p className="text-xs text-gray-500">
                    {t.onlySupport} <span className="text-gray-300 font-medium">{orderInfo?.tokenName}</span> {t.onlySupportSuffix}
                  </p>
                </div>

                {/* Address Warning */}
                <div className="text-xs text-yellow-500/80 flex items-start gap-2 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-[1px]" />
                  <span className="leading-relaxed">{templateReplace(t.addressWarning, { chainName: orderInfo?.chainName ?? "" })}</span>
                </div>
              </motion.div>
            ) : null}

            {status === 'completed' && (
              <>
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

                <div className="space-y-4 text-sm bg-[#2c2c2e]/50 p-4 rounded-xl border border-white/5 shadow-sm">
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>{t.hash}</span>
                    <div className='flex text-blue-14 items-center gap-1 cursor-pointer' onClick={lookScanWithTxHash}>
                      <span className='text-12 text-blue-500'>{t.lookTransaction}</span>
                      <ExternalLink size={14} className="text-blue-500" />
                    </div>
                  </div>

                  <div className='bg-zinc-900 flex items-center justify-between p-2 rounded gap-2'>
                    <span className='text-gray-400 flex-1 truncate'>
                      {orderInfo?.txHash ?? ""}
                    </span>
                    <Copy size={14} className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" onClick={() => copyToClipboard(orderInfo?.txHash ?? "", t.hash)} />
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-green-500/20 rounded-xl p-8 text-center space-y-4 h-full flex flex-col justify-center items-center min-h-[300px]"
              >
                <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg shadow-green-900/20 animate-bounce-short">
                  <CircleX size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{t.paymentError}</h3>
                  {/* <p className="text-green-400 text-base mt-2">{t.depositConfirmed}</p> */}
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
