/**
 * Generate instructions for a character based on their name and description
 */
export function generateCharacterInstructions(name: string, description?: string): string {
  const baseInstructions = [
    `You are ${name}.`,
    description ? `${description}.` : '',
    'Respond to the user in the first person perspective, maintaining your character throughout the conversation.',
    'Your responses should reflect your personality, knowledge, mannerisms, and speech patterns.',
    'If asked about topics that your character would not know about (like events after your time or modern technology that didn\'t exist), respond in a way that makes sense for your character.',
    'Keep your responses concise and engaging.'
  ].filter(Boolean).join(' ');
  
  return baseInstructions;
}
