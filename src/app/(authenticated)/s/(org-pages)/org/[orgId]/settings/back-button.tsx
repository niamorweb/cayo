"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function BackButton({ href }: { href: string }) {
  return (
    <Button variant="ghost" className="md:hidden mr-auto" asChild>
      <Link href={href}>
        <ArrowLeft /> Back
      </Link>
    </Button>
  );
}
