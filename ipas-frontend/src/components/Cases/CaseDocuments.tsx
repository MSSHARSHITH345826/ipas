import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  CloudDownload as CloudDownloadIcon,
  Folder as FolderIcon,
  AttachFile as AttachFileIcon,
  AutoFixHigh as ExtractIcon,
  DataObject as JsonIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import DocumentComparisonViewer from './DocumentComparisonViewer';

interface CaseDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  category: 'polysomnography-report'| 'imaging'| 'lab-results'|'prior-auth' |'operativenotes' |'radionotes'| 'medical-records' |  'insurance' | 'clinical-notes' | 'diagnostics' | 'drnotes' | 'dmeform' | '2d-doppler' | 'ecg' | 'discharge-summary';
  size: string;
  uploadDate: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  url: string;
  originalUrl?: string;
  extractedUrl?: string;
  jsonUrl?: string;
  isExtracted?: boolean;
}

interface CaseDocumentsProps {
  caseId: string;
}

const CaseDocuments: React.FC<CaseDocumentsProps> = ({ caseId }) => {
  const [extractingDocuments, setExtractingDocuments] = useState<Set<string>>(new Set());
  const [extractionProgress, setExtractionProgress] = useState<Record<string, number>>({});
  const [extractedDocuments, setExtractedDocuments] = useState<Set<string>>(new Set());
  const [extractionTimestamps, setExtractionTimestamps] = useState<Record<string, string>>({});
  const [isExtractingAll, setIsExtractingAll] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [comparisonViewerOpen, setComparisonViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CaseDocument | null>(null);

  // Get case-specific documents based on caseId
  const getCaseDocuments = (caseId: string): CaseDocument[] => {
    // Map case IDs to specific case folders and documents
    const caseDocumentMap: Record<string, CaseDocument[]> = {
      'PA-2024-001': [
        {
          id: '1',
          name: 'Prior Authorization Request Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '1.6 MB',
          uploadDate: '2024-12-15',
          status: 'ready',
          url: '/sample-documents/cases/case-001-john-doe/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-001-john-doe/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-001-john-doe/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-001-john-doe/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Patient Medical History',
          type: 'pdf',
          category: 'medical-records',
          size: '1.2 MB',
          uploadDate: '2024-12-15',
          status: 'ready',
          url: '/sample-documents/cases/case-001-john-doe/patient-medical-history-original.pdf',
          originalUrl: '/sample-documents/cases/case-001-john-doe/patient-medical-history-original.pdf',
          extractedUrl: '/sample-documents/cases/case-001-john-doe/patient-medical-history.pdf',
          jsonUrl: '/sample-documents/cases/case-001-john-doe/patient-medical-history.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'MRI Brain Report',
          type: 'pdf',
          category: 'imaging',
          size: '890 KB',
          uploadDate: '2024-12-10',
          status: 'ready',
          url: '/sample-documents/cases/case-001-john-doe/mri-brain-report-original.pdf',
          originalUrl: '/sample-documents/cases/case-001-john-doe/mri-brain-report-original.pdf',
          extractedUrl: '/sample-documents/cases/case-001-john-doe/mri-brain-report.pdf',
          jsonUrl: '/sample-documents/cases/case-001-john-doe/mri-brain-report.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Insurance Card - BCBS',
          type: 'pdf',
          category: 'insurance',
          size: '156 KB',
          uploadDate: '2024-12-15',
          status: 'ready',
          url: '/sample-documents/cases/case-001-john-doe/insurance-card-original.pdf',
          originalUrl: '/sample-documents/cases/case-001-john-doe/insurance-card-original.pdf',
          extractedUrl: '/sample-documents/cases/case-001-john-doe/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-001-john-doe/insurance-card.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Physician Clinical Notes',
          type: 'pdf',
          category: 'clinical-notes',
          size: '678 KB',
          uploadDate: '2024-12-15',
          status: 'ready',
          url: '/sample-documents/cases/case-001-john-doe/physician-notes-original.pdf',
          originalUrl: '/sample-documents/cases/case-001-john-doe/physician-notes-original.pdf',
          extractedUrl: '/sample-documents/cases/case-001-john-doe/physician-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-001-john-doe/physician-notes.json',
          isExtracted: false
        }
      ],
      '002': [
        {
          id: '1',
          name: 'Prior Authorization Request Form (Original)',
          type: 'pdf',
          category: 'prior-auth',
          size: '1.8 MB',
          uploadDate: '2024-12-18',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Patient Medical History - Jane Smith',
          type: 'pdf',
          category: 'medical-records',
          size: '1.4 MB',
          uploadDate: '2024-12-18',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Stress Test Results',
          type: 'pdf',
          category: 'imaging',
          size: '1.1 MB',
          uploadDate: '2024-12-10',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/stress-test-results.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/stress-test-results.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/stress-test-results.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/stress-test-results.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Insurance Card - Aetna',
          type: 'pdf',
          category: 'insurance',
          size: '189 KB',
          uploadDate: '2024-12-18',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/insurance-card.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/insurance-card.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/insurance-card.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Cardiology Consultation Notes',
          type: 'pdf',
          category: 'clinical-notes',
          size: '756 KB',
          uploadDate: '2024-12-18',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.json',
          isExtracted: false
        }
      ],
      '003': [
        {
          id: '1',
          name: 'Prior Authorization Request Form (Original)',
          type: 'pdf',
          category: 'prior-auth',
          size: '2.1 MB',
          uploadDate: '2024-12-20',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Patient Medical History - Mike Johnson',
          type: 'pdf',
          category: 'medical-records',
          size: '1.6 MB',
          uploadDate: '2024-12-20',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/patient-medical-history.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/patient-medical-history.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/patient-medical-history.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/patient-medical-history.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'MRI Knee Report',
          type: 'pdf',
          category: 'imaging',
          size: '1.3 MB',
          uploadDate: '2024-12-05',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/mri-knee-report.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/mri-knee-report.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/mri-knee-report.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/mri-knee-report.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Insurance Card - UnitedHealthcare',
          type: 'pdf',
          category: 'insurance',
          size: '198 KB',
          uploadDate: '2024-12-20',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/insurance-card.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/insurance-card.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/insurance-card.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Robert Davis Medical Records',
          type: 'pdf',
          category: 'clinical-notes',
          size: '892 KB',
          uploadDate: '2024-12-20',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/pt-notes.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/pt-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/pt-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/pt-notes.json',
          isExtracted: false
        }
      ],
      '004': [
        {
          id: '1',
          name: 'Prior Authorization Request Form (Original)',
          type: 'pdf',
          category: 'prior-auth',
          size: '1.9 MB',
          uploadDate: '2024-12-22',
          status: 'ready',
          url: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Patient Medical History - Sarah Wilson',
          type: 'pdf',
          category: 'medical-records',
          size: '1.8 MB',
          uploadDate: '2024-12-22',
          status: 'ready',
          url: '/sample-documents/cases/case-004-sarah-wilson/patient-medical-history.pdf',
          originalUrl: '/sample-documents/cases/case-004-sarah-wilson/patient-medical-history.pdf',
          extractedUrl: '/sample-documents/cases/case-004-sarah-wilson/patient-medical-history.pdf',
          jsonUrl: '/sample-documents/cases/case-004-sarah-wilson/patient-medical-history.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'CT Abdomen Report',
          type: 'pdf',
          category: 'imaging',
          size: '1.5 MB',
          uploadDate: '2024-12-18',
          status: 'ready',
          url: '/sample-documents/cases/case-004-sarah-wilson/ct-abdomen-report.pdf',
          originalUrl: '/sample-documents/cases/case-004-sarah-wilson/ct-abdomen-report.pdf',
          extractedUrl: '/sample-documents/cases/case-004-sarah-wilson/ct-abdomen-report.pdf',
          jsonUrl: '/sample-documents/cases/case-004-sarah-wilson/ct-abdomen-report.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Insurance Card - Cigna',
          type: 'pdf',
          category: 'insurance',
          size: '167 KB',
          uploadDate: '2024-12-22',
          status: 'ready',
          url: '/sample-documents/cases/case-004-sarah-wilson/insurance-card.pdf',
          originalUrl: '/sample-documents/cases/case-004-sarah-wilson/insurance-card.pdf',
          extractedUrl: '/sample-documents/cases/case-004-sarah-wilson/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-004-sarah-wilson/insurance-card.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Gastroenterology Consultation Notes',
          type: 'pdf',
          category: 'clinical-notes',
          size: '945 KB',
          uploadDate: '2024-12-22',
          status: 'ready',
          url: '/sample-documents/cases/case-004-sarah-wilson/gastroenterology-notes.pdf',
          originalUrl: '/sample-documents/cases/case-004-sarah-wilson/gastroenterology-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-004-sarah-wilson/gastroenterology-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-004-sarah-wilson/gastroenterology-notes.json',
          isExtracted: false
        }
      ],
      '005': [
        {
          id: '1',
          name: 'Prior Authorization Request Form (Original)',
          type: 'pdf',
          category: 'prior-auth',
          size: '2.3 MB',
          uploadDate: '2024-12-25',
          status: 'ready',
          url: '/sample-documents/cases/case-005-david-brown/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-005-david-brown/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-005-david-brown/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-005-david-brown/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Patient Medical History - David Brown',
          type: 'pdf',
          category: 'medical-records',
          size: '2.0 MB',
          uploadDate: '2024-12-25',
          status: 'ready',
          url: '/sample-documents/cases/case-005-david-brown/patient-medical-history.pdf',
          originalUrl: '/sample-documents/cases/case-005-david-brown/patient-medical-history.pdf',
          extractedUrl: '/sample-documents/cases/case-005-david-brown/patient-medical-history.pdf',
          jsonUrl: '/sample-documents/cases/case-005-david-brown/patient-medical-history.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Prostate Biopsy Report',
          type: 'pdf',
          category: 'imaging',
          size: '1.7 MB',
          uploadDate: '2024-12-10',
          status: 'ready',
          url: '/sample-documents/cases/case-005-david-brown/prostate-biopsy-report.pdf',
          originalUrl: '/sample-documents/cases/case-005-david-brown/prostate-biopsy-report.pdf',
          extractedUrl: '/sample-documents/cases/case-005-david-brown/prostate-biopsy-report.pdf',
          jsonUrl: '/sample-documents/cases/case-005-david-brown/prostate-biopsy-report.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Insurance Card - Humana',
          type: 'pdf',
          category: 'insurance',
          size: '189 KB',
          uploadDate: '2024-12-25',
          status: 'ready',
          url: '/sample-documents/cases/case-005-david-brown/insurance-card.pdf',
          originalUrl: '/sample-documents/cases/case-005-david-brown/insurance-card.pdf',
          extractedUrl: '/sample-documents/cases/case-005-david-brown/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-005-david-brown/insurance-card.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Urology Consultation Notes',
          type: 'pdf',
          category: 'clinical-notes',
          size: '1.1 MB',
          uploadDate: '2024-12-25',
          status: 'ready',
          url: '/sample-documents/cases/case-005-david-brown/urology-notes.pdf',
          originalUrl: '/sample-documents/cases/case-005-david-brown/urology-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-005-david-brown/urology-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-005-david-brown/urology-notes.json',
          isExtracted: false
        }
      ],
      'PA-2024-002': [
        {
          id: '1',
          name: 'Prior Authorization Request Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '1.8 MB',
          uploadDate: '2024-01-16',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Patient Medical History',
          type: 'pdf',
          category: 'medical-records',
          size: '1.2 MB',
          uploadDate: '2024-01-16',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/patient-medical-history.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Stress Test Results',
          type: 'pdf',
          category: 'medical-records',
          size: '1.2 MB',
          uploadDate: '2024-01-16',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/stress-test-results.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/stress-test-results.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/stress-test-results.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/stress-test-results.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Insurance Card',
          type: 'image',
          category: 'insurance',
          size: '0.9 MB',
          uploadDate: '2024-01-16',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/insurance-card.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/insurance-card.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/insurance-card.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Cardiology Notes',
          type: 'pdf',
          category: 'clinical-notes',
          size: '1.1 MB',
          uploadDate: '2024-01-16',
          status: 'ready',
          url: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.pdf',
          originalUrl: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-002-jane-smith/cardiology-notes.json',
          isExtracted: false
        }
      ],
      'PA-2024-003': [
        {
          id: '1',
          name: 'Prior Authorization Request Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '1.7 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/prior-auth-request-form.json',
          isExtracted: false
        },

        {
          id: '3',
          name: 'Robert Davis Medical Records',
          type: 'pdf',
          category: 'medical-records',
          size: '1.5 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/pt-notes.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/pt-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/pt-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/pt-notes.json',
          isExtracted: false
        },
        {
          id: '8',
          name: 'DME Request form',
          type: 'pdf',
          category: 'dmeform',
          size: '0.9 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/dme.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/dme.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/dme.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/dme.json',
          isExtracted: false
        },
        {
          id: '7',
          name: 'Doctors Note',
          type: 'pdf',
          category: 'drnotes',
          size: '0.9 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/case-003-mike-johnson/drnotes.pdf',
          originalUrl: '/sample-documents/cases/case-003-mike-johnson/drnotes.pdf',
          extractedUrl: '/sample-documents/cases/case-003-mike-johnson/drnotes.pdf',
          jsonUrl: '/sample-documents/cases/case-003-mike-johnson/drnotes.json',
          isExtracted: false
        }
      ],
      'PA-2024-004': [
        {
          id: '1',
          name: 'Prior Authorization Request Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '1.7 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-request-form.pdf',
          jsonUrl: '/sample-documents/cases/case-004-sarah-wilson/prior-auth-request-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Operative Notes',
          type: 'pdf',
          category: 'operativenotes',
          size: '3.2 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/Clincase-004-sarah-wilsonical/opnote.pdf',
          originalUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/opnote.pdf',
          extractedUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/opnote.pdf',
          jsonUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/opnote.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Radiology Notes',
          type: 'pdf',
          category: 'radionotes',
          size: '1.5 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/Clincase-004-sarah-wilsonical/radionote.pdf',
          originalUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/radionote.pdf',
          extractedUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/radionote.pdf',
          jsonUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/radionote.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Doctor Notes',
          type: 'pdf',
          category: 'drnotes',
          size: '0.9 MB',
          uploadDate: '2024-01-17',
          status: 'ready',
          url: '/sample-documents/cases/Clincase-004-sarah-wilsonical/drnote.pdf',
          originalUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/drnote.pdf',
          extractedUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/drnote.pdf',
          jsonUrl: '/sample-documents/cases/Clincase-004-sarah-wilsonical/drnote.json',
          isExtracted: false
        }
      ],
      'PA-2024-006': [
        {
          id: '1',
          name: 'Prior Authorization Request Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '2.1 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-006-rebecca-hardin/prior-auth-form-original.pdf',
          originalUrl: '/sample-documents/cases/case-006-rebecca-hardin/prior-auth-form-original.pdf',
          extractedUrl: '/sample-documents/cases/case-006-rebecca-hardin/structured-text.pdf',
          jsonUrl: '/sample-documents/cases/case-006-rebecca-hardin/prior-auth-form-extracted.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Medical Records',
          type: 'pdf',
          category: 'medical-records',
          size: '3.2 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-006-rebecca-hardin/medical_records.pdf',
          originalUrl: '/sample-documents/cases/case-006-rebecca-hardin/medical_records.pdf',
          extractedUrl: '/sample-documents/cases/case-006-rebecca-hardin/extr/medical-records.pdf',
          jsonUrl: '/sample-documents/cases/case-006-rebecca-hardin/medical_records.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Polysomnography Report',
          type: 'pdf',
          category: 'polysomnography-report',
          size: '1.8 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-006-rebecca-hardin/polysomnography.pdf',
          originalUrl: '/sample-documents/cases/case-006-rebecca-hardin/polysomnography.pdf',
          extractedUrl: '/sample-documents/cases/case-006-rebecca-hardin/extr/polysomnography.pdf',
          jsonUrl: '/sample-documents/cases/case-006-rebecca-hardin/polysomnography.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Doctor Notes',
          type: 'pdf',
          category: 'clinical-notes',
          size: '1.2 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-006-rebecca-hardin/doctor-notes.pdf',
          originalUrl: '/sample-documents/cases/case-006-rebecca-hardin/doctor-notes.pdf',
          extractedUrl: '/sample-documents/cases/case-006-rebecca-hardin/extr/doctor-notes.pdf',
          jsonUrl: '/sample-documents/cases/case-006-rebecca-hardin/doctor-notes.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Insurance Card',
          type: 'pdf',
          category: 'insurance',
          size: '0.9 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-006-rebecca-hardin/insurance-card.pdf',
          originalUrl: '/sample-documents/cases/case-006-rebecca-hardin/insurance-card.pdf',
          extractedUrl: '/sample-documents/cases/case-006-rebecca-hardin/extr/insurance-card.pdf',
          jsonUrl: '/sample-documents/cases/case-006-rebecca-hardin/insurance-card.json',
          isExtracted: false
        }
      ],
      'PA-2024-007': [
        {
          id: '1',
          name: 'Prior Authorization Request Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '2.1 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-007/Prior Authorization Request Form 007.pdf',
          originalUrl: '/sample-documents/cases/case-007/Prior Authorization Request Form 007.pdf',
          extractedUrl: '/sample-documents/cases/case-007/prior auth extracted.pdf',
          jsonUrl: '/sample-documents/cases/case-007/AuthReq.json',
          isExtracted: false
        },
        {
          id: '2',
          name: 'Medical Records',
          type: 'pdf',
          category: 'medical-records',
          size: '3.2 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-007/medrec.pdf ',
          originalUrl: '/sample-documents/cases/case-007/medrec.pdf',
          extractedUrl: '/sample-documents/cases/case-007/med records.pdf',
          jsonUrl: '/sample-documents/cases/case-007/MedicalRecords.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Lab Results',
          type: 'pdf',
          category: 'lab-results',
          size: '3.2 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-007/labres.pdf',
          originalUrl: '/sample-documents/cases/case-007/labres.pdf',
          extractedUrl: '/sample-documents/cases/case-007/labres1.pdf',
          jsonUrl: '/sample-documents/cases/case-007/labres.pdf',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Imaging',
          type: 'pdf',
          category: 'imaging',
          size: '3.2 MB',
          uploadDate: '2024-04-25',
          status: 'ready',
          url: '/sample-documents/cases/case-007/image.pdf',
          originalUrl: '/sample-documents/cases/case-007/image.pdf',
          extractedUrl: '/sample-documents/cases/case-007/Image structured.pdf',
          jsonUrl: '/sample-documents/cases/case-007/image.json',
          isExtracted: false
        }
  
      ],
      'PA-2024-008': [
        {
          id: '1',
          name: 'Prior Auth Form',
          type: 'pdf',
          category: 'prior-auth',
          size: '2.1 MB',
          uploadDate: '2024-10-08',
          status: 'ready',
          url: '/sample-documents/cases/008/Prior Authorization-Form.pdf',
          originalUrl: '/sample-documents/cases/008/Prior Authorization-Form.pdf',
          extractedUrl: '/sample-documents/cases/008/summ/prior.pdf',
          jsonUrl: '/sample-documents/cases/008/prior-auth-form.json',
          isExtracted: false
        },
        {
          id: '2',
          name: '2D Doppler Study',
          type: 'pdf',
          category: '2d-doppler',
          size: '4.5 MB',
          uploadDate: '2024-10-08',
          status: 'ready',
          url: '/sample-documents/cases/008/2D Doppler Study.pdf',
          originalUrl: '/sample-documents/cases/008/2D Doppler Study.pdf',
          extractedUrl: '/sample-documents/cases/008/summ/dop.pdf',
          jsonUrl: '/sample-documents/cases/008/2d-doppler-study.json',
          isExtracted: false
        },
        {
          id: '3',
          name: 'Laboratory Study',
          type: 'pdf',
          category: 'lab-results',
          size: '1.8 MB',
          uploadDate: '2024-10-08',
          status: 'ready',
          url: '/sample-documents/cases/008/Laboratory Study.pdf',
          originalUrl: '/sample-documents/cases/008/Laboratory Study.pdf',
          extractedUrl: '/sample-documents/cases/008/summ/lab.pdf',
          jsonUrl: '/sample-documents/cases/008/laboratory-study.json',
          isExtracted: false
        },
        {
          id: '4',
          name: 'Cardiac rehabilitation',
          type: 'pdf',
          category: 'ecg',
          size: '1.2 MB',
          uploadDate: '2024-10-08',
          status: 'ready',
          url: '/sample-documents/cases/008/Cardiac rehabilitation.pdf',
          originalUrl: '/sample-documents/cases/008/Cardiac rehabilitation.pdf',
          extractedUrl: '/sample-documents/cases/008/summ/Electrocard.pdf',
          jsonUrl: '/sample-documents/cases/008/Cardiac rehabilitation.json',
          isExtracted: false
        },
        {
          id: '5',
          name: 'Discharge Summary',
          type: 'pdf',
          category: 'discharge-summary',
          size: '2.4 MB',
          uploadDate: '2024-10-09',
          status: 'ready',
          url: '/sample-documents/cases/008/Discharge Summary.pdf',
          originalUrl: '/sample-documents/cases/008/Discharge Summary.pdf',
          extractedUrl: '/sample-documents/cases/008/summ/discharge.pdf',
          jsonUrl: '/sample-documents/cases/008/discharge-summary.json',
          isExtracted: false
        },
        {
          id: '6',
          name: 'Operative Report',
          type: 'pdf',
          category: 'operativenotes',
          size: '3.1 MB',
          uploadDate: '2024-10-08',
          status: 'ready',
          url: '/sample-documents/cases/008/Operative Report.pdf',
          originalUrl: '/sample-documents/cases/008/Operative Report.pdf',
          extractedUrl: '/sample-documents/cases/008/summ/oper.pdf',
          jsonUrl: '/sample-documents/cases/008/operative-report.json',
          isExtracted: false
        }
      ]

    };

    return caseDocumentMap[caseId] || caseDocumentMap['PA-2024-001']; // Default to PA-2024-001 if not found
  };

  const documents = getCaseDocuments(caseId);

  // Load extraction state from localStorage on component mount
  useEffect(() => {
    const loadState = () => {
      const storageKey = `ipas_extractions_${caseId}`;
      const savedState = localStorage.getItem(storageKey);
      
      console.log('Component mounted, checking localStorage:', { storageKey, savedState });
      
      // Also check for alternative key formats
      const altKey1 = `ipas_extractions_${caseId.replace('PA-', '').replace('-', '')}`;
      const altKey2 = `ipas_extractions_${caseId.replace('PA-', '')}`;
      const altState1 = localStorage.getItem(altKey1);
      const altState2 = localStorage.getItem(altKey2);
      
      console.log('Alternative keys checked:', { altKey1, altKey2, altState1, altState2 });
      
      // Check all localStorage keys that start with 'ipas_extractions_'
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('ipas_extractions_'));
      console.log('All ipas_extractions keys in localStorage:', allKeys);
      
      // Try to load from the main key first
      let stateToLoad = savedState;
      let keyUsed = storageKey;
      
      // If main key is empty, try alternative keys
      if (!stateToLoad || stateToLoad === '{"extractedDocuments":[],"extractionTimestamps":{}}') {
        if (altState1 && altState1 !== '{"extractedDocuments":[],"extractionTimestamps":{}}') {
          stateToLoad = altState1;
          keyUsed = altKey1;
          console.log('Using alternative key 1:', altKey1);
        } else if (altState2 && altState2 !== '{"extractedDocuments":[],"extractionTimestamps":{}}') {
          stateToLoad = altState2;
          keyUsed = altKey2;
          console.log('Using alternative key 2:', altKey2);
        }
      }
      
      if (stateToLoad && stateToLoad !== '{"extractedDocuments":[],"extractionTimestamps":{}}') {
        try {
          const parsedState = JSON.parse(stateToLoad);
          const extractedDocs = new Set<string>(parsedState.extractedDocuments || []);
          const timestamps = parsedState.extractionTimestamps || {};
          
          console.log('Loading extraction state from key:', keyUsed, { 
            extractedDocs: Array.from(extractedDocs), 
            timestamps,
            extractedCount: extractedDocs.size 
          });
          
          setExtractedDocuments(extractedDocs);
          setExtractionTimestamps(timestamps);
          
          // Force a re-render to ensure state is properly displayed
          setForceUpdate(prev => prev + 1);
        } catch (error) {
          console.error('Error loading extraction state:', error);
        }
      } else {
        console.log('No valid saved state found for case:', caseId);
      }
      
      setIsStateLoaded(true);
    };

    // Load immediately without delay
    loadState();
  }, [caseId]);

  // Save extraction state to localStorage whenever it changes
  useEffect(() => {
    const storageKey = `ipas_extractions_${caseId}`;
    const stateToSave = {
      extractedDocuments: Array.from(extractedDocuments),
      extractionTimestamps
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    console.log('Saving extraction state:', { storageKey, stateToSave });
  }, [caseId, extractedDocuments, extractionTimestamps]);

  // Monitor state changes for debugging
  useEffect(() => {
    console.log('State changed:', {
      extractedDocuments: Array.from(extractedDocuments),
      extractionTimestamps,
      isStateLoaded,
      forceUpdate
    });
  }, [extractedDocuments, extractionTimestamps, isStateLoaded, forceUpdate]);

  const handleExtractDocument = async (documentId: string) => {
    setExtractingDocuments(prev => new Set(prev).add(documentId));
    setExtractionProgress(prev => ({ ...prev, [documentId]: 0 }));

    // Simulate extraction progress
    const progressInterval = setInterval(() => {
      setExtractionProgress(prev => {
        const currentProgress = prev[documentId] || 0;
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          setExtractingDocuments(prev => {
            const newSet = new Set(prev);
            newSet.delete(documentId);
            return newSet;
          });
          setExtractedDocuments(prev => new Set(prev).add(documentId));
          return prev;
        }
        return { ...prev, [documentId]: currentProgress + 10 };
      });
    }, 200);

    // Simulate extraction completion after 2-4 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      setExtractingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
      setExtractionProgress(prev => ({ ...prev, [documentId]: 100 }));
      setExtractedDocuments(prev => new Set(prev).add(documentId));
      setExtractionTimestamps(prev => ({ 
        ...prev, 
        [documentId]: new Date().toISOString() 
      }));
    }, 3000);
  };

  const handleExtractAll = async () => {
    setIsExtractingAll(true);
    
    // Get all documents that haven't been extracted yet
    const documentsToExtract = documents.filter(doc => !extractedDocuments.has(doc.id));
    
    // Start extraction for all documents in parallel with staggered completion
    const extractionPromises = documentsToExtract.map((doc, index) => {
      return new Promise<void>((resolve) => {
        // Stagger the extractions slightly for better visual effect
        const baseDelay = index * 200; // 200ms between each start
        const randomDelay = Math.random() * 1500 + 500; // 500-2000ms processing time
        const totalDelay = baseDelay + randomDelay;
        
        setTimeout(() => {
          setExtractedDocuments(prev => new Set(prev).add(doc.id));
          setExtractionTimestamps(prev => ({ 
            ...prev, 
            [doc.id]: new Date().toISOString() 
          }));
          resolve();
        }, totalDelay);
      });
    });

    // Wait for all extractions to complete
    await Promise.all(extractionPromises);
    
    setIsExtractingAll(false);
    
    // Show completion message
    setShowCompletionMessage(true);
    setTimeout(() => {
      setShowCompletionMessage(false);
    }, 3000);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'image':
        return <ImageIcon color="primary" />;
      case 'doc':
        return <DocIcon color="info" />;
      default:
        return <AttachFileIcon color="action" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prior-auth':
        return <DocumentIcon color="primary" />;
      case 'medical-records':
      case 'lab-results':
        return <FolderIcon color="success" />;
      case 'imaging':
        return <ImageIcon color="info" />;
      case 'insurance':
        return <CloudDownloadIcon color="warning" />;
      case 'clinical-notes':
        return <DocumentIcon color="secondary" />;
      case 'drnotes':
        return <DocumentIcon color="secondary" />;
      case 'dmeform':
        return <DocumentIcon color="secondary" />;
      case 'polysomnography-report':
      case 'operativenotes':
      case 'radionotes':
        return <DocumentIcon color="secondary" />;
      case '2d-doppler':
      case 'ecg':
        return <ImageIcon color="info" />;
      case 'discharge-summary':
        return <DocumentIcon color="primary" />;

      default:
        return <AttachFileIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'processing':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'prior-auth':
        return 'Prior Authorization';
      case 'medical-records':
        return 'Medical Records';
      case 'imaging':
        return 'Imaging';
      case 'insurance':
        return 'Insurance';
      case 'clinical-notes':
        return 'Clinical Notes';
      case 'drnotes':
        return 'Doctor Notes';
      case 'dmeform':
        return 'DME Form';
      case 'operativenotes':
        return 'Operative Notes'
      case 'radionotes':
        return 'Radiology Notes'
      case 'lab-results':
        return 'Lab Results'
      case 'polysomnography-report':
        return 'Polysomnography Report'
      case '2d-doppler':
        return '2D Doppler Study'
      case 'ecg':
        return 'Cardiac rehabilitation'
      case 'discharge-summary':
        return 'Discharge Summary'

      default:
        return 'Other';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    }
  };

  const handleDownload = (caseDocument: CaseDocument) => {
    const link = document.createElement('a');
    link.href = caseDocument.url;
    link.download = caseDocument.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (caseDocument: CaseDocument) => {
    window.open(caseDocument.url, '_blank');
  };

  const handleCompareDocument = (doc: CaseDocument) => {
    setSelectedDocument(doc);
    setComparisonViewerOpen(true);
  };

  // Group documents by category
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, CaseDocument[]>);

  // Calculate extraction statistics
  const totalDocuments = documents.length;
  const extractedCount = extractedDocuments.size;
  const remainingCount = totalDocuments - extractedCount;

  // Debug logging
  console.log('CaseDocuments render:', {
    caseId,
    totalDocuments,
    extractedCount,
    remainingCount,
    extractedDocuments: Array.from(extractedDocuments),
    extractionTimestamps,
    isStateLoaded
  });

  // Don't render until state is loaded
  if (!isStateLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography>Loading document state...</Typography>
      </Box>
    );
  }

  // Additional check to ensure we have the latest state
  console.log('Rendering with state:', {
    extractedDocuments: Array.from(extractedDocuments),
    extractionTimestamps,
    isStateLoaded,
    forceUpdate
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Case Documents - #{caseId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All documents related to this prior authorization case. Click to view or download.
          </Typography>
        </Box>
        
        {/* Extract All Button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ExtractIcon />}
              onClick={handleExtractAll}
              disabled={isExtractingAll || remainingCount === 0}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #45a049 30%, #3d8b40 90%)',
                },
                minWidth: 200,
                py: 1.5
              }}
            >
              {isExtractingAll ? 'Extracting All...' : `Extract All (${remainingCount} remaining)`}
            </Button>
            
            {extractedCount > 0 && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  setExtractedDocuments(new Set());
                  setExtractionTimestamps({});
                }}
                sx={{
                  borderColor: '#f44336',
                  color: '#f44336',
                  minWidth: 120,
                  py: 1.5,
                  '&:hover': {
                    borderColor: '#d32f2f',
                    backgroundColor: '#ffebee'
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
          
          {/* Progress indicator */}
          {isExtractingAll && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress 
                sx={{ 
                  width: 150, 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                  }
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                Processing...
              </Typography>
            </Box>
          )}
          
          {/* Extraction summary */}
          {extractedCount > 0 && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold', display: 'block' }}>
                ✓ {extractedCount} of {totalDocuments} documents extracted
              </Typography>
              {extractionTimestamps && Object.keys(extractionTimestamps).length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Last extraction: {formatTimestamp(Object.values(extractionTimestamps).sort().pop() || '')}
                </Typography>
              )}
            </Box>
          )}
          
          {/* Completion message */}
          {showCompletionMessage && (
            <Typography 
              variant="caption" 
              color="success.main" 
              sx={{ 
                fontWeight: 'bold',
                animation: 'pulse 1s ease-in-out',
                '@keyframes pulse': {
                  '0%': { opacity: 0.5 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.5 }
                }
              }}
            >
              🎉 All documents successfully extracted!
            </Typography>
          )}
        </Box>
      </Box>

      {Object.entries(groupedDocuments).map(([category, docs]) => (
        <Card key={category} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getCategoryIcon(category)}
              <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                {getCategoryName(category)}
              </Typography>
              <Chip 
                label={`${docs.length} document${docs.length > 1 ? 's' : ''}`} 
                size="small" 
                color="primary" 
                sx={{ ml: 2 }}
              />
            </Box>
            
            <List>
              {docs.map((doc, index) => {
                const isExtracted = extractedDocuments.has(doc.id);
                console.log(`Processing doc ${doc.id} (${doc.name}): isExtracted=${isExtracted}`);
                
                if (isExtracted) {
                  console.log(`Rendering extracted documents for ${doc.name} (${doc.id})`);
                }
                
                return (
                <React.Fragment key={doc.id}>
                  {/* Original Document */}
                  <ListItem
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      },
                      backgroundColor: isExtractingAll && !isExtracted 
                        ? '#fff3e0' 
                        : 'transparent',
                      borderLeft: isExtractingAll && !isExtracted
                        ? '4px solid #FF9800'
                        : 'none'
                    }}
                  >
                    <ListItemIcon>
                      {getDocumentIcon(doc.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {doc.name} (Original)
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Size: {doc.size} • Uploaded: {doc.uploadDate}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={doc.status.toUpperCase()}
                              size="small"
                              color={getStatusColor(doc.status)}
                            />
                            {isExtractingAll && !isExtracted && (
                              <Chip
                                label="QUEUED"
                                size="small"
                                color="warning"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView({ ...doc, url: doc.originalUrl || doc.url })}
                          title="View Original Document"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleCompareDocument(doc)}
                          title="Compare Original with Extracted Text"
                        >
                          <CompareIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleDownload({ ...doc, url: doc.originalUrl || doc.url })}
                          title="Download Original Document"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>

                  {/* Extraction Button */}
                  <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<ExtractIcon />}
                        onClick={() => handleExtractDocument(doc.id)}
                        disabled={extractingDocuments.has(doc.id) || isExtractingAll}
                        sx={{ 
                          minWidth: 200,
                          background: isExtracted 
                            ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                            : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          '&:hover': {
                            background: isExtracted
                              ? 'linear-gradient(45deg, #45a049 30%, #3d8b40 90%)'
                              : 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                          },
                          '&:disabled': {
                            background: isExtractingAll 
                              ? 'linear-gradient(45deg, #FF9800 30%, #F57C00 90%)'
                              : undefined
                          }
                        }}
                      >
                        {isExtractingAll && !isExtracted ? 'Queued for Extraction...' :
                         extractingDocuments.has(doc.id) ? 'Extracting...' : 
                         isExtracted ? 'Re-extract Data' : 'Extract Data'}
                      </Button>
                      
                      {isExtracted && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setExtractedDocuments(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(doc.id);
                              return newSet;
                            });
                            setExtractionTimestamps(prev => {
                              const newTimestamps = { ...prev };
                              delete newTimestamps[doc.id];
                              return newTimestamps;
                            });
                          }}
                          sx={{ 
                            minWidth: 120,
                            borderColor: '#f44336',
                            color: '#f44336',
                            '&:hover': {
                              borderColor: '#d32f2f',
                              backgroundColor: '#ffebee'
                            }
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </Box>
                  </ListItem>

                  {/* Extraction Progress */}
                  {extractingDocuments.has(doc.id) && (
                    <ListItem sx={{ py: 1 }}>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={extractionProgress[doc.id] || 0}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          AI is extracting structured data from the document... {extractionProgress[doc.id] || 0}%
                        </Typography>
                      </Box>
                    </ListItem>
                  )}

                  {/* Extracted Documents */}
                  {isExtracted && (
                    <>
                      {/* Extracted PDF */}
                      <ListItem
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1
                          },
                          backgroundColor: '#f8f9fa',
                          borderLeft: '4px solid #4caf50'
                        }}
                      >
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                              {doc.name} (Extracted PDF)
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Size: {doc.size.replace(/\d+/, (match) => Math.floor(parseInt(match) * 0.15).toString())} • 
                                </Typography>
                                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {extractionTimestamps[doc.id] ? formatTimestamp(extractionTimestamps[doc.id]) : 'Just now'}
                                </Typography>
                              </Box>
                              <Chip
                                label="EXTRACTED"
                                size="small"
                                color="success"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleView({ ...doc, url: doc.extractedUrl || doc.url })}
                              title="View Extracted PDF"
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleDownload({ ...doc, url: doc.extractedUrl || doc.url })}
                              title="Download Extracted PDF"
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>

                      {/* Extracted JSON */}
                      <ListItem
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1
                          },
                          backgroundColor: '#f8f9fa',
                          borderLeft: '4px solid #4caf50'
                        }}
                      >
                        <ListItemIcon>
                          <JsonIcon color="success" />
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                              {doc.name} (Structured Data)
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Size: ~15 KB  
                                </Typography>
                                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {extractionTimestamps[doc.id] ? formatTimestamp(extractionTimestamps[doc.id]) : 'Just now'}
                                </Typography>
                              </Box>
                              <Chip
                                label="STRUCTURED"
                                size="small"
                                color="success"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleView({ ...doc, url: doc.jsonUrl || doc.url })}
                              title="View JSON Data"
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleDownload({ ...doc, url: doc.jsonUrl || doc.url })}
                              title="Download JSON Data"
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </>
                  )}
                  
                  {index < docs.length - 1 && <Divider />}
                </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      ))}

      {/* Upload New Document Section */}
      <Card sx={{ mt: 3, border: '2px dashed #e0e0e0' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CloudDownloadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload Additional Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add more supporting documents to this case
          </Typography>
          <Button
            variant="contained"
            startIcon={<AttachFileIcon />}
            sx={{ mr: 2 }}
          >
            Choose Files
          </Button>
          <Button variant="outlined">
            Drag & Drop
          </Button>
        </CardContent>
      </Card>
      {/* Document Comparison Viewer */}
      {selectedDocument && (
        <DocumentComparisonViewer
          open={comparisonViewerOpen}
          onClose={() => {
            setComparisonViewerOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument as any}
        />
      )}
    </Box>
  );
};

export default CaseDocuments;