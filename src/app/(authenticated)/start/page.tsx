"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { ChevronRight, Shield, Users, Vault } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Page() {
  const organizations = useOrganizationStore((s) => s.organizations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrganizations = async () => {
      await fetchAndDecryptOrganizations();
      setIsLoading(false);
    };

    loadOrganizations();
  }, []);

  useEffect(() => {
    fetchAndDecryptOrganizations();
  }, []);

  return (
    <div className="bg-neutral-100 h-screen w-full p-4 flex items-center justify-center relative overflow-hidden">
      {" "}
      <div className="top-1/3 left-0 -translate-y-1/2 -translate-x-1/4 absolute w-[200px] h-[300px] md:w-[400px] md:h-[600px] blur-[3200px] bg-primary/20"></div>
      <div className="top-1/2 right-0 translate-x-1/2 absolute w-[200px] h-[300px] md:w-[400px] md:h-[600px] blur-[320px] bg-primary/20"></div>
      <div className="max-w-[500px] w-full bg-white outline-neutral-200 outline-1 rounded-lg p-10 flex flex-col gap-12">
        <div className="relative z-10 flex flex-col gap-2">
          <h3>Welcome to Cayo</h3>
          <p>Select the space you want to enter</p>
        </div>
        <div className="flex flex-col gap-6 w-full">
          <Button
            asChild
            className="!w-full relative justify-start !h-[64px] text-base rounded-2xl"
            variant="outline"
            size="lg"
          >
            <Link href="/s/vault">
              <div className="bg-white rounded-sm bg-white/80 outline outline-1 outline-neutral-100 size-10 flex items-center justify-center">
                <Shield className="size-6" />
              </div>
              Private vault
              <ChevronRight className=" absolute top-1/2 right-2 -translate-y-1/2 size-6 stroke-[1px]" />
            </Link>
          </Button>
          <div className="w-full flex flex-col gap-3">
            {organizations && organizations.length > 0 ? (
              organizations.map((org, i) => (
                <Button
                  key={i}
                  asChild
                  className="!w-full relative justify-start !h-[64px] text-base rounded-2xl"
                  size="lg"
                >
                  <Link href={"/s/org/" + org.id + "/vault"}>
                    <div className="bg-neutral-50/20 rounded-sm outline-1 outline-neutral-50/30 size-10 flex items-center justify-center">
                      <Users className="size-5" />
                    </div>
                    {org.name}
                    <ChevronRight className=" absolute top-1/2 right-2 -translate-y-1/2 size-6 stroke-[1px]" />
                  </Link>
                </Button>
              ))
            ) : isLoading ? (
              <Skeleton className="w-full h-[72px] rounded-2xl" />
            ) : (
              <p>No organizations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
