import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client - FIX: Corrected environment variable name
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
    
    // Build system prompt with character information
    const systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and stay in character.
       Keep responses concise and engaging.`;
    
    // Format all messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
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
    
    console.log(`Generated response for ${character.name}`);
    return response;
    
  } catch (error) {
    console.error("Error generating character response:", error);
    return `As an AI assistant, I'm currently experiencing technical difficulties. Please try again shortly.`;
  }
}
