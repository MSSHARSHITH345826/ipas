import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tabs,
  Tab,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Description as DocumentIcon,
  Psychology as PsychologyIcon,
  Psychology as AIIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Computer as ComputerIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon,
  Reviews as ReviewsIcon
} from '@mui/icons-material';
import { CircularProgress as CircularProgressIcon } from '@mui/material';
import SimpleDraggableFlowchart from './SimpleDraggableFlowchart';
import CaseDocuments from './CaseDocuments';
import ClinicalSummary from './ClinicalSummary';
import ClinicalCriteriaEval from './ClinicalCriteriaEval';
import MedicalRecordRetrival from './MedicalRecordRetrival'
import EMRNotificationPanel from '../Notifications/EMRNotificationPanel';
import { statusTracker } from '../../services/statusTracker';

interface CaseDetailsEnhancedProps {
  caseId: string;
  defaultTab?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-tabpanel-${index}`}
      aria-labelledby={`case-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CaseDetailsEnhanced: React.FC<CaseDetailsEnhancedProps> = ({ caseId, defaultTab = 0 }) => {
  const [tabValue, setTabValue] = useState(defaultTab);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState('');
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [observabilityDialogOpen, setObservabilityDialogOpen] = useState(false);
  const [observabilityData, setObservabilityData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState(
    caseId === 'PA-2024-007' ? 'Denied' : 'Approved'
  );
  const [emrIntegrationOpen, setEmrIntegrationOpen] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [finalReviewStatus, setFinalReviewStatus] = useState<'approved' | 'denied' | null>(null);

  // Load review status from localStorage on component mount and monitor status changes
  React.useEffect(() => {
    const checkAndUpdateReviewStatus = () => {
      const savedReviewStatus = localStorage.getItem(`review_completed_${caseId}`);
      const savedFinalStatus = localStorage.getItem(`final_review_status_${caseId}`);
      
      // Check current case status from statusTracker
      const currentCaseStatus = statusTracker.getCaseStatus(caseId);
      
      // If case status is pending, reset the review completed state
      if (currentCaseStatus?.currentStatus === 'pending') {
        setReviewCompleted(false);
        setFinalReviewStatus(null);
        // Clear localStorage
        localStorage.removeItem(`review_completed_${caseId}`);
        localStorage.removeItem(`final_review_status_${caseId}`);
      } else if (savedReviewStatus === 'true') {
        setReviewCompleted(true);
        if (savedFinalStatus === 'approved' || savedFinalStatus === 'denied') {
          setFinalReviewStatus(savedFinalStatus as 'approved' | 'denied');
        }
      }
    };

    // Initial check
    checkAndUpdateReviewStatus();

    // Poll for status changes every 1 second
    const interval = setInterval(checkAndUpdateReviewStatus, 1000);

    return () => clearInterval(interval);
  }, [caseId]);

  // Function to handle review completion
  const handleReviewCompleted = async () => {
    setIsProcessingReview(true);
    
    // Simulate processing time with transition animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get SmartAuth recommendation from case data
    const caseData = getCaseData(caseId);
    const smartAuthRecommendation = caseData.aiAnalysis?.recommendedAction || 'Approve with monitoring';
    
    // Determine final status based on SmartAuth recommendation
    let finalStatus: 'approved' | 'denied' = 'approved';
    if (smartAuthRecommendation.toLowerCase().includes('deny') || 
        smartAuthRecommendation.toLowerCase().includes('reject')) {
      finalStatus = 'denied';
    }
    
    // Update case status in statusTracker
    console.log(`🔄 Updating case ${caseId} status to ${finalStatus}`);
    statusTracker.updateCaseStatus(
      caseId, 
      finalStatus, 
      'user', 
      'Review completed - SmartAuth recommendation applied',
      `SmartAuth recommended: ${smartAuthRecommendation}`
    );
    
    // Verify the update
    const updatedStatus = statusTracker.getCaseStatus(caseId);
    console.log(`✅ Case ${caseId} status after update:`, updatedStatus);
    
    setFinalReviewStatus(finalStatus);
    setReviewCompleted(true);
    setIsProcessingReview(false);
    
    // Save review status to localStorage for persistence
    localStorage.setItem(`review_completed_${caseId}`, 'true');
    localStorage.setItem(`final_review_status_${caseId}`, finalStatus);
  };

  // Function to generate and download PDF from JSON
  const downloadObservabilityAsPDF = async () => {
    try {
      // Fetch the JSON data
      const folderPath = caseId === 'PA-2024-001' ? 'case-001-john-doe' : 
                         caseId === 'PA-2024-002' ? 'case-002-jane-smith' : 
                         caseId === 'PA-2024-003' ? 'case-003-mike-johnson' : 
                         caseId === 'PA-2024-004' ? 'case-004-sarah-wilson' : 
                         caseId === 'PA-2024-005' ? 'case-005-david-brown' : 
                         caseId === 'PA-2024-006' ? 'case-006-rebecca-hardin' : 
                         caseId === 'PA-2024-007' ? 'case-007' : 
                         caseId === 'PA-2024-008' ? '008' : 'case-001-john-doe';
      
      const response = await fetch(`/sample-documents/cases/${folderPath}/observability_and_explanation.json`);
      const jsonData = await response.json();
      
      // Create a printable HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Observability & Explainability Report - ${caseId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 900px;
              margin: 0 auto;
            }
            h1 {
              color: #1976d2;
              border-bottom: 3px solid #1976d2;
              padding-bottom: 10px;
            }
            h2 {
              color: #2c3e50;
              margin-top: 25px;
              border-bottom: 2px solid #ecf0f1;
              padding-bottom: 8px;
            }
            h3 {
              color: #34495e;
              margin-top: 15px;
            }
            .section {
              margin-bottom: 30px;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
            }
            .workflow-step {
              margin: 15px 0;
              padding: 12px;
              background: white;
              border-left: 4px solid #1976d2;
            }
            .key-value {
              display: flex;
              margin: 8px 0;
            }
            .key {
              font-weight: bold;
              min-width: 200px;
              color: #2c3e50;
            }
            .value {
              color: #555;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #1976d2;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-completed {
              background-color: #d4edda;
              color: #155724;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #7f8c8d;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Observability & Explainability Report</h1>
          <div class="key-value">
            <span class="key">Case ID:</span>
            <span class="value">${caseId}</span>
          </div>
          <div class="key-value">
            <span class="key">Generated:</span>
            <span class="value">${new Date().toLocaleString()}</span>
          </div>

          <div class="section">
            <h2>Case Overview</h2>
            ${jsonData.caseId ? `<div class="key-value"><span class="key">Case ID:</span><span class="value">${jsonData.caseId}</span></div>` : ''}
            ${jsonData.patientName ? `<div class="key-value"><span class="key">Patient:</span><span class="value">${jsonData.patientName}</span></div>` : ''}
            ${jsonData.provider ? `<div class="key-value"><span class="key">Provider:</span><span class="value">${jsonData.provider}</span></div>` : ''}
            ${jsonData.facility ? `<div class="key-value"><span class="key">Facility:</span><span class="value">${jsonData.facility}</span></div>` : ''}
            ${jsonData.requestedService ? `<div class="key-value"><span class="key">Requested Service:</span><span class="value">${jsonData.requestedService}</span></div>` : ''}
            ${jsonData.authorizationAmount ? `<div class="key-value"><span class="key">Authorization Amount:</span><span class="value">${jsonData.authorizationAmount}</span></div>` : ''}
          </div>

          <div class="section">
            <h2>Workflow Steps</h2>
            ${jsonData.workflowSteps ? jsonData.workflowSteps.map((step: any, index: number) => `
              <div class="workflow-step">
                <h3>Step ${step.step || index + 1}: ${step.action}</h3>
                <div class="key-value">
                  <span class="key">Status:</span>
                  <span class="value"><span class="badge status-completed">${step.status}</span></span>
                </div>
                ${step.details ? `<div class="key-value"><span class="key">Details:</span><span class="value">${step.details}</span></div>` : ''}
                ${step.outcome ? `<div class="key-value"><span class="key">Outcome:</span><span class="value">${step.outcome}</span></div>` : ''}
                ${step.comments ? `<div class="key-value"><span class="key">Comments:</span><span class="value">${step.comments}</span></div>` : ''}
              </div>
            `).join('') : ''}
          </div>

          ${jsonData.keyFindings ? `
          <div class="section">
            <h2>Key Findings</h2>
            ${Object.entries(jsonData.keyFindings).map(([key, value]) => `
              <div class="key-value">
                <span class="key">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                <span class="value">${value}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${jsonData.denialDetails || jsonData.approvalDetails ? `
          <div class="section">
            <h2>${jsonData.denialDetails ? 'Denial' : 'Approval'} Details</h2>
            ${JSON.stringify(jsonData.denialDetails || jsonData.approvalDetails, null, 2).split('\\n').map(line => 
              `<div>${line.replace(/\s/g, '&nbsp;')}</div>`
            ).join('')}
          </div>
          ` : ''}

          ${jsonData.qualityMetrics ? `
          <div class="section">
            <h2>Quality Metrics</h2>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(jsonData.qualityMetrics).map(([key, value]) => `
                  <tr>
                    <td>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                    <td>${value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>Generated by IPAS (Intelligent Prior Authorization System)</p>
            <p>This document contains confidential patient information</p>
          </div>

          <div class="no-print" style="text-align: center; margin: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
              Print / Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Dynamic case data based on caseId
  const getCaseData = (caseId: string) => {
    const caseDataMap: { [key: string]: any } = {
      'PA-2024-001': {
        id: 'PA-2024-001',
        patientName: 'John Smith',
        patientId: 'PA-2024-001',
        dateOfBirth: '1985-03-15',
        provider: 'Sarah Johnson',
        providerId: 'PR-001',
        hospital: 'UCLA Medical Center',
        procedure: 'MRI Brain with Contrast',
        diagnosis: 'Suspected Brain Tumor',
        status: 'In Review',
        priority: 'High',
        submittedDate: '2025-10-08T10:32:00Z',
        lastUpdated: '2025-10-08T14:45:00Z',
        insurance: 'Blue Cross Blue Shield',
        policyNumber: 'BC123456789',
        estimatedCost: 2500,
        documents: [
          { id: 'doc1', name: 'Prior Auth Request Form.pdf', type: 'PDF', size: '2.3 MB', status: 'Processed' },
          { id: 'doc2', name: 'MRI Scan - Brain.jpg', type: 'Image', size: '4.1 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'Patient Medical Records.pdf', type: 'PDF', size: '1.8 MB', status: 'Processed' },
          { id: 'doc4', name: 'Insurance Card.png', type: 'Image', size: '0.9 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-10-08T10:32:00Z', note: 'Patient presents with persistent headaches and visual disturbances', author: 'Sarah Johnson' },
          { timestamp: '2025-10-08T11:15:00Z', note: 'MRI recommended to rule out brain tumor', author: 'Sarah Johnson' },
          { timestamp: '2025-10-08T12:00:00Z', note: 'Prior authorization submitted to insurance', author: 'Nurse Mary Wilson' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.94,
          coverageEligibility: 0.87,
          riskAssessment: 'Standard',
          recommendedAction: 'Approve with monitoring',
          confidence: 0.91
        },
        ipopFlag: ''
      },
      'PA-2024-002': {
        id: 'PA-2024-002',
        patientName: 'Mary Johnson',
        patientId: 'PA-2024-002',
        dateOfBirth: '1972-08-22',
        provider: 'Dr. Michael Chen',
        providerId: 'PR-002',
        hospital: 'Cedars-Sinai Medical Center',
        procedure: 'Cardiac Catheterization',
        diagnosis: 'Coronary Artery Disease',
        status: 'In Review',
        priority: 'High',
        submittedDate: '2025-10-09T09:18:00Z',
        lastUpdated: '2025-10-09T13:24:00Z',
        insurance: 'Aetna',
        policyNumber: 'AET987654321',
        estimatedCost: 15000,
        documents: [
          { id: 'doc1', name: 'Prior Auth Request Form.pdf', type: 'PDF', size: '2.1 MB', status: 'Processed' },
          { id: 'doc2', name: 'EKG Results.pdf', type: 'PDF', size: '0.8 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'Stress Test Results.pdf', type: 'PDF', size: '1.2 MB', status: 'Processed' },
          { id: 'doc4', name: 'Insurance Card.png', type: 'Image', size: '0.9 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-10-09T09:18:00Z', note: 'Patient presents with chest pain and shortness of breath', author: 'Dr. Michael Chen' },
          { timestamp: '2025-10-09T10:30:00Z', note: 'EKG shows ST elevation, cardiac catheterization recommended', author: 'Dr. Michael Chen' },
          { timestamp: '2025-10-09T11:45:00Z', note: 'Prior authorization submitted for cardiac catheterization', author: 'Nurse Jennifer Lee' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.98,
          coverageEligibility: 0.92,
          riskAssessment: 'High',
          recommendedAction: 'Approve immediately',
          confidence: 0.95
        },
        ipopFlag: ''
      },
      'PA-2024-003': {
        id: 'PA-2024-003',
        patientName: 'Robert Davis',
        patientId: 'PA-2024-003',
        dateOfBirth: '1965-12-03',
        provider: 'Dr. Emily Rodriguez',
        providerId: 'PR-003',
        hospital: 'Kaiser Permanente',
        procedure: 'Knee Arthroscopy',
        diagnosis: 'Meniscal Tear',
        status: 'In Review',
        priority: 'Standard',
        submittedDate: '2025-10-10T14:22:00Z',
        lastUpdated: '2025-10-10T16:48:00Z',
        insurance: 'Kaiser Permanente',
        policyNumber: 'KP456789123',
        estimatedCost: 8000,
        documents: [
          { id: 'doc1', name: 'Prior Auth Request Form.pdf', type: 'PDF', size: '2.0 MB', status: 'Processed' },
          { id: 'doc2', name: 'MRI Knee Results.pdf', type: 'PDF', size: '3.2 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'Robert Davis Medical Records.pdf', type: 'PDF', size: '1.5 MB', status: 'Processed' },
          { id: 'doc4', name: 'Insurance Card.png', type: 'Image', size: '0.9 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-10-10T14:22:00Z', note: 'Patient reports persistent knee pain and limited mobility', author: 'Dr. Emily Rodriguez' },
          { timestamp: '2025-10-10T15:30:00Z', note: 'MRI confirms meniscal tear, arthroscopy recommended', author: 'Dr. Emily Rodriguez' },
          { timestamp: '2025-10-10T16:00:00Z', note: 'Prior authorization submitted for knee arthroscopy', author: 'Nurse David Kim' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.89,
          coverageEligibility: 0.85,
          riskAssessment: 'Standard',
          recommendedAction: 'Approve with coverage limit',
          confidence: 0.87
        },
        ipopFlag: ''
      },
      'PA-2024-004': {
        id: 'PA-2024-004',
        patientName: 'Lisa Wilson',
        patientId: 'PA-2024-004',
        dateOfBirth: '1985-03-15',
        provider: 'Andrew Thomson',
        providerId: 'PR-004',
        hospital: 'UCLA Medical Center',
        procedure: 'MRI Brain with Contrast',
        diagnosis: 'Suspected Brain Tumor',
        status: 'In Review',
        priority: 'High',
        submittedDate: '2025-10-08T11:02:00Z',
        lastUpdated: '2025-10-08T14:47:00Z',
        insurance: 'Blue Cross Blue Shield',
        policyNumber: 'BC123456789',
        estimatedCost: 2500,
        documents: [
          { id: 'doc1', name: 'Prior Auth Request Form.pdf', type: 'PDF', size: '2.3 MB', status: 'Processed' },
          { id: 'doc2', name: 'MRI Scan - Brain.jpg', type: 'Image', size: '4.1 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'Patient Medical Records.pdf', type: 'PDF', size: '1.8 MB', status: 'Processed' },
          { id: 'doc4', name: 'Insurance Card.png', type: 'Image', size: '0.9 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-10-08T11:02:00Z', note: 'Patient presents with persistent headaches and visual disturbances', author: 'Sarah Johnson' },
          { timestamp: '2025-10-08T11:45:00Z', note: 'MRI recommended to rule out brain tumor', author: 'Sarah Johnson' },
          { timestamp: '2025-10-08T12:10:00Z', note: 'Prior authorization submitted to insurance', author: 'Nurse Mary Wilson' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.94,
          coverageEligibility: 0.87,
          riskAssessment: 'Standard',
          recommendedAction: 'Approve with monitoring',
          confidence: 0.91
        },
        ipopFlag: 'Outpatient'
      },
      'PA-2024-006': {
        id: 'PA-2024-006',
        patientName: 'Rebecca Hardin',
        patientId: 'PA-2024-006',
        dateOfBirth: '1976-08-25',
        provider: 'Amy Diane Kelly, NP',
        providerId: 'PR-006',
        hospital: 'Prisma Health Pulmonology - Sumter',
        procedure: 'CPAP Device Replacement',
        diagnosis: 'Obstructive Sleep Apnea (G47.33)',
        status: 'In Review',
        priority: 'Standard',
        submittedDate: '2025-10-09T12:14:00Z',
        lastUpdated: '2025-10-09T15:46:00Z',
        insurance: 'Ambetter / Absolute Total Care',
        policyNumber: 'U7131533302',
        estimatedCost: 2500,
        documents: [
          { id: 'doc1', name: 'Prior Auth Request Form.pdf', type: 'PDF', size: '2.1 MB', status: 'Processed' },
          { id: 'doc2', name: 'Medical Records.pdf', type: 'PDF', size: '3.2 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'Polysomnography Report.pdf', type: 'PDF', size: '1.8 MB', status: 'Processed' },
          { id: 'doc4', name: 'Doctor Notes.pdf', type: 'PDF', size: '1.2 MB', status: 'Processed' },
          { id: 'doc5', name: 'Insurance Card.pdf', type: 'PDF', size: '0.9 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-10-09T12:14:00Z', note: 'Patient compliant with CPAP therapy, Epworth score 3/24', author: 'Amy Diane Kelly, NP' },
          { timestamp: '2025-10-09T15:46:00Z', note: "CPAP Device Replacement needed as member is requesting for a personal device. She is currently using father-in-law's device", author: 'Amy Diane Kelly, NP' },
          { timestamp: '2025-10-09T13:10:00Z', note: 'Prior authorization submitted for CPAP replacement and supplies', author: 'Maria Griffin' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.96,
          coverageEligibility: 0.94,
          riskAssessment: 'Low',
          recommendedAction: 'Approve - clear medical necessity',
          confidence: 0.95
        },
        ipopFlag: 'Outpatient'


      },
      'PA-2024-007': {
        id: 'PA-2024-007',
        patientName: 'Amanda Latoya Williams',
        patientId: 'PA-2024-007',
        dateOfBirth: '1987-03-05',
        provider: 'Dr. Benjamin Joseph Velky',
        providerId: 'NPI-1083063507',
        hospital: 'Self Regional Healthcare',
        procedure: 'Inpatient Admission - Acute Uncomplicated Sigmoid Diverticulitis',
        diagnosis: 'Diverticulitis of intestine, part unspecified, without perforation or abscess without bleeding (K57.92)',
        status: 'Denied',
        priority: 'Urgent',
        submittedDate: '2025-04-24T16:54:00Z',
        lastUpdated: '2025-04-25T14:05:30Z',
        insurance: 'Ambetter / Absolute Total Care (ATC Contracted)',
        policyNumber: 'U7183854101',
        estimatedCost: 13500,
        deniedCost: 13500,
        alternativeCost: 1000,
        documents: [
          { id: 'doc1', name: 'Prior Authorization Request Form.pdf', type: 'PDF', size: '2.3 MB', status: 'Processed' },
          { id: 'doc2', name: 'Medical Records.pdf', type: 'PDF', size: '3.8 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'CT Abdomen Pelvis Report.pdf', type: 'PDF', size: '2.1 MB', status: 'Processed' },
          { id: 'doc4', name: 'Laboratory Results.pdf', type: 'PDF', size: '1.5 MB', status: 'Processed' },
          { id: 'doc5', name: 'Structured Medical Records.json', type: 'JSON', size: '0.8 MB', status: 'Processed' },
          { id: 'doc6', name: 'Authorization Request.json', type: 'JSON', size: '0.3 MB', status: 'Processed' },
          { id: 'doc7', name: 'Clinical Summary.pdf', type: 'PDF', size: '1.9 MB', status: 'Analyzed' },
          { id: 'doc8', name: 'UR Packet.pdf', type: 'PDF', size: '2.4 MB', status: 'Processed' },
          { id: 'doc9', name: 'Imaging Reports.pdf', type: 'PDF', size: '3.2 MB', status: 'Analyzed' },
          { id: 'doc10', name: 'Panel Recommendation.pdf', type: 'PDF', size: '1.7 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-04-24T16:54:00Z', note: 'Patient admitted with 2-day history of abdominal pain, back pain, blood in stool, and vomiting. Presenting complaints consistent with acute diverticulitis', author: 'Dr. Benjamin Velky' },
          { timestamp: '2025-04-24T18:30:00Z', note: 'Vitals stable: BP 138/84, HR 78, Temp 98.1°F, SpO2 100%. Patient afebrile and hemodynamically stable', author: 'Nurse Jennifer Lopez' },
          { timestamp: '2025-04-24T19:45:00Z', note: 'CT Abdomen/Pelvis completed - shows uncomplicated sigmoid diverticulitis without abscess, perforation, or pericolonic complications', author: 'Dr. Sarah Mitchell, Radiology' },
          { timestamp: '2025-04-24T21:00:00Z', note: 'Laboratory results: Normal WBC, no leukocytosis. CBC, CMP, BMP all within normal limits', author: 'Lab Department' },
          { timestamp: '2025-04-25T08:30:00Z', note: 'Patient tolerating oral intake, pain controlled with oral analgesics. Currently on Ciprofloxacin 500mg + Metronidazole 500mg', author: 'Dr. Benjamin Velky' },
          { timestamp: '2025-04-25T10:15:00Z', note: 'Inpatient authorization request submitted to Ambetter for continued hospitalization', author: 'UR Department, Self Regional HE' },
          { timestamp: '2025-04-25T14:05:00Z', note: 'Physician panel review completed - consensus for denial of inpatient admission. Patient appropriate for outpatient management per AAFP guidelines', author: 'IPAS Physician Panel' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.32,
          coverageEligibility: 0.15,
          riskAssessment: 'Low',
          recommendedAction: 'Deny inpatient admission - Approve outpatient management',
          confidence: 0.94
        },
        ipopFlag: 'Inpatient'
      },
      'PA-2024-008': {
        id: 'PA-2024-008',
        patientName: 'Daniel de Los Santos marin',
        patientId: 'PA-2024-008',
        dateOfBirth: '1947-08-01',
        provider: 'Dr. Amanda Reynolds',
        providerId: 'NPI-1234567890',
        hospital: 'Trident Medical Center',
        procedure: 'Cardiac Rehabilitation',
        diagnosis: 'NSTEMI, non-ST-elevation myocardial infarction (I21.4)',
        status: 'In Review',
        priority: 'High',
        submittedDate: '2025-10-09T12:14:00Z',
        lastUpdated: '2025-10-09T15:46:00Z',
        insurance: 'AMBETTER-ATC Contracted',
        policyNumber: 'U7183854101',
        estimatedCost: 5500,
        documents: [
          { id: 'doc1', name: 'Prior Auth Request Form.pdf', type: 'PDF', size: '2.1 MB', status: 'Processed' },
          { id: 'doc2', name: 'Medical Records.pdf', type: 'PDF', size: '3.2 MB', status: 'Analyzed' },
          { id: 'doc3', name: 'Polysomnography Report.pdf', type: 'PDF', size: '1.8 MB', status: 'Processed' },
          { id: 'doc4', name: 'Doctor Notes.pdf', type: 'PDF', size: '1.2 MB', status: 'Processed' },
          { id: 'doc5', name: 'Insurance Card.pdf', type: 'PDF', size: '0.9 MB', status: 'Processed' }
        ],
        clinicalNotes: [
          { timestamp: '2025-10-08T08:30:00Z', note: 'Patient presented to ED with chest pain, diagnosed with NSTEMI. Troponin elevated at 2.5 ng/mL', author: 'Dr. Amanda Reynolds' },
          { timestamp: '2025-10-08T10:45:00Z', note: 'Cardiac catheterization performed. 90% LAD stenosis identified and stent placed successfully', author: 'Dr. James Mitchell, Interventional Cardiologist' },
          { timestamp: '2025-10-08T14:20:00Z', note: '2D Doppler echocardiogram shows reduced ejection fraction (40%), mild anterior wall hypokinesis', author: 'Dr. Sarah Chen, Cardiology' },
          { timestamp: '2025-10-09T09:00:00Z', note: 'Patient stable post-PCI. Discharged with cardiac rehab recommendation', author: 'Dr. Amanda Reynolds' },
          { timestamp: '2025-10-09T12:14:00Z', note: 'Prior authorization submitted for Phase II cardiac rehabilitation program - 36 sessions over 12 weeks', author: 'Maria Griffin, Case Manager' },
          { timestamp: '2025-10-09T15:46:00Z', note: 'Patient meets criteria for cardiac rehab: recent MI with PCI, reduced EF, cardiac risk factors (HTN, DM, smoking history)', author: 'Dr. Amanda Reynolds' }
        ],
        aiAnalysis: {
          clinicalNecessity: 0.98,
          coverageEligibility: 0.96,
          riskAssessment: 'Moderate',
          recommendedAction: 'Approve - clear medical necessity post-NSTEMI',
          confidence: 0.97
        },
        ipopFlag: 'Outpatient'
      }

    };

    return caseDataMap[caseId] || {
      id: caseId,
      patientName: 'Unknown Patient',
      patientId: 'PA-2024-005',
      dateOfBirth: 'Unknown',
      provider: 'Unknown Provider',
      providerId: 'PR-UNKNOWN',
      hospital: 'Unknown Hospital',
      procedure: 'Unknown Procedure',
      diagnosis: 'Unknown Diagnosis',
      status: 'Unknown',
      priority: 'Unknown',
      submittedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      insurance: 'Unknown Insurance',
      policyNumber: 'UNKNOWN',
      estimatedCost: 0,
      documents: [],
      clinicalNotes: [],
      aiAnalysis: {
        clinicalNecessity: 0,
        coverageEligibility: 0,
        riskAssessment: 'Unknown',
        recommendedAction: 'Unknown',
        confidence: 0
      }
    };
  };

  const caseData = getCaseData(caseId);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

  // Check if "Auth Decision Summary" tab is clicked
  if (newValue === 2) { // Assuming "Auth Decision Summary" is the third tab (index 2)
    
    // Immediately invoke the async function
    (async () => {
      try {
        const folderName =
          caseId === 'PA-2024-001' ? 'case-001-john-doe' :
          caseId === 'PA-2024-002' ? 'case-002-jane-smith' :
          caseId === 'PA-2024-003' ? 'case-003-mike-johnson' :
          caseId === 'PA-2024-004' ? 'case-004-sarah-wilson' :
          caseId === 'PA-2024-005' ? 'case-005-david-brown' :
          caseId === 'PA-2024-006' ? 'case-006-rebecca-hardin' :
          caseId === 'PA-2024-007' ? 'case-007':
          caseId === 'PA-2024-008' ? '008':
          'case-001-john-doe';

          const response = await fetch(`/sample-documents/cases/${folderName}/observability_and_explanation.json`);

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json();
          setObservabilityData(data);
        } catch (error) {
          console.error('Failed to fetch observability data:', error);
          // Handle the error appropriately
        }
      })();
    }
  };


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success';
      case 'denied': return 'error';
      case 'in review': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'error';
      case 'Standard': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Case Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Case #{caseData.id}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {caseData.procedure} - {caseData.patientName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={caseData.status}
                  color={getStatusColor(caseData.status) as any}
                  size="small"
                />
                <Chip
                  label={caseData.priority}
                  color={getPriorityColor(caseData.priority) as any}
                  size="small"
                />
                {/* <Chip
                  label={`$${caseData.estimatedCost.toLocaleString()}`}
                  color="info"
                  size="small"
                /> */}

                {caseData.ipopFlag &&
                  <Chip
                    label={caseData.ipopFlag}
                    color="success"
                    size="small"
                  />
                }

              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* <Tooltip title="EMR Integration">
                <IconButton
                  onClick={() => setEmrIntegrationOpen(true)}
                >
                  <ComputerIcon />
                </IconButton>
              </Tooltip> */}

              <Tooltip title="View Observability & Explanation">
                <IconButton
                  color="info"
                  onClick={async () => {
                    try {
                      const folderName = caseId === 'PA-2024-001' ? 'case-001-john-doe' : caseId === 'PA-2024-002' ? 'case-002-jane-smith' : caseId === 'PA-2024-003' ? 'case-003-mike-johnson' : caseId === 'PA-2024-004' ? 'case-004-sarah-wilson' : caseId === 'PA-2024-005' ? 'case-005-david-brown' : caseId === 'PA-2024-006' ? 'case-006-rebecca-hardin' : caseId === 'PA-2024-007' ? 'case-007' : caseId === 'PA-2024-008' ? '008' : 'case-001-john-doe';
                      const response = await fetch(`/sample-documents/cases/${folderName}/observability_and_explanation.json`);
                      const data = await response.json();
                      setObservabilityData(data);
                      setObservabilityDialogOpen(true);
                    } catch (error) {
                      console.error('Error loading observability data:', error);
                      alert('Observability report not available for this case');
                    }
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              
              {/* Review Completed Button */}
              <Tooltip title={reviewCompleted ? "Review Completed" : "Complete Review"}>
                <IconButton
                  color={reviewCompleted ? "success" : "primary"}
                  onClick={handleReviewCompleted}
                  //disabled={isProcessingReview || reviewCompleted}
                  sx={{
                    backgroundColor: reviewCompleted 
                      ? (finalReviewStatus === 'approved' ? 'success.main' : 'error.main')
                      : (isProcessingReview ? 'rgba(25, 118, 210, 0.1)' : 'primary.main'),
                    color: 'white',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      backgroundColor: reviewCompleted 
                        ? (finalReviewStatus === 'approved' ? 'success.dark' : 'error.dark')
                        : (isProcessingReview ? 'rgba(25, 118, 210, 0.1)' : 'primary.dark'),
                    }
                  }}
                >
                  {isProcessingReview ? (
                    <CircularProgressIcon size={20} color="inherit" />
                  ) : (
                    <ReviewsIcon />
                  )}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download Observability Report (JSON)">
                <IconButton
                  color="success"
                  disabled={!reviewCompleted}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `/sample-documents/cases/${caseId === 'PA-2024-001' ? 'case-001-john-doe' : caseId === 'PA-2024-002' ? 'case-002-jane-smith' : caseId === 'PA-2024-003' ? 'case-003-mike-johnson' : caseId === 'PA-2024-004' ? 'case-004-sarah-wilson' : caseId === 'PA-2024-005' ? 'case-005-david-brown' : caseId === 'PA-2024-006' ? 'case-006-rebecca-hardin' : caseId === 'PA-2024-007' ? 'case-007' : caseId === 'PA-2024-008' ? '008' : 'case-001-john-doe'}/observability_and_explanation.json`;
                    link.download = `observability_and_explanation_${caseId}.json`;
                    link.click();
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download Observability Report (PDF)">
                <IconButton
                  color="error"
                  disabled={!reviewCompleted}
                  onClick={downloadObservabilityAsPDF}
                >
                  <PdfIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Clinical Notes">
                <IconButton
                  onClick={() => {
                    setClinicalNotes(caseData.clinicalNotes.map((n: any) => `[${new Date(n.timestamp).toLocaleString()}] ${n.author}:\n${n.note}`).join('\n\n'));
                    setEditNotesOpen(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Case">
                <IconButton
                  onClick={() => setShareDialogOpen(true)}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <strong>Name:</strong> {caseData.patientName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">
                  <strong>Patient ID:</strong> {caseData.patientId}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">
                  <strong>Date of Birth:</strong> {new Date(caseData.dateOfBirth).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  <strong>Insurance:</strong> {caseData.insurance} ({caseData.policyNumber})
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Requesting Provider Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HospitalIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <strong>Provider:</strong> {caseData.provider}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">
                  <strong>Provider ID:</strong> {caseData.providerId}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">
                  <strong>Hospital:</strong> {caseData.hospital}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  <strong>Diagnosis:</strong> {caseData.diagnosis}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="case details tabs">
            {/* <Tab label="Orchestration" icon={<AIIcon />} /> */}
            <Tab label="Documents" icon={<DocumentIcon />} />
            <Tab label="Clinical Summary" icon={<DocumentIcon />} />
            <Tab label="Auth Decision Summary" icon={<DocumentIcon />} />

            <Tab label="Review Notes" icon={<TimelineIcon />} />
          </Tabs>
          <Box sx={{ marginLeft: 'auto' }}>
            <Tooltip title="EMR Integration">
              <IconButton
                onClick={() => setEmrIntegrationOpen(true)}
              >
                <ComputerIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* <TabPanel value={tabValue} index={0}>
          <SimpleDraggableFlowchart caseId={caseId} />
        </TabPanel> */}

        <TabPanel value={tabValue} index={0}>
          <CaseDocuments caseId={caseId} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ClinicalSummary caseId={caseId} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>




          {/* Observability & Explanation Dialog */}
          <Box>
            {observabilityData && (

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DocumentIcon color="secondary" />
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    Observability & Explanation Report
                  </Typography>
                </Box>
                {/* Summary Section */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }} variant="outlined">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Patient</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.patientName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Procedure</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.procedure}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl fullWidth >
                        <InputLabel id="demo-simple-select-label">Smart Auth recommendation </InputLabel>
                        <Select
                          labelId="demo-simple-select-label"
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          label="Smart Auth recommendation"
                        >
                          <MenuItem value="Approved">Approved</MenuItem>
                          <MenuItem value="Denied">Denied</MenuItem>
                          <MenuItem value="Pend">Pend</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Processing Time</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.processingTimeline.totalDuration}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Key Findings */}
                <Typography variant="h6" sx={{ mb: 2 }}>Key Findings</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: '100%' }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Clinical Justification</Typography>
                      <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.clinicalJustification}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: '100%' }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Medical Necessity</Typography>
                      <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.medicalNecessity}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: '100%' }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Policy Compliance</Typography>
                      <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.policyCompliance}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: '100%' }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Cost Efficiency</Typography>
                      <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.costEfficiency}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Approval/Denial Details */}
                {observabilityData.denialDetails ? (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>Denial Details</Typography>
                    <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Authorization Number</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{observabilityData.denialDetails.authorizationNumber}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Denied Amount</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{observabilityData.denialDetails.deniedAmount}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Denial Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.denialDetails.denialDate}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Denial Reason</Typography>
                          <Typography variant="body2" color="error.main">{observabilityData.denialDetails.denialReason}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Denied By</Typography>
                          <Typography variant="body2">{observabilityData.denialDetails.deniedBy}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Review Type</Typography>
                          <Typography variant="body2">{observabilityData.denialDetails.reviewType}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Alternative Care Approved */}
                    {observabilityData.denialDetails.alternativeCareApproved && (
                      <>
                        <Typography variant="h6" sx={{ mb: 2 }}>Alternative Care Plan (Approved)</Typography>
                        <Paper sx={{ p: 2, mb: 3, bgcolor: '#e8f5e9' }} variant="outlined">
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Medications</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.denialDetails.alternativeCareApproved.medications}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Follow-up Visit</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.denialDetails.alternativeCareApproved.followUpVisit}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Estimated Outpatient Cost</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{observabilityData.denialDetails.alternativeCareApproved.estimatedOutpatientCost}</Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </>
                    )}

                    {/* Appeal Rights */}
                    {observabilityData.denialDetails.appealRights && (
                      <>
                        <Typography variant="h6" sx={{ mb: 2 }}>Appeal Rights</Typography>
                        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff3e0' }} variant="outlined">
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Appeal Deadline</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.denialDetails.appealRights.appealDeadline}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Peer-to-Peer Review</Typography>
                              <Typography variant="body2">{observabilityData.denialDetails.appealRights.peerToPeerReview}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Expedited Appeal</Typography>
                              <Typography variant="body2">{observabilityData.denialDetails.appealRights.expeditedAppeal}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Contact Number</Typography>
                              <Typography variant="body2">{observabilityData.denialDetails.appealRights.contactNumber}</Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </>
                    )}
                  </>
                ) : observabilityData.approvalDetails ? (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>Approval Details</Typography>
                    <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Authorization Number</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.approvalDetails.authorizationNumber}</Typography>
                        </Grid>
                        {/* <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Approved Amount</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{observabilityData.approvalDetails.approvedAmount}</Typography>
                        </Grid> */}
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Valid Until</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.approvalDetails.validUntil}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Approved By</Typography>
                          <Typography variant="body2">{observabilityData.approvalDetails.approvedBy}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>Review Type</Typography>
                          <Typography variant="body2">{observabilityData.approvalDetails.reviewType}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </>
                ) : null}

                {/* Quality Metrics */}
                <Typography variant="h6" sx={{ mb: 2 }}>Quality Metrics</Typography>
                <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                  <Grid container spacing={2}>
                    {Object.entries(observabilityData.qualityMetrics).map(([key, value]) => (
                      <Grid size={{ xs: 6, md: 4 }} key={key}>
                        <Typography variant="caption" color="text.secondary" sx={{fontSize:'14px'}}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{String(value)}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>

                

                <Card sx={{ mb: 3 }} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DocumentIcon color="secondary" />
                      <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                        AI Specialist panel recommendation
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 3 }}>
                        Recommendation: <strong>{caseId === 'PA-2024-003' ? 'PARTIAL APPROVAL ($4,000 of $8,000)' : caseId === 'PA-2024-007' ? 'DENIED' : 'APPROVE'}</strong>
                      </Typography>
                      {caseId === 'PA-2024-003' && (
                        <Typography variant="body2" color="warning.main" sx={{ mb: 2, p: 1, bgcolor: '#fff3cd', borderRadius: 1 }}>
                          ⚠️ Insurance coverage limit: $4,000 maximum for knee arthroscopy procedures
                        </Typography>
                      )}

                      {/* Panel Members' Votes */}
                      <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Panel Review Summary ({caseId === 'PA-2024-007' ? '3 Doctors' : '4 Doctors'})
                        </Typography>

                        {caseId === 'PA-2024-007' ? (
                          <>
                            {/* Gastroenterologist */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #f44336' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  Gastroenterologist
                                </Typography>
                                <Chip label="DENY" color="error" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Given the acute onset of symptoms, prior history of diverticulitis, and confirmation by imaging, it is medically necessary to initiate appropriate treatment and observation in Outpatient setting as the patient is stable, afebrile, and has no evidence of complications. Supportive therapy, dietary modifications, and symptom monitoring are essential. Antibiotics may be considered given her history, but shared decision-making and close follow-up are recommended.
                              </Typography>
                            </Box>

                            {/* Infectious disease specialist */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #f44336' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  Infectious disease specialist
                                </Typography>
                                <Chip label="DENY" color="error" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                For this patient with uncomplicated acute diverticulitis, the medically necessary management includes supportive care, possible oral antibiotic therapy, pain control, and close outpatient monitoring. Inpatient admission or intravenous antibiotic therapy is not indicated unless her condition worsens or she develops signs of systemic infection or complications.
                              </Typography>
                            </Box>

                            {/* General Surgeon */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #f44336' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  General Surgeon
                                </Typography>
                                <Chip label="DENY" color="error" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                For this patient with uncomplicated acute diverticulitis, there is no medical necessity for surgical intervention or inpatient admission at this time. Outpatient management with supportive care and close follow-up is medically necessary, aligning with current surgical and clinical guidelines
                              </Typography>
                            </Box>

                            <Box sx={{ mt: 2, p: 1, bgcolor: '#fdecea', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                                ✓ Consensus: 0/3 doctors recommend APPROVAL (case PA-2024-007)
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          <>
                            {/* Doctor 1 */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  Sleep medicine specialist
                                </Typography>
                                <Chip label="APPROVE" color="success" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {caseId === 'PA-2024-003' 
                                  ? "Given the patient's established diagnosis of OSA, the presence of multiple high-risk comorbidities, and the demonstrated clinical benefit of CPAP therapy, it is medically necessary for the patient to continue CPAP treatment."
                                  : "Given the patient's established diagnosis of OSA, the presence of multiple high-risk comorbidities, and the demonstrated clinical benefit of CPAP therapy, it is medically necessary for the patient to continue CPAP treatment. Discontinuation of CPAP would likely lead to worsening of OSA and significant negative health consequences."
                                }
                              </Typography>
                            </Box>
                            {/* Doctor 2 */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {caseId === 'PA-2024-003' ? 'Dr. James Roberts, DO - Orthopedic Surgeon' : 'Otolarngology/ENT Specialist'}
                                </Typography>
                                <Chip label="APPROVE" color="success" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {caseId === 'PA-2024-003'
                                  ? "MRI findings confirm meniscal tear and cartilage damage. Patient has documented 6 months of failed conservative therapy including PT and anti-inflammatories. Surgical intervention is appropriate next step."
                                  : "As an Otolaryngologist, I affirm that continued CPAP therapy is medically necessary for this patient. The combined presence of anatomical (enlarged thyroid, obesity) and systemic risk factors (hypertension, arrhythmias) makes ongoing CPAP usage crucial for managing OSA and preventing serious health consequences."
                                }
                              </Typography>
                            </Box>
                            {/* Doctor 3 */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {caseId === 'PA-2024-003' ? 'Dr. Emily Watson, MD - Sports Medicine' : ' Obesity Medicine Specialist'}
                                </Typography>
                                <Chip label="APPROVE" color="success" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {caseId === 'PA-2024-003'
                                  ? "Patient is 45 years old and active. Functional limitations are significant. Evidence-based guidelines support arthroscopic surgery when conservative management fails. Expected outcomes are favorable."
                                  : "As an Obesity Medicine Specialist, I strongly support the medical necessity of continued CPAP therapy for this patient. The combination of class 3 severe obesity, existing cardiovascular comorbidities, and anatomical risk factors necessitates ongoing CPAP use to optimize health outcomes, reduce morbidity, and support overall weight management efforts."
                                }
                              </Typography>
                            </Box>
                            {/* Doctor 4 */}
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {caseId === 'PA-2024-003' ? 'Dr. David Kim, MD - Physical Medicine & Rehabilitation' : ' Cardiologist'}
                                </Typography>
                                <Chip label="APPROVE" color="success" size="small" />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {caseId === 'PA-2024-003'
                                  ? "Comprehensive review of medical records shows progressive worsening despite appropriate non-surgical treatment. Functional status assessment indicates significant impact on daily activities. Approve with recommendation for post-op physical therapy."
                                  : "As a Cardiologist, I strongly affirm the medical necessity of continued CPAP therapy for this patient. Given the interplay between OSA, hypertension, arrhythmias, and severe obesity, ongoing CPAP use is essential for cardiovascular risk reduction and long-term health maintenance."
                                }
                              </Typography>
                            </Box>

                            <Box sx={{ mt: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                ✓ Consensus: 4/4 doctors recommend APPROVAL
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Workflow Steps Table */}
                <Typography variant="h6" sx={{ mb: 2 }}>Workflow Steps</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>Step</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Details</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Outcome</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Comments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {observabilityData.workflowSteps.map((step: any) => (
                        <TableRow key={step.step}>
                          <TableCell>{step.step}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{step.action}</TableCell>
                          <TableCell>
                            <Chip
                              label={step.status}
                              color={step.status === 'Completed' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{step.details}</TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{step.outcome}</TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{step.comments}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                
              </Box>
            )}

            {/* <Button
            startIcon={<DownloadIcon />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/sample-documents/cases/${caseId === 'PA-2024-001' ? 'case-001-john-doe' : caseId === 'PA-2024-002' ? 'case-002-jane-smith' : caseId === 'PA-2024-003' ? 'case-003-mike-johnson' : caseId === 'PA-2024-004' ? 'case-004-sarah-wilson' : caseId === 'PA-2024-005' ? 'case-005-david-brown' : caseId === 'PA-2024-006' ? 'case-006-rebecca-hardin' : caseId === 'PA-2024-007' ? 'case-007' : caseId === 'PA-2024-008' ? '008' : 'case-001-john-doe'}/observability_and_explanation.json`;
              link.download = `observability_and_explanation_${caseId}.json`;
              link.click();
            }}
          >
            Download 
          </Button>
           <Button  variant="contained">
            Save
          </Button>
          <Button onClick={() => setObservabilityDialogOpen(false)} variant="contained">
            Close
          </Button> */}

          {/* Clinical Criteria Evaluation Widget */}
          <Box sx={{ mt: 4 }}>
            <ClinicalCriteriaEval caseId={caseId} />
          </Box>

          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Clinical Timeline
          </Typography>
          {caseData.clinicalNotes.map((note: any, index: number) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  {new Date(note.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {note.author}
                </Typography>
              </Box>
              <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                <Typography variant="body2">
                  {note.note}
                </Typography>
              </Paper>
              {index < caseData.clinicalNotes.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </TabPanel>
      </Card>

      {/* Edit Clinical Notes Dialog */}
      <Dialog open={editNotesOpen} onClose={() => setEditNotesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Clinical Notes - {caseData.id}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Enter clinical notes..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNotesOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setEditNotesOpen(false);
              alert('Clinical notes saved successfully!');
            }}
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share with Reviewers Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Share Case - {caseData.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select reviewers to share this case with:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Reviewers</InputLabel>
            <Select
              multiple
              value={selectedReviewers}
              onChange={(e) => setSelectedReviewers(e.target.value as string[])}
              label="Select Reviewers"
            >
              <MenuItem value="Dr. Sarah Wilson - Cardiologist">Dr. Sarah Wilson - Cardiologist</MenuItem>
              <MenuItem value="Dr. Michael Chen - Medical Director">Dr. Michael Chen - Medical Director</MenuItem>
              <MenuItem value="Dr. Emily Rodriguez - Clinical Specialist">Dr. Emily Rodriguez - Clinical Specialist</MenuItem>
              <MenuItem value="Dr. James Thompson - Quality Assurance">Dr. James Thompson - Quality Assurance</MenuItem>
              <MenuItem value="Dr. Lisa Anderson - Internal Medicine">Dr. Lisa Anderson - Internal Medicine</MenuItem>
              <MenuItem value="Dr. Robert Martinez - Cardiothoracic Surgery">Dr. Robert Martinez - Cardiothoracic Surgery</MenuItem>
            </Select>
          </FormControl>
          {selectedReviewers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Selected: {selectedReviewers.length} reviewer(s)
              </Typography>
              <Box sx={{ mt: 1 }}>
                {selectedReviewers.map((reviewer) => (
                  <Chip
                    key={reviewer}
                    label={reviewer}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                    onDelete={() => setSelectedReviewers(prev => prev.filter(r => r !== reviewer))}
                  />
                ))}
              </Box>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Add a note (optional)"
            placeholder="Add a message to accompany the case sharing..."
            value={shareNote}
            onChange={(e) => setShareNote(e.target.value)}
            sx={{ mt: 3 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={selectedReviewers.length === 0}
            onClick={() => {
              setShareDialogOpen(false);
              const noteText = shareNote ? `\n\nNote: ${shareNote}` : '';
              alert(`Case ${caseData.id} shared with ${selectedReviewers.length} reviewer(s):\n${selectedReviewers.join('\n')}${noteText}`);
              setSelectedReviewers([]);
              setShareNote('');
            }}
          >
            Share Case
          </Button>
        </DialogActions>
      </Dialog>

      {/* EMR Integration Dialog */}
      <Dialog
        open={emrIntegrationOpen}
        onClose={() => setEmrIntegrationOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            EMR Integration - {caseId}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <MedicalRecordRetrival caseId={caseId} />
          <EMRNotificationPanel caseId={caseId} showDetails={true} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmrIntegrationOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Observability & Explanation Dialog */}
      <Dialog
        open={observabilityDialogOpen}
        onClose={() => setObservabilityDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Observability & Explanation Report - {caseId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Complete workflow transparency and decision reasoning
          </Typography>
        </DialogTitle>
        <DialogContent>
          {observabilityData && (
            <Box>
              {/* Summary Section */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Patient</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.patientName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Procedure</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.procedure}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <FormControl fullWidth >
                      <InputLabel id="demo-simple-select-label">Smart Auth recommendation </InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        label="Smart Auth recommendation"
                      >
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="Denied">Denied</MenuItem>
                        <MenuItem value="Pend">Pend</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Processing Time</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.processingTimeline.totalDuration}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Workflow Steps Table */}
              <Typography variant="h6" sx={{ mb: 2 }}>Workflow Steps</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>Step</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Details</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Outcome</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Comments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {observabilityData.workflowSteps.map((step: any) => (
                      <TableRow key={step.step}>
                        <TableCell>{step.step}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{step.action}</TableCell>
                        <TableCell>
                          <Chip
                            label={step.status}
                            color={step.status === 'Completed' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>{step.details}</TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>{step.outcome}</TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{step.comments}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Key Findings */}
              <Typography variant="h6" sx={{ mb: 2 }}>Key Findings</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Clinical Justification</Typography>
                    <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.clinicalJustification}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Medical Necessity</Typography>
                    <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.medicalNecessity}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Policy Compliance</Typography>
                    <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.policyCompliance}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Cost Efficiency</Typography>
                    <Typography variant="body2" color="text.secondary">{observabilityData.keyFindings.costEfficiency}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Approval/Denial Details */}
              {observabilityData.denialDetails ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>Denial Details</Typography>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">Authorization Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{observabilityData.denialDetails.authorizationNumber}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">Denied Amount</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{observabilityData.denialDetails.deniedAmount}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">Denial Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.denialDetails.denialDate}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">Denial Reason</Typography>
                        <Typography variant="body2" color="error.main">{observabilityData.denialDetails.denialReason}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Denied By</Typography>
                        <Typography variant="body2">{observabilityData.denialDetails.deniedBy}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Review Type</Typography>
                        <Typography variant="body2">{observabilityData.denialDetails.reviewType}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </>
              ) : observabilityData.approvalDetails ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>Approval Details</Typography>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">Authorization Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.approvalDetails.authorizationNumber}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary"></Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{observabilityData.approvalDetails.approvedAmount}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{observabilityData.approvalDetails.validUntil}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Approved By</Typography>
                        <Typography variant="body2">{observabilityData.approvalDetails.approvedBy}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="text.secondary">Review Type</Typography>
                        <Typography variant="body2">{observabilityData.approvalDetails.reviewType}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </>
              ) : null}

              {/* Quality Metrics */}
              <Typography variant="h6" sx={{ mb: 2 }}>Quality Metrics</Typography>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {Object.entries(observabilityData.qualityMetrics).map(([key, value]) => (
                    <Grid size={{ xs: 6, md: 4 }} key={key}>
                      <Typography variant="caption" color="text.secondary">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{String(value)}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/sample-documents/cases/${caseId === 'PA-2024-001' ? 'case-001-john-doe' : caseId === 'PA-2024-002' ? 'case-002-jane-smith' : caseId === 'PA-2024-003' ? 'case-003-mike-johnson' : caseId === 'PA-2024-004' ? 'case-004-sarah-wilson' : caseId === 'PA-2024-005' ? 'case-005-david-brown' : caseId === 'PA-2024-006' ? 'case-006-rebecca-hardin' : caseId === 'PA-2024-007' ? 'case-007' : caseId === 'PA-2024-008' ? '008' : 'case-001-john-doe'}/observability_and_explanation.json`;
              link.download = `observability_and_explanation_${caseId}.json`;
              link.click();
            }}
          >
            Download JSON
          </Button>
          <Button
            startIcon={<PdfIcon />}
            color="error"
            onClick={downloadObservabilityAsPDF}
          >
            Download PDF
          </Button>
          <Button variant="contained">
            Save
          </Button>
          <Button onClick={() => setObservabilityDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseDetailsEnhanced;