"use client";
import { Button } from "@/components/ui/button";
import { Send, Copy } from "lucide-react";
import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { encryptAESKey, generateAESKey } from "@/lib/encryption/aes";
import { createClient } from "@/lib/supabase/client";
import { encryptText } from "@/lib/encryption/text";
import { toast } from "sonner";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";

export default function SharePassword({
  currentOrganization,
  selectedPassword,
}: any) {
  const { fetchSecureSends } = useSecureSendStore();
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUsed, setIsUsed] = useState(false);

  const originalAesKey = useAuthStore((s) => s.decryptedAesKey);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied !");
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Copied !");
    }
  };

  const generateSecureSend = async () => {
    setIsLoading(true);
    const supabase = await createClient();
    const aesKeyItem = await generateAESKey();

    const encryptedAesKey = encryptAESKey(aesKeyItem, originalAesKey);
    const iv = Buffer.from(encryptedAesKey.iv, "base64");

    const encryptedData = {
      name: encryptText(selectedPassword.name, aesKeyItem, iv),
      username: encryptText(selectedPassword.username, aesKeyItem, iv),
      password: encryptText(selectedPassword.password, aesKeyItem, iv),
      website_url: encryptText(selectedPassword.url, aesKeyItem, iv),
      note: encryptText(selectedPassword.note, aesKeyItem, iv),
      iv: encryptedAesKey.iv,
      salt: encryptedAesKey.salt,
      encrypted_aes_key: encryptedAesKey.encryptedKey,
      type: "credential",
    };

    const { data, error } = await supabase
      .from("secure_send")
      .insert(encryptedData)
      .select();

    if (!error)
      setGeneratedLink(
        `${window.location.origin}/secure-send/${data[0].id}#${aesKeyItem}`
      );
    setIsUsed(true);
    setIsLoading(false);
    fetchSecureSends();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={isLoading || isUsed}
        onClick={() => generateSecureSend()}
        variant="outline"
      >
        <Send />
        {isLoading ? <span>Generating..</span> : <span>Secure share</span>}
      </Button>
      {generatedLink && (
        <Button onClick={() => copyToClipboard(generatedLink)}>
          <Copy />
          <span>Copy generated link</span>
        </Button>
      )}
    </div>
  );
}
