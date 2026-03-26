/**
 * Global Teardown for Visual Regression Tests
 *
 * Cleans up test environment after visual regression testing is complete.
 */
import { FullConfig } from '@playwright/test';
declare function globalTeardown(config: FullConfig): Promise<void>;
export default globalTeardown;
