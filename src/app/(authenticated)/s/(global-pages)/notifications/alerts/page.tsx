"use client";

import React from "react";
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function SecurityAlertsPage() {
  // Simulation : Pas d'alertes pour le moment
  const alerts: any[] = [];

  return (
    <div className="space-y-8">
      {/* --- SECTION HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Security Alerts
        </h2>
        <p className="text-sm text-neutral-500">
          Monitor suspicious activities and vulnerability reports for your
          vault.
        </p>
      </div>

      <Separator />

      {/* --- CONTENT --- */}
      <div className="flex flex-col gap-6">
        {alerts.length > 0 ? (
          // Liste des alertes (Structure future)
          <div className="flex flex-col gap-3">{/* ... map alerts ... */}</div>
        ) : (
          // --- EMPTY STATE (GOOD NEWS) ---
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/30">
            {/* Icone animée au survol */}
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-100">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-neutral-900">
              All systems operational
            </h3>
            <p className="text-sm text-neutral-500 mt-2 max-w-sm text-center leading-relaxed">
              We haven't detected any suspicious activity, compromised
              passwords, or unauthorized login attempts in your vault.
            </p>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="text-neutral-600" disabled>
                Run Security Scan
              </Button>
            </div>
          </div>
        )}

        {/* --- INFO BOX --- */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">
                Activity Monitoring
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                We log sign-in attempts and sensitive data access to keep you
                informed.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">
                Breach Detection
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                We check your saved passwords against known data breaches
                automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
