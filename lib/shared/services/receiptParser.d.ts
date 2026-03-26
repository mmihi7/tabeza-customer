/**
 * AI-Powered Receipt Parser
 *
 * Uses DeepSeek API directly to parse receipt text into structured data
 * Falls back to regex parsing if DeepSeek is unavailable
 *
 * Setup: Add DEEPSEEK_API_KEY to .env
 * Get your API key from https://platform.deepseek.com
 *
 * Why DeepSeek?
 * - Direct API integration (no EC2 required)
 * - Cost-effective AI parsing
 * - 10-second timeout enforcement
 * - Structured JSON output
 * - Automatic fallback to regex
 */
interface ParsedReceipt {
    items: Array<{
        name: string;
        price: number;
    }>;
    total: number;
    receiptNumber?: string;
    rawText: string;
}
/**
 * Main parsing function - tries DeepSeek first, falls back to regex
 */
export declare function parseReceipt(receiptText: string, barId: string, documentName?: string): Promise<ParsedReceipt>;
export {};
