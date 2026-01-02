"use client";

import PasswordsListSide from "@/components/vault/passwords-list-side";
import { useOrganizationStore } from "@/lib/store/organizationStore";

interface PasswordsListProps {
  organizationId: string;
}

export default function ClientPage({ organizationId }: PasswordsListProps) {
  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === organizationId)
  );

  // On filtre les mots de passe et on s'assure que c'est un tableau (même vide)
  const passwords = currentOrganization?.all_passwords
    ? currentOrganization.all_passwords.filter((x: any) => x.trash === false)
    : [];

  return (
    <PasswordsListSide
      passwords={passwords}
      // @ts-ignore
      currentOrganization={currentOrganization ?? null}
      isTrash={false}
    />
  );
}
