/**
 * Printer Service Types and Interfaces
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This module defines the core types and interfaces for printer driver detection,
 * ESC/POS protocol communication, and authority-based printer service management.
 */
import { VenueMode, AuthorityMode, VenueConfiguration } from './venue-configuration-validation';
export type OperatingSystem = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
export interface Platform {
    os: OperatingSystem;
    browser: string;
    version: string;
    supportsDrivers: boolean;
}
export interface DriverDetectionResult {
    platform: Platform;
    driversRequired: boolean;
    driversDetected: boolean;
    installationGuidance?: InstallationGuidance;
    manualVerificationRequired: boolean;
}
export interface InstallationGuidance {
    downloadUrl: string;
    instructions: string[];
    troubleshootingSteps: string[];
    verificationSteps: string[];
}
export interface DriverStatus {
    installed: boolean;
    version?: string;
    compatible: boolean;
    error?: string;
}
export type ConnectionType = 'usb' | 'network' | 'bluetooth';
export type PrinterFeature = 'barcode' | 'qrcode' | 'logo' | 'cut' | 'drawer';
export interface PrinterConfig {
    printerName: string;
    connectionType: ConnectionType;
    ipAddress?: string;
    port?: number;
    tested: boolean;
    capabilities?: PrinterCapabilities;
}
export interface PrinterCapabilities {
    paperWidth: number;
    characterSets: string[];
    supportedFeatures: PrinterFeature[];
    maxLineLength: number;
}
export interface PrinterConnection {
    id: string;
    config: PrinterConfig;
    status: 'connected' | 'disconnected' | 'error';
    lastError?: string;
}
export type ESCPOSCommandType = 'text' | 'cut' | 'feed' | 'align' | 'font' | 'barcode';
export type TextAlignment = 'left' | 'center' | 'right';
export type FontStyle = 'normal' | 'bold' | 'large';
export interface ESCPOSCommand {
    type: ESCPOSCommandType;
    data: string | number;
    parameters?: Record<string, any>;
}
export interface ReceiptSection {
    lines: string[];
    alignment: TextAlignment;
    font: FontStyle;
}
export interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}
export interface VenueInfo {
    name: string;
    location?: string;
    phone?: string;
}
export interface ReceiptMetadata {
    venueInfo: VenueInfo;
    timestamp: Date;
    testMode: boolean;
}
export interface ReceiptData {
    header: ReceiptSection;
    items: ReceiptItem[];
    footer: ReceiptSection;
    metadata: ReceiptMetadata;
}
export type PrintQuality = 'good' | 'poor' | 'failed';
export interface TestResult {
    success: boolean;
    timestamp: Date;
    error?: string;
    printQuality?: PrintQuality;
}
export type PrinterStatusType = 'online' | 'offline' | 'paper_out' | 'error' | 'busy';
export interface PrinterStatus {
    status: PrinterStatusType;
    timestamp: Date;
    message?: string;
    errorCode?: string;
}
export type PrintJobStatus = 'queued' | 'printing' | 'completed' | 'failed' | 'retrying';
export interface PrintJob {
    id: string;
    receiptData: ReceiptData;
    status: PrintJobStatus;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    lastAttemptAt?: Date;
    error?: string;
}
export interface PrintQueueStatus {
    queueLength: number;
    processing: boolean;
    currentJob?: PrintJob;
    failedJobs: PrintJob[];
}
export type PrinterRequirementReason = 'basic_mode' | 'venue_pos_integration' | 'venue_tabeza_mode';
export interface PrinterRequirement {
    required: boolean;
    reason: PrinterRequirementReason;
    description: string;
}
export type ReceiptType = 'order' | 'payment' | 'refund' | 'other';
export type DistributionChoice = 'physical' | 'digital';
export type ConnectionStatus = 'connected' | 'idle' | 'disconnected';
export type DeviceType = 'mobile' | 'desktop';
export type DeliveryMethod = 'immediate' | 'queued';
export interface POSPrintData {
    receiptContent: string;
    printJobId: string;
    timestamp: Date;
    posSystemId: string;
    receiptType: ReceiptType;
}
export interface ParsedReceiptData {
    receiptType: ReceiptType;
    content: string;
    items: ReceiptItem[];
    total: number;
    metadata: {
        posSystemId?: string;
        transactionId?: string;
        timestamp: Date;
    };
}
export interface ConnectedCustomer {
    customerId: string;
    tabId: string;
    tabNumber: number;
    connectionStatus: ConnectionStatus;
    deviceInfo: {
        type: DeviceType;
        lastSeen: Date;
    };
    customerIdentifier: string;
}
export interface CustomerSelection {
    selectedCustomers: ConnectedCustomer[];
    deliveryMethod: DeliveryMethod;
    staffNotes?: string;
}
export interface DeliveryResult {
    deliveryId: string;
    successful: ConnectedCustomer[];
    failed: {
        customer: ConnectedCustomer;
        error: string;
    }[];
    timestamp: Date;
}
export interface InstallationResult {
    success: boolean;
    printerName: string;
    error?: string;
}
export type InterceptionAction = 'forwarded' | 'digitized' | 'cancelled';
export interface InterceptionResult {
    intercepted: boolean;
    printJobId: string;
    action: InterceptionAction;
}
export interface PrinterServiceConfig {
    venueMode: VenueMode;
    authorityMode: AuthorityMode;
    printerRequired: boolean;
    posIntegrationEnabled: boolean;
}
export declare class InvalidAuthorityConfigurationError extends Error {
    constructor(venueMode: VenueMode, authorityMode: AuthorityMode);
}
export declare class PrinterRequirementMismatchError extends Error {
    constructor(config: VenueConfiguration);
}
export declare class DriverDetectionError extends Error {
    constructor(platform: Platform, reason: string);
}
export declare class UnsupportedPlatformError extends Error {
    constructor(platform: Platform);
}
export declare class PrinterConnectionError extends Error {
    constructor(config: PrinterConfig, reason: string);
}
export declare class ESCPOSProtocolError extends Error {
    constructor(command: ESCPOSCommand, error: string);
}
export declare class PrintTestFailureError extends Error {
    constructor(printerName: string, error: string);
}
