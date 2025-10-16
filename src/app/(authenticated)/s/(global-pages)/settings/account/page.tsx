"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/useAuthStore";
import CardDisplay from "@/components/global/card-display";

export default function Page() {
  const auth = useAuthStore((s) => s.user);

  return (
    <CardDisplay
      href={"/s/settings"}
      title="Account"
      description="Find here all your account informations and preferences."
    >
      <div className="flex flex-col gap-3">
        <div className="mt-6">
          <Label htmlFor="current-email">Your email address</Label>
          <div className="relative">
            <Input
              disabled
              id="current-email"
              value={auth.email}
              required
              className="pr-10"
            />
          </div>
        </div>
        <p className="text-red-600 text-sm text-center mt-6">
          To delete your account, please contact{" "}
          <strong>niamorweb@gmail.com</strong>
        </p>{" "}
      </div>
    </CardDisplay>
  );
}
