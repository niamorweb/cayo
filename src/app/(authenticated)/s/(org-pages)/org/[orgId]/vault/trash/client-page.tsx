"use client";

import PasswordsListSide from "@/components/vault/passwords-list-side";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import {
  Organization,
  PasswordItem,
} from "@/components/vault/passwords-list-side";

interface PasswordsListProps {
  organizationId: string;
}

export default function ClientPage({ organizationId }: PasswordsListProps) {
  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === organizationId)
  );

  const passwords = currentOrganization?.passwords
    ? (currentOrganization.passwords.filter(
        (x) => x.trash === true
      ) as PasswordItem[])
    : null;

  return (
    <PasswordsListSide
      passwords={passwords}
      currentOrganization={(currentOrganization as Organization) ?? null}
      isTrash={true}
    />
  );
}
