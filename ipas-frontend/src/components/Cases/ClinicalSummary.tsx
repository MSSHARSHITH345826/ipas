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
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import DocumentComparisonViewer from './DocumentComparisonViewer';

interface CaseDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  category: 'prior-auth' | 'medical-records' | 'imaging' | 'insurance' | 'Clinical-notes' | 'diagnostics';
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

  "PA-2024-001": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],
  "002": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],
  "003": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],
  "004": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],
  "005": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],

  "PA-2024-002": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],
  
  "PA-2024-004": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-004-sarah-wilson/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-004-sarah-wilson/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-004-sarah-wilson/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-004-sarah-wilson/Summary.pdf",
      "isExtracted": false
    }
  ],

  "PA-2024-003": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-003-mike-johnson/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-003-mike-johnson/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-003-mike-johnson/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-003-mike-johnson/Summary.pdf",
      "isExtracted": false
    }
  ],
  "PA-2024-006": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-006-rebecca-hardin/Summary.pdf",
      "isExtracted": false
    }
  ],
  
  "PA-2024-007": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-12-15",
      "status": "ready",
      "url": "/sample-documents/cases/case-007/Summary.pdf",
      "originalUrl": "/sample-documents/cases/case-007/Summary.pdf",
      "extractedUrl": "/sample-documents/cases/case-007/Summary.pdf",
      "jsonUrl": "/sample-documents/cases/case-007/Summary.pdf",
      "isExtracted": false
    }
  ],
  
  "PA-2024-008": [
    {
      "id": "1",
      "name": "Clinical Summary",
      "type": "pdf",
      "category": "prior-auth",
      "size": "1.6 MB",
      "uploadDate": "2024-02-07",
      "status": "ready",
      "url": "/sample-documents/cases/008/ClinicalSummary _110402.pdf",
      "originalUrl": "/sample-documents/cases/008/ClinicalSummary _110402.pdf",
      "extractedUrl": "/sample-documents/cases/008/ClinicalSummary _110402.pdf",
      "jsonUrl": "/sample-documents/cases/008/MedicalRecordJson.txt",
      "isExtracted": false
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

    // Simulate extraction progress

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
        return <FolderIcon color="success" />;
      case 'imaging':
        return <ImageIcon color="info" />;
      case 'insurance':
        return <CloudDownloadIcon color="warning" />;
      case 'Clinical-notes':
        return <DocumentIcon color="secondary" />;
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
        return 'Clinical Summary';
      case 'medical-records':
        return 'Medical Records';
      case 'imaging':
        return 'Imaging';
      case 'insurance':
        return 'Insurance';
      case 'Clinical-notes':
        return 'Clinical Notes';
      default:
        return 'Other';
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
                          color="secondary"
                          onClick={() => handleDownload({ ...doc, url: doc.originalUrl || doc.url })}
                          title="Download Original Document"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>

          
                  {index < docs.length - 1 && <Divider />}
                </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      ))}

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