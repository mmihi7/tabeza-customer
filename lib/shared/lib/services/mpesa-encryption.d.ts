/**
 * Production-grade M-Pesa credential encryption utilities
 * Storage Contract: PostgreSQL bytea hex format (\x...) is the ONLY canonical format
 *
 * Rules:
 * - In-memory: Buffer
 * - Database: bytea (hex string \x...)
 * - API transport: never exposed
 * - Shared package input: bytea hex string
 */
/**
 * Encrypt a credential and return PostgreSQL bytea hex format
 * This is the ONLY way credentials should be stored in the database
 *
 * @param plaintext - The credential to encrypt
 * @returns PostgreSQL bytea hex string (format: \x1a2b3c...)
 */
export declare function encryptToBytea(plaintext: string): string;
/**
 * Decrypt a credential from PostgreSQL bytea hex format
 * This is the ONLY format we accept - no guessing, no fallbacks
 *
 * @param byteaHex - PostgreSQL bytea hex string (format: \x1a2b3c...)
 * @returns Decrypted plaintext string
 */
export declare function decryptFromBytea(byteaHex: string): string;
/**
 * Validate M-Pesa credentials format before encryption
 */
export declare function validateMpesaCredentials(credentials: {
    businessShortcode: string;
    consumerKey: string;
    consumerSecret: string;
    passkey: string;
}): {
    isValid: boolean;
    errors: string[];
};
/**
 * Test encryption/decryption cycle for diagnostics
 */
export declare function testEncryptionCycle(testValue?: string): boolean;
