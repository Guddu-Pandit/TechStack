export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pdf = require("pdf-parse");

export async function POST(req: Request) {
  try {
    const { filePath } = await req.json();
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from("tech")
      .download(filePath);

    if (error || !data) {
      return NextResponse.json({ error: "File download failed." });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    let extractedText = "";

    if (filePath.endsWith(".pdf")) {
      const result = await pdf(buffer);
      extractedText = result.text;
    } else if (filePath.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: "Unsupported format" });
    }

    return NextResponse.json({ text: extractedText });
  } catch (err) {
    console.error("EXTRACT ERROR:", err);
    return NextResponse.json({ error: "Extraction failed" });
  }
}
