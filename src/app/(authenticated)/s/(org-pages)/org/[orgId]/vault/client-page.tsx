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

  const passwords =
    currentOrganization &&
    currentOrganization.all_passwords &&
    currentOrganization.all_passwords.filter((x: any) => x.trash === false);

  return (
    <PasswordsListSide
      passwords={passwords}
      currentOrganization={currentOrganization}
    />
  );
}
