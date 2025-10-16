import { createClient } from "@/lib/supabase/client";
import React from "react";
import ClientSide from "./client-side";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function checkAndDeleteOldSend(createdAt: string, sendId: string) {
  const createdDate = new Date(createdAt);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.APP_URL;

  if (createdDate < oneDayAgo) {
    await fetch(`${baseUrl}/api/secure-notes`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ secureNoteId: sendId }),
    });
    return false;
  }

  return true;
}

const nothingFoundJSX = () => {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.APP_URL!;

  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col gap-6">
      <h3>Nothing to return</h3>
      <Button size="lg" asChild>
        <Link href={baseUrl}>Go to Home Page</Link>
      </Button>
    </div>
  );
};
export default async function page({ params }: any) {
  const sendId = await params.sendId;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("secure_send")
    .select("*")
    .eq("id", sendId)
    .single();

  if (!data) {
    return nothingFoundJSX();
  }

  let isStillAvailable = await checkAndDeleteOldSend(data.created_at, sendId);

  if (!isStillAvailable) {
    return nothingFoundJSX();
  }

  return <ClientSide secureSend={data} />;
}
