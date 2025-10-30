import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  ButtonGroup
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Description as DocumentIcon,
  Psychology as AIIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Gavel as DecisionIcon,
  Download as DownloadIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import EMRNotificationStatus from '../Notifications/EMRNotificationStatus';
import { statusTracker } from '../../services/statusTracker';

interface ProcessStep {
  id: string;
  name: string;
  type: 'start' | 'process' | 'decision' | 'end';
  status: 'pending' | 'running' | 'completed' | 'error';
  description: string;
  subSteps: string[];
  nextSteps: string[];
  conditions?: { [key: string]: string };
  position: { x: number; y: number };
}

interface SimpleDraggableFlowchartProps {
  caseId: string;
}

const SimpleDraggableFlowchart: React.FC<SimpleDraggableFlowchartProps> = ({ caseId }) => {
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [stepDetailsOpen, setStepDetailsOpen] = useState(false);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [showMessage, setShowMessage] = useState<string>('');
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<'approve' | 'partial' | 'decline' | null>(null);
  const [justification, setJustification] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get initial process steps based on case ID
  const getInitialProcessSteps = useCallback((): ProcessStep[] => {
    // Case PA-2024-001: Gold status - Auto approval workflow (4 stages)
    if (caseId === 'PA-2024-001' || caseId === '001') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Gold status verification and auto-approval',
          subSteps: ['Gold Status Check', 'Auto-Approval', 'Coverage Verification'],
          nextSteps: ['provider-notification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate approval letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Provider Notification', 'EMR Integration'],
          nextSteps: [],
          position: { x: 800, y: 50 }
        }
      ];
    }
    
    // Case PA-2024-002: Complex review workflow (non-gold, high amount)
    if (caseId === 'PA-2024-002' || caseId === '002') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Data validation, guideline matching, and approval determination',
          subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
          nextSteps: ['member-verification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'member-verification',
          name: 'Member Verification',
          type: 'process',
          status: 'pending',
          description: 'Verify member eligibility and coverage details',
          subSteps: ['Eligibility Check', 'Coverage Verification', 'Benefits Analysis'],
          nextSteps: ['data-enrichment'],
          position: { x: 800, y: 50 }
        },
        {
          id: 'data-enrichment',
          name: 'Data Enrichment',
          type: 'process',
          status: 'pending',
          description: 'Enrich case data with additional clinical information',
          subSteps: ['Medical History', 'Lab Results', 'External Records'],
          nextSteps: ['gap-assessment'],
          position: { x: 1050, y: 50 }
        },
        {
          id: 'gap-assessment',
          name: 'Gap Assessment',
          type: 'process',
          status: 'pending',
          description: 'Identify and assess data gaps',
          subSteps: ['Gap Identification', 'Gap Analysis', 'Gap Resolution'],
          nextSteps: ['clinical-summarization'],
          position: { x: 1300, y: 50 }
        },
        {
          id: 'clinical-summarization',
          name: 'Clinical Summarization',
          type: 'process',
          status: 'pending',
          description: 'Generate comprehensive clinical summary',
          subSteps: ['Data Synthesis', 'Summary Generation', 'Key Findings'],
          nextSteps: ['data-prediction'],
          position: { x: 50, y: 265 }
        },
        {
          id: 'data-prediction',
          name: 'Decision Assessment',
          type: 'process',
          status: 'pending',
          description: 'ML-based prediction and risk assessment',
          subSteps: ['Risk Scoring', 'Outcome Prediction', 'Confidence Analysis'],
          nextSteps: ['clinical-review-planning'],
          position: { x: 300, y: 280 }
        },
        {
          id: 'clinical-review-planning',
          name: 'Clinical Review Planning',
          type: 'process',
          status: 'pending',
          description: 'Plan clinical review strategy',
          subSteps: ['Reviewer Assignment', 'Review Criteria', 'Timeline Planning'],
          nextSteps: ['clinical-decisioning'],
          position: { x: 550, y: 280 }
        },
        {
          id: 'clinical-decisioning',
          name: 'Clinical Decisioning',
          type: 'decision',
          status: 'pending',
          description: 'Final clinical decision on authorization',
          subSteps: ['Medical Necessity Review', 'Clinical Guidelines', 'Final Decision'],
          nextSteps: ['provider-notification'],
          position: { x: 800, y: 280 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Notification'],
          nextSteps: [],
          position: { x: 800, y: 480 }
        }
      ];
    }
    
    // Case PA-2024-003: Partial approval workflow (coverage limit)
    if (caseId === 'PA-2024-003' || caseId === '003') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Data validation, guideline matching, and approval determination',
          subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
          nextSteps: ['member-verification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'member-verification',
          name: 'Member Verification',
          type: 'process',
          status: 'pending',
          description: 'Verify member eligibility and coverage details',
          subSteps: ['Eligibility Check', 'Coverage Verification', 'Benefits Analysis'],
          nextSteps: ['data-enrichment'],
          position: { x: 800, y: 50 }
        },
        {
          id: 'data-enrichment',
          name: 'Data Enrichment',
          type: 'process',
          status: 'pending',
          description: 'Enrich case data with additional clinical information',
          subSteps: ['Medical History', 'Lab Results', 'External Records'],
          nextSteps: ['gap-assessment'],
          position: { x: 1050, y: 50 }
        },
        {
          id: 'gap-assessment',
          name: 'Gap Assessment',
          type: 'process',
          status: 'pending',
          description: 'Identify and assess data gaps',
          subSteps: ['Gap Identification', 'Gap Analysis', 'Gap Resolution'],
          nextSteps: ['clinical-summarization'],
          position: { x: 1300, y: 50 }
        },
        {
          id: 'clinical-summarization',
          name: 'Clinical Summarization',
          type: 'process',
          status: 'pending',
          description: 'Generate comprehensive clinical summary',
          subSteps: ['Data Synthesis', 'Summary Generation', 'Key Findings'],
          nextSteps: ['data-prediction'],
          position: { x: 50, y: 265 }
        },
        {
          id: 'data-prediction',
          name: 'Decision Assessment',
          type: 'process',
          status: 'pending',
          description: 'ML-based prediction and risk assessment',
          subSteps: ['Risk Scoring', 'Outcome Prediction', 'Confidence Analysis'],
          nextSteps: ['clinical-review-planning'],
          position: { x: 300, y: 280 }
        },
        {
          id: 'clinical-review-planning',
          name: 'Clinical Review Planning',
          type: 'process',
          status: 'pending',
          description: 'Plan clinical review strategy',
          subSteps: ['Reviewer Assignment', 'Review Criteria', 'Timeline Planning'],
          nextSteps: ['clinical-decisioning'],
          position: { x: 550, y: 280 }
        },
        {
          id: 'clinical-decisioning',
          name: 'Clinical Decisioning',
          type: 'decision',
          status: 'pending',
          description: 'Final clinical decision on authorization',
          subSteps: ['Medical Necessity Review', 'Clinical Guidelines', 'Final Decision'],
          nextSteps: ['provider-notification'],
          position: { x: 800, y: 280 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Notification'],
          nextSteps: [],
          position: { x: 800, y: 480 }
        }
      ];
    }
    
    // Case PA-2024-004: Denial workflow (missing documentation)
    if (caseId === 'PA-2024-004' || caseId === '004') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Data validation, guideline matching, and approval determination',
          subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
          nextSteps: ['member-verification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'member-verification',
          name: 'Member Verification',
          type: 'process',
          status: 'pending',
          description: 'Verify member eligibility and coverage details',
          subSteps: ['Eligibility Check', 'Coverage Verification', 'Benefits Analysis'],
          nextSteps: ['data-enrichment'],
          position: { x: 800, y: 50 }
        },
        {
          id: 'data-enrichment',
          name: 'Data Enrichment',
          type: 'process',
          status: 'pending',
          description: 'Enrich case data with additional clinical information',
          subSteps: ['Medical History', 'Lab Results', 'External Records'],
          nextSteps: ['gap-assessment'],
          position: { x: 1050, y: 50 }
        },
        {
          id: 'gap-assessment',
          name: 'Gap Assessment',
          type: 'process',
          status: 'pending',
          description: 'Identify and assess data gaps',
          subSteps: ['Gap Identification', 'Gap Analysis', 'Gap Resolution'],
          nextSteps: ['provider-notification'],
          position: { x: 1300, y: 50 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate denial letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Notification'],
          nextSteps: [],
          position: { x: 1300, y: 250 }
        }
      ];
    }
    
    // Case PA-2024-005: Full approval workflow for CT Chest
    if (caseId === 'PA-2024-005' || caseId === '005') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Data validation, guideline matching, and approval determination',
          subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
          nextSteps: ['member-verification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'member-verification',
          name: 'Member Verification',
          type: 'process',
          status: 'pending',
          description: 'Verify member eligibility and coverage details',
          subSteps: ['Eligibility Check', 'Coverage Verification', 'Benefits Analysis'],
          nextSteps: ['data-enrichment'],
          position: { x: 800, y: 50 }
        },
        {
          id: 'data-enrichment',
          name: 'Data Enrichment',
          type: 'process',
          status: 'pending',
          description: 'Enrich case data with additional clinical information',
          subSteps: ['Medical History', 'Lab Results', 'External Records'],
          nextSteps: ['gap-assessment'],
          position: { x: 1050, y: 50 }
        },
        {
          id: 'gap-assessment',
          name: 'Gap Assessment',
          type: 'process',
          status: 'pending',
          description: 'Identify and assess data gaps',
          subSteps: ['Gap Identification', 'Gap Analysis', 'Gap Resolution'],
          nextSteps: ['clinical-summarization'],
          position: { x: 1300, y: 50 }
        },
        {
          id: 'clinical-summarization',
          name: 'Clinical Summarization',
          type: 'process',
          status: 'pending',
          description: 'Generate comprehensive clinical summary',
          subSteps: ['Data Synthesis', 'Summary Generation', 'Key Findings'],
          nextSteps: ['data-prediction'],
          position: { x: 50, y: 265 }
        },
        {
          id: 'data-prediction',
          name: 'Decision Assessment',
          type: 'process',
          status: 'pending',
          description: 'ML-based prediction and risk assessment',
          subSteps: ['Risk Scoring', 'Outcome Prediction', 'Confidence Analysis'],
          nextSteps: ['clinical-review-planning'],
          position: { x: 300, y: 280 }
        },
        {
          id: 'clinical-review-planning',
          name: 'Clinical Review Planning',
          type: 'process',
          status: 'pending',
          description: 'Plan clinical review strategy',
          subSteps: ['Reviewer Assignment', 'Review Criteria', 'Timeline Planning'],
          nextSteps: ['clinical-decisioning'],
          position: { x: 550, y: 280 }
        },
        {
          id: 'clinical-decisioning',
          name: 'Clinical Decisioning',
          type: 'decision',
          status: 'pending',
          description: 'Final clinical decision on authorization',
          subSteps: ['Medical Necessity Review', 'Clinical Guidelines', 'Final Decision'],
          nextSteps: ['provider-notification'],
          position: { x: 800, y: 280 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Notification'],
          nextSteps: [],
          position: { x: 800, y: 480 }
        }
      ];
    }
    
    // Case PA-2024-006: Full review workflow ending in approval (CPAP replacement - compliant patient)
    // Case PA-2024-008: Full review workflow ending in approval (Cardiac Rehabilitation post-NSTEMI)
    if (caseId === 'PA-2024-006' || caseId === '006' || caseId === 'PA-2024-008' || caseId === '008') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Data validation, guideline matching, and approval determination',
          subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
          nextSteps: ['member-verification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'member-verification',
          name: 'Member Verification',
          type: 'process',
          status: 'pending',
          description: 'Verify member eligibility and coverage details',
          subSteps: ['Eligibility Check', 'Coverage Verification', 'Benefits Analysis'],
          nextSteps: ['data-enrichment'],
          position: { x: 800, y: 50 }
        },
        {
          id: 'data-enrichment',
          name: 'Data Enrichment',
          type: 'process',
          status: 'pending',
          description: 'Enrich case data with additional clinical information',
          subSteps: ['Medical History', 'Lab Results', 'External Records'],
          nextSteps: ['gap-assessment'],
          position: { x: 1050, y: 50 }
        },
        {
          id: 'gap-assessment',
          name: 'Gap Assessment',
          type: 'process',
          status: 'pending',
          description: 'Identify and assess data gaps',
          subSteps: ['Gap Identification', 'Gap Analysis', 'Gap Resolution'],
          nextSteps: ['clinical-summarization'],
          position: { x: 1300, y: 50 }
        },
        {
          id: 'clinical-summarization',
          name: 'Clinical Summarization',
          type: 'process',
          status: 'pending',
          description: 'Generate comprehensive clinical summary',
          subSteps: ['Data Synthesis', 'Summary Generation', 'Key Findings'],
          nextSteps: ['data-prediction'],
          position: { x: 50, y: 265 }
        },
        {
          id: 'data-prediction',
          name: 'Decision Assessment',
          type: 'process',
          status: 'pending',
          description: 'ML-based prediction and risk assessment',
          subSteps: ['Risk Scoring', 'Outcome Prediction', 'Confidence Analysis'],
          nextSteps: ['clinical-review-planning'],
          position: { x: 300, y: 280 }
        },
        {
          id: 'clinical-review-planning',
          name: 'Clinical Review Planning',
          type: 'process',
          status: 'pending',
          description: 'Plan clinical review strategy',
          subSteps: ['Reviewer Assignment', 'Review Criteria', 'Timeline Planning'],
          nextSteps: ['clinical-decisioning'],
          position: { x: 550, y: 280 }
        },
        {
          id: 'clinical-decisioning',
          name: 'Clinical Decisioning',
          type: 'decision',
          status: 'pending',
          description: 'Final clinical decision on authorization',
          subSteps: ['Medical Necessity Review', 'Clinical Guidelines', 'Final Decision'],
          nextSteps: ['provider-notification'],
          position: { x: 800, y: 280 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate approval letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Notification'],
          nextSteps: [],
          position: { x: 800, y: 480 }
        }
      ];
    }

   // Case PA-2024-007: Full review workflow ending in denial (Inpatient admission - uncomplicated diverticulitis)
    if (caseId === 'PA-2024-007' || caseId === '007') {
      return [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          status: 'pending',
          description: 'Initiates the prior authorization case processing workflow',
          subSteps: ['Case ID Generation', 'Initial Data Collection'],
          nextSteps: ['auth-intake'],
          position: { x: 50, y: 50 }
        },
        {
          id: 'auth-intake',
          name: 'Auth Intake',
          type: 'process',
          status: 'pending',
          description: 'Multi-modal document ingestion and data extraction',
          subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
          nextSteps: ['auth-triage'],
          position: { x: 300, y: 50 }
        },
        {
          id: 'auth-triage',
          name: 'Auth Triage',
          type: 'process',
          status: 'pending',
          description: 'Data validation, guideline matching, and approval determination',
          subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
          nextSteps: ['member-verification'],
          position: { x: 550, y: 50 }
        },
        {
          id: 'member-verification',
          name: 'Member Verification',
          type: 'process',
          status: 'pending',
          description: 'Verify member eligibility and coverage details',
          subSteps: ['Eligibility Check', 'Coverage Verification', 'Benefits Analysis'],
          nextSteps: ['data-enrichment'],
          position: { x: 800, y: 50 }
        },
        {
          id: 'data-enrichment',
          name: 'Data Enrichment',
          type: 'process',
          status: 'pending',
          description: 'Enrich case data with additional clinical information',
          subSteps: ['Medical History', 'Lab Results', 'External Records'],
          nextSteps: ['gap-assessment'],
          position: { x: 1050, y: 50 }
        },
        {
          id: 'gap-assessment',
          name: 'Gap Assessment',
          type: 'process',
          status: 'pending',
          description: 'Identify and assess data gaps',
          subSteps: ['Gap Identification', 'Gap Analysis', 'Gap Resolution'],
          nextSteps: ['clinical-summarization'],
          position: { x: 1300, y: 50 }
        },
        {
          id: 'clinical-summarization',
          name: 'Clinical Summarization',
          type: 'process',
          status: 'pending',
          description: 'Generate comprehensive clinical summary',
          subSteps: ['Data Synthesis', 'Summary Generation', 'Key Findings'],
          nextSteps: ['data-prediction'],
          position: { x: 50, y: 265 }
        },
        {
          id: 'data-prediction',
          name: 'Decision Assessment',
          type: 'process',
          status: 'pending',
          description: 'ML-based prediction and risk assessment',
          subSteps: ['Risk Scoring', 'Outcome Prediction', 'Confidence Analysis'],
          nextSteps: ['clinical-review-planning'],
          position: { x: 300, y: 280 }
        },
        {
          id: 'clinical-review-planning',
          name: 'Clinical Review Planning',
          type: 'process',
          status: 'pending',
          description: 'Plan clinical review strategy',
          subSteps: ['Reviewer Assignment', 'Review Criteria', 'Timeline Planning'],
          nextSteps: ['clinical-decisioning'],
          position: { x: 550, y: 280 }
        },
        {
          id: 'clinical-decisioning',
          name: 'Clinical Decisioning',
          type: 'decision',
          status: 'pending',
          description: 'Final clinical decision on authorization',
          subSteps: ['Medical Necessity Review', 'Clinical Guidelines', 'Final Decision'],
          nextSteps: ['provider-notification'],
          position: { x: 800, y: 280 }
        },
        {
          id: 'provider-notification',
          name: 'Provider Notification',
          type: 'process',
          status: 'pending',
          description: 'Generate approval letter and notify provider',
          subSteps: ['Letter Creation', 'Letter Generation', 'Notification'],
          nextSteps: [],
          position: { x: 800, y: 480 }
        }
      ];
    }
 


    // Default fallback for unknown cases
    return [
      {
        id: 'start',
        name: 'Start',
        type: 'start',
        status: 'pending',
        description: 'Initiates the prior authorization case processing workflow',
        subSteps: ['Case ID Generation', 'Initial Data Collection'],
        nextSteps: ['auth-intake'],
        position: { x: 50, y: 50 }
      },
      {
        id: 'auth-intake',
        name: 'Auth Intake',
        type: 'process',
        status: 'pending',
        description: 'Multi-modal document ingestion and data extraction',
        subSteps: ['Email', 'Mail', 'Fax', 'Call', 'Portal', 'EDI/FHIR', 'Auth ID'],
        nextSteps: ['auth-triage'],
        position: { x: 300, y: 50 }
      },
      {
        id: 'auth-triage',
        name: 'Auth Triage',
        type: 'process',
        status: 'pending',
        description: 'Data validation, guideline matching, and approval determination',
        subSteps: ['Data Completeness', 'Guidelines', 'Insurance', 'Priority', 'Decision'],
        nextSteps: ['provider-notification'],
        position: { x: 550, y: 50 }
      },
      {
        id: 'provider-notification',
        name: 'Provider Notification',
        type: 'process',
        status: 'pending',
        description: 'Generate letter and notify provider',
        subSteps: ['Letter Creation', 'Letter Generation', 'Provider Notification', 'EMR Integration'],
        nextSteps: [],
        position: { x: 800, y: 50 }
      }
    ];
  }, [caseId]);

  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(() => {
    const steps = getInitialProcessSteps();
    console.log('Initial process steps for case', caseId, ':', steps.map(s => ({ id: s.id, position: s.position })));
    return steps;
  });

  // Load session state from localStorage on component mount
  useEffect(() => {
    const loadSessionState = () => {
      const sessionKey = `ipas_orchestration_${caseId}`;
      const savedSession = localStorage.getItem(sessionKey);
      
      console.log('Loading orchestration session:', { sessionKey, savedSession });
      
      // Force clear old sessions for PA-2024-002 to ensure new layout loads
      if (caseId === 'PA-2024-002' && savedSession) {
        console.log('Clearing old PA-2024-002 session to load new layout');
        localStorage.removeItem(sessionKey);
        setSessionLoaded(true);
        return;
      }
      
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          const savedSteps = parsedSession.processSteps || [];
          const savedAnimationStep = parsedSession.animationStep || 0;
          const savedMessage = parsedSession.showMessage || '';
          
          console.log('Loaded session state:', { savedSteps, savedAnimationStep, savedMessage });
          
          // Validate that saved steps match the current case workflow
          const expectedSteps = getInitialProcessSteps();
          const hasAllSteps = savedSteps.length === expectedSteps.length && 
                             expectedSteps.every(expected => 
                               savedSteps.some((s: ProcessStep) => s.id === expected.id)
                             );
          
          if (hasAllSteps) {
            setProcessSteps(savedSteps);
            
            if (savedAnimationStep > 0) {
              setAnimationStep(savedAnimationStep);
              setShowMessage(savedMessage);
            }
          } else {
            console.warn('Saved session has outdated step configuration, clearing session');
            localStorage.removeItem(sessionKey);
          }
        } catch (error) {
          console.error('Error loading session state:', error);
        }
      }
      
      setSessionLoaded(true);
    };

    loadSessionState();
  }, [caseId]);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (!sessionLoaded) return;
    
    const sessionKey = `ipas_orchestration_${caseId}`;
    const sessionState = {
      processSteps,
      animationStep,
      showMessage,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(sessionKey, JSON.stringify(sessionState));
    console.log('Saving orchestration session:', sessionState);
  }, [caseId, processSteps, animationStep, showMessage, sessionLoaded]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'running': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <SuccessIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      case 'running': return <PendingIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
      case 'error': return <ErrorIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      default: return <PendingIcon sx={{ color: '#9e9e9e', fontSize: 16 }} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'start': return <StartIcon sx={{ fontSize: 16 }} />;
      case 'process': return <DocumentIcon sx={{ fontSize: 16 }} />;
      case 'decision': return <DecisionIcon sx={{ fontSize: 16 }} />;
      case 'end': return <SuccessIcon sx={{ fontSize: 16 }} />;
      default: return <AIIcon sx={{ fontSize: 16 }} />;
    }
  };

  // Helper function to check if message contains error/cross symbol
  const hasErrorMessage = (message: string) => {
    return message.includes('✗') || message.includes('❌') || message.includes('Error');
  };

  const handleMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.preventDefault();
    setDraggedStep(stepId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedStep || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    setProcessSteps(prev => 
      prev.map(step => 
        step.id === draggedStep 
          ? { ...step, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : step
      )
    );
  }, [draggedStep, dragOffset]);

  const handleMouseUp = () => {
    setDraggedStep(null);
  };

  useEffect(() => {
    if (draggedStep) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedStep, dragOffset, handleMouseMove]);

  const handleStepClick = (step: ProcessStep) => {
    if (step.id === 'start') {
      if (step.status === 'pending') {
        // Start the animation sequence
        startAnimationSequence();
      } else if (step.status === 'completed') {
        // Show option to restart or continue
        setSelectedStep(step);
        setStepDetailsOpen(true);
      }
    } else if (step.id === 'auth-intake') {
      if (step.status === 'pending') {
        // Check if we can start Auth Intake (Start must be completed)
        const startStep = processSteps.find(s => s.id === 'start');
        if (startStep?.status === 'completed') {
          startAuthIntakeProcess();
        } else {
          setShowMessage('Please complete the Start step first');
        }
      } else if (step.status === 'running') {
        // Show current progress
        setSelectedStep(step);
        setStepDetailsOpen(true);
      } else if (step.status === 'completed') {
        // Show completion details
        setSelectedStep(step);
        setStepDetailsOpen(true);
      }
    } else if (step.id === 'auth-triage') {
      if (step.status === 'pending') {
        // Check if we can start Auth Triage (Auth Intake must be completed)
        const authIntakeStep = processSteps.find(s => s.id === 'auth-intake');
        if (authIntakeStep?.status === 'completed') {
          startAuthTriageProcess();
        } else {
          setShowMessage('Please complete the Auth Intake step first');
        }
      } else if (step.status === 'running') {
        // Show current progress
        setSelectedStep(step);
        setStepDetailsOpen(true);
      } else if (step.status === 'completed') {
        // Show completion details
        setSelectedStep(step);
        setStepDetailsOpen(true);
      }
    } else if (step.id === 'provider-notification') {
      if (step.status === 'pending') {
        // Check if we can start Provider Notification (Auth Triage must be completed)
        const authTriageStep = processSteps.find(s => s.id === 'auth-triage');
        if (authTriageStep?.status === 'completed') {
          startProviderNotificationProcess();
        } else {
          setShowMessage('Please complete the Auth Triage step first');
        }
      } else if (step.status === 'running') {
        // Show current progress
        setSelectedStep(step);
        setStepDetailsOpen(true);
      } else if (step.status === 'completed') {
        // Show completion details with download link
        setSelectedStep(step);
        setStepDetailsOpen(true);
      }
    } else {
      setSelectedStep(step);
      setStepDetailsOpen(true);
    }
  };

  const startAnimationSequence = () => {
    setIsAnimating(true);
    setAnimationStep(0);
    setShowMessage('');

    // Step 1: Show case number
    setTimeout(() => {
      setShowMessage(`Case #${caseId} Generated`);
      setAnimationStep(1);
    }, 500);

    // Step 2: Show connecting to Auth Intake
    setTimeout(() => {
      setShowMessage('Connecting to Auth Intake...');
      setAnimationStep(2);
    }, 2000);

    // Step 3: Complete Start step
    setTimeout(() => {
      setShowMessage('Start process completed ✓');
      setAnimationStep(3);
      
      // Mark Start as completed
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'start' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Automatically proceed to Auth Intake after a short delay
      setTimeout(() => {
        setShowMessage('Proceeding to Auth Intake...');
        setAnimationStep(4);
        
        // Update Auth Intake to running status
        setProcessSteps(prev => 
          prev.map(step => 
            step.id === 'auth-intake' 
              ? { ...step, status: 'running' }
              : step
          )
        );
        
        // Start the Auth Intake process
        startAuthIntakeProcess();
      }, 2000);
    }, 4000);
  };

  const startAuthIntakeProcess = () => {
    setIsAnimating(true);
    setAnimationStep(0);
    setShowMessage('');

    // Update Auth Intake status to running
    setProcessSteps(prev => 
      prev.map(step => 
        step.id === 'auth-intake' 
          ? { ...step, status: 'running' }
          : step
      )
    );

    // Step 1: Show Auth Intake start
    setTimeout(() => {
      setShowMessage('Auth Intake Process Starting...');
      setAnimationStep(1);
    }, 500);

    // Step 2: Check intake channels
    setTimeout(() => {
      setShowMessage('Checking intake channels…');
      setAnimationStep(2);
    }, 1500);

    // Step 3: Show channel status
    setTimeout(() => {
      setShowMessage('✗ Email not found');
      setAnimationStep(3);
    }, 2500);

    setTimeout(() => {
      setShowMessage('✗ Mail not found');
      setAnimationStep(4);
    }, 3000);

    setTimeout(() => {
      setShowMessage('✓ Fax found');
      setAnimationStep(5);
    }, 3500);

    setTimeout(() => {
      setShowMessage('✗ EDI/FHIR request not found');
      setAnimationStep(6);
    }, 4000);

    setTimeout(() => {
      setShowMessage('1 document found via fax');
      setAnimationStep(7);
    }, 4500);

    // Step 4: Start document extraction
    setTimeout(() => {
      checkDocumentExtractionStatus();
    }, 5000);
  };

  const checkDocumentExtractionStatus = () => {
    // Check localStorage for extraction status
    const storageKey = `ipas_extractions_${caseId}`;
    const savedState = localStorage.getItem(storageKey);
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const extractedDocs = parsedState.extractedDocuments || [];
        const totalDocuments = 5; // Based on our case structure
        
        if (extractedDocs.length === 0) {
          // No documents extracted - start extraction
          setShowMessage('Starting Document Extraction...');
          setAnimationStep(8);
          triggerDocumentExtraction();
        } else if (extractedDocs.length < totalDocuments) {
          // Partial extraction - continue
          setShowMessage(`Found ${extractedDocs.length}/${totalDocuments} extracted documents`);
          setAnimationStep(8);
          
          setTimeout(() => {
            setShowMessage('Continuing document retrieval...');
            setAnimationStep(9);
            triggerDocumentExtraction();
          }, 2000);
        } else {
          // All documents extracted - show data
          setShowMessage('Document retrieved successfully ✓');
          setAnimationStep(8);
          showAuthIntakeData();
        }
      } catch (error) {
        console.error('Error checking extraction status:', error);
        setShowMessage('Error checking extraction status');
        setAnimationStep(8);
        showAuthIntakeData();
      }
    } else {
      // No extraction data - start extraction
      setShowMessage('Starting Document Extraction...');
      setAnimationStep(8);
      triggerDocumentExtraction();
    }
  };

  const triggerDocumentExtraction = () => {
    // Simulate extraction process
    setTimeout(() => {
      setShowMessage('Extracting data from the document...');
      setAnimationStep(9);
    }, 2000);
    
    setTimeout(() => {
      setShowMessage('Document extraction in progress...');
      setAnimationStep(10);
    }, 4000);
    
    setTimeout(() => {
      setShowMessage('Documents extracted successfully ✓');
      setAnimationStep(11);
      
      // Simulate saving extraction data to localStorage
      const storageKey = `ipas_extractions_${caseId}`;
      const extractionData = {
        extractedDocuments: ['1', '2', '3', '4', '5'], // All document IDs
        extractionTimestamps: {
          '1': new Date().toISOString(),
          '2': new Date().toISOString(),
          '3': new Date().toISOString(),
          '4': new Date().toISOString(),
          '5': new Date().toISOString()
        },
        // Add extracted data fields for all cases to ensure success
        extractedData: {
          email: caseId === 'PA-2024-001' ? 'john.doe@email.com' : 
                 caseId === 'PA-2024-002' ? 'mary.johnson@email.com' :
                 caseId === 'PA-2024-003' ? 'robert.davis@email.com' :
                 caseId === 'PA-2024-004' ? 'lisa.wilson@email.com' :
                 caseId === 'PA-2024-005' ? 'david.brown@email.com' :
                 caseId === 'PA-2024-006' ? 'rebecca.hardin@email.com' :
                 caseId === 'PA-2024-008' ? 'daniel.delossantos@email.com' : 'patient@email.com',
          mail: caseId === 'PA-2024-001' ? '123 Main St, Anytown, USA' :
                caseId === 'PA-2024-002' ? '456 Oak Ave, Springfield, USA' :
                caseId === 'PA-2024-003' ? '789 Pine Rd, Riverside, USA' :
                caseId === 'PA-2024-004' ? '321 Elm St, Lakeside, USA' :
                caseId === 'PA-2024-005' ? '654 Maple Dr, Hillside, USA' :
                caseId === 'PA-2024-006' ? '987 Cedar Ln, Valley, USA' :
                caseId === 'PA-2024-008' ? '123 Trident Way, Charleston, USA' : '123 Patient St',
          fax: caseId === 'PA-2024-001' ? '+1-555-123-4567' :
               caseId === 'PA-2024-002' ? '+1-555-234-5678' :
               caseId === 'PA-2024-003' ? '+1-555-345-6789' :
               caseId === 'PA-2024-004' ? '+1-555-456-7890' :
               caseId === 'PA-2024-005' ? '+1-555-567-8901' :
               caseId === 'PA-2024-006' ? '+1-555-678-9012' :
               caseId === 'PA-2024-008' ? '+1-555-789-0123' : '+1-555-000-0000',
          phone: caseId === 'PA-2024-001' ? '+1-555-987-6543' :
                 caseId === 'PA-2024-002' ? '+1-555-876-5432' :
                 caseId === 'PA-2024-003' ? '+1-555-765-4321' :
                 caseId === 'PA-2024-004' ? '+1-555-654-3210' :
                 caseId === 'PA-2024-005' ? '+1-555-543-2109' :
                 caseId === 'PA-2024-006' ? '+1-555-432-1098' :
                 caseId === 'PA-2024-008' ? '+1-555-321-0987' : '+1-555-000-0000',
          edi_fhir: caseId === 'PA-2024-001' ? 'FHIR-R4-Resource' :
                    caseId === 'PA-2024-002' ? 'FHIR-R4-Cardiology' :
                    caseId === 'PA-2024-003' ? 'FHIR-R4-Orthopedic' :
                    caseId === 'PA-2024-004' ? 'FHIR-R4-Gastroenterology' :
                    caseId === 'PA-2024-005' ? 'FHIR-R4-Radiology' :
                    caseId === 'PA-2024-006' ? 'FHIR-R4-DME-Pulmonology' :
                    caseId === 'PA-2024-008' ? 'FHIR-R4-Cardiology' : 'FHIR-R4-Resource',
          auth_id: caseId === 'PA-2024-001' ? 'AUTH-2024-001' :
                   caseId === 'PA-2024-002' ? 'AUTH-2024-002' :
                   caseId === 'PA-2024-003' ? 'AUTH-2024-003' :
                   caseId === 'PA-2024-004' ? 'AUTH-2024-004' :
                   caseId === 'PA-2024-005' ? 'AUTH-2024-005' :
                   caseId === 'PA-2024-006' ? 'AUTH-2024-006' :
                   caseId === 'PA-2024-008' ? 'AUTH-2024-008' : 'AUTH-2024-000'
        }
      };
      localStorage.setItem(storageKey, JSON.stringify(extractionData));
      
      showAuthIntakeData();
    }, 6000);
  };

  const showAuthIntakeData = () => {
    // Check for specific data fields in extracted documents
    const checkAuthIntakeData = () => {
      const requiredFields = [
        { name: 'MemberID', field: 'auth_id' },
        { name: 'Provider info', field: 'phone' },
        { name: 'Auth type', field: 'edi_fhir' },
        { name: 'Service type', field: 'edi_fhir' },
        { name: 'Procedure', field: 'edi_fhir' },
        { name: 'DOS', field: 'mail' }
      ];

      let foundFields = 0;
      let currentStep = 12;

      // Check each field in extracted documents
      requiredFields.forEach((field, index) => {
        setTimeout(() => {
          // Check if field exists in extracted data
          const isFound = checkFieldInExtractedData(field.field);
          
          if (isFound) {
            foundFields++;
            setShowMessage(`✓ ${field.name} found`);
            setAnimationStep(currentStep + index);
          } else {
            setShowMessage(`✗ ${field.name} not found`);
            setAnimationStep(currentStep + index);
          }
        }, (index + 1) * 1000);
      });

      // Show completion after all checks
      setTimeout(() => {
        if (foundFields === requiredFields.length) {
          setShowMessage('🎉 Auth Intake Agent work completed with success!');
          setAnimationStep(18);
        } else {
          setShowMessage(`⚠️ Auth Intake partially completed (${foundFields}/${requiredFields.length} fields found) - Proceeding anyway`);
          setAnimationStep(18);
        }
        
        // Update Auth Intake status to completed (even with partial data)
        setProcessSteps(prev => 
          prev.map(step => 
            step.id === 'auth-intake' 
              ? { ...step, status: 'completed' }
              : step
          )
        );
        
        // Automatically proceed to Auth Triage after a short delay
        setTimeout(() => {
          setShowMessage('Proceeding to Auth Triage...');
          setAnimationStep(19);
          
          // Update Auth Triage to running status
          setProcessSteps(prev => 
            prev.map(step => 
              step.id === 'auth-triage' 
                ? { ...step, status: 'running' }
                : step
            )
          );
          
          // Keep animation active for 2 more seconds while transitioning
          setTimeout(() => {
            // Start the Auth Triage process
            startAuthTriageProcess();
          }, 2000);
        }, 2000);
        
        setIsAnimating(false);
      }, (requiredFields.length + 1) * 1000);
    };

    // Start checking data
    setTimeout(() => {
      setShowMessage('Checking extracted data for required fields...');
      setAnimationStep(12);
    }, 1000);

    setTimeout(() => {
      checkAuthIntakeData();
    }, 2000);
  };

  const checkFieldInExtractedData = (fieldName: string): boolean => {
    // Check localStorage for extracted documents
    const storageKey = `ipas_extractions_${caseId}`;
    const savedState = localStorage.getItem(storageKey);
    
    if (!savedState) return false;
    
    try {
      const parsedState = JSON.parse(savedState);
      const extractedData = parsedState.extractedData || {};
      
      // Check if the specific field exists in extracted data
      if (extractedData[fieldName]) {
        return true;
      }
      
      // For Case 001, Case 002, and Case 006, ensure all fields are found for demo purposes
      if (caseId === 'PA-2024-001' || caseId === '001' || caseId === 'PA-2024-002' || caseId === '002' || caseId === 'PA-2024-006' || caseId === '006' || caseId === 'PA-2024-008' || caseId === '008') {
        return true;
      }
      
      // For other cases, use realistic success rates
      const fieldSuccessRates: { [key: string]: number } = {
        'email': 0.9,      // 90% success rate
        'mail': 0.85,      // 85% success rate  
        'fax': 0.7,        // 70% success rate
        'phone': 0.95,     // 95% success rate
        'edi_fhir': 0.6,   // 60% success rate
        'auth_id': 0.8     // 80% success rate
      };
      
      const successRate = fieldSuccessRates[fieldName] || 0.5;
      return Math.random() < successRate;
    } catch (error) {
      console.error('Error checking extracted data:', error);
      return false;
    }
  };

  const startAuthTriageProcess = () => {
    setIsAnimating(true);
    setAnimationStep(20);
    setShowMessage('');

    // Step 1: Check extracted data
    setTimeout(() => {
      setShowMessage('Checking extracted data for required fields...');
      setAnimationStep(21);
    }, 1000);

    setTimeout(() => {
      setShowMessage('✓ MemberID found');
      setAnimationStep(22);
    }, 2000);

    setTimeout(() => {
      setShowMessage('✓ Provider info found');
      setAnimationStep(23);
    }, 2500);

    setTimeout(() => {
      setShowMessage('✓ Auth type found');
      setAnimationStep(24);
    }, 3000);

    setTimeout(() => {
      setShowMessage('✓ Service type found');
      setAnimationStep(25);
    }, 3500);

    setTimeout(() => {
      setShowMessage('✓ Procedure found');
      setAnimationStep(26);
    }, 4000);

    setTimeout(() => {
      setShowMessage('✓ DOS found');
      setAnimationStep(27);
    }, 4500);

    // Step 2: Data Completeness Check
    setTimeout(() => {
      setShowMessage('Checking data completeness...');
      setAnimationStep(28);
    }, 5000);

    setTimeout(() => {
      setShowMessage('✓ All required data fields present');
      setAnimationStep(29);
    }, 6000);

    // Step 3: Check if auth is needed
    setTimeout(() => {
      setShowMessage('Checking if auth is needed for the service');
      setAnimationStep(30);
    }, 7000);

    setTimeout(() => {
      setShowMessage('✓ Auth needed');
      setAnimationStep(31);
    }, 8000);

    // Step 4: Gold Status Check
    setTimeout(() => {
      setShowMessage('Checking Gold Status...');
      setAnimationStep(32);
    }, 9000);

    setTimeout(() => {
      if (caseId === 'PA-2024-001') {
        setShowMessage('✓ Gold status detected');
      } else {
        setShowMessage('✗ No Gold status detected');
      }
      setAnimationStep(33);
    }, 10000);

    // Step 5: Priority Assignment
    setTimeout(() => {
      setShowMessage('Assigning priority level...');
      setAnimationStep(34);
    }, 11000);

    setTimeout(() => {
      setShowMessage('✓ Standard priority assigned');
      setAnimationStep(35);
    }, 12000);

    // Step 6: Complete
    setTimeout(() => {
      setShowMessage('✓ Auth Triage completed');
      setAnimationStep(36);
      
      // Update Auth Triage status to completed
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'auth-triage' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Route to next stage based on case
      setTimeout(() => {
        if (caseId === 'PA-2024-001') {
          // Case-001: Direct to Provider Notification
          setShowMessage('Proceeding to Provider Notification...');
          setAnimationStep(37);
          setProcessSteps(prev => 
            prev.map(step => 
              step.id === 'provider-notification' 
                ? { ...step, status: 'running' }
                : step
            )
          );
          setTimeout(() => {
            startProviderNotificationProcess();
          }, 2000);
        } else if (caseId === 'PA-2024-002' || caseId === 'PA-2024-003' || caseId === 'PA-2024-004' || caseId === 'PA-2024-005' || caseId === 'PA-2024-006' || caseId === 'PA-2024-007' || caseId === 'PA-2024-008') {
          // Case-002, Case-003, Case-004, Case-005, Case-006 & Case-007: Proceed to Member Verification
          setShowMessage('Proceeding to Member Verification...');
          setAnimationStep(37);
          setProcessSteps(prev => 
            prev.map(step => 
              step.id === 'member-verification' 
                ? { ...step, status: 'running' }
                : step
            )
          );
          setTimeout(() => {
            startMemberVerificationProcess();
          }, 2000);
        }
      }, 2000);
    }, 13000);
  };

  const startProviderNotificationProcess = () => {
    setIsAnimating(true);
    setAnimationStep(38);
    setShowMessage('');

    // Step 1: Letter Creation
    setTimeout(() => {
      if (caseId === 'PA-2024-004') {
        setShowMessage('Creating denial letter...');
      } else {
        setShowMessage('Creating approval letter...');
      }
      setAnimationStep(39);
    }, 1000);

    setTimeout(() => {
      setShowMessage('✓ Letter template loaded');
      setAnimationStep(40);
    }, 2000);

    // Step 2: Letter Generation
    setTimeout(() => {
      setShowMessage('Generating PDF document...');
      setAnimationStep(41);
    }, 3000);

    setTimeout(() => {
      if (caseId === 'PA-2024-004') {
        setShowMessage('✓ Denial letter generated - Missing documentation noted');
      } else if (caseId === 'PA-2024-007') {
        setShowMessage('✓ Denial letter generated - Inpatient admission not medically necessary');
      } else if (caseId === 'PA-2024-006') {
        setShowMessage('✓ Approval letter generated - CPAP replacement approved');
      } else if (caseId === 'PA-2024-008') {
        setShowMessage('✓ Approval letter generated - Cardiac rehabilitation approved');
      } else {
        setShowMessage('✓ Approval letter generated');
      }
      setAnimationStep(42);
    }, 4000);

    // Step 3: Provider Notification
    setTimeout(() => {
      setShowMessage('Sending notification to provider...');
      setAnimationStep(43);
    }, 5000);

    setTimeout(() => {
      setShowMessage('✓ Notification sent successfully');
      setAnimationStep(44);
    }, 6000);

    // Step 4: EMR Integration
    setTimeout(() => {
      setShowMessage('Sending authorization data to EMR medical records...');
      setAnimationStep(45);
    }, 7000);

    setTimeout(() => {
      setShowMessage('✓ Data transmitted to EMR successfully');
      setAnimationStep(46);
      
      // Trigger EMR notification service immediately
      import('../../services/emrNotificationService').then(({ emrNotificationService }) => {
        // Send to EPIC immediately
        emrNotificationService.sendToEMR(
          caseId,
          'Sarah Johnson',
          `AUTH-${caseId}`,
          'CPT-12345'
        );
        
        // Simulate hospital notification after 2 seconds
        setTimeout(() => {
          emrNotificationService.simulateHospitalNotification(
            caseId,
            'UCLA Medical Center',
            0
          );
        }, 2000);
        
        // Simulate order placement after additional 3 seconds
        setTimeout(() => {
          emrNotificationService.simulateOrderPlacement(
            caseId,
            'UCLA Medical Center',
            0
          );
        }, 5000);
      });
    }, 8000);

    // Step 5: Complete
    setTimeout(() => {
      if (caseId === 'PA-2024-007') {
        setShowMessage('❌ Authorization Denied - Letter available for download');
      } else if (caseId === 'PA-2024-006') {
        setShowMessage('✅ Authorization Approved - CPAP Replacement Authorized');
      } else if (caseId === 'PA-2024-008') {
        setShowMessage('✅ Authorization Approved - Cardiac Rehabilitation Authorized (36 sessions)');
      } else {
        setShowMessage('🎉 Authorization Complete - Letter available for download!');
      }
      setAnimationStep(47);
      
      // Update Provider Notification status to completed
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'provider-notification' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Mark letter as generated in localStorage for dashboard notification
      localStorage.setItem(`ipas_letter_generated_${caseId}`, new Date().toISOString());
      
      // Update case status to approved/denied based on the decision
      const finalStatus = (caseId === 'PA-2024-007') ? 'denied' : 'approved';
      console.log(`✓ Updating case ${caseId} status to: ${finalStatus}`);
      statusTracker.updateCaseStatus(
        caseId, 
        finalStatus, 
        'system', 
        'Workflow completed successfully',
        `Authorization ${finalStatus} and letter generated`
      );
      console.log(`✓ Case ${caseId} status updated successfully`);
      
      setIsAnimating(false);
    }, 9000);
  };

  const startMemberVerificationProcess = () => {
    setIsAnimating(true);
    setAnimationStep(38);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('Verifying member eligibility...');
      setAnimationStep(39);
    }, 1000);

    setTimeout(() => {
      setShowMessage('✓ Member ID verified: INS987654321');
      setAnimationStep(40);
    }, 2000);

    setTimeout(() => {
      setShowMessage('Checking coverage details...');
      setAnimationStep(41);
    }, 3000);

    setTimeout(() => {
      setShowMessage('✓ Coverage verified - Active benefits for the DOS');
      setAnimationStep(42);
    }, 4000);

    setTimeout(() => {
      setShowMessage('✓ Member Verification complete');
      setAnimationStep(43);
      
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'member-verification' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Proceed to Data Enrichment
      setTimeout(() => {
        setShowMessage('Proceeding to Data Enrichment...');
        setAnimationStep(44);
        setProcessSteps(prev => 
          prev.map(step => 
            step.id === 'data-enrichment' 
              ? { ...step, status: 'running' }
              : step
          )
        );
        setTimeout(() => {
          startDataEnrichmentProcess();
        }, 2000);
      }, 2000);
    }, 5000);
  };

  const startDataEnrichmentProcess = () => {
    setIsAnimating(true);
    setAnimationStep(45);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('⚡ Flashing clinical data...');
      setAnimationStep(46);
    }, 1000);

    setTimeout(() => {
      if (caseId === 'PA-2024-003') {
        setShowMessage('📊 X-ray and MRI results found');
      } else if (caseId === 'PA-2024-005') {
        setShowMessage('📊 Previous chest X-ray and lab results found');
      } else if (caseId === 'PA-2024-006') {
        setShowMessage('📊 Sleep study results found - OSA diagnosis confirmed (AHI 8.9/hr)');
      } else if (caseId === 'PA-2024-008') {
        setShowMessage('📊 Cardiac cath report and echo results found - NSTEMI with reduced EF (40%)');
      } else {
        setShowMessage('📊 Stress test results found');
      }
      setAnimationStep(47);
    }, 2000);

    setTimeout(() => {
      setShowMessage('✓ Clinical data loaded');
      setAnimationStep(48);
    }, 3000);

    setTimeout(() => {
      setShowMessage('Checking additional sources…');
      setAnimationStep(49);
    }, 4000);

    setTimeout(() => {
      setShowMessage('Retrieving data from member RTRs, claim RTRs, Auth RTRs');
      setAnimationStep(50);
    }, 5000);

    setTimeout(() => {
      setShowMessage('Data successfully retrieved');
      setAnimationStep(51);
    }, 6000);

    setTimeout(() => {
      setShowMessage('✓ Data Enrichment complete');
      setAnimationStep(52);
      
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'data-enrichment' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Proceed to Gap Assessment
      setTimeout(() => {
        setShowMessage('Proceeding to Gap Assessment...');
        setAnimationStep(53);
        setProcessSteps(prev => 
          prev.map(step => 
            step.id === 'gap-assessment' 
              ? { ...step, status: 'running' }
              : step
          )
        );
        setTimeout(() => {
          startGapAssessmentProcess();
        }, 2000);
      }, 2000);
    }, 7000);
  };

  const startGapAssessmentProcess = () => {
    setIsAnimating(true);
    setAnimationStep(54);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('Scanning for data gaps...');
      setAnimationStep(55);
    }, 1000);

    setTimeout(() => {
      setShowMessage('Analyzing documentation completeness...');
      setAnimationStep(56);
    }, 2000);

    setTimeout(() => {
      if (caseId === 'PA-2024-004') {
        setShowMessage('❌ GAPS FOUND: Missing critical documentation');
        setAnimationStep(57);
      } else {
        setShowMessage('✓ No gaps found in documentation');
        setAnimationStep(57);
      }
    }, 3000);

    setTimeout(() => {
      if (caseId === 'PA-2024-004') {
        setShowMessage('❌ Missing: Documentation of prior colonoscopies and dates');
        setAnimationStep(58);
      } else {
        setShowMessage('✓ Gap Assessment complete');
        setAnimationStep(58);
      }
      
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'gap-assessment' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Route based on case
      setTimeout(() => {
        if (caseId === 'PA-2024-004') {
          // Case-004: Skip to Provider Notification for denial
          setShowMessage('Proceeding to Provider Notification (Denial)...');
          setAnimationStep(59);
          setProcessSteps(prev => 
            prev.map(step => 
              step.id === 'provider-notification' 
                ? { ...step, status: 'running' }
                : step
            )
          );
          setTimeout(() => {
            startProviderNotificationProcess();
          }, 2000);
        } else {
          // Other cases: Proceed to Decision Prediction
          setShowMessage('Proceeding to Clinical Summarization...');
          setAnimationStep(59);
          setProcessSteps(prev => 
            prev.map(step => 
              step.id === 'clinical-summarization' 
                ? { ...step, status: 'running' }
                : step
            )
          );
          setTimeout(() => {
            startClinicalSummarizationProcess();
          }, 2000);
        }
      }, 2000);
    }, 4000);
  };

   const startClinicalSummarizationProcess = () => {
    setIsAnimating(true);
    setAnimationStep(67);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('Synthesizing clinical data...');
      setAnimationStep(68);
    }, 1000);

    setTimeout(() => {
      setShowMessage('Generating comprehensive summary...');
      setAnimationStep(69);
    }, 2000);

    setTimeout(() => {
      setShowMessage('✓ Clinical summary generated');
      setAnimationStep(70);
    }, 3000);

    setTimeout(() => {
      setShowMessage('✓ Clinical Summarization complete');
      setAnimationStep(71);
      
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'clinical-summarization' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Proceed to Clinical Review Planning
      setTimeout(() => {
        setShowMessage('Proceeding to Decision Assessment...');
        setAnimationStep(72);
        setProcessSteps(prev => 
          prev.map(step => 
            step.id === 'data-prediction' 
              ? { ...step, status: 'running' }
              : step
          )
        );
        setTimeout(() => {
          startDataPredictionProcess();
        }, 2000);
      }, 2000);
    }, 4000);
  };

  const startDataPredictionProcess = () => {
    setIsAnimating(true);
    setAnimationStep(60);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('Assembling clinical notes...');
      setAnimationStep(61);
    }, 1000);

    setTimeout(() => {
      setShowMessage('Running ML prediction model...');
      setAnimationStep(62);
    }, 2000);

    setTimeout(() => {
      if (caseId === 'PA-2024-003') {
        setShowMessage('✓ Prediction: PARTIAL APPROVAL recommended ($4,000)');
      } else if (caseId === 'PA-2024-007') {
        setShowMessage('✓ Prediction: DENIAL recommended - Outpatient management appropriate');
      } else {
        setShowMessage('✓ Prediction: Case can be APPROVED');
      }
      setAnimationStep(63);
    }, 3000);

    setTimeout(() => {
      setShowMessage('💬 Opening chat for case review...');
      setAnimationStep(64);
      // Open chat dialog
      setChatOpen(true);
      // Pause animation - will resume when user clicks "Continue"
      setIsAnimating(false);
      
      if (caseId === 'PA-2024-003') {
        setChatMessages([
          {
            role: 'assistant',
            content: `I've analyzed Case PA-2024-003 (Robert Davis - Knee Arthroscopy). The procedure is medically necessary and meets clinical guidelines. However, the insurance policy has a coverage limit of $4,000 for this condition, while the requested amount is $8,000. My recommendation is PARTIAL APPROVAL for $4,000. Do you have any questions?`
          }
        ]);
      } else if (caseId === 'PA-2024-005') {
        setChatMessages([
          {
            role: 'assistant',
            content: `I've analyzed Case PA-2024-005 (David Brown - CT Chest with Contrast). The imaging is medically necessary based on clinical symptoms and meets all guidelines. Similar cases show a 92% approval rate. The $1,800 cost is reasonable and within coverage. My recommendation is APPROVE. Do you have any questions about the case?`
          }
        ]);
      } else if (caseId === 'PA-2024-006' || caseId === 'PA-2024-008') {
        setChatMessages([
          {
            role: 'assistant',
            content: caseId === 'PA-2024-008' 
              ? `I've analyzed Case PA-2024-008 (Daniel de Los Santos marin - Cardiac Rehabilitation). The patient recently suffered NSTEMI with 90% LAD stenosis requiring PCI with stent placement. Post-procedure echocardiogram shows reduced ejection fraction (40%) with anterior wall hypokinesis. Patient meets all criteria for Phase II cardiac rehabilitation: recent MI with PCI, reduced EF, multiple cardiac risk factors (HTN, DM, smoking history). Evidence strongly supports cardiac rehab improves mortality and functional capacity post-MI. My recommendation is APPROVE - 36 sessions over 12 weeks. Do you have questions?`
              : `I've analyzed Case PA-2024-006 (Rebecca Hardin - CPAP Device Replacement). Based on the clinical data and similar patient outcomes, the case shows strong medical necessity. The 77% approval rate for similar cases supports an approval decision. The patient has documented OSA with AHI 8.9/hr, compliant with current CPAP therapy, and device replacement is medically necessary. My recommendation is APPROVE. Do you have questions?`
          }
        ]);
      } else if (caseId === 'PA-2024-007') {
        setChatMessages([
          {
            role: 'assistant',
            content: `I've analyzed Case PA-2024-007 (Amanda Latoya Williams - Inpatient Admission for Acute Diverticulitis). After comprehensive review of clinical data, vital signs, laboratory results, and CT imaging, I've identified key findings: Patient is hemodynamically stable (BP 138/84, HR 78, Temp 98.1°F, SpO2 100%), afebrile, with normal WBC (no leukocytosis). CT shows uncomplicated sigmoid diverticulitis without abscess, perforation, or pericolonic complications. Patient tolerating oral intake and receiving appropriate antibiotic therapy (Ciprofloxacin + Metronidazole). Per AAFP guidelines and InterQual criteria, inpatient admission is not medically necessary - case meets criteria for outpatient management. My recommendation is DENY inpatient admission and APPROVE outpatient management plan. Do you have questions about this assessment?`
          }
        ]);
      } else {
        setChatMessages([
          {
            role: 'assistant',
            content: `I've analyzed Case PA-2024-002 (Mary Johnson - Cardiac Catheterization). Based on clinical guidelines, similar patient outcomes (77% approval rate), and medical necessity, my prediction is that this case can be APPROVED. Do you have any questions about the case?`
          }
        ]);
      }
    }, 4000);

    // Removed automatic progression - now controlled by chat dialog "Continue" button
  };

 

  const startClinicalReviewPlanningProcess = () => {
    setIsAnimating(true);
    setAnimationStep(73);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('Creating review plan...');
      setAnimationStep(74);
    }, 1000);

    setTimeout(() => {
      setShowMessage('✓ Review criteria established');
      setAnimationStep(75);
    }, 2000);

    setTimeout(() => {
      setShowMessage('✓ Timeline planned');
      setAnimationStep(76);
    }, 3000);

    setTimeout(() => {
      setShowMessage('✓ Clinical Review Planning complete');
      setAnimationStep(77);
      
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'clinical-review-planning' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Proceed to Clinical Decisioning
      setTimeout(() => {
        setShowMessage('Proceeding to Clinical Decisioning...');
        setAnimationStep(78);
        setProcessSteps(prev => 
          prev.map(step => 
            step.id === 'clinical-decisioning' 
              ? { ...step, status: 'running' }
              : step
          )
        );
        setTimeout(() => {
          startClinicalDecisioningProcess();
        }, 2000);
      }, 2000);
    }, 4000);
  };

  const startClinicalDecisioningProcess = () => {
    setIsAnimating(true);
    setAnimationStep(79);
    setShowMessage('');

    setTimeout(() => {
      setShowMessage('Reviewing medical necessity...');
      setAnimationStep(80);
    }, 1000);

    setTimeout(() => {
      setShowMessage('Applying clinical guidelines...');
      setAnimationStep(81);
    }, 2000);

    setTimeout(() => {
      setShowMessage('🏥 Convening Clinical Panel Review...');
      setAnimationStep(82);
    }, 3000);

    // Reviewer 1: Cardiologist
    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('👨‍⚕️  Sleep Medicine Specialist: Reviewing CPAP replacement medical necessity...');
      } else {
        setShowMessage('👨‍⚕️ Cardiologist: Reviewing cardiac catheterization necessity...');
      }
      setAnimationStep(83);
    }, 4000);

    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('✓ Sleep Medicine Specialist recommends: APPROVE - Clear OSA diagnosis, compliant patient');
      } else {
        setShowMessage('✓ Cardiologist recommends: APPROVE');
      }
      setAnimationStep(84);
    }, 5500);

    // Reviewer 2: Medical Director
    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('👩‍⚕️ Medical Director: Evaluating CPAP compliance and device age...');
      } else {
        setShowMessage('👩‍⚕️ Medical Director: Reviewing cost-benefit analysis...');
      }
      setAnimationStep(85);
    }, 6500);

    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('✓ Medical Director recommends: APPROVE - Device replacement medically necessary');
      } else {
        setShowMessage('✓ Medical Director recommends: APPROVE');
      }
      setAnimationStep(86);
    }, 8000);

    // Reviewer 3: Clinical Specialist
    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('👨‍⚕️ Clinical Specialist: Reviewing sleep study results and therapy compliance...');
      } else {
        setShowMessage('👨‍⚕️ Clinical Specialist: Reviewing patient history and risk factors...');
      }
      setAnimationStep(87);
    }, 9000);

    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('✓ Clinical Specialist recommends: APPROVE - Excellent compliance, clear OSA');
      } else {
        setShowMessage('✓ Clinical Specialist recommends: APPROVE');
      }
      setAnimationStep(88);
    }, 10500);

    // Reviewer 4: Quality Assurance
    setTimeout(() => {
      if (caseId === 'PA-2024-006') {
        setShowMessage('👩‍⚕️ Quality Assurance: Checking DME replacement guidelines...');
      } else {
        setShowMessage('👩‍⚕️ Quality Assurance: Reviewing compliance and guidelines...');
      }
      setAnimationStep(89);
    }, 11500);

    setTimeout(() => {
      if (caseId === 'PA-2024-007') {
        setShowMessage('✓ Quality Assurance recommends: DENY INPATIENT - Does not meet admission criteria');
      } else if (caseId === 'PA-2024-006') {
        setShowMessage('✓ Quality Assurance recommends: APPROVE - Meets all DME replacement criteria');
      } else {
        setShowMessage('✓ Quality Assurance recommends: APPROVE');
      }
      setAnimationStep(90);
    }, 13000);

    // Panel consensus
    setTimeout(() => {
      if (caseId === 'PA-2024-007') {
        setShowMessage('🎯 Panel Consensus: All 3 reviewers agree - DENY INPATIENT admission');
      } else if (caseId === 'PA-2024-006') {
        setShowMessage('🎯 Panel Consensus: All 4 reviewers agree - APPROVE CPAP replacement');
      } else {
        setShowMessage('🎯 Panel Consensus: All 4 reviewers agree - APPROVE');
      }
      setAnimationStep(91);
    }, 14000);

    setTimeout(() => {
      if (caseId === 'PA-2024-003') {
        setShowMessage('✓ Final Recommendation: PARTIAL APPROVAL ($4,000 of $8,000)');
      } else if (caseId === 'PA-2024-007') {
        setShowMessage('✓ Final Recommendation: DENY INPATIENT - Approve outpatient management');
      } else if (caseId === 'PA-2024-006') {
        setShowMessage('✓ Final Recommendation: APPROVE - CPAP replacement with supplies');
      } else if (caseId === 'PA-2024-008') {
        setShowMessage('✓ Final Recommendation: APPROVE - Cardiac rehabilitation 36 sessions');
      } else {
        setShowMessage('✓ Final Recommendation: APPROVE');
      }
      setAnimationStep(92);
    }, 15500);

    setTimeout(() => {
      setShowMessage('⏸️ Awaiting decision confirmation...');
      setAnimationStep(93);
      
      setProcessSteps(prev => 
        prev.map(step => 
          step.id === 'clinical-decisioning' 
            ? { ...step, status: 'completed' }
            : step
        )
      );
      
      // Show decision dialog
      setIsAnimating(false);
      setDecisionDialogOpen(true);
    }, 16500);
  };

  const clearSession = () => {
    const sessionKey = `ipas_orchestration_${caseId}`;
    localStorage.removeItem(sessionKey);
    
    // Reset to initial state based on case
    setProcessSteps(getInitialProcessSteps());
    setAnimationStep(0);
    setShowMessage('');
    setIsAnimating(false);
    setStepDetailsOpen(false);
  };

  const renderConnector = (fromStep: ProcessStep, toStep: ProcessStep, condition?: string) => {
    // Calculate edge points based on relative positions
    const fromLeft = fromStep.position.x;
    const fromRight = fromStep.position.x + 200; // 200px width
    const fromCenterX = fromStep.position.x + 100;
    const fromCenterY = fromStep.position.y + 25;
    
    const toLeft = toStep.position.x;
    const toRight = toStep.position.x + 200;
    const toCenterX = toStep.position.x + 100;
    const toCenterY = toStep.position.y + 25;
    
    // Determine which edges to connect
    let fromX: number, fromY: number, toX: number, toY: number;
    
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;
    
    // Special case: Gap Assessment to Decision Prediction (right to top)
    if (fromStep.id === 'gap-assessment' && toStep.id === 'clinical-summarization') {
      // Connect from right edge to top center
      fromX = 1500; // Gap Assessment right edge (1300 + 200)
      fromY = 135;  // Gap Assessment middle (50 + 85)
      toX = 150;    // Decision Prediction top center (50 + 100)
      toY = 245;    // Decision Prediction TOP edge - 5px above (position.y - 5)
      console.log('Gap Assessment to Decision Prediction connector:', { 
        from: `(${fromX}, ${fromY})`, 
        to: `(${toX}, ${toY})`,
        fromDesc: 'Gap Assessment right edge',
        toDesc: 'Decision Prediction TOP center'
      });
    } 
    // Special case: Clinical Decisioning to Provider Notification (bottom to top)
    else if (fromStep.id === 'clinical-decisioning' && toStep.id === 'provider-notification') {
      fromX = fromStep.position.x + 100; // Center of Clinical Decisioning
      fromY = fromStep.position.y + 170; // Bottom edge (assuming ~170px height)
      toX = toStep.position.x + 100; // Center top of Provider Notification
      toY = toStep.position.y; // Top edge
    } else if (dx > 0) {
      // Target is to the right of source - connect right side to left side
      fromX = fromRight; // Right edge of source
      toX = toLeft;      // Left edge of target
      fromY = fromStep.position.y + 85; // 85px from top of block
      toY = toStep.position.y + 85;     // 85px from top of block
    } else {
      // Target is to the left of source - connect left side to right side
      fromX = fromLeft;  // Left edge of source
      toX = toRight;     // Right edge of target
      fromY = fromStep.position.y + 85; // 85px from top of block
      toY = toStep.position.y + 85;     // 85px from top of block
    }
    
    // Calculate right-angle path
    let pathData: string;
    
    // Special handling for Gap Assessment to Decision Prediction (right, down, left)
    if (fromStep.id === 'gap-assessment' && toStep.id === 'clinical-summarization') {
      // Go right 50px, down to target row, then left to target
      const rightExtend = fromX + 50;
      pathData = `M ${fromX} ${fromY} L ${rightExtend} ${fromY} L ${rightExtend} ${toY} L ${toX} ${toY}`;
      console.log('Gap Assessment to Decision Prediction path:', pathData);
      console.log('This should arrive at TOP center of Decision Prediction');
    }
    // Special handling for Clinical Decisioning to Provider Notification (straight down)
    else if (fromStep.id === 'clinical-decisioning' && toStep.id === 'provider-notification') {
      // Straight vertical line from bottom to top
      pathData = `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection: go right/left first, then up/down
      const midX = fromX + (toX - fromX) / 2;
      pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    } else {
      // Vertical connection: go up/down first, then right/left
      const midY = fromY + (toY - fromY) / 2;
      pathData = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
    }
    
             const midX = (fromX + toX) / 2;
             const midY = (fromY + toY) / 2;
             
             // Check if this connector should be animated (mutually exclusive)
             const shouldAnimateStartToIntake = isAnimating && animationStep >= 4 && animationStep < 16 && fromStep.id === 'start' && toStep.id === 'auth-intake';
             const shouldAnimateIntakeToTriage = isAnimating && animationStep >= 16 && animationStep < 28 && fromStep.id === 'auth-intake' && toStep.id === 'auth-triage';
             const shouldAnimateTriageToNotification = isAnimating && animationStep >= 28 && fromStep.id === 'auth-triage' && toStep.id === 'provider-notification';
             const shouldAnimate = shouldAnimateStartToIntake || shouldAnimateIntakeToTriage || shouldAnimateTriageToNotification;
             
             // Use downward arrowhead for Gap Assessment to Decision Prediction
             const markerType = (fromStep.id === 'gap-assessment' && toStep.id === 'clinical-summarization') 
               ? 'url(#arrowhead-down)' 
               : 'url(#arrowhead)';
             
             return (
               <g key={`${fromStep.id}-${toStep.id}`}>
                 <path
                   d={pathData}
                   stroke={getStatusColor(fromStep.status)}
                   strokeWidth={shouldAnimate ? "4" : "2"}
                   fill="none"
                   markerEnd={markerType}
                   style={{ 
                     filter: condition ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none',
                     cursor: 'pointer',
                     transition: 'stroke-width 0.2s ease, stroke 0.2s ease',
                     strokeDasharray: shouldAnimate ? '10,5' : 'none',
                     animation: shouldAnimate ? 'dash 1s linear infinite' : 'none'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.strokeWidth = '3';
                     e.currentTarget.style.stroke = '#9c27b0'; // Violet color
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.strokeWidth = shouldAnimate ? '4' : '2';
                     e.currentTarget.style.stroke = getStatusColor(fromStep.status);
                   }}
                 />
                 {condition && (
                   <text
                     x={midX}
                     y={midY - 8}
                     fontSize="10"
                     fill="#666"
                     textAnchor="middle"
                     style={{ 
                       fontWeight: 'bold',
                       filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.8))'
                     }}
                   >
                     {condition}
                   </text>
                 )}
               </g>
             );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            IPAS Flow - Case #{caseId}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={isAnimating ? "In Progress" : "Ready"} 
              color={isAnimating ? "warning" : "success"} 
              size="small" 
            />
            <Chip 
              label={`${processSteps.filter(s => s.status === 'completed').length}/${processSteps.length} Steps Complete`} 
              color="info" 
              size="small" 
            />
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                clearSession();
                window.location.reload();
              }}
            >
              Reset Workflow
            </Button>
          </Box>
        </Box>

        {/* Animation Message Display */}
        {showMessage && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: hasErrorMessage(showMessage) ? '#ffebee' : 
                           animationStep >= 3 ? '#e8f5e8' : '#fff3cd',
            border: `2px solid ${hasErrorMessage(showMessage) ? '#f44336' : 
                              animationStep >= 3 ? '#4caf50' : '#ff9800'}`,
            borderRadius: 2,
            textAlign: 'center',
            animation: 'pulse 0.5s ease-in-out'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: hasErrorMessage(showMessage) ? '#c62828' : 
                       animationStep >= 3 ? '#2e7d32' : '#e65100',
                fontWeight: 'bold',
                animation: animationStep >= 4 ? 'flash 0.5s ease-in-out infinite alternate' : 'none'
              }}
            >
              {showMessage}
            </Typography>
            
            {/* EMR Medical Record Link */}
            {showMessage.includes('Data transmitted to EMR successfully') && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DocumentIcon />}
                  onClick={() => {
                    // Open EMR medical record in new tab
                    window.open('https://epic-demo.healthcare.com/patient/medical-records', '_blank');
                  }}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  View Updated Medical Record in EMR
                </Button>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  Authorization data has been integrated into the patient's EMR medical record
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Simple Draggable Flowchart */}
        <Box
          ref={containerRef}
          sx={{ 
            height: 700, 
            width: '100%',
            border: '1px solid #e0e0e0', 
            borderRadius: 2,
            position: 'relative',
            overflow: 'auto',
            overflowX: 'auto',
            overflowY: 'auto',
            backgroundColor: '#fafafa'
          }}
        >
          <svg width="100%" height="680" style={{ position: 'absolute', top: 0, left: 0, minWidth: '1565px' }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#666"
                />
              </marker>
              <marker
                id="arrowhead-down"
                markerWidth="7"
                markerHeight="10"
                refX="3.5"
                refY="0"
                orient="360"
              >
                <polygon
                  points="0 0, 3.5 10, 7 0"
                  fill="#666"
                />
              </marker>
              <style>
                {`
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -15;
                    }
                  }
                  @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                  }
                  @keyframes flash {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                  }
                `}
              </style>
            </defs>
            
            {/* Render connectors */}
            {processSteps.map(step => 
              step.nextSteps.map(nextStepId => {
                const nextStep = processSteps.find(s => s.id === nextStepId);
                if (!nextStep) return null;
                
                const condition = step.conditions?.[nextStepId];
                return renderConnector(step, nextStep, condition);
              })
            )}
          </svg>

          {/* Render draggable nodes */}
          {processSteps.map(step => (
            <Paper
              key={step.id}
              sx={{
                position: 'absolute',
                left: step.position.x,
                top: step.position.y,
                width: 200,
                p: 2,
                cursor: draggedStep === step.id ? 'grabbing' : 'grab',
                border: `2px solid ${getStatusColor(step.status)}`,
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: 2,
                '&:hover': {
                  boxShadow: step.id === 'start' && step.status === 'completed' ? 6 : 4,
                  transform: step.id === 'start' && step.status === 'completed' ? 'scale(1.05)' : 'scale(1.02)',
                  transition: 'all 0.2s'
                },
                userSelect: 'none'
              }}
              onMouseDown={(e) => handleMouseDown(e, step.id)}
              onClick={() => handleStepClick(step)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getTypeIcon(step.type)}
                <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                  {step.name}
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.id === 'start' && step.status === 'completed' && (
                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      Click to Start
                    </Typography>
                  )}
                  {getStatusIcon(step.status)}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {step.description}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={step.status.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(step.status),
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
              {step.id === 'provider-notification' && step.status === 'completed' && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = `/sample-documents/approval-letters/${caseId}-approval-letter.pdf`;
                      link.download = `${caseId}-approval-letter.pdf`;
                      link.click();
                    }}
                  >
                    Download Letter
                  </Button>
                  <EMRNotificationStatus caseId={caseId} />
                </Box>
              )}
            </Paper>
          ))}
        </Box>

        {/* Step Details Dialog */}
        <Dialog
          open={stepDetailsOpen}
          onClose={() => setStepDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AIIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {selectedStep?.name}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedStep && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Step Details
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    label={selectedStep.status.toUpperCase()}
                    color={selectedStep.status === 'completed' ? 'success' : 
                           selectedStep.status === 'running' ? 'warning' : 'default'}
                  />
                  <Chip
                    label={selectedStep.type.toUpperCase()}
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {selectedStep.description}
                </Typography>

                <Typography variant="h6" gutterBottom>
                  Sub-Steps
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {selectedStep.subSteps.map((subStep, index) => (
                    <Chip
                      key={index}
                      label={subStep}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>

                {selectedStep.nextSteps.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Next Steps
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {selectedStep.nextSteps.map((nextStep, index) => (
                        <Chip
                          key={index}
                          label={nextStep}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </>
                )}

                {selectedStep.conditions && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Conditions
                    </Typography>
                    <Box>
                      {Object.entries(selectedStep.conditions).map(([condition, nextStep], index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{condition}:</strong> → {nextStep}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                {/* Session Management Options */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Session Management
                  </Typography>
                  
                  {selectedStep.id === 'start' && selectedStep.status === 'completed' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        This step is completed. You can restart the entire workflow or continue with the next step.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small"
                          onClick={() => {
                            setStepDetailsOpen(false);
                            startAnimationSequence();
                          }}
                        >
                          Restart Workflow
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          size="small"
                          onClick={() => {
                            setStepDetailsOpen(false);
                            startAuthIntakeProcess();
                          }}
                        >
                          Continue to Auth Intake
                        </Button>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small"
                      onClick={() => {
                        clearSession();
                        setStepDetailsOpen(false);
                      }}
                    >
                      Clear Session
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="info" 
                      size="small"
                      onClick={() => {
                        console.log('Current session state:', {
                          processSteps,
                          animationStep,
                          showMessage
                        });
                      }}
                    >
                      Debug Session
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStepDetailsOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Chat Dialog for Decision Prediction */}
        <Dialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChatIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Case Discussion - {caseId}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
              {chatMessages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                      maxWidth: '80%'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {msg.content}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask a question about the case..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    const userMessage = chatInput.trim();
                    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                    setChatInput('');
                    
                    // Simulate AI response
                    setTimeout(() => {
                      let responses: {[key: string]: string} = {};
                      
                      // Case-specific responses
                      if (caseId === 'PA-2024-006' || caseId === 'PA-2024-008') {
                        responses = {
                          'default': 'Based on the clinical data and similar patient outcomes, the case shows strong medical necessity. The 77% approval rate for similar cases supports an approval decision.',
                          'risk': 'The risk assessment indicates a favorable outcome. Patient has excellent CPAP compliance and stable condition.',
                          'cost': 'The 2,500 amount is within normal range for CPAP device replacement with accessories. Similar approved cases averaged $2,300.',
                          'guidelines': 'The case meets all clinical guidelines for DME replacement as per Medicare LCD and policy requirements.',
                          'symptoms': 'Patient presented with documented Obstructive Sleep Apnea (AHI 8.9/hr on diagnostic sleep study). Current symptoms include daytime sleepiness (Epworth score 3/24 - indicating excellent control with current therapy). Patient is highly compliant with CPAP therapy and requires device replacement as current unit is 5+ years old.',
                          'diagnosis': 'The patient has a confirmed diagnosis of Obstructive Sleep Apnea (ICD-10: G47.33) documented via polysomnography. The AHI of 8.9/hr falls within the mild-to-moderate range, clearly meeting medical necessity criteria for CPAP therapy.',
                          'medically necessary': 'This CPAP replacement is medically necessary because: 1) Patient has documented OSA with AHI 8.9/hr requiring ongoing therapy, 2) Current device is 5+ years old and approaching end of functional life, 3) Patient demonstrates excellent compliance with therapy (Epworth score 3/24), 4) Device replacement is standard practice per Medicare LCD guidelines for DME >5 years old, 5) Continued CPAP therapy prevents serious complications including cardiovascular events, cognitive impairment, and motor vehicle accidents.',
                        };
                      } else if (caseId === 'PA-2024-007') {
                        responses = {
                          'default': 'Based on the clinical data, the inpatient admission does not meet medical necessity criteria. Patient is hemodynamically stable, afebrile, with normal labs and uncomplicated diverticulitis on CT. AAFP guidelines support outpatient management.',
                          'risk': 'Low clinical risk for outpatient management. Patient has stable vital signs (BP 138/84, HR 78, Temp 98.1°F, SpO2 100%), no systemic toxicity, tolerating oral intake, and receiving appropriate antibiotic therapy. Risk of progression is approximately 5%.',
                          'cost': 'Inpatient admission would cost $12,500-15,000 for 3-day stay, while outpatient management costs only $800-$1,200. Cost savings of approximately $11,700 while maintaining appropriate level of care.',
                          'guidelines': 'The case does NOT meet inpatient admission criteria per AAFP evidence-based guidelines, ACG clinical guidelines, or InterQual criteria. Guidelines require complications (abscess, perforation), hemodynamic instability, sepsis, or inability to tolerate oral intake for inpatient care.',
                          'vitals': 'Patient vitals are completely stable: BP 138/84, HR 78, Temp 98.1°F (afebrile), SpO2 100%. No signs of hemodynamic instability or systemic toxicity.',
                          'symptoms': 'Patient presented with abdominal pain, back pain, and blood in stool. However, current clinical presentation shows patient tolerating oral intake, pain controlled with oral analgesics, and receiving appropriate antibiotic coverage.',
                          'diagnosis': 'The patient has acute uncomplicated sigmoid diverticulitis (K57.92) confirmed on CT scan. CT shows no abscess, perforation, or pericolonic complications. This is a classic case for outpatient management.',
                          'labs': 'Laboratory results show normal WBC with no leukocytosis, normal metabolic panel, and normal renal function. Absence of elevated WBC count indicates no systemic infection requiring inpatient care.',
                          'imaging': 'CT abdomen/pelvis shows uncomplicated sigmoid diverticulitis without abscess, perforation, or pericolonic complications. This is Hinchey Grade 0-1 diverticulitis, which evidence strongly supports for outpatient management.',
                          'medically necessary': 'Inpatient admission is NOT medically necessary because: 1) Patient is hemodynamically stable with normal vital signs, 2) Afebrile with normal inflammatory markers, 3) CT shows uncomplicated diverticulitis without complications, 4) Tolerating oral intake and oral medications, 5) Receiving appropriate antibiotic therapy (Ciprofloxacin + Metronidazole), 6) All evidence-based guidelines support outpatient management for this clinical presentation.',
                        };
                      } else {
                        responses = {
                          'default': 'Based on the clinical data and similar patient outcomes, the case shows strong medical necessity. The 77% approval rate for similar cases supports an approval decision.',
                          'risk': 'The risk assessment indicates a favorable outcome. Patient has stable vitals and meets all clinical criteria for the procedure.',
                          'cost': 'The 15,000 amount is within normal range for cardiac catheterization. Similar approved cases averaged $14,500.',
                          'guidelines': 'The case meets all clinical guidelines for cardiac catheterization as per the American College of Cardiology standards.',
                        };
                      }
                      
                      let response = responses.default;
                      if (userMessage.toLowerCase().includes('risk')) response = responses.risk;
                      if (userMessage.toLowerCase().includes('cost') || userMessage.toLowerCase().includes('amount')) response = responses.cost;
                      if (userMessage.toLowerCase().includes('guideline')) response = responses.guidelines;
                      if (userMessage.toLowerCase().includes('compliance')) response = responses.compliance || responses.default;
                      if (userMessage.toLowerCase().includes('device age') || userMessage.toLowerCase().includes('how old')) response = responses['device age'] || responses.default;
                      if (userMessage.toLowerCase().includes('symptom')) response = responses.symptoms || responses.default;
                      if (userMessage.toLowerCase().includes('diagnosis') || userMessage.toLowerCase().includes('diagnose')) response = responses.diagnosis || responses.default;
                      if (userMessage.toLowerCase().includes('vital') || userMessage.toLowerCase().includes('vitals')) response = responses.vitals || responses.default;
                      if (userMessage.toLowerCase().includes('lab') || userMessage.toLowerCase().includes('laboratory')) response = responses.labs || responses.default;
                      if (userMessage.toLowerCase().includes('imaging') || userMessage.toLowerCase().includes('ct') || userMessage.toLowerCase().includes('scan')) response = responses.imaging || responses.default;
                      if (userMessage.toLowerCase().includes('medically necessary') || userMessage.toLowerCase().includes('why is it medically necessary') || userMessage.toLowerCase().includes('medical necessity')) response = responses['medically necessary'] || responses.default;
                      
                      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
                    }, 1000);
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => {
                  if (chatInput.trim()) {
                    const userMessage = chatInput.trim();
                    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                    setChatInput('');
                    
                    setTimeout(() => {
                      let responses: {[key: string]: string} = {};
                      
                      // Case-specific responses
                      if (caseId === 'PA-2024-006' || caseId === 'PA-2024-008') {
                        responses = {
                          'default': 'Based on the clinical data and similar patient outcomes, the case shows strong medical necessity. The 77% approval rate for similar cases supports an approval decision.',
                          'risk': 'The risk assessment indicates a favorable outcome. Patient has excellent CPAP compliance and stable condition.',
                          'cost': 'The 2,500 amount is within normal range for CPAP device replacement with accessories. Similar approved cases averaged $2,300.',
                          'guidelines': 'The case meets all clinical guidelines for DME replacement as per Medicare LCD and policy requirements.',
                          'symptoms': 'Patient presented with documented Obstructive Sleep Apnea (AHI 8.9/hr on diagnostic sleep study). Current symptoms include daytime sleepiness (Epworth score 3/24 - indicating excellent control with current therapy). Patient is highly compliant with CPAP therapy and requires device replacement as current unit is 5+ years old.',
                          'diagnosis': 'The patient has a confirmed diagnosis of Obstructive Sleep Apnea (ICD-10: G47.33) documented via polysomnography. The AHI of 8.9/hr falls within the mild-to-moderate range, clearly meeting medical necessity criteria for CPAP therapy.',
                          'medically necessary': 'This CPAP replacement is medically necessary because: 1) Patient has documented OSA with AHI 8.9/hr requiring ongoing therapy, 2) Current device is 5+ years old and approaching end of functional life, 3) Patient demonstrates excellent compliance with therapy (Epworth score 3/24), 4) Device replacement is standard practice per Medicare LCD guidelines for DME >5 years old, 5) Continued CPAP therapy prevents serious complications including cardiovascular events, cognitive impairment, and motor vehicle accidents.',
                        };
                      } else if (caseId === 'PA-2024-007') {
                        responses = {
                          'default': 'Based on the clinical data, the inpatient admission does not meet medical necessity criteria. Patient is hemodynamically stable, afebrile, with normal labs and uncomplicated diverticulitis on CT. AAFP guidelines support outpatient management.',
                          'risk': 'Low clinical risk for outpatient management. Patient has stable vital signs (BP 138/84, HR 78, Temp 98.1°F, SpO2 100%), no systemic toxicity, tolerating oral intake, and receiving appropriate antibiotic therapy. Risk of progression is approximately 5%.',
                          'cost': 'Inpatient admission would cost $12,500-15,000 for 3-day stay, while outpatient management costs only $800-$1,200. Cost savings of approximately $11,700 while maintaining appropriate level of care.',
                          'guidelines': 'The case does NOT meet inpatient admission criteria per AAFP evidence-based guidelines, ACG clinical guidelines, or InterQual criteria. Guidelines require complications (abscess, perforation), hemodynamic instability, sepsis, or inability to tolerate oral intake for inpatient care.',
                          'vitals': 'Patient vitals are completely stable: BP 138/84, HR 78, Temp 98.1°F (afebrile), SpO2 100%. No signs of hemodynamic instability or systemic toxicity.',
                          'symptoms': 'Patient presented with abdominal pain, back pain, and blood in stool. However, current clinical presentation shows patient tolerating oral intake, pain controlled with oral analgesics, and receiving appropriate antibiotic coverage.',
                          'diagnosis': 'The patient has acute uncomplicated sigmoid diverticulitis (K57.92) confirmed on CT scan. CT shows no abscess, perforation, or pericolonic complications. This is a classic case for outpatient management.',
                          'labs': 'Laboratory results show normal WBC with no leukocytosis, normal metabolic panel, and normal renal function. Absence of elevated WBC count indicates no systemic infection requiring inpatient care.',
                          'imaging': 'CT abdomen/pelvis shows uncomplicated sigmoid diverticulitis without abscess, perforation, or pericolonic complications. This is Hinchey Grade 0-1 diverticulitis, which evidence strongly supports for outpatient management.',
                          'medically necessary': 'Inpatient admission is NOT medically necessary because: 1) Patient is hemodynamically stable with normal vital signs, 2) Afebrile with normal inflammatory markers, 3) CT shows uncomplicated diverticulitis without complications, 4) Tolerating oral intake and oral medications, 5) Receiving appropriate antibiotic therapy (Ciprofloxacin + Metronidazole), 6) All evidence-based guidelines support outpatient management for this clinical presentation.',
                        };
                      } else {
                        responses = {
                          'default': 'Based on the clinical data and similar patient outcomes, the case shows strong medical necessity.',
                          'risk': 'The risk assessment indicates a favorable outcome. Patient has stable vitals and meets all clinical criteria for the procedure.',
                          'cost': 'The 15,000 amount is within normal range for cardiac catheterization. Similar approved cases averaged $14,500.',
                          'guidelines': 'The case meets all clinical guidelines for cardiac catheterization as per the American College of Cardiology standards.',
                        };
                      }
                      
                      let response = responses.default;
                      if (userMessage.toLowerCase().includes('risk')) response = responses.risk;
                      if (userMessage.toLowerCase().includes('cost') || userMessage.toLowerCase().includes('amount')) response = responses.cost;
                      if (userMessage.toLowerCase().includes('guideline')) response = responses.guidelines;
                      if (userMessage.toLowerCase().includes('compliance')) response = responses.compliance || responses.default;
                      if (userMessage.toLowerCase().includes('device age') || userMessage.toLowerCase().includes('how old')) response = responses['device age'] || responses.default;
                      if (userMessage.toLowerCase().includes('symptom')) response = responses.symptoms || responses.default;
                      if (userMessage.toLowerCase().includes('diagnosis') || userMessage.toLowerCase().includes('diagnose')) response = responses.diagnosis || responses.default;
                      if (userMessage.toLowerCase().includes('vital') || userMessage.toLowerCase().includes('vitals')) response = responses.vitals || responses.default;
                      if (userMessage.toLowerCase().includes('lab') || userMessage.toLowerCase().includes('laboratory')) response = responses.labs || responses.default;
                      if (userMessage.toLowerCase().includes('imaging') || userMessage.toLowerCase().includes('ct') || userMessage.toLowerCase().includes('scan')) response = responses.imaging || responses.default;
                      if (userMessage.toLowerCase().includes('medically necessary') || userMessage.toLowerCase().includes('why is it medically necessary') || userMessage.toLowerCase().includes('medical necessity')) response = responses['medically necessary'] || responses.default;
                      
                      setChatMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: response
                      }]);
                    }, 1000);
                  }
                }}
              >
                Send
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChatOpen(false)} variant="outlined">
              Close Chat
            </Button>
            <Button 
              onClick={() => {
                setChatOpen(false);
                // Continue to next stage
                setTimeout(() => {
                  setShowMessage('✓ Decision Assessment complete');
                  setProcessSteps(prev => 
                    prev.map(step => 
                      step.id === 'data-prediction' 
                        ? { ...step, status: 'completed' }
                        : step
                    )
                  );
                  
                  setTimeout(() => {
                    setShowMessage('Matching against clinical guidelines...');
                    setAnimationStep(65);
                  }, 1000);

                  setTimeout(() => {
                    setShowMessage('Checking clinical guidelines...');
                    setAnimationStep(66);
                  }, 2000);

                  setTimeout(() => {
                    if (caseId === 'PA-2024-003') {
                      setShowMessage('✓ Meets clinical guidelines for knee arthroscopy');
                    } else if (caseId === 'PA-2024-005') {
                      setShowMessage('✓ Meets clinical guidelines for CT chest with contrast');
                    } else if (caseId === 'PA-2024-006') {
                      setShowMessage('✓ Meets DME replacement guidelines - Device >5 years old, compliant patient');
                    } else if (caseId === 'PA-2024-008') {
                      setShowMessage('✓ Meets AHA/ACC guidelines for cardiac rehabilitation post-MI with reduced EF');
                    } else {
                      setShowMessage('✓ Meets clinical guidelines for cardiac catheterization');
                    }
                    setAnimationStep(67);
                  }, 3000);

                  setTimeout(() => {
                    setShowMessage('Analyzing similar patient cases...');
                    setAnimationStep(68);
                  }, 4000);

                  setTimeout(() => {
                    if (caseId === 'PA-2024-003') {
                      setShowMessage('✓ 65% of similar patients were partially approved');
                    } else if (caseId === 'PA-2024-005') {
                      setShowMessage('✓ 92% of similar patients were approved');
                    } else if (caseId === 'PA-2024-006') {
                      setShowMessage('✓ 87% of similar DME replacement cases were approved');
                    } else if (caseId === 'PA-2024-008') {
                      setShowMessage('✓ 94% of similar post-MI cardiac rehab cases were approved');
                    } else {
                      setShowMessage('✓ 87% of similar patients were approved');
                    }
                    setAnimationStep(69);
                  }, 5000);

                  setTimeout(() => {
                    setShowMessage('✓ Guidelines matched successfully');
                    setAnimationStep(70);
                    
                    setTimeout(() => {
                      setShowMessage('Proceeding to Clinical Review Planning...');
                      setProcessSteps(prev => 
                        prev.map(step => 
                          step.id === 'clinical-review-planning' 
                            ? { ...step, status: 'running' }
                            : step
                        )
                      );
                      setTimeout(() => {
                        startClinicalReviewPlanningProcess();
                      }, 2000);
                    }, 2000);
                  }, 6000);
                }, 500);
              }} 
              variant="contained"
              color="primary"
            >
              Continue to Next Stage
            </Button>
          </DialogActions>
        </Dialog>

        {/* Decision Dialog for Clinical Decisioning */}
        <Dialog
          open={decisionDialogOpen}
          onClose={() => setDecisionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Clinical Decision Required
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Recommendation: <strong>{caseId === 'PA-2024-003' ? 'PARTIAL APPROVAL ($4,000 of $8,000)' : caseId === 'PA-2024-007' ? 'DECLINE' : 'APPROVE'}</strong>
            </Typography>
            {caseId === 'PA-2024-003' && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, p: 1, bgcolor: '#fff3cd', borderRadius: 1 }}>
                ⚠️ Insurance coverage limit: $4,000 maximum for knee arthroscopy procedures
              </Typography>
            )}
            {caseId === 'PA-2024-007' && (
              <Typography variant="body2" color="error.main" sx={{ mb: 2, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                ❌ Inpatient admission not medically necessary: Patient hemodynamically stable, afebrile, normal labs, uncomplicated diverticulitis on CT. Meets criteria for outpatient management per AAFP guidelines.
              </Typography>
            )}
            
            {/* Panel Members' Votes */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                {caseId === 'PA-2024-007' ? 'Panel Review Summary (3 Doctors)' : 'Panel Review Summary (4 Doctors)'}
              </Typography>
              
              {/* Gastroenterologist */}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: caseId === 'PA-2024-007' ? '4px solid #f44336' : '4px solid #4caf50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                     {caseId === 'PA-2024-007' ? 'Gastroenterologist' : 'Sleep medicine specialist'}
                  </Typography>
                  <Chip label={caseId === 'PA-2024-007' ? 'DENY' : 'APPROVE'} color={caseId === 'PA-2024-007' ? 'error' : 'success'} size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {caseId === 'PA-2024-003' 
                    ? "Given the patient's established diagnosis of OSA, the presence of multiple high-risk comorbidities, and the demonstrated clinical benefit of CPAP therapy, it is medically necessary for the patient to continue CPAP treatment."
                    : caseId === 'PA-2024-007'
                    ? "Given the acute onset of symptoms, prior history of diverticulitis, and confirmation by imaging, it is medically necessary to initiate appropriate treatment and observation in Outpatient setting as the patient is stable, afebrile, and has no evidence of complications. Supportive therapy, dietary modifications, and symptom monitoring are essential. Antibiotics may be considered given her history, but shared decision-making and close follow-up are recommended."
                    : "Given the patient's established diagnosis of OSA, the presence of multiple high-risk comorbidities, and the demonstrated clinical benefit of CPAP therapy, it is medically necessary for the patient to continue CPAP treatment. Discontinuation of CPAP would likely lead to worsening of OSA and significant negative health consequences."
                  }
                </Typography>
              </Box>
              
              {/* Infectious Disease Specialist */}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: caseId === 'PA-2024-007' ? '4px solid #f44336' : '4px solid #4caf50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {caseId === 'PA-2024-003' ? 'Dr. James Roberts, DO - Orthopedic Surgeon' : caseId === 'PA-2024-007' ? 'Infectious Disease Specialist' : 'Otolarngology/ENT Specialist'}
                  </Typography>
                  <Chip label={caseId === 'PA-2024-007' ? 'DENY' : 'APPROVE'} color={caseId === 'PA-2024-007' ? 'error' : 'success'} size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {caseId === 'PA-2024-003'
                    ? "MRI findings confirm meniscal tear and cartilage damage. Patient has documented 6 months of failed conservative therapy including PT and anti-inflammatories. Surgical intervention is appropriate next step."
                    : caseId === 'PA-2024-007'
                    ? "For this patient with uncomplicated acute diverticulitis, the medically necessary management includes supportive care, possible oral antibiotic therapy, pain control, and close outpatient monitoring. Inpatient admission or intravenous antibiotic therapy is not indicated unless her condition worsens or she develops signs of systemic infection or complications."
                    : "As an Otolaryngologist, I affirm that continued CPAP therapy is medically necessary for this patient. The combined presence of anatomical (enlarged thyroid, obesity) and systemic risk factors (hypertension, arrhythmias) makes ongoing CPAP usage crucial for managing OSA and preventing serious health consequences."
                  }
                </Typography>
              </Box>
              
              {/* General Surgeon */}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: caseId === 'PA-2024-007' ? '4px solid #f44336' : '4px solid #4caf50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {caseId === 'PA-2024-003' ? 'Dr. Emily Watson, MD - Sports Medicine' : caseId === 'PA-2024-007' ? 'General Surgeon' : ' Obesity Medicine Specialist'}
                  </Typography>
                  <Chip label={caseId === 'PA-2024-007' ? 'DENY' : 'APPROVE'} color={caseId === 'PA-2024-007' ? 'error' : 'success'} size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {caseId === 'PA-2024-003'
                    ? "Patient is 45 years old and active. Functional limitations are significant. Evidence-based guidelines support arthroscopic surgery when conservative management fails. Expected outcomes are favorable."
                    : caseId === 'PA-2024-007'
                    ? "For this patient with uncomplicated acute diverticulitis, there is no medical necessity for surgical intervention or inpatient admission at this time. Outpatient management with supportive care and close follow-up is medically necessary, aligning with current surgical and clinical guidelines."
                    : "As an Obesity Medicine Specialist, I strongly support the medical necessity of continued CPAP therapy for this patient. The combination of class 3 severe obesity, existing cardiovascular comorbidities, and anatomical risk factors necessitates ongoing CPAP use to optimize health outcomes, reduce morbidity, and support overall weight management efforts."
                  }
                </Typography>
              </Box>
              
              {/* Cardiologist - Only show for non-007 cases */}
              {caseId !== 'PA-2024-007' && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {caseId === 'PA-2024-003' ? 'Dr. David Kim, MD - Physical Medicine & Rehabilitation' : ' Cardiologist'}
                  </Typography>
                    <Chip label='APPROVE' color='success' size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {caseId === 'PA-2024-003'
                    ? "Comprehensive review of medical records shows progressive worsening despite appropriate non-surgical treatment. Functional status assessment indicates significant impact on daily activities. Approve with recommendation for post-op physical therapy."
                    : "As a Cardiologist, I strongly affirm the medical necessity of continued CPAP therapy for this patient. Given the interplay between OSA, hypertension, arrhythmias, and severe obesity, ongoing CPAP use is essential for cardiovascular risk reduction and long-term health maintenance."
                  }
                </Typography>
              </Box>
              )}

              <Box sx={{ mt: 2, p: 1, bgcolor: caseId === 'PA-2024-007' ? '#ffebee' : '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: caseId === 'PA-2024-007' ? '#c62828' : '#1976d2' }}>
                  {caseId === 'PA-2024-007' ? '❌ Consensus: 3/3 doctors recommend DENIAL' : '✓ Consensus: 4/4 doctors recommend APPROVAL'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Your Final Decision:
            </Typography>
            <ButtonGroup fullWidth sx={{ mb: 3 }}>
              <Button
                variant={selectedDecision === 'approve' ? 'contained' : 'outlined'}
                color="success"
                startIcon={<ThumbUpIcon />}
                onClick={() => setSelectedDecision('approve')}
              >
                Approve
              </Button>
              <Button
                variant={selectedDecision === 'partial' ? 'contained' : 'outlined'}
                color="warning"
                startIcon={<RemoveIcon />}
                onClick={() => setSelectedDecision('partial')}
              >
                Partial
              </Button>
              <Button
                variant={selectedDecision === 'decline' ? 'contained' : 'outlined'}
                color="error"
                startIcon={<ThumbDownIcon />}
                onClick={() => setSelectedDecision('decline')}
              >
                Decline
              </Button>
            </ButtonGroup>
            {selectedDecision && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Justification (required)"
                placeholder="Enter your justification for this decision..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDecisionDialogOpen(false);
              setSelectedDecision(null);
              setJustification('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedDecision || !justification.trim()}
              onClick={() => {
                setDecisionDialogOpen(false);
                setShowMessage(`✓ Decision: ${selectedDecision?.toUpperCase()}`);
                
                // Proceed to Provider Notification
                setTimeout(() => {
                  setShowMessage('Proceeding to Provider Notification...');
                  setProcessSteps(prev => 
                    prev.map(step => 
                      step.id === 'provider-notification' 
                        ? { ...step, status: 'running' }
                        : step
                    )
                  );
                  setTimeout(() => {
                    startProviderNotificationProcess();
                  }, 2000);
                }, 2000);
                
                setSelectedDecision(null);
                setJustification('');
              }}
            >
              Confirm Decision
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SimpleDraggableFlowchart;