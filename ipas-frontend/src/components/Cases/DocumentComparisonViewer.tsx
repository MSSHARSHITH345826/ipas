import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  PictureAsPdf as PdfIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  DataObject as JsonIcon,
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize PDF.js worker
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;
}

interface DocumentComparisonViewerProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    originalUrl?: string;
    extractedUrl?: string;
    jsonUrl?: string;
    size: string;
    uploadDate: string;
    status: string;
    url: string;
    type?: string;
    category?: string;
  };
}

interface EditableField {
  path: string[];
  value: any;
}

const DocumentComparisonViewer: React.FC<DocumentComparisonViewerProps> = ({
  open,
  onClose,
  document: doc
}) => {
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editedValue, setEditedValue] = useState<string>('');

  const [isEditingCell, setIsEditingCell] = useState(false);

  useEffect(() => {
    if (open && doc) {
      loadDocumentContent();
      // Set the PDF URL with the full path
      const url = doc.originalUrl || doc.url;
      if (url) {
        // For development server, ensure we're using the correct port and public path
        setPdfUrl(url);
        console.log('Loading PDF from URL:', url);

        // Verify if the file is accessible
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            if (blob.type !== 'application/pdf') {
              console.warn('Warning: Resource is not a PDF:', blob.type);
            }
          })
          .catch(error => {
            console.error('Error checking PDF file:', error);
            setError('Cannot access the PDF file. Please check if the file exists in the public folder.');
          });
      }
    }
  }, [open, doc]);

  const loadDocumentContent = async () => {
    setLoading(true);
    try {
      if (doc?.jsonUrl) {
        // Check for saved changes in localStorage first
        const key = doc.jsonUrl.split('/').pop() || 'temp';
        const savedContent = localStorage.getItem(`edited_json_${key}`);

        if (savedContent) {
          // If we have saved changes, use those
          setJsonContent(JSON.parse(savedContent));
          console.log('Loaded content from localStorage');
        } else {
          // Otherwise load from the file
          const response = await fetch(doc.jsonUrl);
          if (response.ok) {
            const jsonData = await response.json();
            setJsonContent(jsonData);
            console.log('Loaded content from file');
          }
        }
      }
    } catch (error) {
      console.error('Error loading document content:', error);
      setError('Failed to load document content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    console.error('PDF URL:', pdfUrl);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);

    // Try to fetch the PDF directly to check if it's accessible
    fetch(pdfUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('PDF file is accessible, but failed to load in viewer');
        setError('PDF viewer failed to load the file. Please try downloading it instead.');
      })
      .catch(fetchError => {
        console.error('Failed to fetch PDF:', fetchError);
        setError('Cannot access the PDF file. Please make sure the file exists and try again.');
      });

    setPdfLoading(false);
  };

  const onDocumentLoadProgress = () => {
    setPdfLoading(true);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const renderPdfViewer = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
        <Box sx={{ width: '100%', height: '600px', position: 'relative' }}>
          <object
            data={pdfUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            onError={(e) => {
              console.error('Error loading PDF in object tag:', e);
              setError('Failed to load PDF file. Please try downloading it instead.');
            }}
          >
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="error" gutterBottom>
                {error || 'Error loading PDF file'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleDownload(pdfUrl, `${doc.name}`)}
                startIcon={<DownloadIcon />}
              >
                Download Instead
              </Button>
            </Box>
          </object>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => setZoomLevel(prev => Math.max(prev - 10, 50))}>
            <ZoomOutIcon />
          </IconButton>
          <Typography>
            {zoomLevel}%
          </Typography>
          <IconButton onClick={() => setZoomLevel(prev => Math.min(prev + 10, 200))}>
            <ZoomInIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  // Helper function to parse string value to appropriate type
  const parseValue = (value: string, originalValue: any) => {
    if (value === '') return '';
    if (typeof originalValue === 'number') {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    if (typeof originalValue === 'boolean') {
      return value.toLowerCase() === 'true';
    }
    return value;
  };

  // Helper function to update nested object immutably
  const updateNestedValue = (obj: any, path: string[], value: any): any => {
    if (path.length === 0) return value;

    const currentPath = path[0];
    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };

    newObj[currentPath] = updateNestedValue(
      obj[currentPath],
      path.slice(1),
      value
    );

    return newObj;
  };

  // Helper function to handle saving changes to the JSON file
  const handleSaveChanges = async (path: string[], newValue: any) => {
    try {
      // Get the original value to determine the type
      const originalValue = path.reduce((obj, key) => obj?.[key], jsonContent);
      const parsedValue = parseValue(newValue, originalValue);

      // Create updated content with immutable updates
      const updatedContent = updateNestedValue(jsonContent, path, parsedValue);

      // Save to localStorage first as backup
      if (doc?.jsonUrl) {
        const key = doc.jsonUrl.split('/').pop() || 'temp';
        localStorage.setItem(`edited_json_${key}`, JSON.stringify(updatedContent));
      }

      // Update the state
      setJsonContent(updatedContent);
      setEditingField(null);
      setEditedValue('');

      // Write changes to file system
      const filePath = doc?.jsonUrl?.replace(window.location.origin, '');
      if (filePath) {
        try {
          // Use the browser's FileSystem API to write to the file
          const file = new File(
            [JSON.stringify(updatedContent, null, 2)],
            filePath.split('/').pop() || 'document.json',
            { type: 'application/json' }
          );

          // Create a download link
          const link = document.createElement('a');
          link.href = URL.createObjectURL(file);
          link.download = filePath.split('/').pop() || 'document.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('Please save the downloaded file to:', filePath);
        } catch (fileError) {
          console.error('Error creating file:', fileError);
        }
      }

      console.log('Changes saved successfully in state:', {
        path,
        newValue: parsedValue,
        updatedContent
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  // Helper function to start editing a field
  const startEditing = (path: string[], value: any) => {
    setEditingField({ path, value });
    setEditedValue(String(value));
  };

  // Helper function to cancel editing
  const cancelEditing = () => {
    setEditingField(null);
    setEditedValue('');
  };

  const cancelSetIsEditingCell = () => {
    setIsEditingCell(false);
  }

  // Helper function to format field names from camelCase
  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to format values based on their type
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.map(item => formatValue(item)).join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `${formatFieldName(k)}: ${formatValue(v)}`)
        .join(', ');
    }
    return String(value);
  };

  // Format FHIR resource for display
  const formatFHIRResource = (resource: any) => {
    if (!resource || typeof resource !== 'object') return {};

    // Handle different FHIR resource types
    switch (resource.resourceType) {
      case 'Patient':
        return {
          'Patient Name': resource.name?.[0] ? `${resource.name[0].given?.join(' ')} ${resource.name[0].family}` : 'N/A',
          'Date of Birth': resource.birthDate || 'N/A',
          'Gender': resource.gender || 'N/A',
          'Address': resource.address?.[0] ? `${resource.address[0].line?.[0]}, ${resource.address[0].city}, ${resource.address[0].state}` : 'N/A',
          'Phone': resource.telecom?.[0]?.value || 'N/A'
        };
      case 'Observation':
        return {
          'Type': resource.code?.text || resource.code?.coding?.[0]?.display || 'N/A',
          'Date': resource.effectiveDateTime || 'N/A',
          'Status': resource.status || 'N/A',
          'Result': resource.valueString || 'See Details Below',
          'Details': resource.component?.reduce((acc: any, comp: any) => {
            acc[comp.code.text] = comp.valueQuantity ?
              `${comp.valueQuantity.value} ${comp.valueQuantity.unit}` :
              comp.valueString || 'N/A';
            return acc;
          }, {})
        };
      case 'Condition':
        return {
          'Condition': resource.code?.coding?.[0]?.display || 'N/A',
          'Status': resource.clinicalStatus?.coding?.[0]?.code || 'N/A',
          'Onset Date': resource.onsetDateTime || resource.recordedDate || 'N/A'
        };
      case 'DeviceRequest':
        return {
          'Device': resource.codeCodeableConcept?.text || resource.codeCodeableConcept?.coding?.[0]?.display || 'N/A',
          'Status': resource.status || 'N/A',
          'Priority': resource.priority || 'N/A',
          'Order Date': resource.authoredOn || 'N/A',
          'Parameters': resource.parameter?.reduce((acc: any, param: any) => {
            acc[param.code.text] = param.valueString || param.valueInteger ||
              param.valueCodeableConcept?.coding?.[0]?.display || 'N/A';
            return acc;
          }, {})
        };
      default:
        // For other types or non-FHIR data, use simple key-value display
        return Object.entries(resource).reduce((acc: any, [key, value]) => {
          if (typeof value !== 'object') acc[key] = value;
          return acc;
        }, {});
    }
  };

  // Render a nested table for object values
  const renderNestedTable = (data: any, level: number = 0, path: string[] = []) => {
    if (!data || typeof data !== 'object') {
      return <Typography>{formatValue(data)}</Typography>;
    }

    // Handle FHIR Bundle format
    if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
      return data.entry.map((entry: any, index: number) => {
        const resource = entry.resource;
        const formattedData = formatFHIRResource(resource);
        return renderNestedTable(formattedData, level, [...path, index.toString()]);
      });
    }

    return (
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          mb: 1,
          backgroundColor: level === 0 ? 'background.paper' : 'background.default'
        }}
      >
        <Table size="small">
          <TableBody>
            {Object.entries(data).map(([field, value]) => {
              const currentPath = [...path, field];
              const isEditing = editingField?.path.join('.') === currentPath.join('.');
              const isEditingCell = editingField?.path.join('.') === currentPath.join('.');
              const isEditable = typeof value !== 'object' || value === null;

              return (
                <TableRow key={field}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      width: '30%',
                      fontWeight: 'medium',
                      color: 'text.primary',
                      borderBottom: '1px solid rgba(224, 224, 224, 0.4)'
                    }}
                  >
                    {formatFieldName(field)}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: '1px solid rgba(224, 224, 224, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                          variant="outlined"
                          autoFocus
                        />
                      ) : typeof value === 'object' && value !== null ? (
                        Array.isArray(value) ? (
                          <Box sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
                            {value.map((item, index) => (
                              <Box key={index} sx={{ mb: 1 }}>
                                {renderNestedTable(item, level + 1, [...currentPath, index.toString()])}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          renderNestedTable(value, level + 1, currentPath)
                        )
                      ) : (
                        formatValue(value)
                      )}
                    </Box>
                    {isEditable && (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                        {isEditing ? (
                          <>
                            <Tooltip title="Save">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={async () => {
                                  setSaving(true);
                                  try {
                                    await handleSaveChanges(currentPath, editedValue);
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                                disabled={saving}
                              >
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={cancelEditing}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => startEditing(currentPath, value)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderExtractedTable = () => {
    if (!jsonContent) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No extracted data available
          </Typography>
        </Box>
      );
    }

    // Check if this is a complex FHIR-like structure with entries
    if (jsonContent.entry && Array.isArray(jsonContent.entry)) {
      // Group entries by resource type
      const groupedEntries = jsonContent.entry.reduce((acc: any, entry: any) => {
        const resourceType = entry.resource?.resourceType;
        if (!acc[resourceType]) {
          acc[resourceType] = [];
        }
        acc[resourceType].push(entry.resource);
        return acc;
      }, {});

      // Render each resource type as a section
      return Object.entries(groupedEntries).map(([resourceType, resources]) => {
        return (
          <Box key={resourceType} sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                color: 'primary.main',
                fontWeight: 'bold',
                borderBottom: '2px solid #1976d2',
                paddingBottom: 1
              }}
            >
              {resourceType}
            </Typography>
            {(resources as any[]).map((resource, index) => {
              // Extract the most relevant information based on resource type
              const displayData = extractDisplayData(resource);
              return (
                <TableContainer
                  key={resource.id || index}
                  component={Paper}
                  variant="outlined"
                  sx={{ mb: 2, backgroundColor: 'background.paper' }}
                >
                  <Table size="small">
                    <TableBody>
                      {Object.entries(displayData).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              width: '30%',
                              fontWeight: 'medium',
                              color: 'text.primary'
                            }}
                          >
                            {formatFieldName(key)}
                          </TableCell>
                          <TableCell
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1
                            }}
                          >
                             <Box sx={{ flexGrow: 1 }}>
                              {isEditingCell ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={value}
                                  onChange={(e) => setEditedValue(e.target.value)}
                                  variant="outlined"
                                  autoFocus
                                />
                              ) : (
                                formatValue(value)
                              )}
                            </Box>
                            {/*<Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                              {editingField?.path.join('.') === `${resourceType}.${resource.id}.${key}` ? (
                                <>
                                  <Tooltip title="Save">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={async () => {
                                        setSaving(true);
                                        try {
                                          await handleSaveChanges([resourceType, resource.id, key], editedValue);
                                        } finally {
                                          setSaving(false);
                                        }
                                      }}
                                      disabled={saving}
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={cancelEditing}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => startEditing([resourceType, resource.id, key], value)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box> */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })}
          </Box>
        );
      });
    }

    // For simple JSON structures, use the original rendering
    const tableData = Object.entries(jsonContent).map(([category, data]) => {
      return (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: 'primary.main',
              fontWeight: 'bold'
            }}
          >
            {formatFieldName(category)}
          </Typography>
          {renderSimpleTable(data)}
        </Box>
      );
    });

    return <>{tableData}</>;
  };

  const extractDisplayData = (resource: any) => {
    switch (resource.resourceType) {
      case 'Patient':
        return {
          'Name': resource.name?.[0] ? `${resource.name[0].given?.join(' ')} ${resource.name[0].family}` : 'N/A',
          'Birth Date': resource.birthDate || 'N/A',
          'Gender': resource.gender || 'N/A',
          'Address': resource.address?.[0] ? `${resource.address[0].line?.[0]}, ${resource.address[0].city}, ${resource.address[0].state} ${resource.address[0].postalCode}` : 'N/A',
          'Phone': resource.telecom?.[0]?.value || 'N/A'
        };
      case 'Observation':
        const result: any = {
          'Type': resource.code?.text || resource.code?.coding?.[0]?.display || 'N/A',
          'Date': formatDate(resource.effectiveDateTime) || 'N/A',
          'Status': resource.status || 'N/A',
        };
        if (resource.valueString) {
          result['Result'] = resource.valueString;
        }
        if (resource.component) {
          resource.component.forEach((comp: any) => {
            result[comp.code.text] = comp.valueQuantity ?
              `${comp.valueQuantity.value} ${comp.valueQuantity.unit}` :
              comp.valueString || 'N/A';
          });
        }
        return result;
      case 'Condition':
        return {
          'Condition': resource.code?.coding?.[0]?.display || 'N/A',
          'Status': resource.clinicalStatus?.coding?.[0]?.code || 'N/A',
          'ICD-10': resource.code?.coding?.[0]?.code || 'N/A',
          'Date': formatDate(resource.onsetDateTime || resource.recordedDate) || 'N/A'
        };
      case 'DeviceRequest':
        const params: any = {
          'Device': resource.codeCodeableConcept?.text || resource.codeCodeableConcept?.coding?.[0]?.display || 'N/A',
          'Status': resource.status || 'N/A',
          'Priority': resource.priority || 'N/A',
          'Order Date': formatDate(resource.authoredOn) || 'N/A',
        };
        resource.parameter?.forEach((param: any) => {
          params[param.code.text] = param.valueString || param.valueInteger ||
            param.valueCodeableConcept?.coding?.[0]?.display || 'N/A';
        });
        return params;
      case 'Coverage':
        return {
          'Insurance': resource.payor?.[0]?.display || 'N/A',
          'Plan': resource.class?.[0]?.value || 'N/A',
          'Group': resource.class?.[1]?.value || 'N/A',
          'Subscriber ID': resource.subscriberId || 'N/A',
          'Status': resource.status || 'N/A'
        };
      case 'Practitioner':
        return {
          'Name': resource.name?.[0] ?
            `${resource.name[0].given?.join(' ')} ${resource.name[0].family} ${resource.name[0].suffix?.join(' ') || ''}` : 'N/A',
          'NPI': resource.identifier?.find((id: any) => id.system.includes('npi'))?.value || 'N/A',
          'DEA': resource.identifier?.find((id: any) => id.system.includes('dea'))?.value || 'N/A'
        };
      default:
        return Object.entries(resource)
          .filter(([key, value]) => typeof value !== 'object')
          .reduce((acc: any, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const renderSimpleTable = (data: any) => {
    if (!data || typeof data !== 'object') {
      return <Typography>{formatValue(data)}</Typography>;
    }

    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
        <Table size="small">
          <TableBody>
            {Object.entries(data).map(([key, value], index) => (
              <TableRow key={key}>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    width: '30%',
                    fontWeight: 'medium',
                    color: 'text.primary'
                  }}
                >
                  {formatFieldName(key)}
                </TableCell>
                <TableCell
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    {isEditingCell ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={value}
                        onChange={(e) => setEditedValue(e.target.value)}
                        variant="outlined"
                        autoFocus
                      />
                    ) : (
                      formatValue(value)
                    )}
                  </Box>
                  {/* <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {editingField?.path.join('.') === `simple.${key}` ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={async () => {
                              setSaving(true);
                              try {
                                await handleSaveChanges(['simple', key], editedValue);
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={cancelEditing}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small"
                          onClick={() => startEditing(['simple', key], value)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box> */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon />
          <Typography variant="h6" component="div">
            Document Comparison: {doc?.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setZoomLevel(prev => Math.max(prev - 10, 50))} size="small">
            <ZoomOutIcon />
          </IconButton>
          <Typography variant="body2">{zoomLevel}%</Typography>
          <IconButton onClick={() => setZoomLevel(prev => Math.min(prev + 10, 200))} size="small">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Left Panel - PDF Viewer */}
          <Box sx={{ width: '50%', borderRight: 1, borderColor: 'divider', minWidth: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Original Document
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {doc?.size} • Uploaded: {doc?.uploadDate}
                </Typography>
              </Box>
              {error ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="error" gutterBottom>
                    {error}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleDownload(pdfUrl, `${doc.name}`)}
                    startIcon={<DownloadIcon />}
                  >
                    Download Instead
                  </Button>
                </Box>
              ) : (
                renderPdfViewer()
              )}
            </Box>
          </Box>

          {/* Right Panel - Extracted Content */}
          <Box sx={{ width: '50%', p: 2, height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', }}>
              <Box sx={{ mr: 'auto' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Extracted Content
                </Typography>
              </Box>





              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                {isEditingCell ? (
                  <>
                    <Tooltip title="Save">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={async () => {
                          // setSaving(true);
                          // try {
                          //   await handleSaveChanges(['simple', key], editedValue);
                          // } finally {
                          //   setSaving(false);
                          // }
                        }}
                        disabled={saving}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={cancelSetIsEditingCell}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setIsEditingCell(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>







            </Box>
            {loading ? (
              <LinearProgress />
            ) : (
              renderExtractedTable()
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload(doc?.originalUrl || doc?.url || '', `${doc?.name}-original`)}
          >
            Download Original
          </Button>
          {doc?.extractedUrl && (
            <Button
              startIcon={<PdfIcon />}
              onClick={() => handleDownload(doc.extractedUrl!, `${doc?.name}-extracted`)}
            >
              Download Extracted
            </Button>
          )}
          {doc?.jsonUrl && (
            <Button
              startIcon={<JsonIcon />}
              onClick={() => handleDownload(doc.jsonUrl!, `${doc?.name}-structured`)}
            >
              Download Structured Data
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};



export default DocumentComparisonViewer;
// http://localhost:3001/sample-documents/cases/case-006-rebecca-hardin/prior-auth-form-extracted.json