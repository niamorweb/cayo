import ClientPage from "./client-page";

export default async function page({ params }: any) {
  const organizationId = params.orgId;

  return <ClientPage organizationId={organizationId} />;
}
