"use client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Key, Plus, Send } from "lucide-react";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { encryptText } from "@/lib/encryption/text";
import { encryptAESKey, generateAESKey } from "@/lib/encryption_aes";
import { useAuthStore } from "@/lib/store/useAuthStore";
import CreateSecureNote from "./create";
import ViewSecureNote from "./view";
import SkeletonPassword from "../skeleton-password";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";
import GlobalLayoutPage from "../global/global-layout-page";
import ItemLeftDisplay from "../global/item-left-display";

interface SecureSend {
  id: string;
  name: string;
  text: string;
  type: string;
  created_at: string;
  created_at_clean: string;
  link: string;
  encrypted_aes_key: string;
  iv: string;
  salt: string;
}

// const formatFullDate = (date: string) => {
//   const d = new Date(date);
//   const day = d.getDate().toString().padStart(2, "0");
//   const month = (d.getMonth() + 1).toString().padStart(2, "0");
//   const year = d.getFullYear().toString().slice(-2);
//   const hours = d.getHours().toString().padStart(2, "0");
//   const minutes = d.getMinutes().toString().padStart(2, "0");

//   return `${day}/${month}/${year} - ${hours}:${minutes}`;
// };

export default function SecureSendPageLayout() {
  const { secureSends, isLoading, fetchSecureSends } = useSecureSendStore();

  const [activeModal, setActiveModal] = useState("");
  const [selectedSecureSend, setSelectedSecureSend] =
    useState<SecureSend | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const originalAesKey = useAuthStore((s) => s.decryptedAesKey);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Copied!");
    }
  }, []);

  const generateSecureSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const supabase = createClient();
    const aesKeyItem = generateAESKey();
    const encryptedAesKey = encryptAESKey(aesKeyItem, originalAesKey);
    const iv = Buffer.from(encryptedAesKey.iv, "base64");

    const encryptedData = {
      text: encryptText(content, aesKeyItem, iv),
      name: encryptText(title, aesKeyItem, iv),
      username: encryptText(title, aesKeyItem, iv),
      iv: encryptedAesKey.iv,
      salt: encryptedAesKey.salt,
      encrypted_aes_key: encryptedAesKey.encryptedKey,
      type: "text",
    };

    const { data, error } = await supabase
      .from("secure_send")
      .insert(encryptedData)
      .select();

    if (error) {
      toast.error("Failed to create secure send");
      return;
    }

    await fetchSecureSends();
    setGeneratedLink(
      `${window.location.origin}/secure-send/${data[0].id}#${aesKeyItem}`
    );
    toast.success("Secure send created!");
  };

  const deleteSecureSend = async () => {
    const supabase = createClient();

    if (!selectedSecureSend) {
      toast.error("No secure send selected");
      return;
    }

    const { error } = await supabase
      .from("secure_send")
      .delete()
      .eq("id", selectedSecureSend.id);

    if (error) {
      toast.error("Failed to delete secure send");
      return;
    }

    fetchSecureSends();
    setActiveModal("");
    setSelectedSecureSend(null);
    toast.success("Secure send deleted successfully!");
  };

  const handleCreateNew = () => {
    setGeneratedLink("");
    setTitle("");
    setContent("");
    setActiveModal("create");
  };

  const handleViewNote = (send: SecureSend) => {
    setSelectedSecureSend(send);
    setActiveModal("view");
  };

  return (
    <GlobalLayoutPage
      name="All secure sends"
      conditionToHide={activeModal ? true : false}
      actionButton={
        <Button onClick={handleCreateNew}>
          <Plus /> New
        </Button>
      }
      leftChildren={
        <>
          <div className="px-3 flex flex-col w-full mb-3">
            {isLoading ? (
              [0, 1].map((_, i) => <SkeletonPassword key={i} />)
            ) : secureSends.length > 0 ? (
              secureSends.map((item, index) => (
                <ItemLeftDisplay
                  index={index}
                  name={item.name}
                  description={`Created at: ${item.created_at_clean}`}
                  illustration={
                    item.type === "text" ? (
                      <Send className="stroke-[1px]" />
                    ) : (
                      <Key className="stroke-[1px]" />
                    )
                  }
                  icon={<ChevronRight />}
                  isItemActive={selectedSecureSend?.id === item.id}
                  onClick={() => handleViewNote(item)}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No secure sends yet
              </div>
            )}
          </div>
        </>
      }
      mainChildren={
        <>
          {activeModal === "create" && (
            <CreateSecureNote
              generateSecureSend={generateSecureSend}
              setActiveModal={setActiveModal}
              setTitle={setTitle}
              setContent={setContent}
              title={title}
              content={content}
              generatedLink={generatedLink}
              copyToClipboard={copyToClipboard}
            />
          )}

          {activeModal === "view" && selectedSecureSend && (
            <ViewSecureNote
              selectedSecureSend={selectedSecureSend}
              setActiveModal={setActiveModal}
              copyToClipboard={copyToClipboard}
              deleteSecureSend={deleteSecureSend}
            />
          )}
        </>
      }
    />
  );
}
