"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();

  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // FILE VALIDATION
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    // If user removed the file
    if (!selected) {
      setFile(null);
      setError("");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    // Size validation
    if (selected.size > maxSize) {
      setError("File size must be less than 10MB.");
      setFile(null);
      e.target.value = "";
      return;
    }

    // Type validation
    if (!allowedTypes.includes(selected.type)) {
      setError("Only PDF and DOCX files are allowed.");
      setFile(null);
      e.target.value = "";
      return;
    }

    // Clear error on valid file
    setError("");
    setFile(selected);
  };

  // SUBMIT → SUPABASE
  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a valid PDF/DOCX file.");
      return;
    }

    setLoading(true);

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // 1) Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from("user-documents")
      .upload(filePath, file, {
        upsert: true, 
      });

    if (uploadError) {
      console.log(uploadError);
      setError("Error uploading file.");
      setLoading(false);
      return;
    }

    // 2) Insert into DB
    const { error: dbError } = await supabase.from("documents").insert({
      user_id: user.id,
      file_path: filePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      extracted_text: null,
    });

    if (dbError) {
      console.log(dbError);
      setError("File uploaded but database insert failed.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setError("");
    setFile(null);
    alert("File uploaded successfully!");
  };

  return (
    <div className="min-h-svh w-full flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold">📁 Document Dashboard</h1>

          <Button variant="destructive" className="px-4 bg-red-500">
            <Link href="/">Logout</Link>
          </Button>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="file">Upload Document</Label>

          <Input
            id="file"
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full mt-4"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
