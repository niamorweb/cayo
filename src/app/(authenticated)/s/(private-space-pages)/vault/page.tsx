"use client";
import React, { useMemo } from "react";
import { decryptText } from "@/lib/encryption/text";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { usePasswordStore } from "@/lib/store/passwordStore";
import PasswordsListSide, {
  PasswordItem,
} from "@/components/vault/passwords-list-side";

export default function Page() {
  const passwords = usePasswordStore((s) => s.passwords);
  const aesKeyStore = useAuthStore((state) => state.decryptedAesKey);

  const passwordsLisibles = useMemo((): PasswordItem[] | null => {
    if (!passwords || !aesKeyStore) return null;

    return passwords
      .filter((x) => x.trash === false)
      .map((x) => ({
        id: x.id,
        name: decryptText(x.name, aesKeyStore, x.iv),
        username: decryptText(x.username, aesKeyStore, x.iv),
        url: decryptText(x.url, aesKeyStore, x.iv),
        modified_at: x.modified_at,
        password: decryptText(x.password, aesKeyStore, x.iv),
        note: decryptText(x.note, aesKeyStore, x.iv),
      })) as PasswordItem[];
  }, [passwords, aesKeyStore]);

  return (
    <PasswordsListSide
      passwords={passwordsLisibles}
      currentOrganization={null}
      isTrash={false}
    />
  );
}
