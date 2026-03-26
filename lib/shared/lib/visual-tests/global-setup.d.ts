/**
 * Global Setup for Visual Regression Tests
 *
 * Sets up test environment and creates test venues with different configurations
 * for comprehensive theme testing across all venue modes and authority settings.
 */
import { FullConfig } from '@playwright/test';
declare function globalSetup(config: FullConfig): Promise<void>;
export default globalSetup;
