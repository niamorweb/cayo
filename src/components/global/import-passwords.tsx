"use client";
import React from "react";
import CardDisplay from "@/components/global/card-display";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { encryptText } from "@/lib/encryption/text";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import Papa from "papaparse";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";

export default function ImportPasswords({ currentOrganization }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    username: "",
    password: "",
    url: "",
    note: "",
  });

  const aesKey = useAuthStore((s) => s.decryptedAesKey);

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    const { data, errors, meta } = Papa.parse<string[]>(text.trim(), {
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      toast.error("Error parsing CSV file.");
      console.error("CSV Parse Errors:", errors);
      return;
    }

    // Use meta.fields if available, else use first row as header
    const headers = meta.fields || (data.length > 0 ? data[0] : []);
    const rows = meta.fields ? data : data.slice(1);

    setHeaders(headers.map((h) => h.trim()));
    setPreview(rows.slice(0, 10));
    setFile(file);

    setMapping({
      name: autoDetect(headers, ["name", "title", "site"]),
      username: autoDetect(headers, ["username", "user", "login", "email"]),
      password: autoDetect(headers, ["password", "pass", "pwd"]),
      url: autoDetect(headers, ["url", "website", "site", "link"]),
      note: autoDetect(headers, ["note", "notes", "comment"]),
    });
  };

  const autoDetect = (headers: string[], keywords: string[]) => {
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    // 1. Exact match
    for (const keyword of keywords) {
      const exactMatchIndex = lowerHeaders.findIndex((h) => h === keyword);
      if (exactMatchIndex !== -1) return headers[exactMatchIndex];
    }

    // 2. Includes match (prioritize better matches by length)
    const scoredMatches = lowerHeaders
      .map((h, i) => {
        const score = keywords.reduce(
          (acc, keyword) => (h.includes(keyword) ? acc + 1 : acc),
          0
        );
        return { index: i, score };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredMatches.length > 0) {
      return headers[scoredMatches[0].index]; // Return the best match
    }

    // 3. Fallback
    return "";
  };

  const handleImport = async () => {
    if (!file || !aesKey) {
      toast.error("File or AES key missing.");
      return;
    }

    const supabase = createClient();
    const text = await file.text();

    const { data, errors, meta } = Papa.parse<string[]>(text.trim(), {
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      toast.error("Error parsing CSV file.");
      console.error("CSV Parse Errors:", errors);
      return;
    }

    const headersInFile = meta.fields || (data.length > 0 ? data[0] : []);
    const rows = meta.fields ? data : data.slice(1);

    const passwordsToInsert = rows
      .map((cols) => {
        const getCol = (field: string) => {
          const colName = mapping[field];
          const index = headersInFile.indexOf(colName);
          return index >= 0 ? cols[index]?.trim() : "";
        };

        const raw = {
          name: getCol("name"),
          username: getCol("username"),
          password: getCol("password"),
          url: getCol("url"),
          note: getCol("note"),
        };

        if (!raw.password) return null;

        const iv = randomBytes(16);
        const ivArray = Array.from(iv);

        let finalAesKey = aesKey;
        if (currentOrganization)
          finalAesKey = currentOrganization.decrypted_aes_key;

        const encrypted = {
          name: encryptText(raw.name, finalAesKey, iv),
          username: encryptText(raw.username, finalAesKey, iv),
          password: encryptText(raw.password, finalAesKey, iv),
          url: encryptText(raw.url, finalAesKey, iv),
          note: encryptText(raw.note, finalAesKey, iv),
          iv: ivArray,
          organization: currentOrganization ? currentOrganization.id : null,
          group_id: null,
        };

        return encrypted;
      })
      .filter(Boolean);

    if (passwordsToInsert.length === 0) {
      toast.error("No valid password found in the file.");
      return;
    }

    const { data: created, error } = await supabase
      .from("passwords")
      .insert(passwordsToInsert);

    if (error) {
      toast.error("Import failed.");
      console.error(error);
      return;
    }

    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
    toast.success(
      `${passwordsToInsert.length} passwords successfully imported!`
    );
  };

  return (
    <CardDisplay
      href={"/s/settings"}
      title="Import"
      description="Import password in your private vault."
      actionBtns={
        headers.length > 0 && (
          <Button size="lg" onClick={handleImport}>
            Import all passwords
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3">
        <Input type="file" accept=".csv" onChange={handleFileLoad} />
        {headers.length > 0 && (
          <div className="flex flex-col gap-3 mt-6">
            <span className="text-lg font-semibold ">Map the columns :</span>
            <div className="flex flex-col mt-4">
              <div className="grid grid-cols-2">
                <p className="text-sm">Field in App</p>
                <p className="text-sm">Column in the CSV file</p>
              </div>
              <Separator className="my-3" />
              {["name", "username", "password", "url", "note"].map((field) => (
                <div
                  key={field}
                  className=" grid grid-cols-2 hover:bg-neutral-100 duration-150 p-3 rounded-xl"
                >
                  <Label htmlFor={field} className="capitalize">
                    {field}
                  </Label>
                  <Select
                    value={mapping[field]}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, [field]: value })
                    }
                  >
                    <SelectTrigger id={field}>
                      <SelectValue placeholder="-- Skip --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">-- Skip --</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 flex flex-col ">
              <span className="text-lg font-semibold ">Preview :</span>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(mapping).map((k) => (
                      <TableHead key={k}>{k}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(mapping).map((header, j) => {
                        const index = headers.indexOf(header);
                        return (
                          <TableCell className="p-3" key={j}>
                            {index >= 0 ? row[index] : "-"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </CardDisplay>
  );
}
