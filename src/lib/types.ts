export type UserRole = 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  dealershipIds?: string[];
  dealerships?: Dealership[];
  lastLoginAt?: string;
}

export interface Dealership {
  _id: string;
  name: string;
  code: string;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE';
  settings?: Record<string, any>;
}

export interface ColumnMappingItem {
  sourceColumn: string;
  targetField: string;
  dataType: 'string' | 'number' | 'currency' | 'date' | 'boolean';
  transformation?: 'none' | 'trim' | 'uppercase' | 'lowercase' | 'parse_currency' | 'parse_date';
  isRequired?: boolean;
}

export interface Report {
  _id: string;
  name: string;
  dealershipId: Dealership | string;
  uploadedBy: User | string;
  sourceFileName: string;
  sourceFileType: string;
  sourceFileSize: number;
  campaignName?: string;
  reportType?: string;
  reportDateFrom?: string;
  reportDateTo?: string;
  recordCount: number;
  status: 'DRAFT' | 'PARSED' | 'MAPPED' | 'IMPORTED' | 'ARCHIVED' | 'FAILED';
  columnMappings: ColumnMappingItem[];
  originalHeaders: string[];
  normalizedHeaders: string[];
  importId?: string;
  version: number;
  parentReportId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  year?: number;
  make?: string;
  model?: string;
}

export interface ReportRecord {
  _id: string;
  reportId: string;
  dealershipId: string;
  externalEntityId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  vehicle: Vehicle;
  campaignName?: string;
  campaignInsertDate?: string;
  eventNumber?: string;
  closeDate?: string;
  roAmount?: number;
  nOrU?: string;
  customFields?: Record<string, any>;
  sourceData: Record<string, any>;
  recordStatus: 'VALID' | 'WARNING' | 'ERROR';
  validationNotes?: string[];
  lastEditedBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSession {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'PENDING' | 'ANALYZING' | 'MAPPED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  duplicateCount: number;
  detectedHeaders: string[];
  mappingStatus: string;
  validationErrors?: Array<{ row: number; field: string; message: string; value?: any }>;
  startedAt?: string;
  completedAt?: string;
  reportId?: Report | string;
  uploadedBy?: User | string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  dealershipId: string;
  userId?: User | string;
  entityType: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PdfTemplateSettings {
  reportTitle: string;
  subtitle?: string;
  headerDealershipName?: string;
  campaignLabel?: string;
  dateRangeText?: string;
  primaryColor?: string;
  showSummaryMetrics?: boolean;
  columns: Array<{
    field: string;
    label: string;
    visible: boolean;
  }>;
  footerNotes?: string;
}

export interface TemplateItem {
  _id: string;
  dealershipId: string;
  name: string;
  type: 'PDF' | 'SMS' | 'EMAIL' | 'VA_TASK';
  pdfSettings?: PdfTemplateSettings;
  smsBody?: string;
  emailSubject?: string;
  emailBody?: string;
  vaTaskDescription?: string;
  availableVariables: string[];
  createdAt: string;
}
