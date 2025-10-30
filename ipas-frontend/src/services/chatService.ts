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
    
    // Search for relevant chunks (80 chunks - balanced coverage)
    const chunks = knowledgeBaseService.searchKnowledgeBase(kb, userMessage, 80);
    console.log(`🔍 Found ${chunks.length} relevant chunks`);
    
    if (chunks.length > 0) {
      console.log(`📄 Top sources:`, chunks.slice(0, 5).map(c => c.source));
    }
    
    if (chunks.length === 0) {
      return { response: `I couldn't find information about "${userMessage}" in the case documents.` };
    }
    
    // Build context
    const context = chunks.map(c => c.content).join('\n\n');
    
    const systemPrompt = `You are a medical AI assistant for case ${caseId}.

Case Information:
${context}

Instructions:
- Provide clear, complete answers using relevant information from the documents
- Include important details: dates, values, findings, diagnoses
- Be thorough but concise - cover key points without excessive detail
- Use exact data from medical records when relevant
- Organize information clearly`;


    
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
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
          max_tokens: 8000, // Balanced - thorough but not excessive
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
    
    // Clean response
    answer = answer.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '');
    
    return { response: answer };
    
  } catch (error: any) {
    console.error('Chat error:', error);
    throw error;
  }
}

