import OpenAI from 'openai';
import { prisma } from './prisma';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-proj-dummy-key-replace-me', // User must provide this
});

export async function classifyComplaint(title: string, description: string): Promise<string | null> {
    // Return early if no key provided to avoid crashes
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ [AI Classification] OPENAI_API_KEY is missing. Skipping intelligent classification.');
        return null; // Fallback to user selection
    }

    try {
        console.log('[AI Classification] Fetching categories for context...');

        // 1. Get all available categories with their departments
        // Caching this in memory would be better for prod, but direct DB query is fine for MVP
        const categories = await prisma.complaintCategory.findMany({
            include: { department: true }
        });

        if (categories.length === 0) return null;

        // 2. Format categories for the prompt
        // Format: UUID | Category Name | Department Type
        const categoryContext = categories
            .map(c => `${c.id} | ${c.name} | ${c.department.departmentType}`)
            .join('\n');

        const prompt = `
        You are an intelligent grievance classifier for a city administration system.
        
        Your task is to analyze the complaint and map it to the MOST appropriate Category ID from the list below.
        Consider the department type (e.g., WATER_SUPPLY, SANITATION) when making your decision.

        Complaint Title: "${title}"
        Complaint Description: "${description}"

        Available Categories (ID | Name | Department):
        ${categoryContext}

        INSTRUCTIONS:
        1. Return ONLY the UUID of the best matching category.
        2. Do not explain your reasoning.
        3. If the description mentions specific keywords (e.g., "water leak"), prioritize categories under the relevant department (e.g., WATER_SUPPLY).
        4. If no specific category fits, choose the most generic one available (e.g., "Other", "General").
        `;

        console.log('[AI Classification] Sending request to OpenAI...');

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a precise classification API. Output only valid UUIDs." },
                { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo",
            temperature: 0.1, // Low temperature for deterministic output
            max_tokens: 60,
        });

        const suggestedId = completion.choices[0].message.content?.trim();
        console.log('[AI Classification] AI suggested ID:', suggestedId);

        // 3. Validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (suggestedId && uuidRegex.test(suggestedId)) {
            // Verify it actually exists in our DB to be safe
            const isValid = categories.some(c => c.id === suggestedId);
            return isValid ? suggestedId : null;
        }

        return null;

    } catch (error) {
        console.error('❌ [AI Classification] Error:', error);
        return null; // Fail gracefully
    }
}
