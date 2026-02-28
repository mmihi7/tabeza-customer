/**
 * TABEZA Validation Library - Cross-System Validator
 * Validates data compatibility between cloud and agent systems
 */
import type { CrossSystemValidation, CrossSystemValidationParams, SystemType } from '../types';
/**
 * Cross-System Validator Class
 * Handles validation of data compatibility across cloud and agent systems
 */
export declare class CrossSystemValidator {
    private strictMode;
    constructor(options?: {
        strictMode?: boolean;
    });
    /**
     * Validate cross-system compatibility
     */
    validate(params: CrossSystemValidationParams): CrossSystemValidation;
    /**
     * Validate cloud system compatibility
     */
    private validateCloudCompatibility;
    /**
     * Validate agent system compatibility
     */
    private validateAgentCompatibility;
    /**
     * Check if data contains binary content
     */
    private containsBinaryData;
    /**
     * Check if data contains file system paths
     */
    private containsFilePaths;
    /**
     * Check if data contains OS-specific operations
     */
    private containsOSOperations;
    /**
     * Get approximate data size in bytes
     */
    private getDataSize;
    /**
     * Check if data is JSON serializable
     */
    private isSerializable;
    /**
     * Check for circular references
     */
    private hasCircularReferences;
    /**
     * Get object nesting depth
     */
    private getObjectDepth;
    /**
     * Check for Windows-incompatible paths
     */
    private hasIncompatiblePaths;
    /**
     * Get compatibility report
     */
    getCompatibilityReport(data: any, targetSystems: SystemType[]): {
        overall: 'COMPATIBLE' | 'PARTIALLY_COMPATIBLE' | 'INCOMPATIBLE';
        cloudScore: number;
        agentScore: number;
        recommendations: string[];
        blockers: string[];
    };
    /**
     * Set strict mode
     */
    setStrictMode(strict: boolean): void;
    /**
     * Get strict mode status
     */
    isStrictMode(): boolean;
}
//# sourceMappingURL=cross-system-validator.d.ts.map