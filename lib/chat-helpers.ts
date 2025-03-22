import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client with the correct environment variable
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

/**
 * Generate character response using OpenAI directly
 */
export async function generateCharacterResponse(
  characterId: string,
  messages: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  try {
    console.log(`Generating response for character ${characterId}`);
    
    // Get character data
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
    if (!character) {
      console.error(`Character ${characterId} not found`);
      return "I apologize, but I'm having trouble accessing my character information.";
    }
    
    // Build system prompt with character information and strong first-person enforcement
    let systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and stay in character.
       Keep responses concise and engaging.`;
       
    // Force first-person perspective regardless of stored instructions
    systemPrompt = `${systemPrompt}
    
    IMPORTANT OVERRIDE: You MUST respond as if you ARE ${character.name} using first-person perspective.
    - Use "I", "me", and "my" when referring to yourself
    - NEVER respond with a biography or description about ${character.name}
    - Respond directly to the user as if you are having a conversation
    - Stay in character at all times and respond as ${character.name} would`;
    
    // Format all messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with first-person instruction override');
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Check if response still seems to be in third person and fix it
    if (response.startsWith(character.name) || 
        response.includes(`${character.name} is`) || 
        !response.includes("I ") && !response.includes("I'm ") && !response.includes("My ")) {
      console.log("Detected third-person response, generating new response...");
      return `*As ${character.name}*: I ${response.split(" is ")[1] || 
        "need to speak in first person! " + response.replace(character.name, "I")}`;
    }
    
    console.log(`Generated response for ${character.name}`);
    return response;
    
  } catch (error) {
    console.error("Error generating character response:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "I'm having trouble connecting to my knowledge base. This might be due to an API key issue.";
      }
    }
    return `As an AI assistant, I'm currently experiencing technical difficulties. Please try again shortly.`;
  }
}
