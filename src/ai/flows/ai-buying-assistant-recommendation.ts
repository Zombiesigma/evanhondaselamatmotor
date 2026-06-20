'use server';
/**
 * @fileOverview An AI-powered buying assistant that recommends Honda motorcycle models and credit packages based on user needs and budget.
 *
 * - aiBuyingAssistantRecommendation - A function that handles the AI buying assistant recommendation process.
 * - AIBuyingAssistantRecommendationInput - The input type for the aiBuyingAssistantRecommendation function.
 * - AIBuyingAssistantRecommendationOutput - The return type for the aiBuyingAssistantRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotorcycleSchema = z.object({
  name: z.string().describe('Name of the motorcycle model.'),
  type: z.string().describe('Type of the motorcycle (e.g., Matic, Sport, Cub, Electric, Adventure).'),
  price: z.number().describe('On-The-Road (OTR) price of the motorcycle.'),
  engineCapacityCc: z.number().optional().describe('Engine capacity in CC.'),
  features: z.array(z.string()).optional().describe('Key features of the motorcycle.'),
});

const CreditOptionSchema = z.object({
  leasingProvider: z.string().describe('Name of the leasing provider.'),
  minDownPaymentPercentage: z.number().describe('Minimum down payment as a percentage (e.g., 20 for 20%).'),
  maxTenureMonths: z.number().describe('Maximum tenor in months (e.g., 36 for 36 months).'),
  minTenureMonths: z.number().describe('Minimum tenor in months (e.g., 12 for 12 months).'),
  averageInterestRatePercentage: z.number().optional().describe('Average annual interest rate percentage (e.g., 8.5 for 8.5%).'),
});

const AIBuyingAssistantRecommendationInputSchema = z.object({
  lifestyleNeeds: z.string().describe('A detailed description of the user\'s lifestyle, daily use, and preferences (e.g., "daily commute in heavy traffic", "weekend adventure rides", "family transport").'),
  budget: z.number().describe('The user\'s total budget for a motorcycle, including down payment and monthly installments.'),
  preferredMotorcycleType: z.string().optional().describe('Optional preferred motorcycle type (e.g., Matic, Sport, Cub, Electric).'),
  availableMotorcycles: z.array(MotorcycleSchema).describe('A list of available Honda motorcycle models with their details.'),
  availableCreditOptions: z.array(CreditOptionSchema).describe('A list of available credit options from various leasing providers.'),
});
export type AIBuyingAssistantRecommendationInput = z.infer<typeof AIBuyingAssistantRecommendationInputSchema>;

const RecommendedMotorcycleOutputSchema = z.object({
  name: z.string().describe('Name of the recommended motorcycle model.'),
  price: z.number().describe('On-The-Road (OTR) price of the recommended motorcycle.'),
  reason: z.string().describe('A brief explanation why this motorcycle is suitable for the user\'s needs.'),
});

const SuggestedCreditPackageOutputSchema = z.object({
  downPaymentAmount: z.number().describe('Suggested down payment amount in currency.'),
  downPaymentPercentage: z.number().describe('Suggested down payment as a percentage.'),
  tenureMonths: z.number().describe('Suggested tenor in months.'),
  estimatedMonthlyInstallment: z.number().describe('Estimated monthly installment amount.'),
  leasingProvider: z.string().describe('Suggested leasing provider.'),
  notes: z.string().optional().describe('Additional notes or considerations for the credit package.'),
});

const AIBuyingAssistantRecommendationOutputSchema = z.object({
  recommendedMotorcycles: z.array(RecommendedMotorcycleOutputSchema).describe('A list of recommended motorcycle models.'),
  suggestedCreditPackage: SuggestedCreditPackageOutputSchema.optional().describe('A suggested credit package based on the user\'s budget and selected motorcycle.'),
  explanation: z.string().describe('A comprehensive explanation of the recommendations, including how they match the user\'s lifestyle and budget.'),
});
export type AIBuyingAssistantRecommendationOutput = z.infer<typeof AIBuyingAssistantRecommendationOutputSchema>;

const recommendationPrompt = ai.definePrompt({
  name: 'aiBuyingAssistantRecommendationPrompt',
  input: { schema: AIBuyingAssistantRecommendationInputSchema },
  output: { schema: AIBuyingAssistantRecommendationOutputSchema },
  prompt: `You are an intelligent Honda motorcycle buying assistant. Your goal is to help prospective buyers find the most suitable Honda motorcycle models and suggest appropriate credit packages based on their lifestyle needs and budget.\n\nHere is the user's information:\n- Lifestyle Needs: {{{lifestyleNeeds}}}\n- Budget: {{{budget}}}\n{{#if preferredMotorcycleType}}- Preferred Motorcycle Type: {{{preferredMotorcycleType}}}\n{{/if}}\nHere are the available Honda motorcycle models:\n{{#each availableMotorcycles}}\n- Name: {{{name}}}, Type: {{{type}}}, Price: Rp. {{{price}}}{{#if engineCapacityCc}}, Engine: {{{engineCapacityCc}}}cc{{/if}}{{#if features}}, Features: {{#each features}}{{{this}}}{{/each}}{{/if}}\n{{/each}}\n\nHere are the available credit options:\n{{#each availableCreditOptions}}\n- Leasing Provider: {{{leasingProvider}}}, Min DP: {{{minDownPaymentPercentage}}}%, Min Tenure: {{{minTenureMonths}}} months, Max Tenure: {{{maxTenureMonths}}} months{{#if averageInterestRatePercentage}}, Avg Interest Rate: {{{averageInterestRatePercentage}}}%{{/if}}\n{{/each}}\n\nAnalyze the user's lifestyle needs and budget carefully.\n1. Recommend 1-3 Honda motorcycle models that best fit their description and are within their budget. For each recommendation, provide a brief reason.\n2. Based on the recommended motorcycle and the user's budget, suggest an ideal credit package. This should include a reasonable down payment amount and percentage, a suitable tenor, and an estimated monthly installment. Choose a leasing provider from the available options.\n3. Provide a comprehensive explanation of your recommendations, detailing how the chosen motorcycles and credit package align with the user's lifestyle and budget. If the budget is too low for any recommendation, advise them.\n\nEnsure the output adheres strictly to the specified JSON schema. Do not include any additional text outside the JSON.\n`,
});

const aiBuyingAssistantRecommendationFlow = ai.defineFlow(
  {
    name: 'aiBuyingAssistantRecommendationFlow',
    inputSchema: AIBuyingAssistantRecommendationInputSchema,
    outputSchema: AIBuyingAssistantRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await recommendationPrompt(input);
    if (!output) {
      throw new Error("No output received from the recommendation prompt.");
    }
    return output;
  }
);

export async function aiBuyingAssistantRecommendation(
  input: AIBuyingAssistantRecommendationInput
): Promise<AIBuyingAssistantRecommendationOutput> {
  return aiBuyingAssistantRecommendationFlow(input);
}
