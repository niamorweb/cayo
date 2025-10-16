"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { encryptAESKey } from "@/lib/encryption_aes";
import { CheckCircle, XCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import CardDisplay from "@/components/global/card-display";

interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
}

interface PasswordStrength {
  score: number;
  checks: PasswordChecks;
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null;

  const { score, checks } = getPasswordStrength(password);
  const strengthText = score <= 2 ? "Weak" : score <= 3 ? "Medium" : "Strong";
  const strengthColor =
    score <= 2 ? "bg-red-500" : score <= 3 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength</span>
        <Badge variant={score >= 4 ? "default" : "secondary"}>
          {strengthText}
        </Badge>
      </div>
      <Progress value={(score / 5) * 100} className={`h-2 ${strengthColor}`} />

      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { key: "length", label: "8+ characters" },
          { key: "uppercase", label: "Uppercase" },
          { key: "numbers", label: "Number" },
          { key: "special", label: "Special character" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            {checks[key as keyof PasswordChecks] ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500" />
            )}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="pr-10 bg-white"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3"
        onClick={onToggleVisibility}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </Button>
    </div>
  </div>
);

export default function Page() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const auth = useAuthStore((s) => s.user);
  const router = useRouter();
  const supabase = createClient();

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  const togglePasswordVisibility = (field: "old" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const aesKey = localStorage.getItem("aes-key");

      if (!passwordsMatch) {
        setError("New passwords don't match.");
        return;
      }

      if (passwordStrength.score < 3) {
        setError("Password is not strong enough.");
        return;
      }

      if (!aesKey) {
        setError("Encryption key not found.");
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: auth.email,
          password: oldPassword,
        });

      if (signInError) {
        setError("Incorrect old password.");
        return;
      }

      const encryptedAesKey = encryptAESKey(aesKey, newPassword);

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Error updating password.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
          personal_iv: encryptedAesKey.iv,
          personal_salt: encryptedAesKey.salt,
        })
        .eq("id", data.user.id);

      if (profileError) {
        setError("Error updating profile.");
        return;
      }

      toast.success("Password updated successfully.");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardDisplay
      href={"/s/settings"}
      title="Change Password"
      description="Update your password to secure your account."
      actionBtns={
        <Button
          onClick={handleChangePassword}
          size="lg"
          disabled={
            isLoading ||
            passwordStrength.score < 3 ||
            !passwordsMatch ||
            !oldPassword
          }
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </>
          )}
        </Button>
      }
    >
      <form className="space-y-4" onSubmit={handleChangePassword}>
        <PasswordInput
          id="old-password"
          label="Current Password"
          value={oldPassword}
          onChange={setOldPassword}
          showPassword={showPasswords.old}
          onToggleVisibility={() => togglePasswordVisibility("old")}
        />

        <PasswordInput
          id="new-password"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          showPassword={showPasswords.new}
          onToggleVisibility={() => togglePasswordVisibility("new")}
        />

        <PasswordStrengthIndicator password={newPassword} />

        <div className="space-y-2">
          <PasswordInput
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            showPassword={showPasswords.confirm}
            onToggleVisibility={() => togglePasswordVisibility("confirm")}
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Passwords don't match
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </CardDisplay>
  );
}
