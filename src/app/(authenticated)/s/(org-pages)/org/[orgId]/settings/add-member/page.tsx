"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeClosed, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { encryptAESKey, generateAESKey } from "@/lib/encryption_aes";
import {
  bufferToBase64,
  encryptWithAes,
  encryptWithRsaPublicKey,
  exportKeyToBase64,
  generateRsaKeyPair,
  importAesKeyFromBase64,
} from "@/lib/encryption/rsa";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import BackButton from "../back-button";
import CardDisplay from "@/components/global/card-display";

export default function Page() {
  const pathname = usePathname();
  const orgId = pathname.split("/")[3];

  const [inviteEmail, setInviteEmail] = useState("");
  const [createUserData, setCreateUserData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTab, setCurrentTab] = useState<"invite" | "create">("invite");

  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !currentOrganization) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      const userResponse = await fetch(`/api/org/${orgId}/invite-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!userResponse.ok) {
        toast.error("User not found");
        return;
      }

      const { id: userId, public_key } = await userResponse.json();

      const encryptedAesKey = await encryptWithRsaPublicKey(
        currentOrganization.decrypted_aes_key,
        public_key
      );

      const { error } = await supabase.from("organizations_members").insert({
        organization_id: orgId,
        user_id: userId,
        role: "user",
        has_accepted: false,
        encrypted_aes_key: encryptedAesKey,
      });

      if (error) {
        toast.error("An error has occurred");
        console.error("Error inviting member:", error);
      } else {
        setInviteEmail("");
        toast.success("Invitation sent!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) return;

    setIsLoading(true);

    try {
      const aesKeyBase64 = generateAESKey();
      const encryptedAesKey = encryptAESKey(
        aesKeyBase64,
        createUserData.password
      );

      const aesKey = await importAesKeyFromBase64(aesKeyBase64);
      const keyPair = await generateRsaKeyPair();
      const publicKeyBase64 = await exportKeyToBase64(
        keyPair.publicKey,
        "spki"
      );
      const privateKeyBuffer = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      const { cipher, iv } = await encryptWithAes(privateKeyBuffer, aesKey);

      const profileData = {
        personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
        personal_iv: encryptedAesKey.iv,
        personal_salt: encryptedAesKey.salt,
        rsa_public_key: publicKeyBase64,
        iv_rsa_private_key: bufferToBase64(iv),
        encrypted_rsa_private_key: bufferToBase64(cipher),
      };

      const encryptedOrgAesKey = await encryptWithRsaPublicKey(
        currentOrganization.decrypted_aes_key,
        publicKeyBase64
      );

      const newOrgMemberData = {
        organization_id: orgId,
        role: "user",
        has_accepted: false,
        encrypted_aes_key: encryptedOrgAesKey,
      };

      const response = await fetch(`/api/org/${orgId}/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCredential: createUserData,
          profileData,
          newOrgMemberData,
        }),
      });

      if (!response.ok) {
        toast.error("Error creating user");
        return;
      }

      setCreateUserData({ email: "", password: "" });
      toast.success("User successfully created and added to the organization!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardDisplay
      href={"/s/org/" + orgId + "/settings"}
      title="Add members"
      description="Add new members to your organization"
      actionBtns={
        currentTab === "invite" ? (
          <Button
            onClick={inviteMember}
            disabled={!inviteEmail.trim() || isLoading}
            size="lg"
          >
            {isLoading ? "Sending..." : "Send invitation"}
          </Button>
        ) : (
          <div className="mt-6 flex w-full justify-end items-center gap-3">
            <Button
              onClick={createUser}
              disabled={
                !createUserData.email || !createUserData.password || isLoading
              }
              size="lg"
            >
              {isLoading ? "Creating..." : "Create and add this user"}
            </Button>
          </div>
        )
      }
    >
      <div className="flex items-center w-full gap-3 mb-6">
        <Button
          onClick={() => setCurrentTab("invite")}
          className={currentTab === "invite" ? "bg-neutral-100" : ""}
          variant={currentTab === "invite" ? "outline" : "ghost"}
          size="lg"
        >
          Invite someone
        </Button>
        <Button
          onClick={() => setCurrentTab("create")}
          className={currentTab === "create" ? "bg-neutral-100" : ""}
          variant={currentTab === "create" ? "outline" : "ghost"}
          size="lg"
        >
          Create a user
        </Button>
      </div>

      {currentTab === "invite" ? (
        <div className="flex w-full flex-col gap-2">
          <Label>Email address</Label>
          <Input
            type="email"
            placeholder="Enter an email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <Label>Email address</Label>
            <Input
              type="email"
              placeholder="Enter an email address"
              value={createUserData.email}
              onChange={(e) =>
                setCreateUserData({
                  ...createUserData,
                  email: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label>Password</Label>
            <div className="relative">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                variant="ghost"
                size="icon"
              >
                {showPassword ? <EyeClosed /> : <Eye />}
              </Button>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter a secure password"
                value={createUserData.password}
                onChange={(e) =>
                  setCreateUserData({
                    ...createUserData,
                    password: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </CardDisplay>
  );
}
