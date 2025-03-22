import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client with the correct environment variable
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY // Changed from OPENAI_API_KEY to OPEN_AI_KEY
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
       Keep responses concise and engaging. Make sure the responses you return are as if it's the character responding the the user!`;
    
    // Format all messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with system prompt:', systemPrompt.substring(0, 100) + '...');
    
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
    // Add more detailed error information
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "I'm having trouble connecting to my knowledge base. This might be due to an API key issue. Please check your OpenAI API key configuration.";
      }
    }
    return `Ah! Sorry. I seem to have misunderstood your question. can you say that again, eh?`;
  }
}
