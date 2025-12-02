import { knowledgeBaseService } from './knowledgeBase';

// Azure OpenAI Configuration - using environment variables for security
const AZURE_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT || "https://oai-mcm-agentic-flow-nprd01.openai.azure.com/";
const AZURE_DEPLOYMENT = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || "gpt-4.1";
const AZURE_API_KEY = process.env.REACT_APP_AZURE_OPENAI_KEY || "";
const API_VERSION = process.env.REACT_APP_AZURE_API_VERSION || "2024-02-15-preview";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Retry wrapper with exponential backoff for handling rate limiting and transient errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2,
  backoff: number = 2
): Promise<T> {
  let delay = baseDelay;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError = error.status === 429 || 
                               error.message?.includes('429') ||
                               error.message?.includes('rate limit');
      const isRetryableError = isRateLimitError || 
                               error.status >= 500 || 
                               error.message?.includes('network');
      
      console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed:`, error.message || error);
      
      if (attempt === maxRetries) {
        console.error(`[Retry] Failed after ${maxRetries} retries.`);
        throw error;
      }
      
      if (!isRetryableError) {
        console.error(`[Retry] Non-retryable error, failing immediately.`);
        throw error;
      }
      
      // Add random jitter (0-1 seconds) to avoid thundering herd
      const jitter = Math.random();
      const sleepTime = delay + jitter;
      
      console.info(`[Retry] Retrying in ${sleepTime.toFixed(2)}s...`);
      await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
      
      delay *= backoff;
    }
  }
  
  throw new Error('Retry logic error - should not reach here');
}

// Main chat function - Frontend Only
export async function sendChatMessage(
  caseId: string,
  userMessage: string,
  conversationHistory: Message[]
): Promise<{ response: string }> {
  try {
    // Get knowledge base (cached/persistent)
    const kb = await knowledgeBaseService.getKnowledgeBase(caseId);
    console.log(`📚 KB: ${kb.chunks.length} chunks from ${kb.documentCount} docs`);
    
    // Search for relevant chunks (120 chunks - comprehensive coverage for all documents)
    const chunks = knowledgeBaseService.searchKnowledgeBase(kb, userMessage, 120);
    console.log(`🔍 Found ${chunks.length} relevant chunks`);
    
    if (chunks.length > 0) {
      console.log(`📄 Top sources:`, chunks.slice(0, 5).map(c => c.source));
    }
    
    if (chunks.length === 0) {
      return { response: `I couldn't find information about "${userMessage}" in the case documents.` };
    }
    
    // Build context - ensure all document types are represented
    const context = chunks.map(c => c.content).join('\n\n');
    
    const systemPrompt = `You are a medical AI assistant for case ${caseId}. You have access to comprehensive case information including medical records, clinical notes, medical history, lab results, imaging reports, prior authorization forms, insurance information, and clinical guidelines.

Case Information:
${context}

CRITICAL FORMATTING INSTRUCTIONS - ALWAYS FOLLOW:

1. STRUCTURE YOUR RESPONSE COMPREHENSIVELY:
   - Use clear headings and subheadings
   - Break information into logical sections
   - Use bullet points (•) for lists
   - Use numbered lists (1., 2., 3.) for sequential information or procedures
   - Use line breaks between sections for readability

2. RESPONSE FORMAT TEMPLATE (adapt based on question type):

   **[Main Topic/Answer]**
   
   **Key Findings:**
   • Point 1 with specific details
   • Point 2 with values/dates
   • Point 3 with clinical observations
   
   **Detailed Information:**
   
   1. [First Category]
      • Detail with exact values
      • Date or timeline information
      • Relevant context
   
   2. [Second Category]
      • Specific findings
      • Clinical significance
      • Relevant measurements
   
   **Clinical Significance:**
   • Why this matters
   • Impact on treatment/authorization
   • Relevant guidelines or criteria

3. CONTENT REQUIREMENTS:
   - Include ALL relevant details from medical history, demographics, vital signs, medications, allergies
   - Use exact values, dates, and measurements from documents
   - Explain clinical significance when relevant
   - Be thorough but organized
   - Focus on clarity and readability

4. FORMATTING RULES:
   - Use **bold** for section headers
   - Use bullet points (•) for easy scanning
   - Keep related information grouped together
   - Add blank lines between major sections
   - Use indentation for sub-points

Example Response Format:

**Patient's Medical History**

**Chronic Conditions:**
• Hypertension - diagnosed 2018, currently controlled
• Type 2 Diabetes - on metformin 1000mg BID
• Sleep Apnea - AHI 28 events/hour (moderate-severe)

**Surgical History:**
1. Appendectomy - 2015
2. Knee arthroscopy - 2020

**Medications:**
• Lisinopril 10mg daily (blood pressure)
• Metformin 1000mg twice daily (diabetes)
• Atorvastatin 20mg nightly (cholesterol)

**Clinical Significance:**
• Multiple comorbidities requiring coordinated care management
• Sleep apnea severity requires therapeutic intervention

Remember: ALWAYS structure responses this way for maximum clarity and ease of understanding!`;


    
    // Include more conversation history for better context (last 8 messages)
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8),
      { role: 'user', content: userMessage }
    ];
    
    // Call Azure OpenAI API directly with retry logic
    const url = `${AZURE_ENDPOINT}openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
    
    console.log(`🤖 Calling Azure OpenAI...`);
    
    const data = await retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_API_KEY
        },
        body: JSON.stringify({
          messages: messages,
          temperature: 0.7,
          max_tokens: 12000, // Increased for comprehensive responses covering all document details
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const error: any = new Error(`Azure API error: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    });

    let answer = data.choices[0].message.content;
    
    // Preserve formatting for structured responses (keep **, *, bullets, etc.)
    // Only remove problematic characters if any
    answer = answer.trim();
    
    return { response: answer };
    
  } catch (error: any) {
    console.error('Chat error:', error);
    throw error;
  }
}

