"use client";

import { useParams } from "next/navigation";
import ClientPage from "./client-page";

export default function Page() {
  const params = useParams();
  const organizationId = params.orgId as string;

  return <ClientPage organizationId={organizationId} />;
}
