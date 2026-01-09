"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  KeyRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createClient } from "@/lib/supabase/client";
import { encryptAESKey } from "@/lib/encryption_aes";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { cn } from "@/lib/utils";

// --- ZOD SCHEMA ---
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// --- COMPOSANT INDICATEUR DE FORCE ---
const PasswordStrength = ({ password }: { password: string }) => {
  const checks = [
    { label: "8+ chars", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Special", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.valid).length;
  const strength = score < 3 ? "Weak" : score < 5 ? "Medium" : "Strong";
  const color =
    score < 3 ? "bg-red-500" : score < 5 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-3 mt-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold uppercase text-neutral-500">
          Security Strength
        </span>
        <span
          className={cn(
            "text-xs font-bold",
            score < 3
              ? "text-red-600"
              : score < 5
              ? "text-yellow-600"
              : "text-green-600"
          )}
        >
          {strength}
        </span>
      </div>
      <Progress
        value={(score / 5) * 100}
        className={cn("h-1.5", "[&>div]:transition-all [&>div]:duration-500")}
        //@ts-ignore
        indicatorClassName={color}
      />

      <div className="grid grid-cols-2 gap-2 pt-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-xs text-neutral-600"
          >
            {check.valid ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-neutral-300" />
            )}
            <span className={cn(check.valid && "text-neutral-900 font-medium")}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SecurityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const { user: auth, decryptedAesKey } = useAuthStore();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);

    if (!auth?.email || !decryptedAesKey) {
      toast.error("Session invalid. Please refresh.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verify Old Password (via SignIn)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: auth.email,
        password: values.oldPassword,
      });

      if (signInError) {
        form.setError("oldPassword", { message: "Incorrect password" });
        setIsLoading(false);
        return;
      }

      // 2. Re-Encrypt Master AES Key with NEW Password
      const encryptedAesKey = encryptAESKey(
        decryptedAesKey,
        values.newPassword
      );

      // 3. Update Auth User (Supabase Auth)
      const { error: updateAuthError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateAuthError) throw new Error(updateAuthError.message);

      // 4. Update Profile (Database) with new encrypted key blob
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
          personal_iv: encryptedAesKey.iv,
          personal_salt: encryptedAesKey.salt,
        })
        .eq("id", auth.id);

      if (updateProfileError)
        throw new Error("Failed to update vault security");

      toast.success("Password updated successfully");
      form.reset();

      // Optional: Force logout or redirect
      // router.push("/login");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* --- HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Security & Authentication
        </h2>
        <p className="text-sm text-neutral-500">
          Update your password to ensure your vault remains secure.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: FORM --- */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Old Password */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <KeyRound className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Current Credentials
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Required to decrypt your vault before changing keys.
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showOld ? "text" : "password"}
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOld(!showOld)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* New Password */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      New Credentials
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Choose a strong, unique password.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showNew ? "text" : "password"}
                              {...field}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                              {showNew ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        {/* Real-time Strength Indicator */}
                        <PasswordStrength password={field.value} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type={showNew ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading || !form.formState.isValid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* --- RIGHT COLUMN: INFO --- */}
        <div className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">
              Zero-Knowledge Architecture
            </AlertTitle>
            <AlertDescription className="text-amber-800/80 text-xs mt-2 leading-relaxed">
              Unlike traditional apps, we don't just update a hash in a
              database.
              <br />
              <br />
              <strong>Why is the old password needed?</strong>
              <br />
              We use your old password to decrypt your Master AES Key in memory.
              Then, we re-encrypt that key with your NEW password.
              <br />
              <br />
              If you lose your password, we cannot recover your data.
            </AlertDescription>
          </Alert>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <h4 className="font-semibold text-sm text-neutral-900 mb-4">
              Security Checklist
            </h4>
            <ul className="space-y-3">
              {[
                "Use at least 12 characters",
                "Combine letters, numbers & symbols",
                "Don't reuse passwords from other sites",
                "Use a passphrase (e.g. CorrectHorseBatteryStaple)",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-neutral-500"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
