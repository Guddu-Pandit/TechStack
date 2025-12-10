
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pdf = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing filePath" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from("tech")
      .download(filePath);

    if (error || !data) {
      console.error("Download error:", error);
      return NextResponse.json(
        { error: "Unable to download file" },
        { status: 500 }
      );
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
    console.error("Extraction Error:", err);
    return NextResponse.json(
      { error: "Failed to extract text" },
      { status: 500 }
    );
  }
}
