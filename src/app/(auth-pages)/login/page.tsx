"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decryptAESKey } from "@/lib/encryption_aes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Eye, EyeClosed } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"login-form" | "login-otp">("login-form");
  const [otpValue, setOtpValue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const setDecryptedAesKey = useAuthStore((state) => state.setDecryptedAesKey);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [factorId, setFactorId] = useState<string>("");

  async function verifyOTP() {
    setErrorMessage("");
    const { data: mfaData, error: mfaError } =
      await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: otpValue,
      });

    if (mfaError) {
      setOtpValue("");
      setErrorMessage("OTP code invalid");
      return;
    }

    setErrorMessage("");
    await completeLogin(mfaData.user);
  }

  async function completeLogin(user: any) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id);

    const profile = profileData && profileData[0];

    const decryptedAeskey = decryptAESKey(
      profile.personal_aes_encrypted_key,
      profile.personal_iv,
      profile.personal_salt,
      password
    );

    setUser(user);
    setProfile(profile);
    setDecryptedAesKey(decryptedAeskey);

    localStorage.setItem("aes-key", decryptedAeskey);
    router.push("/start");
  }

  async function signInWithEmail(e: any) {
    setIsLoading(true);
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error?.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const factors = data.user.factors?.filter((f) => f.status === "verified");

      // if (factors && factors.length > 0) {
      //   setFactorId(factors[0].id);
      //   setStep("login-otp");
      //   return;
      // }

      await completeLogin(data.user);
    }
  }

  // async function signInWithEmail(e: any) {
  //   e.preventDefault();
  //   const { data, error } = await supabase.auth.signInWithPassword({
  //     email,
  //     password,
  //   });

  //   if (data.user) {
  //     console.log("data.user ::: ", data.user);

  //     const factors = data.user.factors?.filter((f) => f.status === "verified");

  //     if (factors && factors.length > 0) {
  //       setStep("login-otp");

  //       const mfaCode = prompt("Entrez votre code d'authentification:");
  //       if (mfaCode) {
  //         const { data: mfaData, error: mfaError } =
  //           await supabase.auth.mfa.challengeAndVerify({
  //             factorId: factors[0].id,
  //             code: mfaCode,
  //           });

  //         if (mfaError) {
  //           alert("Code MFA invalide");
  //           return;
  //         }
  //       } else {
  //         return;
  //       }
  //     }
  //   }

  //   if (data.user) {
  //     const { data: profileData, error: profileError } = await supabase
  //       .from("profiles")
  //       .select("*")
  //       .eq("id", data.user.id);

  //     const profile = profileData && profileData[0];

  //     const decryptedAeskey = decryptAESKey(
  //       profile.personal_aes_encrypted_key,
  //       profile.personal_iv,
  //       profile.personal_salt,
  //       password
  //     );

  //     setUser(data.user);
  //     setProfile(profile);
  //     setDecryptedAesKey(decryptedAeskey);

  //     localStorage.setItem("aes-key", decryptedAeskey);
  //     router.push("/start");
  //   }
  // }

  return (
    <section className="bg-neutral-100 overflow-hidden px-5 relative w-full flex items-center justify-center">
      <div className="container h-screen py-12 md:py-32 relative z-10 flex justify-center items-center">
        {step === "login-form" && (
          <div className="p-6 max-w-[450px] rounded-md border-neutral-50/10 w-full z-10 text-neutral-800 bg-white ">
            <span className="w-fit text-left text-3xl md:text-4xl font-semibold tracking-tighter ">
              Login to your account
            </span>

            <form className="flex flex-col mt-6">
              <div className="flex flex-col gap-2 mb-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter an email address"
                  className="h-11 "
                  required
                />
              </div>
              <div className="flex flex-col gap-2 mb-6">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    name="password"
                    id="password"
                    value={password}
                    placeholder="Enter a password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    required
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute p-2 hover:bg-neutral-50/10 rounded-sm  right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeClosed className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                disabled={isLoading || !email.trim() || !password.trim()}
                onClick={(e) => signInWithEmail(e)}
                type="submit"
                size="lg"
                className="h-11"
              >
                Login
              </Button>
              <div className="mt-6 text-neutral-700">
                <span className="text-sm">
                  Don't have an account ?{" "}
                  <Button variant="link" asChild>
                    <Link
                      className="underline underline-offset-2 duration-150 hover:underline"
                      href="/signup"
                    >
                      Create an account
                    </Link>
                  </Button>
                </span>
              </div>
            </form>
          </div>
        )}

        {step === "login-otp" && (
          <div className="p-6 max-w-[450px] rounded-md border-neutral-50/10 w-full z-10 text-white bg-neutral-50/5">
            <h3 className="w-fit text-left mb-8 ">
              Enter the code from your authenticator app
            </h3>

            <InputOTP
              value={otpValue}
              onChange={(e) => setOtpValue(e)}
              className="w-full"
              maxLength={6}
            >
              <InputOTPGroup>
                <InputOTPSlot
                  className="border-neutral-50/20 text-lg size-12"
                  index={0}
                />
                <InputOTPSlot
                  className="border-neutral-50/20 text-lg size-12"
                  index={1}
                />
                <InputOTPSlot
                  className="border-neutral-50/20 text-lg size-12"
                  index={2}
                />
              </InputOTPGroup>
              <InputOTPSeparator className="" />
              <InputOTPGroup>
                <InputOTPSlot
                  className="border-neutral-50/20 text-lg size-12"
                  index={3}
                />
                <InputOTPSlot
                  className="border-neutral-50/20 text-lg size-12"
                  index={4}
                />
                <InputOTPSlot
                  className="border-neutral-50/20 text-lg size-12"
                  index={5}
                />
              </InputOTPGroup>
            </InputOTP>
            {errorMessage && <p className="mt-2">{errorMessage}</p>}
            <div className="flex justify-end mt-6">
              <Button
                onClick={verifyOTP}
                disabled={otpValue.length !== 6}
                className=""
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
