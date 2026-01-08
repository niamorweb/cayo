import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export default function Layout({ children }: any) {
  return (
    <div className="bg-white overflow-hidden">
      {/* <header className="relative z-10 px-5 w-full border-b-2 border-neutral-800/20">
        <nav className="text-neutral-800 mx-auto px-4 py-8 flex items-center justify-between w-full">
          <Link href="/">
            <h3>Cayo</h3>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Signup</Link>
            </Button>
          </div>
        </nav>
      </header> */}

      {children}
    </div>
  );
}
