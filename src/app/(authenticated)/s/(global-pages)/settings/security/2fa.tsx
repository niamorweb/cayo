// components/Enable2FA.tsx
import { useState } from "react";
import QRCode from "qrcode";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";

export const Enable2FA = () => {
  const [step, setStep] = useState<"init" | "scan" | "verify">("init");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const { enrollMFA, verifyEnrollment } = useMFA();

  const startEnrollment = async () => {
    const { data, error } = await enrollMFA();

    if (data) {
      setFactorId(data.id);
      setSecret(data.totp.secret);
      const qrCodeUrl = await QRCode.toDataURL(data.totp.uri);
      setQrCode(qrCodeUrl);
      setStep("scan");
    }
  };

  const completeEnrollment = async () => {
    const { data, error } = await verifyEnrollment(factorId, code);

    if (!error) {
      setStep("init");
      // 2FA activé
    }
  };

  return (
    <div>
      {step === "init" && (
        <Button onClick={startEnrollment}>
          Activer l'authentification à double facteur
        </Button>
      )}

      {step === "scan" && (
        <div>
          <h3>Scannez ce QR code avec votre app d'authentification</h3>
          <img src={qrCode} alt="QR Code 2FA" />
          <p>Secret: {secret}</p>
          <Button onClick={() => setStep("verify")}>J'ai scanné le code</Button>
        </div>
      )}

      {step === "verify" && (
        <div>
          <h3>Entrez le code généré par votre app</h3>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
          />
          <Button onClick={completeEnrollment}>
            Valider et activer le 2FA
          </Button>
        </div>
      )}
    </div>
  );
};
