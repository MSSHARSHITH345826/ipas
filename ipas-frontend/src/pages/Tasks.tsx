import React, { useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, Dialog, DialogTitle, DialogContent, Alert, IconButton, Button, LinearProgress, Chip, ButtonGroup, Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import { Close as CloseIcon, Download as DownloadIcon, Description as DescriptionIcon, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import CaseDetailsEnhanced from '../components/Cases/CaseDetailsEnhanced';
import ErrorBoundary from '../components/ErrorBoundary';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import ExpandCircleDownOutlinedIcon from '@mui/icons-material/ExpandCircleDownOutlined';
import TruCareCloudRecentCasesTable from '../components/Dashboard/TruCareCloudRecentCasesTable';
import AddIcon from '@mui/icons-material/Add';

const Tasks: React.FC = () => {
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [caseDetailsOpen, setCaseDetailsOpen] = useState(false);
    const [showLetterNotification, setShowLetterNotification] = useState(false);
    const [defaultTab, setDefaultTab] = useState<number>(0);

    // Check if letter was generated for any case
    React.useEffect(() => {
        const checkLetterGeneration = () => {
            const caseIds = ['PA-2024-001', 'PA-2024-002', 'PA-2024-003', 'PA-2024-004', 'PA-2024-005', 'PA-2024-006', 'PA-2024-007', 'PA-2024-008'];

            for (const caseId of caseIds) {
                const letterKey = `ipas_letter_generated_${caseId}`;
                const dismissedKey = `ipas_letter_notification_dismissed_${caseId}`;

                const letterGenerated = localStorage.getItem(letterKey);
                const notificationDismissed = localStorage.getItem(dismissedKey);

                // Show notification if letter was generated and notification hasn't been dismissed
                if (letterGenerated && !notificationDismissed) {
                    setShowLetterNotification(true);
                    // Only store the case ID for download if no case details dialog is open
                    if (!caseDetailsOpen) {
                        setSelectedCaseId(caseId);
                    }
                    break; // Only show one notification at a time
                }
            }
        };

        checkLetterGeneration();

        // Poll for changes every 2 seconds to detect when letter is generated
        const interval = setInterval(checkLetterGeneration, 2000);

        return () => clearInterval(interval);
    }, [caseDetailsOpen]);

    // Consistent data for today
    const todayData = {
        totalCases: 12,
        pendingReview: 2,
        autoApproved: 8,
        partiallyApproved: 3,
        denied: 1,
        patientsServiced: 312,
        // Historical data for comparison
        totalCasesYesterday: 9,
        pendingReviewYesterday: 3,
        autoApprovedYesterday: 6,
        partiallyApprovedYesterday: 2,
        deniedYesterday: 1,
        patientsServicedLastQuarter: 287
    };

    const handleCaseClick = (caseId: string) => {
        setSelectedCaseId(caseId);
        setCaseDetailsOpen(true);
    };

    const handleCloseCaseDetails = () => {
        setCaseDetailsOpen(false);
        setSelectedCaseId(null);
    };

    // Helper function to calculate percentage change and get trend
    const getTrendData = (current: number, previous: number) => {
        const change = current - previous;
        const percentage = previous === 0 ? 0 : ((change / previous) * 100);
        const isPositive = change > 0;
        const isNegative = change < 0;

        return {
            change,
            percentage: Math.abs(percentage),
            isPositive,
            isNegative,
            isNeutral: change === 0,
            icon: isPositive ? <TrendingUp /> : isNegative ? <TrendingDown /> : <TrendingFlat />,
            color: isPositive ? '#4caf50' : isNegative ? '#f44336' : '#9e9e9e'
        };
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mb: '1rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 'auto' }}>
                    <Typography variant="h4" component="h3" gutterBottom sx={{ color: '#111', fontWeight: 'bold', marginBottom: 0, mr: '1rem' }}>
                        Tasks
                    </Typography>
                    <ButtonGroup variant="outlined" size='small' color='inherit' aria-label="Basic button group">
                        <Button sx={{ lineHeight: 'normal', background: '#4a387e', color: '#fff', borderColor: '#4a387e' }}>My Tasks</Button>
                        <Button sx={{ lineHeight: 'normal' }}>Group Queues</Button>
                        <Button sx={{ lineHeight: 'normal' }}>Personal Queues</Button>
                    </ButtonGroup>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                        variant="contained" 
                        color="success" 
                        size="small" 
                        sx={{ background: '#4a387e', mr: 2 }}
                        onClick={() => {
                            setDefaultTab(3); // Review Notes tab (index 3)
                            setSelectedCaseId('PA-2024-006');
                            setCaseDetailsOpen(true);
                        }}
                    >
                        NOTES (3) <AddIcon sx={{ml: 1}} />
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        size="small" 
                        sx={{ background: '#4a387e', mr: 2 }}
                        onClick={() => {
                            setDefaultTab(0); // Documents tab (index 0)
                            setSelectedCaseId('PA-2024-006');
                            setCaseDetailsOpen(true);
                        }}
                    >
                        ATTACHMENTS (5) <AddIcon sx={{ml: 1}} />
                    </Button>
                    <a href=""><PrintOutlinedIcon fontSize='large' /></a>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', mb: '1rem' }}>
                <Box className="groupedNameWrapper">
                    <Box className="grupRow">Group Queue</Box>
                    <Box className="grupRow formRow" sx={{ background: '#fff' }}>
                        <input type="text" className="form-control" value="UM determination" id="formGroupExampleInput" placeholder="" />
                        <Box className="inputHelpText">Minimum 2 characters</Box>
                    </Box>
                    <Box className="grupRow" sx={{ background: '#ddf2ff' }}>UM determination</Box>
                </Box>
                <Box className="dateRangeWrapper">
                    <Box className="dateRangeRow">
                        <Box sx={{ flexGrow: 1 }}>
                            <Grid container spacing={1} className="formRow">
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"><b>Date Range</b></label>
                                        {/* <input type="text" className="form-control w_130" id="formGroupExampleInput" placeholder="" /> */}
                                        <select className="form-select w_130">
                                            <option selected>Due Date</option>
                                        </select>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"><b>Date From</b></label>
                                        <input type="text" className="form-control w_130" id="formGroupExampleInput" placeholder="" />
                                        <Box className="inputHelpText">MM/DD/YYYY</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"></label>
                                        <input type="number" className="form-control w_60" id="formGroupExampleInput" placeholder="" />
                                        <Box className="inputHelpText">HH</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"></label>
                                        <input type="number" className="form-control w_60" id="formGroupExampleInput" placeholder="" />
                                        <Box className="inputHelpText">MM</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"></label>
                                        {/* <input type="text" className="form-control w_60" id="formGroupExampleInput" placeholder="" /> */}
                                        <select className="form-select w_60">
                                            <option selected>PM</option>
                                            <option>AM</option>
                                        </select>
                                        <Box className="inputHelpText">AM/PM</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"><b>Date To</b></label>
                                        <input type="text" className="form-control w_130" value="10/15/2025" id="formGroupExampleInput" placeholder="" />
                                        <Box className="inputHelpText">MM/DD/YYYY</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"></label>
                                        <input type="number" className="form-control w_60" value="11" id="formGroupExampleInput" placeholder="" />
                                        <Box className="inputHelpText">HH</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"></label>
                                        <input type="number" className="form-control w_60" value="59" id="formGroupExampleInput" placeholder="" />
                                        <Box className="inputHelpText">MM</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"></label>
                                        {/* <input type="text" className="form-control w_60" id="formGroupExampleInput" placeholder="" /> */}
                                        <select className="form-select w_60">
                                            <option selected>PM</option>
                                            <option>AM</option>
                                        </select>
                                        <Box className="inputHelpText">AM/PM</Box>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <Box style={{ marginBottom: '1rem' }}>
                                        <label htmlFor="formGroupExampleInput"><b>Priority</b></label>
                                        {/* <input type="text" className="form-control w_130" id="formGroupExampleInput" placeholder="" /> */}
                                        <select className="form-select w_130">
                                            <option selected>All</option>
                                        </select>
                                    </Box>
                                </Grid>
                                <Grid size="auto">
                                    <label htmlFor="formGroupExampleInput" style={{ display: 'block', fontWeight: '600' }}>Include</label>
                                    {/* <Box className="form-check form-check-inline" style={{ marginBottom: '1rem' }}>
                                        <input className="form-check-input" type="checkbox" id="inlineCheckbox1" checked  />
                                        <label className="form-check-label" htmlFor="inlineCheckbox1">Open</label>
                                    </Box>
                                    <Box className="form-check form-check-inline" style={{ marginBottom: '1rem' }}>
                                        <input className="form-check-input" type="checkbox" id="inlineCheckbox2" checked />
                                        <label className="form-check-label" htmlFor="inlineCheckbox2">Overdue</label>
                                    </Box>
                                    <Box className="form-check form-check-inline" style={{ marginBottom: '1rem' }}>
                                        <input className="form-check-input" type="checkbox" id="inlineCheckbox3" checked  />
                                        <label className="form-check-label" htmlFor="inlineCheckbox3">Completed</label>
                                    </Box>
                                    <Box className="form-check form-check-inline" style={{ marginBottom: '1rem' }}>
                                        <input className="form-check-input" type="checkbox" id="inlineCheckbox4" />
                                        <label className="form-check-label" htmlFor="inlineCheckbox4">Cancelled</label>
                                    </Box> */}
                                    <FormGroup sx={{ flexDirection: 'row' }}>
                                        <FormControlLabel control={<Checkbox defaultChecked />} label="Open" />
                                        <FormControlLabel control={<Checkbox defaultChecked />} label="Overdue" />
                                        <FormControlLabel control={<Checkbox defaultChecked />} label="Completed" />
                                        <FormControlLabel control={<Checkbox />} label="Cancelled" />
                                    </FormGroup>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box className="advanceSearch">
                            <ExpandCircleDownOutlinedIcon /><b>Advanced search</b>
                        </Box>
                        <Box className="advanceSearch" sx={{ justifyContent: 'end' }}>
                            <Button variant="contained" color="success" size="small" sx={{ background: '#4a387e', mr: 1 }}>Search</Button>
                            <Button variant="contained" color="success" size="small" sx={{ background: '#4a387e' }}>Reset</Button>
                        </Box>
                    </Box>
                    <Box className="borderBox recentTableStyle" sx={{ mt: 2 }}>
                        {/* Recent Cases Table */}
                        <TruCareCloudRecentCasesTable onCaseClick={handleCaseClick} />
                    </Box>
                </Box>
            </Box>



            {/* Case Details Dialog */}
            <Dialog
                open={caseDetailsOpen}
                onClose={handleCloseCaseDetails}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: { height: '90vh' }
                }}
            >
                <DialogTitle>
                    Case Details
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {selectedCaseId && (
                        <ErrorBoundary>
                            <CaseDetailsEnhanced caseId={selectedCaseId} defaultTab={defaultTab} />
                        </ErrorBoundary>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Tasks;
