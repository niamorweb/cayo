import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { decryptText } from "@/lib/encryption/text";
import { decryptAESKey } from "@/lib/encryption_aes";
import { useAuthStore } from "@/lib/store/useAuthStore";

export interface SecureSend {
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

const formatFullDate = (date: string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

type SecureSendStore = {
  secureSends: SecureSend[];
  isLoading: boolean;
  fetchSecureSends: () => Promise<void>;
  reset: () => void;
};

export const useSecureSendStore = create<SecureSendStore>((set, get) => ({
  secureSends: [],
  isLoading: false,

  fetchSecureSends: async () => {
    const supabase = createClient();
    const auth = useAuthStore.getState().user;
    const originalAesKey = useAuthStore.getState().decryptedAesKey;

    if (!auth?.id || !originalAesKey) return;

    set({ isLoading: true });

    const { data, error } = await supabase
      .from("secure_send")
      .select("*")
      .eq("user_id", auth.id);

    if (error) {
      toast.error("Failed to load secure sends");
      set({ isLoading: false });
      return;
    }

    const decrypted = data.map((item) => {
      const itemKeyDecrypted = decryptAESKey(
        item.encrypted_aes_key,
        item.iv,
        item.salt,
        originalAesKey
      );

      return {
        ...item,
        name: decryptText(item.name, itemKeyDecrypted, item.iv),
        text: decryptText(item.text, itemKeyDecrypted, item.iv),
        username: decryptText(item.username, itemKeyDecrypted, item.iv),
        password: decryptText(item.password, itemKeyDecrypted, item.iv),
        url: decryptText(item.website_url, itemKeyDecrypted, item.iv),
        note: decryptText(item.note, itemKeyDecrypted, item.iv),
        created_at_clean: formatFullDate(item.created_at),
        link: `${window.location.origin}/secure-send/${item.id}#${itemKeyDecrypted}`,
      };
    });

    set({ secureSends: decrypted, isLoading: false });
  },

  reset: () => set({ secureSends: [], isLoading: false }),
}));
