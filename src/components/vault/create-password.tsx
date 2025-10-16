"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { Eye, Lock, Plus, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationStore } from "@/lib/store/organizationStore";

const encryptText = (text: any, key: any, iv: any) => {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key, "base64"), iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

const decryptText = (encryptedText: any, key: any, iv: any) => {
  const decipher = createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "base64"),
    iv
  );
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export default function PasswordFormCreate({
  setActiveModal,
  currentOrganization,
  bottomPosition,
}: any) {
  const aesKey = useAuthStore((s) => s.decryptedAesKey);
  const allOrgGroups = useOrganizationStore((s) => s.getOrganizationGroups);

  const orgGroups = currentOrganization && allOrgGroups(currentOrganization.id);

  const [showPassword, setShowPassword] = useState<any>(false);
  const [form, setForm] = useState<any>({
    name: "",
    username: "",
    password: "",
    url: "",
    note: "",
    group_id: "null",
  });

  const generatePassword = () => {
    const length = Math.floor(Math.random() * 5) + 14; // 14 à 18
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setForm({ ...form, password });
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let finalAesKey = aesKey;
    if (currentOrganization)
      finalAesKey = currentOrganization.decrypted_aes_key;

    const iv = randomBytes(16);
    const ivArray = Array.from(iv);

    const encryptedData = {
      name: encryptText(form.name, finalAesKey, iv),
      username: encryptText(form.username, finalAesKey, iv),
      password: encryptText(form.password, finalAesKey, iv),
      url: encryptText(form.url, finalAesKey, iv),
      note: encryptText(form.note, finalAesKey, iv),
      iv: ivArray,
      organization: currentOrganization ? currentOrganization.id : null,
      group_id: currentOrganization
        ? form.group_id === "null"
          ? null
          : form.group_id
        : null,
    };

    const supabase = createClient();
    const { data: itemCreated } = await supabase
      .from("passwords")
      .insert([encryptedData]);

    const dataDecrypted = {
      name: decryptText(encryptedData.name, finalAesKey, iv),
      username: decryptText(encryptedData.username, finalAesKey, iv),
      password: decryptText(encryptedData.password, finalAesKey, iv),
      url: decryptText(encryptedData.url, finalAesKey, iv),
      note: decryptText(encryptedData.note, finalAesKey, iv),
    };

    setForm({
      name: "",
      username: "",
      password: "",
      url: "",
      note: "",
    });
    toast.success("Credential created !");

    setActiveModal(null);
    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
  };

  return (
    <Dialog>
      <DialogTrigger>
        {bottomPosition === "list-pw-bottom" ? (
          <button className="w-full text-primary flex justify-center items-center gap-3 rounded-lg duration-150 outline outline-neutral-100 hover:bg-primary/5 px-5 py-4 ">
            Create a new credential
            <Plus className="size-6 stroke-[1px]" />
          </button>
        ) : (
          <Button>
            <Plus /> New credential
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[470px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="!text-3xl text-left">
              Create a new credential
            </DialogTitle>
            <DialogDescription>
              Fill in the fields to save your new password securely.
            </DialogDescription>
          </DialogHeader>

          {[
            "name",
            "username",
            "password",
            "url",
            "note",
            ...(currentOrganization ? ["access"] : []),
          ].map((field: any) => (
            <div key={field} className="flex items-center gap-2">
              <Label className="w-2/5 capitalize" htmlFor={field}>
                {field}
              </Label>
              <div className="w-3/5 rounded-lg relative h-fit bg-neutral-50">
                {field === "note" ? (
                  <Textarea
                    id={field}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    placeholder="Empty"
                  />
                ) : field === "access" ? (
                  <Select
                    value={form.access}
                    onValueChange={(value) => {
                      setForm({ ...form, group_id: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
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
                ) : field === "password" ? (
                  <div className="relative w-full h-full">
                    <Input
                      id={field}
                      name={field}
                      type={showPassword ? "text" : "password"}
                      onChange={handleChange}
                      value={form[field]}
                      placeholder="Empty"
                    />

                    <div
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                      className="z-10 cursor-pointer absolute right-10 top-1/2 -translate-y-1/2 p-2 duration-150 hover:bg-blue-500/10 rounded-sm"
                    >
                      <Eye className="size-5 text-black/85" />
                    </div>
                    <div
                      onClick={() => {
                        generatePassword();
                      }}
                      className="z-10 cursor-pointer absolute right-1 top-1/2 -translate-y-1/2 p-2 duration-150 hover:bg-blue-500/10 rounded-sm"
                    >
                      <RefreshCcw className="size-5 text-black/85" />
                    </div>
                  </div>
                ) : (
                  <Input
                    id={field}
                    name={field}
                    type={field === "password" ? "password" : "text"}
                    onChange={handleChange}
                    value={form[field]}
                    placeholder="Empty"
                  />
                )}
              </div>
            </div>
          ))}
          <DialogFooter>
            <Button disabled={form.name.length < 1} type="submit">
              Save Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
