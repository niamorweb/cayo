"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { randomBytes } from "crypto";
import {
  FileSpreadsheet,
  UploadCloud,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { encryptText } from "@/lib/encryption/text";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { cn } from "@/lib/utils";

// Champs requis par l'application
const APP_FIELDS = [
  { key: "name", label: "Name (Title)", required: true },
  { key: "username", label: "Username / Email", required: false },
  { key: "password", label: "Password", required: true },
  { key: "url", label: "Website URL", required: false },
  { key: "note", label: "Notes", required: false },
];

export default function ImportPasswords({ currentOrganization }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    username: "",
    password: "",
    url: "",
    note: "",
  });

  const aesKey = useAuthStore((s) => s.decryptedAesKey);

  // --- LOGIC: AUTO-DETECT COLUMNS ---
  const autoDetect = (headers: string[], keywords: string[]) => {
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    // 1. Exact match
    for (const keyword of keywords) {
      const index = lowerHeaders.findIndex((h) => h === keyword);
      if (index !== -1) return headers[index];
    }

    // 2. Partial match
    for (const keyword of keywords) {
      const index = lowerHeaders.findIndex((h) => h.includes(keyword));
      if (index !== -1) return headers[index];
    }

    return "";
  };

  // --- LOGIC: FILE LOAD ---
  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const text = await uploadedFile.text();

    const { data, errors, meta } = Papa.parse<string[]>(text.trim(), {
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      toast.error("Error parsing CSV file.");
      return;
    }

    const fileHeaders = meta.fields || (data.length > 0 ? data[0] : []);
    const rows = meta.fields ? data : data.slice(1);

    setHeaders(fileHeaders.map((h) => h.trim()));
    setPreview(rows.slice(0, 5)); // Preview only top 5 rows
    setFile(uploadedFile);

    // Auto-map logic
    setMapping({
      name: autoDetect(fileHeaders, ["name", "title", "account", "service"]),
      username: autoDetect(fileHeaders, ["username", "user", "login", "email"]),
      password: autoDetect(fileHeaders, ["password", "pass", "pwd", "key"]),
      url: autoDetect(fileHeaders, ["url", "website", "site", "link", "uri"]),
      note: autoDetect(fileHeaders, ["note", "notes", "comment", "extra"]),
    });
  };

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setPreview([]);
    setMapping({ name: "", username: "", password: "", url: "", note: "" });
  };

  // --- LOGIC: IMPORT PROCESS ---
  const handleImport = async () => {
    if (!file || !aesKey) return;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const text = await file.text();
      const { data, meta } = Papa.parse<string[]>(text.trim(), {
        skipEmptyLines: true,
      });

      const fileHeaders = meta.fields || (data.length > 0 ? data[0] : []);
      const rows = meta.fields ? data : data.slice(1);

      const passwordsToInsert = rows
        .map((cols) => {
          const getVal = (key: string) => {
            const colName = mapping[key];
            if (!colName || colName === "__skip__") return "";
            const index = fileHeaders.indexOf(colName);
            return index >= 0 ? cols[index]?.trim() : "";
          };

          const raw = {
            name: getVal("name"),
            username: getVal("username"),
            password: getVal("password"),
            url: getVal("url"),
            note: getVal("note"),
          };

          // Skip if essential data is missing
          if (!raw.name || !raw.password) return null;

          // Encryption
          const iv = randomBytes(16);
          const ivArray = Array.from(iv);
          const finalAesKey = currentOrganization
            ? currentOrganization.decrypted_aes_key
            : aesKey;

          return {
            name: encryptText(raw.name, finalAesKey, iv),
            username: encryptText(raw.username, finalAesKey, iv),
            password: encryptText(raw.password, finalAesKey, iv),
            url: encryptText(raw.url, finalAesKey, iv),
            note: encryptText(raw.note, finalAesKey, iv),
            iv: ivArray,
            organization: currentOrganization ? currentOrganization.id : null,
            group_id: null,
          };
        })
        .filter(Boolean);

      if (passwordsToInsert.length === 0) {
        toast.error("No valid passwords found. Check your mapping.");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from("passwords")
        .insert(passwordsToInsert);

      if (error) throw error;

      await Promise.all([
        fetchAndStorePasswordsAndFolders(true),
        fetchAndDecryptOrganizations(true),
      ]);

      toast.success(
        `${passwordsToInsert.length} passwords imported successfully!`
      );
      handleReset();
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* --- HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Import Passwords
        </h2>
        <p className="text-sm text-neutral-500">
          Import your credentials from a CSV file (LastPass, 1Password,
          Chrome...).
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: CONFIGURATION --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. FILE UPLOAD */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs">
                1
              </div>
              Select File
            </h3>

            {!file ? (
              <div className="relative group">
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50/10 transition-all cursor-pointer bg-white">
                  <div className="p-3 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-neutral-900">
                    Click to upload CSV
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    or drag and drop file here
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileLoad}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 border border-green-100 rounded-lg text-green-600">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </section>

          {/* 2. MAPPING */}
          {file && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs">
                  2
                </div>
                Map Columns
              </h3>

              <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-sm overflow-hidden">
                {APP_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-12 items-center p-4 gap-4 hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="col-span-4">
                      <Label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                    </div>
                    <div className="col-span-1 flex justify-center text-neutral-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="col-span-7">
                      <Select
                        value={mapping[field.key]}
                        onValueChange={(val) =>
                          setMapping({ ...mapping, [field.key]: val })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9 border-neutral-200",
                            !mapping[field.key] &&
                              field.required &&
                              "border-red-300 bg-red-50/30"
                          )}
                        >
                          <SelectValue placeholder="Select CSV Column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="__skip__"
                            className="text-neutral-400 italic"
                          >
                            -- Ignore this field --
                          </SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !mapping.name || !mapping.password}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] shadow-lg shadow-indigo-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Import Data
                    </>
                  )}
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* --- RIGHT COLUMN: PREVIEW & HELP --- */}
        <div className="space-y-6">
          {/* Help Box */}
          <Alert className="bg-indigo-50/50 border-indigo-100">
            <AlertCircle className="h-4 w-4 text-indigo-600" />
            <AlertTitle className="text-indigo-900 font-medium">
              CSV Format
            </AlertTitle>
            <AlertDescription className="text-indigo-800/80 text-xs mt-1 leading-relaxed">
              Make sure your CSV has a header row. We recommend exporting as
              "Generic CSV" from your previous password manager.
            </AlertDescription>
          </Alert>

          {/* Live Preview */}
          {file && preview.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase">
                  Live Preview
                </span>
                <span className="text-[10px] text-neutral-400">
                  First 5 rows
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[120px] text-xs">Name</TableHead>
                      <TableHead className="text-xs">Username</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => {
                      // Helper pour récupérer la valeur mappée
                      const getName = () => {
                        const idx = headers.indexOf(mapping.name);
                        return idx >= 0 ? row[idx] : "-";
                      };
                      const getUser = () => {
                        const idx = headers.indexOf(mapping.username);
                        return idx >= 0 ? row[idx] : "-";
                      };

                      return (
                        <TableRow key={i} className="hover:bg-neutral-50">
                          <TableCell className="text-xs font-medium truncate max-w-[120px]">
                            {getName()}
                          </TableCell>
                          <TableCell className="text-xs text-neutral-500 truncate max-w-[120px]">
                            {getUser()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="p-2 bg-neutral-50 border-t border-neutral-100 text-[10px] text-center text-neutral-400">
                Data shown is from your local file
              </div>
            </div>
          )}

          {!file && (
            <div className="p-6 border border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center text-center text-neutral-400 gap-2">
              <FileText className="w-8 h-8 opacity-20" />
              <p className="text-sm">Preview will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
