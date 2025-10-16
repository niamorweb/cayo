"use client";
import React from "react";
import { decryptText } from "@/lib/encryption/text";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { usePasswordStore } from "@/lib/store/passwordStore";
import PasswordsListSide from "@/components/vault/passwords-list-side";

export default function Page() {
  const passwords = usePasswordStore((s) => s.passwords);

  const aesKeyStore = useAuthStore((state) => state.decryptedAesKey);

  const passwordsLisibles =
    passwords &&
    aesKeyStore &&
    passwords
      .map((x) => ({
        id: x.id,
        created_at: x.created_at,
        iv: x.iv,
        name: decryptText(x.name, aesKeyStore, x.iv),
        password: decryptText(x.password, aesKeyStore, x.iv),
        username: decryptText(x.username, aesKeyStore, x.iv),
        note: decryptText(x.note, aesKeyStore, x.iv),
        url: decryptText(x.url, aesKeyStore, x.iv),
        folder: x.folder,
        trash: x.trash,
        modified_at: x.modified_at,
      }))
      .filter((x) => x.trash === true);

  return <PasswordsListSide passwords={passwordsLisibles} isTrash={true} />;
}
