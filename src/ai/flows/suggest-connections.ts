// src/ai/flows/suggest-connections.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting connections and search terms based on open documents and browser tabs.
 *
 * - suggestConnections - The main function that takes open documents and browser tabs as input and returns suggestions.
 * - SuggestConnectionsInput - The input type for the suggestConnections function.
 * - SuggestConnectionsOutput - The output type for the suggestConnections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestConnectionsInputSchema = z.object({
  openDocuments: z
    .array(z.string())
    .describe('An array of strings representing the content of open documents.'),
  openTabs: z
    .array(z.string())
    .describe('An array of strings representing the URLs or titles of open browser tabs.'),
});
export type SuggestConnectionsInput = z.infer<typeof SuggestConnectionsInputSchema>;

const SuggestConnectionsOutputSchema = z.object({
  suggestedConnections: z
    .array(z.string())
    .describe('An array of strings representing suggested connections between the open documents and tabs.'),
  suggestedSearchTerms: z
    .array(z.string())
    .describe('An array of strings representing suggested search terms.'),
});
export type SuggestConnectionsOutput = z.infer<typeof SuggestConnectionsOutputSchema>;

export async function suggestConnections(input: SuggestConnectionsInput): Promise<SuggestConnectionsOutput> {
  return suggestConnectionsFlow(input);
}

const suggestConnectionsPrompt = ai.definePrompt({
  name: 'suggestConnectionsPrompt',
  input: {schema: SuggestConnectionsInputSchema},
  output: {schema: SuggestConnectionsOutputSchema},
  prompt: `You are an AI assistant designed to analyze open documents and browser tabs and suggest connections and relevant search terms to improve user efficiency.

  Analyze the following open documents:
  {{#each openDocuments}}
  - {{{this}}}
  {{/each}}

  Analyze the following open browser tabs:
  {{#each openTabs}}
  - {{{this}}}
  {{/each}}

  Based on the content of the documents and tabs, suggest connections between them and provide relevant search terms that the user can use to find more information.
  Return the results as JSON conforming to the following schema:
  ${JSON.stringify(SuggestConnectionsOutputSchema.describe, null, 2)}`,
});

const suggestConnectionsFlow = ai.defineFlow(
  {
    name: 'suggestConnectionsFlow',
    inputSchema: SuggestConnectionsInputSchema,
    outputSchema: SuggestConnectionsOutputSchema,
  },
  async input => {
    const {output} = await suggestConnectionsPrompt(input);
    return output!;
  }
);
