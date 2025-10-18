import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { readAll } from "https://deno.land/std@0.168.0/streams/read_all.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const conversationId = formData.get("conversationId") as string;
    const userId = formData.get("userId") as string;

    if (!file || !conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing PDF:", file.name, "Size:", file.size);

    // Get Supabase keys
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(fileName, fileData, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("File uploaded successfully:", uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("chat-files")
      .getPublicUrl(fileName);

    // Extract text from PDF using a simple approach
    // Note: For production, consider using a dedicated PDF parsing service
    let pdfText = "";
    
    try {
      // Try to extract text using PDF.js approach
      const decoder = new TextDecoder();
      const text = decoder.decode(fileData);
      
      // Extract readable text (basic approach)
      const textMatches = text.match(/\(([^\)]+)\)/g);
      if (textMatches) {
        pdfText = textMatches
          .map(match => match.slice(1, -1))
          .join(' ')
          .replace(/\\[nrt]/g, ' ')
          .trim();
      }
    } catch (error) {
      console.error("PDF text extraction error:", error);
    }

    if (!pdfText || pdfText.length < 50) {
      return new Response(
        JSON.stringify({ 
          error: "Could not extract text from PDF. Please ensure the PDF contains selectable text (not scanned images)." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted text length:", pdfText.length);

    // Summarize using AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates comprehensive, well-structured summaries of PDF documents. Focus on the main topics, key points, and important details. Format your response with clear sections and bullet points where appropriate."
          },
          {
            role: "user",
            content: `Please provide a detailed summary of this PDF document:\n\n${pdfText.slice(0, 30000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    // Save user's file message
    await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: `Uploaded PDF: ${file.name}`,
        file_url: publicUrl,
        file_name: file.name,
        file_type: "application/pdf",
      });

    // Save AI summary
    await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: `📄 **PDF Summary: ${file.name}**\n\n${summary}`,
      });

    return new Response(
      JSON.stringify({ 
        summary,
        fileUrl: publicUrl,
        fileName: file.name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("PDF summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
