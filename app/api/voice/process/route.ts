import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

export async function POST(req: Request) {
  try {
    console.log("Voice processing request received");
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log("Unauthorized request (no user ID)");
      return new NextResponse("Unauthorized: No user ID found", { status: 401 });
    }
    
    console.log("Authorized user:", userId);
    
    // Parse the FormData
    const formData = await req.formData();
    
    // Extract data from the form
    const audioFile = formData.get("audio_file") as File;
    const characterId = formData.get("character_id") as string;
    
    console.log("Request data:", {
      hasAudioFile: !!audioFile,
      audioFileSize: audioFile?.size,
      characterId: characterId || "MISSING"
    });
    
    if (!audioFile) {
      console.error("No audio file in request");
      return new NextResponse("Missing audio file", { status: 400 });
    }
    
    if (!characterId) {
      console.error("No character ID in request");
      return new NextResponse("Missing character ID", { status: 400 });
    }
    
    console.log(`Processing for character: ${characterId}, Audio file type: ${audioFile.type}, size: ${audioFile.size} bytes`);
    
    // Get character from database
    console.log(`Looking up character: ${characterId}`);
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
    if (!character) {
      console.error(`Character not found: ${characterId}`);
      return new NextResponse(`Character not found with ID: ${characterId}`, { status: 404 });
    }
    
    console.log(`Character found: ${character.name}`);
    
    // Convert audio file to buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Audio buffer created, size: ${buffer.length} bytes`);
    
    // Step 1: Transcribe audio using Whisper
    console.log("Transcribing audio with Whisper API...");
    
    // Create a temporary file object for the OpenAI API
    const tempFile = new File([buffer], "audio.webm", { 
      type: audioFile.type || "audio/webm" 
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: tempFile,
      model: "whisper-1",
      language: "en"
    });
    
    const userText = transcription.text;
    console.log(`Transcribed text: "${userText}"`);
    
    if (!userText || userText.trim() === "") {
      console.warn("Empty transcription result");
      return new NextResponse("Could not transcribe audio. Please speak more clearly and try again.", 
        { status: 400 }
      );
    }
    
    // Step 2: Generate AI response
    console.log(`Generating response from ${character.name}`);
    
    // Use character instructions as system prompt
    const systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and stay in character.
       Keep responses concise and engaging.`;
    
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      max_tokens: 300,
      temperature: 0.7
    });
    
    const aiTextResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log(`AI text response: "${aiTextResponse.substring(0, 100)}..."`);
    
    if (!aiTextResponse || aiTextResponse.trim() === "") {
      console.warn("Empty AI response");
      return new NextResponse("AI could not generate a response. Please try again.", 
        { status: 500 }
      );
    }
    
    // Step 3: Convert response to speech
    console.log("Converting to speech with TTS API...");
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // Consider making this configurable
      input: aiTextResponse
    });
    
    // Convert audio buffer to base64
    const speechArrayBuffer = await speechResponse.arrayBuffer();
    console.log(`Speech response received, size: ${speechArrayBuffer.byteLength} bytes`);
    
    const audioBuffer = Buffer.from(speechArrayBuffer);
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log("Creating message records in database...");
    
    // Create a conversation if not exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: userId,
        characterId: character.id
      }
    });
    
    if (!conversation) {
      console.log("Creating new conversation");
      conversation = await prisma.conversation.create({
        data: {
          userId: userId,
          characterId: character.id,
          title: `Chat with ${character.name}`
        }
      });
    }
    
    // Create user message in database
    await prisma.message.create({
      data: {
        content: userText || "Empty message", // Fallback for null content
        role: "user",
        conversationId: conversation.id
      }
    });
    
    // Create AI message in database
    await prisma.message.create({
      data: {
        content: aiTextResponse || "No response", // Fallback for null content
        role: "assistant",
        conversationId: conversation.id
      }
    });
    
    console.log("Voice processing completed successfully");
    
    return NextResponse.json({
      status: "success",
      user_text: userText,
      ai_text: aiTextResponse,
      audio_data: `data:audio/mp3;base64,${audioBase64}`
    });
    
  } catch (error: unknown) {
    console.error("Error processing voice:", error);
    
    // Get more detailed error information
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error(error.stack);
    }
    
    return new NextResponse(`Error processing voice: ${errorMessage}`, { status: 500 });
  }
}
