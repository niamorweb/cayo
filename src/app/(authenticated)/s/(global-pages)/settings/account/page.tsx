"use client";

import React from "react";
import { Mail, User, Trash2, AlertTriangle, Fingerprint } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function AccountPage() {
  const auth = useAuthStore((s) => s.user);

  const handleCopyId = () => {
    if (auth?.id) {
      navigator.clipboard.writeText(auth.id);
      toast.success("User ID copied");
    }
  };

  if (!auth) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-500">
        Loading account details...
      </div>
    );
  }

  // Génération des initiales pour l'avatar
  const initials = auth.email?.substring(0, 2).toUpperCase() || "ME";

  return (
    <div className="space-y-8">
      {/* --- SECTION HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Personal Information
        </h2>
        <p className="text-sm text-neutral-500">
          Manage your identification details and personal preferences.
        </p>
      </div>

      <Separator />

      {/* --- PROFILE CARD --- */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Avatar Block */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="w-24 h-24 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-2xl font-bold text-neutral-400">
              {initials}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              disabled
            >
              Change Avatar
            </Button>
          </div>

          {/* Fields Block */}
          <div className="flex-1 space-y-6 max-w-lg">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold text-neutral-500 uppercase tracking-wider"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  id="email"
                  value={auth.email ?? ""}
                  disabled
                  className="pl-10 bg-neutral-50/50 border-neutral-200 text-neutral-600 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Your email is managed by your authentication provider and cannot
                be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="uid"
                className="text-xs font-semibold text-neutral-500 uppercase tracking-wider"
              >
                User ID
              </Label>
              <div className="relative group">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  id="uid"
                  value={auth.id}
                  readOnly
                  className="pl-10 bg-neutral-50/50 border-neutral-200 font-mono text-xs text-neutral-500"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyId}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs text-neutral-400 hover:text-neutral-900"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="border border-red-100 bg-red-50/30 rounded-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-base font-semibold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-red-700/80 mt-1 max-w-2xl">
            Permanently delete your account and all of your content. This action
            is not reversible, so please continue with caution.
          </p>
        </div>
        <div className="bg-red-50 px-6 py-4 border-t border-red-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-red-600 font-medium">
            Want to leave us?
          </span>
          <Button
            variant="destructive"
            className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm transition-all"
            onClick={() =>
              (window.location.href =
                "mailto:niamorweb@gmail.com?subject=Delete%20Account%20Request")
            }
          >
            <Trash2 className="w-4 h-4 mr-2" /> Request Account Deletion
          </Button>
        </div>
      </div>
    </div>
  );
}
