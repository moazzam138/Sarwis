'use server';
/**
 * @fileOverview A Genkit flow for generating an environmental insight or eco-tip.
 *
 * - generateEnvironmentalInsight - A function that generates an environmental insight.
 * - GenerateEnvironmentalInsightInput - The input type for the generateEnvironmentalInsight function.
 * - GenerateEnvironmentalInsightOutput - The return type for the generateEnvironmentalInsight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateEnvironmentalInsightInputSchema = z.object({
  // No specific input needed for a general environmental insight, but can be expanded later.
  // For example, if we want to tailor the tip based on the deposited waste type or weight.
});
export type GenerateEnvironmentalInsightInput = z.infer<typeof GenerateEnvironmentalInsightInputSchema>;

const GenerateEnvironmentalInsightOutputSchema = z.object({
  insight: z.string().describe('A brief, engaging, and relevant environmental fact or eco-tip.')
});
export type GenerateEnvironmentalInsightOutput = z.infer<typeof GenerateEnvironmentalInsightOutputSchema>;

export async function generateEnvironmentalInsight(input: GenerateEnvironmentalInsightInput): Promise<GenerateEnvironmentalInsightOutput> {
  return generateEnvironmentalInsightFlow(input);
}

const environmentalInsightPrompt = ai.definePrompt({
  name: 'environmentalInsightPrompt',
  input: { schema: GenerateEnvironmentalInsightInputSchema },
  output: { schema: GenerateEnvironmentalInsightOutputSchema },
  prompt: `You are an AI assistant designed to provide encouraging and educational environmental facts or eco-tips after a user successfully deposits waste.
Your goal is to make the user feel good about their contribution and learn something new about sustainable practices.
Provide a brief, engaging, and relevant environmental fact or eco-tip. It should be concise, positive, and easy to understand.`
});

const generateEnvironmentalInsightFlow = ai.defineFlow(
  {
    name: 'generateEnvironmentalInsightFlow',
    inputSchema: GenerateEnvironmentalInsightInputSchema,
    outputSchema: GenerateEnvironmentalInsightOutputSchema
  },
  async (input) => {
    const { output } = await environmentalInsightPrompt(input);
    return output!;
  }
);
