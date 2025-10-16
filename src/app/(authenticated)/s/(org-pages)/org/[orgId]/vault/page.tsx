import ClientPage from "./client-page";

export default async function page({ params }: any) {
  const organizationId = await params.orgId;

  return <ClientPage organizationId={organizationId} />;
}
