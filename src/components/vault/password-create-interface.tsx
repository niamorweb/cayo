"use client";
import { ArrowLeft, Eye, Globe, Lock } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { randomBytes } from "crypto";
import { encryptText } from "@/lib/encryption/text";
import { Label } from "@/components/ui/label";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Separator } from "@/components/ui/separator";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationStore } from "@/lib/store/organizationStore";

export default function CreatePasswordInterface({
  currentOrganization,
  setDisplayMode,
}: any) {
  const [passwordData, setPasswordData] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    note: "",
    group_id: "null",
  });
  const aesKey = useAuthStore((s) => s.decryptedAesKey);

  const allOrgGroups = useOrganizationStore((s) => s.getOrganizationGroups);

  const orgGroups = currentOrganization && allOrgGroups(currentOrganization.id);

  const handleInputChange = (field: string, value: string) => {
    setPasswordData({
      ...passwordData,
      [field]: value,
    });
  };

  const handleCancel = () => {
    setPasswordData({
      name: "",
      username: "",
      password: "",
      url: "",
      note: "",
      group_id: "null",
    });
    setDisplayMode("none");
  };

  const handleSave = async (e: any) => {
    e.preventDefault();

    const supabase = createClient();

    if (!passwordData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    let finalAesKey = aesKey;
    if (currentOrganization)
      finalAesKey = currentOrganization.decrypted_aes_key;

    const iv = randomBytes(16);
    const ivArray = Array.from(iv);

    const encryptedData = {
      name: encryptText(passwordData.name, finalAesKey, iv),
      username: encryptText(passwordData.username, finalAesKey, iv),
      password: encryptText(passwordData.password, finalAesKey, iv),
      url: encryptText(passwordData.url, finalAesKey, iv),
      note: encryptText(passwordData.note, finalAesKey, iv),
      iv: ivArray,
      organization: currentOrganization ? currentOrganization.id : null,
      group_id: currentOrganization
        ? passwordData.group_id === "null"
          ? null
          : passwordData.group_id
        : null,
    };

    const { data: itemCreated, error: itemCreate } = await supabase
      .from("passwords")
      .insert([encryptedData]);

    if (!itemCreate) {
      await fetchAndStorePasswordsAndFolders(true);
      await fetchAndDecryptOrganizations(true);
      toast.success("Credential created!");
      setDisplayMode("none");
    } else {
      toast.error("Failed to create credential");
    }
  };

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    handleInputChange("password", password);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full flex flex-1 justify-center bg-neutral-100 md:w-3/5 md:relative p-4 md:p-8">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="flex items-center justify-between md:justify-end gap-2">
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="md:hidden mr-auto"
          >
            <ArrowLeft /> Back
          </Button>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="bg-neutral-50 rounded-md border border-black/10 h-16 w-16 flex items-center justify-center">
            <Globe className="size-8" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <input
              autoFocus
              placeholder="Enter credential name"
              className="text-xl py-1 rounded-lg w-full !outline-none bg-neutral-100 px-2"
              value={passwordData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              type="text"
            />
            <Separator />
            <p className="text-sm text-neutral-500">New credential</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 flex w-full flex-col gap-2">
          <div className="grid grid-cols-5 w-full">
            <Label className="col-span-2">Username</Label>
            <div className="relative col-span-3">
              <input
                placeholder="Enter username"
                className="p-2 text-sm rounded-lg w-full !outline-none bg-neutral-100"
                value={passwordData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                type="text"
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 w-full">
            <Label className="col-span-2">Password</Label>
            <div className="relative col-span-3 flex items-center gap-2">
              <input
                placeholder="Enter password"
                className="p-2 rounded-lg w-full text-sm !outline-none bg-neutral-100"
                value={passwordData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                type="text"
              />
              <Button
                onClick={generatePassword}
                variant="outline"
                size="sm"
                type="button"
              >
                Generate
              </Button>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 w-full">
            <Label className="col-span-2">Website URL</Label>
            <div className="relative col-span-3">
              <input
                className="p-2 text-sm rounded-lg w-full !outline-none bg-neutral-100"
                type="text"
                placeholder="https://example.com"
                value={passwordData.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-4">
          <Label>Notes</Label>
          <textarea
            placeholder="Add notes"
            className="rounded-lg text-sm w-full !outline-none bg-neutral-100 p-2 min-h-[100px]"
            value={passwordData.note}
            onChange={(e) => handleInputChange("note", e.target.value)}
          />
        </div>
        {currentOrganization && (
          <div className="bg-white border border-border rounded-xl p-4 grid grid-cols-5 w-full gap-4">
            <Label className="col-span-2">Access</Label>
            <Select
              value={passwordData.group_id}
              onValueChange={(value) => {
                setPasswordData({ ...passwordData, group_id: value });
              }}
            >
              <SelectTrigger className="col-span-3 w-full">
                <SelectValue defaultValue="null" placeholder="Everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="null">
                    <Eye /> Everyone
                  </SelectItem>
                  {orgGroups &&
                    orgGroups.map((x: any, i: any) => (
                      <SelectItem value={x.id}>
                        <Lock /> {x.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className=" w-full grid grid-cols-2 gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="rounded-xl p-4 h-12 "
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-xl p-4 h-12">
            Create credential
          </Button>
        </div>
      </div>
    </div>
  );
}
