import React, { useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, Dialog, DialogTitle, DialogContent, Alert, IconButton, Button, LinearProgress, Chip } from '@mui/material';
import { Close as CloseIcon, Download as DownloadIcon, Description as DescriptionIcon, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import ApprovalStatusChart from '../components/Dashboard/ApprovalStatusChart';
//import RecentCasesTable from '../components/Dashboard/RecentCasesTable';
import AnalyticsReports from '../components/Dashboard/AnalyticsReports';
import GeographicHeatMap from '../components/Dashboard/GeographicHeatMap';
import HospitalPerformance from '../components/Dashboard/HospitalPerformance';
import CaseDetailsEnhanced from '../components/Cases/CaseDetailsEnhanced';
import ErrorBoundary from '../components/ErrorBoundary';

const Dashboard: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false);
  const [showLetterNotification, setShowLetterNotification] = useState(false);

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
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
        Smart Auth Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to Smart Auth - Intelligent Prior Authorization System
      </Typography>

      {/* Letter Generation Notification */}
      {showLetterNotification && (
        <Alert 
          severity="success" 
          icon={<DescriptionIcon />}
          sx={{ 
            mb: 3,
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            '& .MuiAlert-icon': {
              color: '#155724'
            }
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `/sample-documents/approval-letters/${selectedCaseId}-approval-letter.pdf`;
                  link.download = `${selectedCaseId}-approval-letter.pdf`;
                  link.click();
                }}
              >
                Download
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setShowLetterNotification(false);
                  localStorage.setItem(`ipas_letter_notification_dismissed_${selectedCaseId}`, 'true');
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          }
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#155724' }}>
            📄 Approval Letter Generated
          </Typography>
          <Typography variant="body2" sx={{ color: '#155724' }}>
            Approval letter for Case <strong>{selectedCaseId}</strong> has been generated and is ready for download
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ textAlign: 'center', backgroundColor: '#f8f9fa', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                Total Cases
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, fontSize: '0.75rem' }}>
                Today
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1.8rem' }}>
                {todayData.totalCases}
              </Typography>
              {(() => {
                const trend = getTrendData(todayData.totalCases, todayData.totalCasesYesterday);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, gap: 0.3 }}>
                    <Box sx={{ fontSize: '0.8rem' }}>{trend.icon}</Box>
                    <Typography variant="caption" sx={{ color: trend.color, fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {trend.percentage.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(trend.percentage, 100)}
                      sx={{ width: 30, height: 3, borderRadius: 2, backgroundColor: '#e0e0e0' }}
                      color={trend.isPositive ? 'success' : trend.isNegative ? 'error' : 'inherit'}
                    />
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ textAlign: 'center', backgroundColor: '#fff3cd', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#856404', fontSize: '0.9rem' }} gutterBottom>
                Pending Review
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, fontSize: '0.75rem' }}>
                Today
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1.8rem' }}>
                {todayData.pendingReview}
              </Typography>
              {(() => {
                const trend = getTrendData(todayData.pendingReview, todayData.pendingReviewYesterday);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, gap: 0.3 }}>
                    <Box sx={{ fontSize: '0.8rem' }}>{trend.icon}</Box>
                    <Typography variant="caption" sx={{ color: trend.color, fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {trend.percentage.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(trend.percentage, 100)}
                      sx={{ width: 30, height: 3, borderRadius: 2, backgroundColor: '#e0e0e0' }}
                      color={trend.isPositive ? 'success' : trend.isNegative ? 'error' : 'inherit'}
                    />
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ textAlign: 'center', backgroundColor: '#d4edda', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#155724', fontSize: '0.9rem' }} gutterBottom>
                Auto Approved
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, fontSize: '0.75rem' }}>
                Today
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1.8rem' }}>
                {todayData.autoApproved}
              </Typography>
              {(() => {
                const trend = getTrendData(todayData.autoApproved, todayData.autoApprovedYesterday);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, gap: 0.3 }}>
                    <Box sx={{ fontSize: '0.8rem' }}>{trend.icon}</Box>
                    <Typography variant="caption" sx={{ color: trend.color, fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {trend.percentage.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(trend.percentage, 100)}
                      sx={{ width: 30, height: 3, borderRadius: 2, backgroundColor: '#e0e0e0' }}
                      color={trend.isPositive ? 'success' : trend.isNegative ? 'error' : 'inherit'}
                    />
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ textAlign: 'center', backgroundColor: '#f8d7da', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#721c24', fontSize: '0.9rem' }} gutterBottom>
                Denied
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, fontSize: '0.75rem' }}>
                Today
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1.8rem' }}>
                {todayData.denied}
              </Typography>
              {(() => {
                const trend = getTrendData(todayData.denied, todayData.deniedYesterday);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, gap: 0.3 }}>
                    <Box sx={{ fontSize: '0.8rem' }}>{trend.icon}</Box>
                    <Typography variant="caption" sx={{ color: trend.color, fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {trend.percentage.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(trend.percentage, 100)}
                      sx={{ width: 30, height: 3, borderRadius: 2, backgroundColor: '#e0e0e0' }}
                      color={trend.isPositive ? 'success' : trend.isNegative ? 'error' : 'inherit'}
                    />
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ textAlign: 'center', backgroundColor: '#e8f5e8', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontSize: '0.9rem' }} gutterBottom>
                Patients Serviced
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, fontSize: '0.75rem' }}>
                This Quarter
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1.8rem' }}>
                {todayData.patientsServiced.toLocaleString()}
              </Typography>
              {(() => {
                const trend = getTrendData(todayData.patientsServiced, todayData.patientsServicedLastQuarter);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, gap: 0.3 }}>
                    <Box sx={{ fontSize: '0.8rem' }}>{trend.icon}</Box>
                    <Typography variant="caption" sx={{ color: trend.color, fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {trend.percentage.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(trend.percentage, 100)}
                      sx={{ width: 30, height: 3, borderRadius: 2, backgroundColor: '#e0e0e0' }}
                      color={trend.isPositive ? 'success' : trend.isNegative ? 'error' : 'inherit'}
                    />
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

        {/* Approval Status Chart */}
        <Box sx={{ mb: 4 }}>
          <ApprovalStatusChart todayData={todayData} />
        </Box>

      {/* Recent Cases Table */}
      {/* <Box sx={{ mb: 4 }}>
        <RecentCasesTable onCaseClick={handleCaseClick} />
      </Box> */}

      {/* Geographic Heat Map */}
      <Box sx={{ mb: 4 }}>
        <GeographicHeatMap />
      </Box>

      {/* Hospital Performance */}
      <Box sx={{ mb: 4 }}>
        <HospitalPerformance />
      </Box>

      {/* Analytics & Reports */}
      <AnalyticsReports />

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
              <CaseDetailsEnhanced caseId={selectedCaseId} />
            </ErrorBoundary>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
