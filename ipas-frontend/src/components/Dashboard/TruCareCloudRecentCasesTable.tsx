import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    IconButton,
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
    Tooltip,
    TablePagination
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Download as DownloadIcon,
    Description as DescriptionIcon,
    Share as ShareIcon,
    PlayArrow as PlayArrowIcon,
    Refresh as RefreshIcon,
    ResetTv as ResetTvIcon
} from '@mui/icons-material';
import { statusTracker, CaseStatus } from '../../services/statusTracker';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SimpleDraggableFlowchart from '../Cases/SimpleDraggableFlowchart';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import { useLocation } from 'react-router-dom';

interface Case {
    id: string;
    patientName: string;
    provider: string;
    procedure: string;
    status: 'pending' | 'approved' | 'partially-approved' | 'denied' | 'under_review';
    submittedDate: string;
    priority: 'low' | 'standard' | 'Urgent';
    amount: number;
}

interface RecentCasesTableProps {
    onCaseClick?: (caseId: string) => void;
}

const TruCareCloudRecentCasesTable: React.FC<RecentCasesTableProps> = ({ onCaseClick }) => {
    const [caseStatuses, setCaseStatuses] = React.useState<{ [key: string]: CaseStatus }>({});
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [selectedCase, setSelectedCase] = React.useState<Case | null>(null);
    const [clinicalNotes, setClinicalNotes] = React.useState('');
    const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
    const [selectedReviewers, setSelectedReviewers] = React.useState<string[]>([]);
    const [shareNote, setShareNote] = React.useState('');
    const [statusUpdateDialog, setStatusUpdateDialog] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState<Case['status']>('pending');
    const [statusReason, setStatusReason] = React.useState('');
    const [agenticDialogOpen, setAgenticDialogOpen] = React.useState(false);
    const [selectedCaseID, setSelectedCaseID] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const location = useLocation();

    // Load and monitor case statuses using the status tracker
    React.useEffect(() => {
        const loadCaseStatuses = () => {
            const allStatuses = statusTracker.getAllStatuses();
            console.log('📊 TruCareCloudRecentCasesTable: Loading case statuses:', allStatuses);
            setCaseStatuses(allStatuses);
        };

        loadCaseStatuses();

        // Poll for changes every 2 seconds
        const interval = setInterval(loadCaseStatuses, 2000);

        return () => clearInterval(interval);
    }, []);

    // Handle status update
    const handleStatusUpdate = (caseId: string, newStatus: Case['status'], reason?: string) => {
        statusTracker.updateCaseStatus(caseId, newStatus, 'user', reason);
        setCaseStatuses(statusTracker.getAllStatuses());
    };

    // Simulate workflow progression
    const simulateWorkflow = (caseId: string) => {
        statusTracker.simulateWorkflowProgression(caseId);
        setCaseStatuses(statusTracker.getAllStatuses());
    };

    // Dummy data for recent cases
    const cases: Case[] = [
        {
            id: 'PA-2024-001',
            patientName: 'John Smith',
            provider: 'Dr. Sarah Johnson',
            procedure: 'MRI Brain with Contrast',
            status: 'approved',
            submittedDate: '2025-10-11',
            priority: 'Urgent',
            amount: 2500
        },
        {
            id: 'PA-2024-002',
            patientName: 'Mary Johnson',
            provider: 'Dr. Michael Chen',
            procedure: 'Cardiac Catheterization',
            status: 'pending',
            submittedDate: '2025-10-11',
            priority: 'Urgent',
            amount: 15000
        },
        {
            id: 'PA-2024-003',
            patientName: 'Robert Davis',
            provider: 'Dr. Emily Rodriguez',
            procedure: 'Knee Arthroscopy',
            status: 'partially-approved',
            submittedDate: '2025-10-08',
            priority: 'standard',
            amount: 8000
        },
        {
            id: 'PA-2024-004',
            patientName: 'Lisa Wilson',
            provider: 'Dr. James Thompson',
            procedure: 'Colonoscopy',
            status: 'denied',
            submittedDate: '2025-10-08',
            priority: 'standard',
            amount: 1200
        },
        {
            id: 'PA-2024-005',
            patientName: 'David Brown',
            provider: 'Dr. Sarah Johnson',
            procedure: 'CT Chest with Contrast',
            status: 'approved',
            submittedDate: '2025-10-11',
            priority: 'standard',
            amount: 1800
        },
        {
            id: 'PA-2024-006',
            patientName: 'Rebecca Hardin',
            provider: 'Amy Diane Kelly, NP',
            procedure: 'CPAP Device Replacement',
            status: 'pending',
            submittedDate: '2025-10-08',
            priority: 'standard',
            amount: 2500
        },
        {
            id: 'PA-2024-007',
            patientName: 'Amanda Williams',
            provider: 'Dr. Benjamin Velky',
            procedure: 'Inpatient',
            status: 'denied',
            submittedDate: '2025-10-11',
            priority: 'Urgent',
            amount: 2500
        },
        {
            id: 'PA-2024-008',
            patientName: 'Daniel de Los Santos marin',
            provider: 'Dr. Amanda R',
            procedure: 'Cardiac rehabilitation',
            status: 'pending',
            submittedDate: '2025-10-08',
            priority: 'standard',
            amount: 2500
        }
    ];

    const getStatusChip = (status: Case['status']) => {
        const statusConfig = {
            pending: { label: 'Pending', color: 'warning', icon: <ScheduleIcon /> },
            approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon /> },
            'partially-approved': { label: 'Partially Approved', color: 'info', icon: <CheckCircleIcon /> },
            denied: { label: 'Denied', color: 'error', icon: <CancelIcon /> },
            under_review: { label: 'Under Review', color: 'primary', icon: <ScheduleIcon /> }
        };

        const config = statusConfig[status];
        return (
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color as any}
                size="small"
                variant="outlined"
            />
        );
    };

    const getPriorityColor = (priority: Case['priority']) => {
        const colors = {
            low: '#4caf50',
            standard: '#ff9800',
            Urgent: '#f44336'
        };
        return colors[priority];
    };

    const handleDownloadEMR = (caseItem: Case) => {
        // Get current status for this case
        const currentCaseStatus = caseStatuses[caseItem.id] || caseItem.status;

        // Generate EPIC_insert.json for the case
        const EPICData = {
            case_id: caseItem.id,
            patient: {
                name: caseItem.patientName,
                member_id: caseItem.id.replace('PA-', 'INS'),
                date_of_birth: caseItem.id === 'PA-2024-001' ? '1975-03-15' : '1968-05-22'
            },
            provider: {
                name: caseItem.provider,
                npi: '1234567890'
            },
            procedure: {
                name: caseItem.procedure,
                cpt_code: caseItem.id === 'PA-2024-001' ? '70553' : '93458',
                amount: caseItem.amount
            },
            authorization: {
                status: currentCaseStatus,
                priority: caseItem.priority,
                submitted_date: caseItem.submittedDate,
                decision_date: new Date().toISOString().split('T')[0]
            },
            clinical_data: {
                diagnosis: caseItem.id === 'PA-2024-001' ? 'Headache with neurological symptoms' : 'Coronary artery disease with angina',
                icd10_code: caseItem.id === 'PA-2024-001' ? 'G44.1' : 'I25.119',
                clinical_notes: clinicalNotes || 'Standard clinical assessment completed'
            }
        };

        const blob = new Blob([JSON.stringify(EPICData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EPIC_insert_${caseItem.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const availableReviewers = [
        'Dr. Sarah Wilson - Cardiologist',
        'Dr. Michael Chen - Medical Director',
        'Dr. Emily Rodriguez - Clinical Specialist',
        'Dr. James Thompson - Quality Assurance',
        'Dr. Lisa Anderson - Internal Medicine',
        'Dr. Robert Martinez - Cardiothoracic Surgery'
    ];

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    return (
        <Card>
            <CardContent sx={{ pb: '0 !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    {/* <Typography variant="h6" component="h2">
            Recent Cases
          </Typography> */}
                    <Box>
                        {location.pathname === '/TrucareCloud' && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }} >
                                <FilterListOutlinedIcon />
                                <select className="form-select filterSelect w_80">
                                    <option selected>Status</option>
                                </select>
                                <select className="form-select filterSelect w_80">
                                    <option selected>Type</option>
                                </select>
                                <select className="form-select filterSelect w_130">
                                    <option selected>Diagnosis T...</option>
                                </select>
                                <select className="form-select filterSelect w_80">
                                    <option selected>LOB</option>
                                </select>
                                <select className="form-select filterSelect w_130">
                                    <option selected>Plan Product</option>
                                </select>
                                <select className="form-select filterSelect w_100">
                                    <option selected>More (4)</option>
                                </select>
                                <Box className="formRow" sx={{ ml: 2 }}>
                                    <input type="text" placeholder="Search" className='form-control' />
                                </Box>
                                <Button variant="text" sx={{ color: '#999' }}>Clear</Button>
                            </Box>
                        )}

                        {location.pathname === '/Tasks' && (
                            <Typography variant="h6" component="h2">
                                Recent Cases
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => {
                                setCaseStatuses(statusTracker.getAllStatuses());
                            }}
                            variant="outlined"
                        >
                            Refresh
                        </Button>
                        <Tooltip title="Reset All Statuses">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    statusTracker.resetAllStatuses();
                                    setCaseStatuses(statusTracker.getAllStatuses());
                                }}
                                color="warning"
                            >
                                <ResetTvIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 665 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Case ID</TableCell>
                                <TableCell>Patient</TableCell>
                                <TableCell>Requesting Provider</TableCell>
                                <TableCell>Procedure</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Priority</TableCell>
                                {/* <TableCell>Amount</TableCell> */}
                                <TableCell>Submitted</TableCell>
                                <TableCell>Letter</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((caseItem) => {
                                // Use dynamic status from tracker
                                const caseStatus = caseStatuses[caseItem.id];
                                const currentStatus = caseStatus?.currentStatus || caseItem.status;
                                const caseWithStatus = { ...caseItem, status: currentStatus };

                                return (
                                    <TableRow key={caseItem.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {caseItem.id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{caseItem.patientName}</TableCell>
                                        <TableCell>{caseItem.provider}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                                {caseItem.procedure}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getStatusChip(currentStatus)}
                                                {/* <Tooltip title="Update Status">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedCase(caseItem);
                                                            setNewStatus(currentStatus);
                                                            setStatusUpdateDialog(true);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip> */}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        display: 'inline-block',
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: getPriorityColor(caseItem.priority),
                                                        mr: 1
                                                    }}
                                                />
                                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                    {caseItem.priority}
                                                </Typography>
                                            </Box>

                                        </TableCell>
                                        {/* <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                ${caseItem.amount.toLocaleString()}
                                            </Typography>
                                        </TableCell> */}
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(caseItem.submittedDate).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {currentStatus === 'approved' ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => {
                                                            // Download the approval letter PDF
                                                            const link = document.createElement('a');
                                                            link.href = `/sample-documents/approval-letters/${caseItem.id}-approval-letter.pdf`;
                                                            link.download = `${caseItem.id}-approval-letter.pdf`;
                                                            link.click();
                                                        }}
                                                        title="Download Approval Letter"
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <DescriptionIcon sx={{ color: '#ccc', fontSize: 20 }} />
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => onCaseClick?.(caseItem.id)}
                                                    title="View Case Details"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    onClick={() => {
                                                        setSelectedCase(caseItem);
                                                        setClinicalNotes(`Clinical notes for ${caseItem.patientName}:\n\nProcedure: ${caseItem.procedure}\nStatus: ${currentStatus}\nPriority: ${caseItem.priority}\n\nAdd your clinical observations here...`);
                                                        setEditDialogOpen(true);
                                                    }}
                                                    title="Edit Clinical Notes"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => {
                                                        setSelectedCase(caseItem);
                                                        setSelectedReviewers([]);
                                                        setShareDialogOpen(true);
                                                    }}
                                                    title="Share with Reviewers"
                                                >
                                                    <ShareIcon />
                                                </IconButton>
                                                <IconButton
                                                    id={caseItem.id}
                                                    size="small"
                                                    color="info"
                                                    title="Orchestration Flow"
                                                    onClick={() => {
                                                        setSelectedCaseID(caseItem.id);
                                                        setAgenticDialogOpen(true)
                                                    }}
                                                >
                                                    <PsychologyIcon />
                                                </IconButton>

                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 100]}
                    component="div"
                    count={cases.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </CardContent>

            {/* Edit Clinical Notes Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Edit Clinical Notes - {selectedCase?.id}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder="Enter clinical notes..."
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setEditDialogOpen(false);
                            // In a real app, save notes to backend
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
                    Share Case - {selectedCase?.id}
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
                            {availableReviewers.map((reviewer) => (
                                <MenuItem key={reviewer} value={reviewer}>
                                    {reviewer}
                                </MenuItem>
                            ))}
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
                            alert(`Case ${selectedCase?.id} shared with ${selectedReviewers.length} reviewer(s):\n${selectedReviewers.join('\n')}${noteText}`);
                            setSelectedReviewers([]);
                            setShareNote('');
                        }}
                    >
                        Share Case
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Case Status</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>New Status</InputLabel>
                            <Select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value as Case['status'])}
                                label="New Status"
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="under_review">Under Review</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="partially-approved">Partially Approved</MenuItem>
                                <MenuItem value="denied">Denied</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Reason for Status Change"
                            multiline
                            rows={3}
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            placeholder="Enter the reason for this status change..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (selectedCase) {
                                handleStatusUpdate(selectedCase.id, newStatus, statusReason);
                                setStatusUpdateDialog(false);
                                setStatusReason('');
                            }
                        }}
                        variant="contained"
                    >
                        Update Status
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={agenticDialogOpen} onClose={() => setAgenticDialogOpen(false)} fullWidth PaperProps={{
                sx: { maxWidth: 1700 }, // max width in px or use e.g. '80vw'
            }}>
                <DialogTitle>
                    Orchestration Flow
                </DialogTitle>
                <DialogContent>
                    <SimpleDraggableFlowchart caseId={selectedCaseID} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAgenticDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

        </Card>
    );
};

export default TruCareCloudRecentCasesTable;
