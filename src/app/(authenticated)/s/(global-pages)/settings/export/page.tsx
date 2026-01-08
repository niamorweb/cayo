"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Types d'export disponibles
const EXPORT_FORMATS = [
  {
    id: "json",
    title: "JSON (JavaScript Object Notation)",
    description:
      "Best for importing into other password managers or backups. Preserves structure.",
    icon: FileJson,
  },
  {
    id: "csv",
    title: "CSV (Comma Separated Values)",
    description: "Readable by Excel or Google Sheets. Basic table format.",
    icon: FileSpreadsheet,
  },
];

export default function ExportPage() {
  const [format, setFormat] = useState("json");
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);

    // Simulation d'un export (à remplacer par la logique réelle plus tard)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Export ${format.toUpperCase()} generated successfully!`);
    } catch (error) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* --- HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Export Vault</h2>
        <p className="text-sm text-neutral-500">
          Download a copy of your passwords and secure notes.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: CONFIGURATION --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Download className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Choose Format
                </h3>
                <p className="text-xs text-neutral-500">
                  Select the file type for your export.
                </p>
              </div>
            </div>

            <RadioGroup
              defaultValue="json"
              value={format}
              onValueChange={setFormat}
              className="grid gap-4 pt-2"
            >
              {EXPORT_FORMATS.map((item) => {
                const Icon = item.icon;
                const isSelected = format === item.id;
                return (
                  <Label
                    key={item.id}
                    htmlFor={item.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    <RadioGroupItem
                      value={item.id}
                      id={item.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900">
                        <Icon className="w-4 h-4 text-neutral-500" />
                        {item.title}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 font-normal leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleExport}
              size="lg"
              disabled={isLoading}
              className="bg-neutral-900 hover:bg-neutral-800 text-white min-w-[150px] shadow-lg shadow-neutral-500/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download File
                </>
              )}
            </Button>
          </div>
        </div>

        {/* --- RIGHT COLUMN: WARNINGS --- */}
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900 font-semibold">
              Security Warning
            </AlertTitle>
            <AlertDescription className="text-red-800/90 text-xs mt-2 leading-relaxed">
              The exported file will contain your passwords in{" "}
              <strong>plain text</strong> (unencrypted).
              <br />
              <br />
              Anyone with access to this file can read your passwords.
              <br />
              <br />
              <ul className="list-disc pl-4 space-y-1">
                <li>Do not email this file.</li>
                <li>Do not save it on a public computer.</li>
                <li>
                  Delete the file immediately after importing it elsewhere.
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
