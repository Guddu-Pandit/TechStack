import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import mammoth from "mammoth";
import { extractText } from "unpdf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();
    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            return (await cookies()).getAll();
          }
        }
      }
    );

    const { data, error } = await supabase.storage
      .from("tech")
      .download(filePath);

    if (error || !data) {
      console.error("DOWNLOAD ERROR:", error);
      return NextResponse.json({ error: "Could not download file" }, { status: 500 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    let extractedText = "";

    // ------------------------
    //     PDF Extraction
    // ------------------------
   if (filePath.endsWith(".pdf")) {
  try {
    const result = await extractText(buffer);

    // result.text may be string | string[] | undefined
    let rawText: string = "";

    if (Array.isArray(result?.text)) {
      rawText = result.text.join(" ");
    } else if (typeof result?.text === "string") {
      rawText = result.text;
    }

    rawText = rawText?.trim?.() || "";

    if (!rawText || rawText.length < 5) {
      extractedText =
        "⚠ Unable to read text. This PDF may be scanned or contain non-selectable text.";
    } else {
      extractedText = rawText;
    }
  } catch (err) {
    console.error("UNPDF ERROR:", err);
    extractedText =
      "⚠ PDF extraction failed. File may be password-protected, scanned, or corrupted.";
  }
}


    // ------------------------
    //       DOCX Extraction
    // ------------------------
    else if (filePath.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value?.trim() || "⚠ DOCX contains no readable text.";
    }

    else {
      return NextResponse.json({ error: "Unsupported file type" });
    }

    return NextResponse.json({ text: extractedText });

  } catch (err) {
    console.error("EXTRACTION ERROR:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
