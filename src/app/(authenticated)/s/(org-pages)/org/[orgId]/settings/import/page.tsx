"use client";
import ImportPasswords from "@/components/global/import-passwords";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useParams, usePathname } from "next/navigation";

export default function Page() {
  const params = useParams();
  const organizations = useOrganizationStore((s) => s.organizations);
  const orgId = params.orgId as string;

  const currentOrganization = organizations?.find((org) => org.id === orgId);

  return <ImportPasswords currentOrganization={currentOrganization} />;
}
