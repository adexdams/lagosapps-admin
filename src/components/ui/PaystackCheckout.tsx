import { useState } from "react";
import Button from "./Button";

const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

interface PaystackCheckoutProps {
  amount: number;
  email: string;
  description: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

export default function PaystackCheckout({ amount, email, description, onSuccess, onCancel }: PaystackCheckoutProps) {
  const [step, setStep] = useState<"summary" | "card" | "processing" | "success">("summary");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const reference = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const handlePay = () => {
    if (!cardNumber || !expiry || !cvv) return;
    setLoading(true);
    setStep("processing");
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 2500);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Paystack header */}
        <div className="bg-[#0A2540] px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-[#00C3F7]/20 flex items-center justify-center">
              <span className="text-[#00C3F7] font-extrabold text-sm">P</span>
            </div>
            <span className="text-white font-bold text-sm">Paystack</span>
          </div>
          {step !== "processing" && step !== "success" && (
            <button onClick={onCancel} className="text-white/60 hover:text-white cursor-pointer text-sm">
              Cancel
            </button>
          )}
        </div>

        {/* Summary step */}
        {step === "summary" && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm text-on-surface-variant">{email}</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-on-surface">{formatNaira(amount)}</p>
              <p className="text-sm text-on-surface-variant">{description}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setStep("card")}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-outline-variant/15 cursor-pointer hover:border-[#0A2540] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[22px] text-[#0A2540]">credit_card</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">Pay with Card</p>
                  <p className="text-xs text-on-surface-variant">Visa, Mastercard, Verve</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </button>
              <button className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-outline-variant/15 cursor-pointer hover:border-[#0A2540] transition-colors text-left opacity-50">
                <span className="material-symbols-outlined text-[22px] text-[#0A2540]">account_balance</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">Bank Transfer</p>
                  <p className="text-xs text-on-surface-variant">Pay from any bank app</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </button>
              <button className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-outline-variant/15 cursor-pointer hover:border-[#0A2540] transition-colors text-left opacity-50">
                <span className="material-symbols-outlined text-[22px] text-[#0A2540]">dialpad</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">USSD</p>
                  <p className="text-xs text-on-surface-variant">Dial code from your phone</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </button>
            </div>
            <p className="text-center text-xs text-on-surface-variant">Secured by <strong>Paystack</strong></p>
          </div>
        )}

        {/* Card entry step */}
        {step === "card" && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("summary")} className="text-sm text-[#0A2540] font-bold flex items-center gap-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
              </button>
              <p className="text-sm font-bold text-on-surface-variant">{formatNaira(amount)}</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Card Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full p-3 sm:p-4 text-base rounded-lg border-2 border-outline-variant/20 focus:border-[#0A2540] focus:outline-none font-mono"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Expiry</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full p-3 sm:p-4 text-base rounded-lg border-2 border-outline-variant/20 focus:border-[#0A2540] focus:outline-none font-mono"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className="w-full p-3 sm:p-4 text-base rounded-lg border-2 border-outline-variant/20 focus:border-[#0A2540] focus:outline-none font-mono"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={!cardNumber || !expiry || !cvv}
              className="w-full py-3.5 sm:py-4 rounded-xl text-white font-bold text-base cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0A2540" }}
            >
              Pay {formatNaira(amount)}
            </button>
            <p className="text-center text-xs text-on-surface-variant">Secured by <strong>Paystack</strong></p>
          </div>
        )}

        {/* Processing step */}
        {step === "processing" && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center space-y-4">
            <div className="size-14 rounded-full border-4 border-[#0A2540]/20 border-t-[#0A2540] animate-spin" />
            <p className="text-base font-bold text-on-surface">Processing payment...</p>
            <p className="text-sm text-on-surface-variant">Please do not close this window</p>
          </div>
        )}

        {/* Success step */}
        {step === "success" && !loading && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-4">
            <div className="size-16 rounded-full bg-[#1B5E20]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1B5E20] text-[36px]">check_circle</span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-on-surface">Payment Successful!</p>
              <p className="text-2xl font-extrabold text-primary">{formatNaira(amount)}</p>
              <p className="text-sm text-on-surface-variant">{description}</p>
              <p className="text-xs text-on-surface-variant mt-2">Ref: {reference}</p>
            </div>
            <Button variant="primary" className="w-full text-base" onClick={() => onSuccess(reference)}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
