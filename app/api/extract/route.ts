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
          },
        },
      }
    );

    const { data, error } = await supabase.storage
      .from("tech")
      .download(`${filePath}`);
    console.log("Trying to download:", `${filePath}`);

    if (error || !data) {
      console.error("DOWNLOAD ERROR:", error);
      return NextResponse.json(
        { error: "Could not download file" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    let extractedText = "";

    //     PDF Extraction
    if (filePath.endsWith(".pdf")) {
      try {
        let result = await extractText(buffer);

        let rawText = Array.isArray(result?.text)
          ? result.text.join(" ")
          : result?.text || "";

        rawText = rawText.trim();

        if (!rawText || rawText.length < 5) {
          // FALLBACK: use pdf-parse
          const pdf = require("pdf-parse");
          const pdfResult = await pdf(buffer);
          rawText = pdfResult.text?.trim() || "";
        }

        extractedText = rawText || "⚠ No readable text found.";
      } catch (err) {
        console.error("UNPDF ERROR:", err);

        extractedText = "⚠ PDF extraction failed.";
      }
    }

    //       DOCX Extraction
    else if (filePath.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText =
        result.value?.trim() || "⚠ DOCX contains no readable text.";
    } else {
      return NextResponse.json({ error: "Unsupported file type" });
    }

    return NextResponse.json({ text: extractedText });
  } catch (err) {
    console.error("EXTRACTION ERROR:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
