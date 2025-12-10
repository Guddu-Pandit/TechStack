import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import mammoth from "mammoth";
import { extractText } from "unpdf";

export const runtime = "nodejs";

// Convert Supabase result (Blob or Stream) → ArrayBuffer safely
async function toArrayBuffer(data: any): Promise<ArrayBuffer> {
  // If Blob (browser/edge)
  if (data.arrayBuffer) {
    return await data.arrayBuffer();
  }

  // If web ReadableStream
  if (data instanceof ReadableStream) {
    const reader = data.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    let length = chunks.reduce((a, c) => a + c.length, 0);
    let combined = new Uint8Array(length);

    let pos = 0;
    for (const chunk of chunks) {
      combined.set(chunk, pos);
      pos += chunk.length;
    }

    return combined.buffer;
  }

  // If NodeJS Stream
  const stream = data;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).buffer;
}

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
      .download(filePath);

    if (!data || error) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Convert Supabase result to ArrayBuffer
    const arrayBuffer = await toArrayBuffer(data);
    const uint8 = new Uint8Array(arrayBuffer); // For unpdf
    const buffer = Buffer.from(arrayBuffer); // For pdf-parse & mammoth

    let extractedText = "";

    // --------------------------
    //       PDF Extraction
    // --------------------------
    if (filePath.endsWith(".pdf")) {
      try {
        // Primary extraction using unpdf
        const result = await extractText(uint8);

        let rawText = Array.isArray(result?.text)
          ? result.text.join(" ")
          : result?.text || "";

        rawText = rawText.trim();

        // Fallback to pdf-parse when unpdf extracts empty text
        if (!rawText || rawText.length < 5) {
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

    // --------------------------
    //       DOCX Extraction
    // --------------------------
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
