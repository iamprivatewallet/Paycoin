import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, Loader2, Globe, ChevronDown, Check, Zap, AlertTriangle, CircleDollarSign, Copy, ExternalLink, CircleX, CloudOff } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { queryOrder, QueryOrderResponse } from "../../services/index"
import { formatTime, remainingSeconds, formatDuration, remainingSecondsWithFormat } from "../../utils/TimeUtils"
import { templateReplace, isValidString, cutNumberStr } from "../../utils/StringUtils"
import Loading from "../../svg/Loading.svg";

type PaymentStatus = 'pending' | 'confirming' | 'completed' | 'error';
type Language = 'zh_CN' | 'zh_HK' | 'en_US' | 'ja_JP' | 'ko_KR' | 'es_ES' | 'tr_TR' | 'de_DE' | 'fr_FR';

const translations = {
  'zh_CN': {
    paymentInfo: "支付信息",
    pending: "等待支付",
    confirming: "支付确认中",
    completed: "支付完成",
    orderId: "订单号",
    copy: "复制",
    expireTime: "订单有效时间",
    timeLeft: "剩余",
    currency: "支付币种",
    paymentAddress: "收款地址",
    amount: "支付金额",
    network: "支付网络",
    address: "转账地址",
    networkAlert: "请务必使用",
    networkAlertSuffix: "网络",
    clickToCopy: "点击复制地址",
    onlySupport: "仅支持",
    onlySupportSuffix: "充值",
    paymentSuccess: "支付成功",
    paymentError: "支付失败",
    depositConfirmed: "您的充值已到账",
    note: "注意:",
    note1: "请在有效时间内完成支付;",
    note2: "收款地址随时变化，请务保存收款信息;",
    note3: "请仔细核对充值金额;",
    note4: "转账完成后请耐心等待区块确认。",
    contactSupport: "有任何疑问，请随时联系在线支持!",
    copied: "已复制",
    min: "分",
    sec: "秒",
    payNow: "立即充值",
    amountWarning: "请确保扣除矿工费后，实际到账金额与上述金额相等。",
    addressWarning: "此二维码仅限一次付款，重复付款将无法入账，请确保转账网络为{chainName}，否则资产可能永久丢失。",
    exchangeRate: "汇率:",
    hash: "交易哈希",
    lookTransaction: "查看交易"
  },
  'zh_HK': {
    paymentInfo: "支付資訊",
    pending: "等待支付",
    confirming: "支付確認中",
    completed: "支付完成",
    orderId: "訂單號",
    copy: "複製",
    expireTime: "訂單有效時間",
    timeLeft: "剩餘",
    currency: "支付幣種",
    paymentAddress: "收款地址",
    amount: "支付金額",
    network: "支付網絡",
    address: "轉賬地址",
    networkAlert: "請務必使用",
    networkAlertSuffix: "網���",
    clickToCopy: "點擊複製地址",
    onlySupport: "僅支持",
    onlySupportSuffix: "充值",
    paymentSuccess: "支付成功",
    paymentError: "付款失敗",
    depositConfirmed: "您的充值已到賬",
    note: "注意:",
    note1: "請在有效時間內完成支付;",
    note2: "收款地址隨時變化，請務必保存收款資訊;",
    note3: "請仔細核對充值金額;",
    note4: "轉賬完成後請耐心等待區塊確認。",
    contactSupport: "有任何疑問，請隨時聯繫在線支持!",
    copied: "已複製",
    min: "分",
    sec: "秒",
    payNow: "立即充值",
    amountWarning: "請確保扣除礦工費後，實際到賬金額與上述金額相等。",
    addressWarning: "此二維碼僅限一次付款，重複付款將無法入賬，請確保轉賬網絡為{chainName}，否則資產可能永久丟失。",
    exchangeRate: "匯率:",
    hash: "交易雜湊",
    lookTransaction: "查看交易"
  },
  'en_US': {
    paymentInfo: "Payment Info",
    pending: "Pending",
    confirming: "Confirming",
    completed: "Completed",
    orderId: "Order ID",
    copy: "Copy",
    expireTime: "Valid Until",
    timeLeft: "Time Left",
    currency: "Payment Currency",
    paymentAddress: "Payment Address",
    amount: "Amount",
    network: "Network",
    address: "Transfer Address",
    networkAlert: "Please use",
    networkAlertSuffix: "network",
    clickToCopy: "Click to copy",
    onlySupport: "Only support",
    onlySupportSuffix: "deposit",
    paymentSuccess: "Payment Successful",
    paymentError: "Payment Failed",
    depositConfirmed: "Deposit confirmed successfully",
    note: "Note:",
    note1: "Please complete payment within valid time.",
    note2: "Address changes periodically, do not save.",
    note3: "Please check the amount carefully.",
    note4: "Please wait for block confirmation.",
    contactSupport: "Any questions? Contact online support!",
    copied: "Copied",
    min: "m",
    sec: "s",
    payNow: "Pay Now",
    amountWarning: "Please ensure the actual amount received equals the above amount after deducting gas fees.",
    addressWarning: "This QR code is for one-time payment only. Repeated payments will not be credited. Please ensure the transfer network is {chainName}, otherwise assets may be lost forever.",
    exchangeRate: "Rate:",
    hash: "Tx Hash",
    lookTransaction: "View Transaction"
  },
  'ja_JP': {
    paymentInfo: "支払い情報",
    pending: "支払い待ち",
    confirming: "確認中",
    completed: "完了",
    orderId: "注文ID",
    copy: "コピー",
    expireTime: "有効期限",
    timeLeft: "残り",
    currency: "通貨",
    paymentAddress: "受取アドレス",
    amount: "金額",
    network: "ネットワーク",
    address: "アドレス",
    networkAlert: "必ず",
    networkAlertSuffix: "ネットワークを使用してください",
    clickToCopy: "クリックしてコピー",
    onlySupport: "",
    onlySupportSuffix: "のみ対応",
    paymentSuccess: "支払い成功",
    paymentError: "支払い失敗",
    depositConfirmed: "入金が確認されました",
    note: "注意:",
    note1: "有効期限内に支払いを完了してください。",
    note2: "アドレスは変更されます。保存しないでください。",
    note3: "金額をよく確認してください。",
    note4: "ブロック確認をお待ちください。",
    contactSupport: "ご不明な点は、サポートまで！",
    copied: "コピーしました",
    min: "分",
    sec: "秒",
    payNow: "今すぐ支払う",
    amountWarning: "ガス代を差し引いた後、実際の着金額が上記の金額と等しいことを確認してください。",
    addressWarning: "このQRコードは1回限りの支払いです。重複して支払うと入金されません。転送ネットワークが {chainName} であることを確認してください。そうしないと、資産が永久に失われる可能性があります。",
    exchangeRate: "レート:",
    hash: "Txハッシュ",
    lookTransaction: "トランザクションを確認"
  },
  'ko_KR': {
    paymentInfo: "결제 정보",
    pending: "결제 대기",
    confirming: "확인 중",
    completed: "완료",
    orderId: "주문 ID",
    copy: "복사",
    expireTime: "유효 시간",
    timeLeft: "남은 시간",
    currency: "통화",
    paymentAddress: "수신 주소",
    amount: "금액",
    network: "네트워크",
    address: "주소",
    networkAlert: "반드시",
    networkAlertSuffix: "네트워크를 사용하십시오",
    clickToCopy: "복사하려면 클릭",
    onlySupport: "",
    onlySupportSuffix: "입금만 지원",
    paymentSuccess: "결제 성공",
    paymentError: "결제 실패",
    depositConfirmed: "입금이 확인되었습니다",
    note: "주의:",
    note1: "유효 시간 내에 결제를 완료하십시오.",
    note2: "주소는 수시로 변경되므로 저장하지 마십시오.",
    note3: "입금 금액을 주의 깊게 확인하십시오.",
    note4: "송금 후 블록 확인을 기다려 주십시오.",
    contactSupport: "궁금한 점은 지원팀에 문의하세요!",
    copied: "복사됨",
    min: "분",
    sec: "초",
    payNow: "즉시 결제",
    amountWarning: "가스비를 공제한 후 실제 입금 금액이 위 금액과 동일한지 확인하십시오.",
    addressWarning: "이 QR 코드는 일회용 결제 전용입니다. 중복 결제는 입금되지 않습니다. 전송 네트워크가 {chainName} 인지 확인하십시오. 그렇지 않으면 자산이 영구적으로 손실될 수 있습니다.",
    exchangeRate: "환율:",
    hash: "Tx 해시",
    lookTransaction: "트랜잭션 확인"
  },
  'es_ES': {
    paymentInfo: "Información de Pago",
    pending: "Pendiente",
    confirming: "Confirmando",
    completed: "Completado",
    orderId: "ID del Pedido",
    copy: "Copiar",
    expireTime: "Válido Hasta",
    timeLeft: "Tiempo Restante",
    currency: "Moneda",
    paymentAddress: "Dirección de Pago",
    amount: "Cantidad",
    network: "Red",
    address: "Dirección",
    networkAlert: "Por favor use la red",
    networkAlertSuffix: "",
    clickToCopy: "Clic para copiar",
    onlySupport: "Solo soporta depósitos en",
    onlySupportSuffix: "",
    paymentSuccess: "Pago Exitoso",
    paymentError: "Pago fallido",
    depositConfirmed: "Depósito confirmado exitosamente",
    note: "Nota:",
    note1: "Complete el pago dentro del tiempo válido.",
    note2: "La dirección cambia periódicamente, no la guarde.",
    note3: "Verifique la cantidad cuidadosamente.",
    note4: "Espere la confirmación del bloque.",
    contactSupport: "¿Preguntas? ¡Contacte soporte en línea!",
    copied: "Copiado",
    min: "m",
    sec: "s",
    payNow: "Pagar Ahora",
    amountWarning: "Asegúrese de que el monto real recibido sea igual al monto anterior después de deducir las tarifas de gas.",
    addressWarning: "Este código QR es solo para un pago único. Los pagos repetidos no se acreditarán. Asegúrese de que la red de transferencia sea {chainName}; de lo contrario, los activos pueden perderse para siempre.",
    exchangeRate: "Tasa:",
    hash: "Hash de transacción",
    lookTransaction: "Ver transacción"
  },
  'tr_TR': {
    paymentInfo: "Ödeme Bilgileri",
    pending: "Bekliyor",
    confirming: "Onaylanıyor",
    completed: "Tamamlandı",
    orderId: "Sipariş ID",
    copy: "Kopyala",
    expireTime: "Geçerlilik Süresi",
    timeLeft: "Kalan Süre",
    currency: "Para Birimi",
    paymentAddress: "Ödeme Adresi",
    amount: "Miktar",
    network: "Ağ",
    address: "Adres",
    networkAlert: "Lütfen",
    networkAlertSuffix: "ağını kullanın",
    clickToCopy: "Kopyalamak için tıkla",
    onlySupport: "Sadece",
    onlySupportSuffix: "yatırımını destekler",
    paymentSuccess: "Ödeme Başarılı",
    paymentError: "Ödeme Başarısız",
    depositConfirmed: "Yatırımınız başarıyla onaylandı",
    note: "Not:",
    note1: "Lütfen ödemeyi geçerli süre içinde tamamlayın.",
    note2: "Adres periyodik olarak değişir, kaydetmeyin.",
    note3: "Lütfen miktarı dikkatlice kontrol edin.",
    note4: "Lütfen blok onayını bekleyin.",
    contactSupport: "Sorunuz mu var? Canlı desteğe ulaşın!",
    copied: "Kopyalandı",
    min: "dk",
    sec: "sn",
    payNow: "Hemen Öde",
    amountWarning: "Lütfen gaz ücretleri düşüldükten sonra alınan gerçek tutarın yukarıdaki tutara eşit olduğundan emin olun.",
    addressWarning: "Bu QR kodu sadece tek seferlik ödeme içindir. Tekrarlanan ödemeler hesaba geçmeyecektir. Lütfen transfer ağının {chainName} olduğundan emin olun, aksi takdirde varlıklar kalıcı olarak kaybolabilir.",
    exchangeRate: "Kur:",
    hash: "İşlem Hash",
    lookTransaction: "İşlemi Gör"
  },
  'de_DE': {
    paymentInfo: "Zahlungsinformationen",
    pending: "Ausstehend",
    confirming: "Bestätigen",
    completed: "Abgeschlossen",
    orderId: "Bestell-ID",
    copy: "Kopieren",
    expireTime: "Gültig bis",
    timeLeft: "Verbleibende Zeit",
    currency: "Währung",
    paymentAddress: "Zahlungsadresse",
    amount: "Betrag",
    network: "Netzwerk",
    address: "Adresse",
    networkAlert: "Bitte verwenden Sie das",
    networkAlertSuffix: "Netzwerk",
    clickToCopy: "Zum Kopieren klicken",
    onlySupport: "Unterstützt nur",
    onlySupportSuffix: "Einzahlung",
    paymentSuccess: "Zahlung erfolgreich",
    paymentError: "Zahlung fehlgeschlagen",
    depositConfirmed: "Einzahlung erfolgreich bestätigt",
    note: "Hinweis:",
    note1: "Bitte schließen Sie die Zahlung innerhalb der gültigen Zeit ab.",
    note2: "Adresse ändert sich regelmäßig, nicht speichern.",
    note3: "Bitte überprüfen Sie den Betrag sorgfältig.",
    note4: "Bitte warten Sie auf die Blockbestätigung.",
    contactSupport: "Fragen? Kontaktieren Sie den Online-Support!",
    copied: "Kopiert",
    min: "m",
    sec: "s",
    payNow: "Jetzt bezahlen",
    amountWarning: "Bitte stellen Sie sicher, dass der tatsächlich erhaltene Betrag nach Abzug der Gasgebühren dem oben genannten Betrag entspricht.",
    addressWarning: "Dieser QR-Code ist nur für eine einmalige Zahlung bestimmt. Wiederholte Zahlungen werden nicht gutgeschrieben. Bitte stellen Sie sicher, dass das Überweisungsnetzwerk {chainName} ist, andernfalls können Vermögenswerte für immer verloren gehen.",
    exchangeRate: "Kurs:",
    hash: "Tx-Hash",
    lookTransaction: "Transaktion anzeigen"
  },
  'fr_FR': {
    paymentInfo: "Infos de paiement",
    pending: "En attente",
    confirming: "Confirmation",
    completed: "Terminé",
    orderId: "ID Commande",
    copy: "Copier",
    expireTime: "Valable jusqu'au",
    timeLeft: "Temps restant",
    currency: "Devise",
    paymentAddress: "Adresse de paiement",
    amount: "Montant",
    network: "Réseau",
    address: "Adresse",
    networkAlert: "Veuillez utiliser le réseau",
    networkAlertSuffix: "",
    clickToCopy: "Cliquer pour copier",
    onlySupport: "Ne supporte que les dépôts en",
    onlySupportSuffix: "",
    paymentSuccess: "Paiement réussi",
    paymentError: "Échec du paiement",
    depositConfirmed: "Dépôt confirmé avec succès",
    note: "Note :",
    note1: "Veuillez compléter le paiement dans le temps imparti.",
    note2: "L'adresse change périodiquement, ne pas enregistrer.",
    note3: "Veuillez vérifier le montant soigneusement.",
    note4: "Veuillez attendre la confirmation du bloc.",
    contactSupport: "Des questions ? Contactez le support en ligne !",
    copied: "Copié",
    min: "m",
    sec: "s",
    payNow: "Payer maintenant",
    amountWarning: "Veuillez vous assurer que le montant réel reçu est égal au montant ci-dessus après déduction des frais de gaz.",
    addressWarning: "Ce code QR est pour un paiement unique seulement. Les paiements répétés ne seront pas crédités. Veuillez vous assurer que le réseau de transfert est {chainName}, sinon les actifs peuvent être perdus à jamais.",
    exchangeRate: "Taux:",
    hash: "Hash de transaction",
    lookTransaction: "Voir la transaction"
  }
};

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'zh_CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh_HK', label: '繁體中文', flag: '🇭🇰' },
  { code: 'en_US', label: 'English', flag: '🇺🇸' },
  { code: 'ja_JP', label: '日本語', flag: '🇯🇵' },
  { code: 'ko_KR', label: '한국어', flag: '🇰🇷' },
  { code: 'es_ES', label: 'Español', flag: '🇪🇸' },
  { code: 'tr_TR', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'de_DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
];

const PaymentCashier = () => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || '';
  const e = params.get('e') || '';
  const languge = params.get('language') || 'en_US';

  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [lang, setLang] = useState<Language>((languge as Language) ?? 'en_US');
  const [orderInfo, setOrderInfo] = useState<QueryOrderResponse | undefined>(undefined);
  const [isRequestData, setIsRequestData] = useState(false)
  const [orderExpiredTime, setOrderExpiredTime] = useState<number | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [errorInfo, setErrorInfo] = useState("");
  const intervalRef = useRef<number | null>(null);
  const intervalTimerRef = useRef<number | null>(null);
  const interval = 4000;

  const t = translations[lang] ?? translations['en_US'];

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
      <div className="min-h-screen bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center relative">
        <div className='column items-center justify-center' style={{ justifyItems: "center" }}>
          <CloudOff size={80} className='text-red-400' />
          <span>{errorInfo}</span>
        </div>
      </div>
    )
  } else if (orderInfo === undefined) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] text-gray-200 p-4 font-sans flex justify-center items-center relative">
        <div className='column'>
          <img src={Loading} alt="" />
        </div>
      </div>
    )
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">

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
              <div className="flex items-start justify-between text-xs pt-3 border-t border-white/5">
                <span className="text-gray-500 shrink-0 mt-[2px]">{t.paymentAddress}:</span>
                <div className="flex items-start justify-end gap-1 min-w-0 flex-1">
                  <span className="text-gray-400 font-mono break-all text-right leading-relaxed">{orderInfo?.address}</span>
                  <button
                    onClick={() => copyToClipboard(orderInfo?.address ?? "", t.paymentAddress)}
                    className="text-blue-400 hover:text-blue-300 shrink-0 mt-[2px]"
                  >
                    {/* {t.copy} */}
                    <Copy size={14} className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                  </button>
                </div>
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

            {status !== 'completed' && status !== 'error' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* QR Code Section */}
                <div className="space-y-2 text-center">
                  <div className="bg-white p-4 rounded-xl w-fit mx-auto relative group shadow-lg shadow-black/30">
                    <QRCodeSVG
                      value={orderInfo?.address ?? ""}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                    {/* Scan Hint Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl cursor-pointer"
                      onClick={() => copyToClipboard(orderInfo?.address ?? "", t.address)}>
                      <span className="text-black font-medium text-sm">{t.clickToCopy}</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500">
                    {t.onlySupport} <span className="text-gray-300 font-medium">{orderInfo?.tokenName}</span> {t.onlySupportSuffix}
                  </p>
                </div>

                {/* Address Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-gray-400 text-sm">{t.address}:</span>
                  </div>

                  <div className="bg-zinc-900 relative p-2 rounded flex items-start justify-between gap-1 items-center min-w-0 flex-1">
                    <span className="text-gray-400 font-mono break-all leading-relaxed">{orderInfo?.address}</span>
                    <button
                      onClick={() => copyToClipboard(orderInfo?.address ?? "", t.address)}
                      className="text-blue-400 hover:text-blue-300 shrink-0 mt-[5px]"
                    >
                      {/* {t.copy} */}
                      <Copy size={14} className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                    </button>
                  </div>

                  {/* Address Warning */}
                  <div className="text-xs text-yellow-500/80 flex items-start gap-2 mt-2 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-[1px]" />
                    <span className="leading-relaxed">{templateReplace(t.addressWarning, { chainName: orderInfo?.chainName ?? "" })}</span>
                  </div>
                </div>

                {/* Pay Now Button */}
                {/* <button 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                  onClick={() => {
                    toast.info(t.payNow + "...");
                  }}
                >
                  <Zap size={20} fill="currentColor" />
                  {t.payNow}
                </button> */}
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
