import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Clock, AlertTriangle, CheckCircle2, ChevronDown, Globe, Sun, Moon, LayoutTemplate, CloudOff } from "lucide-react";
import {
  type LangKey,
  LANGUAGES,
  topupRechargeTranslations,
} from "../../i18n/topupRecharge";
import { queryOrder, type QueryOrderResponse } from "../../services";
import { paymentCashierTranslations, type Language as CashierLanguage } from "../../i18n/paymentCashier";
import { isValidString, templateReplace } from "../../utils/StringUtils";
import { remainingSeconds } from "../../utils/TimeUtils";
import Loading from "../../svg/Loading.svg";

const POLL_INTERVAL_MS = 4000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCountdown(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatValidUntil(timestamp?: number) {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function FormattedAddress({ address }: { address: string }) {
  return (
    <p className="font-mono text-xs leading-5 font-semibold break-all" style={{ color: "inherit" }}>
      {address}
    </p>
  );
}

function CopyBtn({ onClick, copied, label, copiedLabel, dark = false }: {
  onClick: () => void; copied: boolean; label: string; copiedLabel: string; dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all"
      style={copied
        ? { background: "#dcfce7", borderColor: "#86efac", color: "#16a34a" }
        : {
            background: dark ? "#28282c" : "#f3f4f6",
            borderColor: dark ? "#38383e" : "#e5e7eb",
            color: dark ? "#d0d0d8" : "#374151",
          }
      }
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

// ─── Language selector ────────────────────────────────────────────────────────

function LangSelector({ lang, onChange }: { lang: LangKey; onChange: (l: LangKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.key === lang)!;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] text-xs font-medium text-[#374151] hover:bg-[#e9eaec] transition-colors"
      >
        <Globe size={13} className="text-[#6b7280]" />
        <span>{current.native}</span>
        <ChevronDown size={11} className={`text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#e5e7eb] rounded-2xl shadow-lg z-50 overflow-hidden py-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => { onChange(l.key); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${
                l.key === lang
                  ? "bg-[#f0fdf4] text-[#16a34a] font-semibold"
                  : "text-[#374151] hover:bg-[#f9fafb]"
              }`}
              dir={l.rtl ? "rtl" : undefined}
            >
              <span>{l.native}</span>
              <span className="text-[#9ca3af] text-[10px]">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STYLE_ROUTES = [
  { path: "/pro", label: "专业版" },
  { path: "/enterprise", label: "企业版" },
] as const;

function StyleRouteSelector() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = STYLE_ROUTES.find((s) => loc.pathname === s.path) ?? STYLE_ROUTES[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] text-xs font-medium text-[#374151] hover:bg-[#e9eaec] transition-colors"
      >
        <LayoutTemplate size={13} className="text-[#6b7280]" />
        <span>{current.label}</span>
        <ChevronDown size={11} className={`text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#e5e7eb] rounded-2xl shadow-lg z-50 overflow-hidden py-1">
          {STYLE_ROUTES.map((s) => (
            <button
              key={s.path}
              type="button"
              onClick={() => {
                navigate({ pathname: s.path, search: loc.search });
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${
                s.path === loc.pathname
                  ? "bg-[#f0fdf4] text-[#16a34a] font-semibold"
                  : "text-[#374151] hover:bg-[#f9fafb]"
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PaymentStatus = "pending" | "confirming" | "completed" | "error";
type TopupStylePageProps = {
  orderId: string;
  e: string;
  language: string;
  search: string;
};

function parseBool(val: string | null, def = true): boolean {
  if (val === null) return def;
  return !["0", "false", "no"].includes(val.toLowerCase());
}

function mapLanguageToLangKey(language: string): LangKey {
  const languageMap: Record<string, LangKey> = {
    en_us: "en",
    zh_cn: "zh-CN",
    fr_fr: "fr",
    de_de: "de",
    es_es: "es",
    ja_jp: "ja",
    ko_kr: "ko",
    ar_sa: "ar",
  };
  return languageMap[language.toLowerCase()] ?? "en";
}

function getInitialParams(search: string, language: string): { lang: LangKey; showSelector: boolean; dark: boolean } {
  const p = new URLSearchParams(search);
  const rawLang = p.get("lang") ?? mapLanguageToLangKey(language);
  const lang: LangKey = LANGUAGES.some((l) => l.key === rawLang) ? (rawLang as LangKey) : "en";
  const showSelector = parseBool(p.get("showLangSelector"), true);
  const rawTheme = p.get("theme") ?? "";
  const dark = ["dark", "black"].includes(rawTheme.toLowerCase());
  return { lang, showSelector, dark };
}

export default function TopupStylePage({ orderId, e, language, search }: TopupStylePageProps) {
  const initial = useMemo(() => getInitialParams(search, language), [search, language]);
  const [lang, setLang] = useState<LangKey>(initial.lang);
  const [dark, setDark] = useState(initial.dark);
  const showSelector = initial.showSelector;

  const [orderInfo, setOrderInfo] = useState<QueryOrderResponse | undefined>(undefined);
  const [errorInfo, setErrorInfo] = useState("");
  const [isRequestData, setIsRequestData] = useState(false);
  const [orderExpiredTime, setOrderExpiredTime] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [successVisible, setSuccessVisible] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const intervalTimerRef = useRef<number | null>(null);
  const interval = POLL_INTERVAL_MS;
  const qrRef = useRef<HTMLDivElement>(null);

  const t = topupRechargeTranslations[lang];
  const isRtl = LANGUAGES.find((l) => l.key === lang)?.rtl ?? false;
  const cashierLangMap: Record<LangKey, CashierLanguage> = {
    en: "en_US",
    "zh-CN": "zh_CN",
    "zh-TW": "zh_HK",
    de: "de_DE",
    fr: "fr_FR",
    es: "es_ES",
    ar: "en_US",
    ko: "ko_KR",
    ja: "ja_JP",
  };
  const tA = paymentCashierTranslations[cashierLangMap[lang]] ?? paymentCashierTranslations.en_US;
  const failedTextByLang: Record<LangKey, string> = {
    en: "Order is abnormal or failed, please initiate payment again.",
    "zh-CN": "订单异常或已失败，请重新发起支付。",
    "zh-TW": "訂單異常或已失敗，請重新發起支付。",
    de: "Bestellung ist fehlgeschlagen oder ungueltig. Bitte erneut bezahlen.",
    fr: "Commande anormale ou echouee. Veuillez relancer le paiement.",
    es: "Pedido anormal o fallido. Inicie el pago de nuevo.",
    ar: "الطلب غير صالح او فشل. يرجى اعادة الدفع.",
    ko: "주문이 비정상이거나 실패했습니다. 다시 결제를 진행하세요.",
    ja: "注文が異常または失敗しました。再度お支払いください。",
  };

  const walletAddress = orderInfo?.address ?? "";
  const amountStr = orderInfo?.quantity ?? "";
  const currency = orderInfo?.tokenName ?? "";
  const chainName = orderInfo?.chainName ?? "";
  const outOrderId = orderInfo?.outOrderId ?? "";
  const txHash = orderInfo?.txHash ?? "";
  const explorerHref = orderInfo?.scanUrl?.trim() || (txHash ? `https://tronscan.org/#/transaction/${txHash}` : "#");

  const nStatus = Number(orderInfo?.status ?? 0);
  const isSuccess = status === "completed";

  const th = {
    pageBg:    dark ? "#111111" : "#f2f3f7",
    cardBg:    dark ? "#1c1c1e" : "#ffffff",
    cardBorder:dark ? "#2a2a2e" : "transparent",
    heading:   dark ? "#f5f5f5" : "#1a1a2e",
    subText:   dark ? "#a0a0aa" : "#6b7280",
    mutedText: dark ? "#6b7280" : "#9ca3af",
    divider:   dark ? "#2a2a2e" : "#f3f4f6",
    inputBg:   dark ? "#28282c" : "#f9fafb",
    inputBorder:dark? "#38383e" : "#f0f0f0",
    cancelBg:  dark ? "#3a1a1a" : "#fff5f5",
    cancelBorder:dark? "#7f2020" : "rgba(248,113,113,0.4)",
    timerBg:   dark ? "#2a2208" : "#fffbeb",
    timerBorder:dark? "#7a5c00" : "#fde68a",
    timerIconBg:dark? "#3a3010" : "#fef3c7",
    networkBg: dark ? "#1a2540" : "#eff6ff",
    networkText:dark? "#7ba7f7" : "#2563eb",
    networkBorder:dark?"#2a4080":"#bfdbfe",
    amtBorder: dark ? "#2a2a2e" : "#f3f4f6",
    trackBg:   dark ? "#2a2a2e" : "#e5e7eb",
    qrBorder:  dark ? "#38383e" : "#e5e7eb",
    qrBg:      dark ? "#ffffff" : "#ffffff",
    btnLight:  dark ? "#28282c" : "#f3f4f6",
    btnLightBorder: dark ? "#38383e" : "#e5e7eb",
    btnLightText:   dark ? "#d0d0d8" : "#6b7280",
    successOverlay: dark ? "#1c1c1e" : "#ffffff",
    summaryBg: dark ? "#28282c" : "#f9fafb",
  };

  const stepLabels = {
    pending: tA.pending,
    confirming: tA.confirming,
    completed: tA.completed,
  };

  const queryOrderInfo = async () => {
    if (!isValidString(orderId) || !isValidString(e)) {
      return;
    }
    const data = await queryOrder({ orderId, e });
    const result = data.data;
    const code = data.code;
    const msg = data.msg;
    setIsRequestData(true);
    if (code === 1) {
      setErrorInfo("");
      setOrderInfo(result);
      if (orderExpiredTime === null && result && result.expiredTime) {
        setOrderExpiredTime(result.expiredTime ?? 0);
      }
    } else {
      setErrorInfo(msg);
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  useEffect(() => {
    const fetch = async () => {
      await queryOrderInfo();

      if (status === "completed" || status === "error") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    void fetch();
    intervalRef.current = window.setInterval(fetch, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, status, interval, orderId, e]);

  useEffect(() => {
    const st = Number(orderInfo?.status ?? 0);
    if (st === 1 || st === 2) {
      setStatus("completed");
      const tid = window.setTimeout(() => setSuccessVisible(true), 400);
      return () => clearTimeout(tid);
    }
    if (st === -1) {
      setStatus("error");
      setSuccessVisible(false);
      return;
    }
    setStatus("pending");
    setSuccessVisible(false);
  }, [orderInfo?.status]);

  useEffect(() => {
    if (orderInfo) {
      intervalTimerRef.current = window.setInterval(() => {
        const expiredTime = orderExpiredTime ?? 0;
        let remaining = remainingSeconds(expiredTime);
        if (remaining >= 0) {
          remaining -= 1;
          setSeconds(remaining);
        } else if (intervalTimerRef.current) {
          clearInterval(intervalTimerRef.current);
          intervalTimerRef.current = null;
        }
      }, 1000);
    }

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [orderExpiredTime]);

  const mkCopy = (text: string, set: (v: boolean) => void) => async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    set(true); setTimeout(() => set(false), 2000);
  };
  const saveQrCode = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const size = (img.width || 168) * scale;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(svgUrl);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "qrcode.png";
      a.click();
    };
    img.src = svgUrl;
  };

  const steps = [
    { key: "pending" as PaymentStatus, label: stepLabels.pending },
    { key: "confirming" as PaymentStatus, label: stepLabels.confirming },
    { key: "completed" as PaymentStatus, label: stepLabels.completed },
  ];
  const stepIdx = steps.findIndex((s) => s.key === status);

  if (isValidString(errorInfo) && isRequestData && !orderInfo) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center">
        <div className="column items-center justify-center flex flex-col gap-3" style={{ justifyItems: "center" }}>
          <CloudOff size={80} className="text-red-400" />
          <span>{errorInfo}</span>
        </div>
      </div>
    );
  }

  if (orderInfo === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center">
        <div className="flex w-full flex-col items-center justify-center">
          <img src={Loading} alt="loading" className="block max-w-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{ background: th.pageBg, fontFamily: "'Noto Sans SC', 'Inter', sans-serif", transition: "background 0.3s" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className={`w-full max-w-sm md:max-w-xl ${status === "error" ? "" : "min-h-screen"} flex flex-col`} style={{ background: th.pageBg }}>
        {(showSelector || true) && (
          <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-1">
            <StyleRouteSelector />
            {showSelector && <LangSelector lang={lang} onChange={setLang} />}
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="flex items-center justify-center w-8 h-8 rounded-full border transition-all"
              style={{
                background: th.btnLight,
                borderColor: th.btnLightBorder,
                color: th.subText,
              }}
              title={dark ? "Switch to light" : "Switch to dark"}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        )}

        <div
          className={`${status === "error" ? "" : "flex-1"} mx-3 mb-3 rounded-2xl overflow-hidden shadow-sm flex flex-col relative transition-colors duration-300`}
          style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}` }}
        >

          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h1 className="text-lg font-bold" style={{ color: th.heading }}>{t.title}</h1>
          </div>

          {status === "error" && (
            <div className="mx-5 mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 flex items-center gap-2">
              <CloudOff size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300 leading-5">{failedTextByLang[lang] ?? failedTextByLang.en}</p>
            </div>
          )}

          {status !== "error" && (
            <div className="px-5 pb-4">
              <div className="relative flex items-start justify-between">
                <div className="absolute left-0 right-0 top-[10px] h-0.5" style={{ background: th.trackBg }} />
                <div
                  className="absolute left-0 top-[10px] h-0.5 transition-all duration-700"
                  style={{ width: `${(Math.max(stepIdx, 0) / (steps.length - 1)) * 100}%`, background: isSuccess ? "#16a34a" : "#f59e0b" }}
                />
                {steps.map((s, i) => {
                  const active = i <= stepIdx;
                  const current = i === stepIdx;
                  const green = isSuccess && active;
                  return (
                    <div key={s.key} className="relative flex flex-col items-center gap-1.5 z-10">
                      <div
                        className="transition-all duration-500"
                        style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: active ? (green ? "#16a34a" : "#f59e0b") : th.cardBg,
                          border: `2px solid ${active ? (green ? "#16a34a" : "#f59e0b") : "#d1d5db"}`,
                          boxShadow: current ? `0 0 0 3px ${green ? "#bbf7d0" : "#fde68a"}` : "none",
                        }}
                      />
                      <span
                        className="text-[10px] font-medium whitespace-nowrap transition-colors duration-500"
                        style={{ color: active ? (green ? "#16a34a" : "#f59e0b") : "#9ca3af" }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="absolute left-0 right-0 bottom-0 z-20 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden"
            style={{
              background: th.successOverlay,
              height: successVisible ? "calc(100% - 112px)" : 0,
              opacity: successVisible ? 1 : 0,
              pointerEvents: successVisible ? "auto" : "none",
              transform: successVisible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center"
                  style={{ animation: successVisible ? "successPulse 1.2s ease-out forwards" : "none" }}
                >
                  <CheckCircle2 size={38} className="text-[#16a34a]" strokeWidth={2} />
                </div>
              </div>
              {successVisible && [...Array(8)].map((_, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full" style={{
                  background: ["#f59e0b","#16a34a","#2563eb","#ef4444","#8b5cf6","#ec4899","#06b6d4","#f97316"][i],
                  top: "50%", left: "50%",
                  transform: `rotate(${i * 45}deg) translateY(-44px)`,
                  animation: `confettiFly 0.7s ${i * 60}ms ease-out both`,
                }} />
              ))}
            </div>

            <h2 className="text-xl font-bold mb-0.5" style={{ color: th.heading }}>{t.successTitle}</h2>
            <p className="text-sm mb-0.5" style={{ color: th.subText }}>
              <span className="font-semibold" style={{ color: th.heading }}>{t.successSub(amountStr, currency)}</span>
            </p>
            <p className="text-[10px] mb-5" style={{ color: th.mutedText }}>
              {t.successWallet}: {walletAddress.length > 16 ? `${walletAddress.slice(0, 10)}…${walletAddress.slice(-6)}` : walletAddress}
            </p>

            <div className="w-full px-5 mb-5">
              <div className="rounded-2xl px-4 py-3 divide-y" style={{ background: th.summaryBg, borderColor: th.divider }}>
                {([
                  { label: t.summaryAmount,   value: `${amountStr} ${currency}`.trim(), highlight: false },
                  { label: t.summaryProtocol, value: [currency, chainName].filter(Boolean).join(" · ") || "—", highlight: false },
                  { label: t.summaryStatus,   value: t.summaryStatusVal,      highlight: true  },
                ] as { label: string; value: string; highlight: boolean }[]).map(({ label, value, highlight }) => (
                  <div key={label} className="flex items-center justify-between py-2" style={{ borderColor: th.divider }}>
                    <span className="text-xs" style={{ color: th.subText }}>{label}</span>
                    <span className="text-xs font-semibold" style={{ color: highlight ? "#16a34a" : th.heading }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2" style={{ borderColor: th.divider }}>
                  <span className="text-xs" style={{ color: th.subText }}>{t.summaryOrderNo}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold" style={{ color: th.heading }}>{outOrderId}</span>
                    <CopyBtn onClick={mkCopy(outOrderId, setCopiedOrderId)} copied={copiedOrderId} label={t.copy} copiedLabel={t.copied} dark={dark} />
                  </div>
                </div>
                <div className="py-2" style={{ borderColor: th.divider }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: th.subText }}>{t.summaryHash}</span>
                    <div className="flex items-center gap-1.5">
                      <CopyBtn onClick={mkCopy(txHash, setCopiedHash)} copied={copiedHash} label={t.copy} copiedLabel={t.copied} dark={dark} />
                      {explorerHref !== "#" && (
                        <a href={explorerHref} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors">
                          {t.viewExplorer}
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 2.5h7v7M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="font-mono text-[10px] rounded-lg px-3 py-2 break-all leading-4 select-all" style={{ color: th.heading, background: th.btnLight }}>
                    {txHash || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* <button type="button" className="w-4/5 py-3.5 rounded-2xl bg-[#f59e0b] text-white text-sm font-bold shadow-md hover:bg-[#d97706] active:scale-[0.98] transition-all">
              {t.backHome}
            </button> */}
          </div>

          <div className={`mx-5 mb-4 rounded-xl px-4 py-3 flex gap-3 border transition-colors duration-300 ${status === "error" ? "items-center" : "items-start"}`} style={{ background: th.timerBg, borderColor: th.timerBorder }}>
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: th.timerIconBg }}>
              <Clock size={16} className="text-[#f59e0b]" />
            </div>
            <div className="flex-1 min-w-0">
              {isSuccess ? (
                <p className="text-xs font-medium text-[#16a34a] leading-5">{t.timerSuccess}</p>
              ) : status === "error" ? (
                <p className="text-xs font-medium leading-5" style={{ color: th.heading }}>
                  {tA.expireTime}:{" "}
                  <span className="font-semibold" style={{ color: th.heading }}>
                    {formatValidUntil(orderInfo?.expiredTime)}
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-xs font-medium leading-5" style={{ color: th.heading }}>
                    {t.timerLabel("__TIME__").split("__TIME__")[0]}
                    <span className="text-[#ef4444] font-bold" style={{ fontVariantNumeric: "tabular-nums" } as CSSProperties}>
                      {formatCountdown(Math.max(seconds, 0))}
                    </span>
                    {t.timerLabel("__TIME__").split("__TIME__")[1]}
                  </p>
                  <p className="text-[10px] mt-0.5 leading-4" style={{ color: th.subText }}>{t.timerSub}</p>
                </>
              )}
            </div>
          </div>

          {status !== "error" && <div className="h-px mx-5 mb-3" style={{ background: th.divider }} />}

          <div className="px-5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0" style={{ color: th.subText }}>{t.orderNo}</span>
              <span className="font-mono text-xs font-semibold truncate" style={{ color: th.heading }}>{outOrderId}</span>
            </div>
            <CopyBtn onClick={mkCopy(outOrderId, setCopiedOrderId)} copied={copiedOrderId} label={t.copy} copiedLabel={t.copied} dark={dark} />
          </div>

          <div className="px-5 mb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: th.subText }}>{t.rechargeAmount}</span>
              <span className="text-[10px] text-[#ef4444]">{t.amountHint}</span>
            </div>
            <div className={`flex items-end justify-between py-2.5 ${status === "error" ? "" : "border-b"}`} style={{ borderColor: th.amtBorder }}>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold leading-none" style={{ color: th.heading }}>{amountStr}</span>
                <span className="text-base font-semibold" style={{ color: th.subText }}>{currency}</span>
              </div>
              <CopyBtn onClick={mkCopy(`${amountStr}`.trim(), setCopiedAmount)} copied={copiedAmount} label={t.copy} copiedLabel={t.copied} dark={dark} />
            </div>
          </div>

          {status !== "error" && (
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[10px]" style={{ color: th.mutedText }}>{t.network}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border" style={{ background: th.networkBg, color: th.networkText, borderColor: th.networkBorder }}>
                {[currency, chainName].filter(Boolean).join(" · ") || "—"}
              </span>
            </div>
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div ref={qrRef} className="flex-shrink-0 p-2 rounded-xl shadow-sm self-center md:self-start border" style={{ background: th.qrBg, borderColor: th.qrBorder }}>
                <QRCodeSVG value={walletAddress || "-"} size={168} />
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="rounded-xl px-3 py-2.5 mb-2 flex-1 border" style={{ background: th.inputBg, borderColor: th.inputBorder }}>
                  <p className="text-[9px] mb-1 uppercase tracking-wide leading-none" style={{ color: th.mutedText }}>{tA.paymentAddress}</p>
                  <div style={{ color: th.heading }}>
                    <FormattedAddress address={walletAddress} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={saveQrCode} className="flex-1 py-1.5 rounded-xl border text-[11px] font-medium transition-colors" style={{ background: th.btnLight, borderColor: th.btnLightBorder, color: th.btnLightText }}>
                    {t.saveQR}
                  </button>
                  <button
                    type="button"
                    onClick={mkCopy(walletAddress, setCopiedAddress)}
                    className="flex-1 py-1.5 rounded-xl border text-[11px] font-medium transition-colors"
                    style={copiedAddress
                      ? { background: "#dcfce7", borderColor: "#86efac", color: "#16a34a" }
                      : { background: th.btnLight, borderColor: th.btnLightBorder, color: th.btnLightText }}
                  >
                    {copiedAddress ? t.copiedAddress : t.copyAddress}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-1.5">
              <AlertTriangle size={12} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#ef4444] leading-4">{templateReplace(tA.addressWarning, { chainName: chainName || "USDT-TRC20" })}</p>
            </div>
          </div>
          )}

          {status !== "error" && <div className="flex-1" />}
        </div>
      </div>

      <style>{`
        @keyframes successPulse {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confettiFly {
          0% { transform: rotate(var(--r,0deg)) translateY(0) scale(0); opacity: 1; }
          100% { transform: rotate(var(--r,0deg)) translateY(-44px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
