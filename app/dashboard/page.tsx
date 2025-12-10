"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();

  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setUserInfo(user);
  };

  fetchUser();

  // FETCH FILES FROM DATABASE
  const fetchFiles = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id);

    if (!error) setFiles(data || []);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // FILE VALIDATION
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

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

    if (selected.size > maxSize) {
      setError("File size must be less than 10MB.");
      setFile(null);
      e.target.value = "";
      return;
    }

    if (!allowedTypes.includes(selected.type)) {
      setError("Only PDF and DOCX files are allowed.");
      setFile(null);
      e.target.value = "";
      return;
    }

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

    const { error: uploadError } = await supabase.storage
      .from("tech")
      .upload(filePath, file);

    if (uploadError) {
      setError("Error uploading file.");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("files").insert({
      user_id: user.id,
      file_path: filePath,
      original_filename: file.name,
    });

    if (dbError) {
      setError("File uploaded but database insert failed.");
      setLoading(false);
      return;
    }

    setFile(null);
    setError("");
    setLoading(true);

    fetchFiles(); // reload list

    alert("File uploaded successfully!");
  };

  // EXTRACT TEXT API CALL
  const extractText = async (filePath: string) => {
    setExtractingId(filePath); // start extraction for THIS file

    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    });

    const data = await res.json();
    setExtractingId(null); // stop only this file

    if (data.error) {
      setExtractedText("Failed to extract text.");
      return;
    }

    setExtractedText(data.text);
  };

  return (
    <div className="min-h-svh w-full bg-[#F5F7FA] flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold">Document Dashboard</h1>

          <div className="flex items-center gap-4">
            {userInfo && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {userInfo.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500">{userInfo.email}</p>
              </div>
            )}
            <Button variant="outline" className="rounded-lg px-4">
              <Link href="/">Logout</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
        <section className="px-8 py-10">
          <h2 className="text-4xl font-bold text-[#0A0F1C]">
            Welcome back,{" "}
            <span className="text-[#3B82F6]">
              {userInfo?.user_metadata?.full_name || "User"}
            </span>
          </h2>
          <p className="text-gray-600 mt-2">
            Manage and extract text from your documents with ease.
          </p>
        </section>
        {/* UPLOAD CARD */}
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-xl">Upload Document</h2>
          <p className="text-sm text-gray-500 mt-1">
            PDF & DOCX only (max 10MB)
          </p>

          <div className="mt-4 flex items-center gap-4">
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="w-full"
            />

            <Button
              className="px-6 bg-black hover:bg-gray-800"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        {/* FILE LIST CARD */}
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-xl">Your Documents</h2>
          <p className="text-sm text-gray-500 mb-4">{files.length} uploaded</p>

          {files.length === 0 && (
            <p className="text-sm text-gray-500">No documents uploaded.</p>
          )}

          {files.map((f) => (
            <div
              key={f.id}
              className="border rounded-xl p-4 flex items-center justify-between mb-3"
            >
              <div>
                <p className="font-medium">{f.original_filename}</p>
                <p className="text-xs text-gray-500">
                  {new Date(f.created_at).toISOString().split("T")[0]}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="rounded-lg cursor-pointer">
                  ⬇ Download
                </Button>

                <Button
                  onClick={() => extractText(f.file_path)}
                  className="rounded-lg bg-[#0A0F1C] hover:bg-black text-white cursor-pointer"
                  disabled={extractingId === f.file_path}
                >
                  {extractingId === f.file_path
                    ? "Extracting..."
                    : "Extract Text"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* EXTRACTED TEXT */}
        {extractedText && (
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-2">Extracted</h3>
            <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
