import ClientProtection from "./client-protection";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientProtection>{children}</ClientProtection>;
}
