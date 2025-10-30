import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Alert,
  AlertTitle,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Computer as ComputerIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { emrNotificationService, EMRNotification, EMRIntegrationStatus } from '../services/emrNotificationService';

interface HospitalOrder {
  id: string;
  patientName: string;
  patientId: string;
  caseId: string;
  procedure: string;
  authorizationNumber: string;
  status: 'pending' | 'received' | 'order_placed' | 'completed';
  receivedAt: string;
  orderPlacedAt?: string;
  orderId?: string;
  provider: string;
  hospital: string;
}

const HospitalPortal: React.FC = () => {
  const [orders, setOrders] = useState<HospitalOrder[]>([]);
  const [notifications, setNotifications] = useState<EMRNotification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<HospitalOrder | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadOrders();
    loadNotifications();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      loadOrders();
      loadNotifications();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOrders = () => {
    // Load orders from EMR integration status
    const allNotifications = emrNotificationService.getAllNotifications();
    const hospitalNotifications = allNotifications.filter(n => 
      n.type === 'hospital_received' || n.type === 'order_placed'
    );

    const ordersMap = new Map<string, HospitalOrder>();

    hospitalNotifications.forEach(notification => {
      const caseId = notification.caseId;
      const details = notification.details;
      
      if (!ordersMap.has(caseId)) {
        // Case-specific information
        const getCaseInfo = (caseId: string) => {
          switch (caseId) {
            case 'PA-2024-001':
              return {
                patientName: 'John Doe',
                patientId: 'P-2024-001',
                procedure: 'MRI Brain with Contrast',
                provider: 'Dr. Sarah Johnson',
                hospital: 'UCLA Medical Center'
              };
            case 'PA-2024-002':
              return {
                patientName: 'Mary Johnson',
                patientId: 'P-2024-002',
                procedure: 'Cardiac Catheterization',
                provider: 'Dr. Michael Chen',
                hospital: 'Cedars-Sinai Medical Center'
              };
            case 'PA-2024-003':
              return {
                patientName: 'Robert Davis',
                patientId: 'P-2024-003',
                procedure: 'Knee Arthroscopy',
                provider: 'Dr. Lisa Wilson',
                hospital: 'Kaiser Permanente'
              };
            case 'PA-2024-004':
              return {
                patientName: 'Sarah Wilson',
                patientId: 'P-2024-004',
                procedure: 'CT Abdomen with Contrast',
                provider: 'Dr. David Brown',
                hospital: 'Stanford Health Care'
              };
            case 'PA-2024-005':
              return {
                patientName: 'David Brown',
                patientId: 'P-2024-005',
                procedure: 'CT Chest with Contrast',
                provider: 'Dr. Jennifer Taylor',
                hospital: 'UCSF Medical Center'
              };
            case 'PA-2024-006':
              return {
                patientName: 'Rebecca Hardin',
                patientId: 'PA-2024-006',
                procedure: 'CPAP Device Replacement',
                provider: 'Amy Diane Kelly, NP',
                hospital: 'Prisma Health Pulmonology - Sumter'
              };
            case 'PA-2024-007':
              return {
                patientName: 'Rebecca===Hardin',
                patientId: 'P-2024-007',
                procedure: 'Inpatient',
                provider: 'Benjamin Velky',
                hospital: 'Self Regional HE'
              };
            case 'PA-2024-008':
              return {
                patientName: 'Daniel de Los Santos marin',
                patientId: 'P-2024-008',
                procedure: 'Cardiac rehabilitation',
                provider: 'Amanda R',
                hospital: 'Trident Medical Center'
              };
                            
            default:
              return {
                patientName: 'Unknown Patient',
                patientId: 'P-2024-000',
                procedure: 'Unknown Procedure',
                provider: 'Unknown Provider',
                hospital: 'Unknown Hospital'
              };
          }
        };

        const caseInfo = getCaseInfo(caseId);
        
        ordersMap.set(caseId, {
          id: `ORD_${caseId}`,
          patientName: caseInfo.patientName,
          patientId: caseInfo.patientId,
          caseId,
          procedure: caseInfo.procedure,
          authorizationNumber: details.authorizationNumber || `AUTH_${caseId}`,
          status: 'pending',
          receivedAt: notification.timestamp,
          provider: caseInfo.provider,
          hospital: caseInfo.hospital
        });
      }

      const order = ordersMap.get(caseId)!;
      
      if (notification.type === 'hospital_received') {
        order.status = 'received';
        order.receivedAt = notification.timestamp;
      } else if (notification.type === 'order_placed') {
        order.status = 'order_placed';
        order.orderPlacedAt = notification.timestamp;
        order.orderId = details.orderId;
      }
    });

    setOrders(Array.from(ordersMap.values()));
  };

  const loadNotifications = () => {
    const allNotifications = emrNotificationService.getAllNotifications();
    const hospitalNotifications = allNotifications.filter(n => 
      n.type === 'hospital_received' || n.type === 'order_placed'
    );
    setNotifications(hospitalNotifications);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'order_placed':
      case 'completed':
        return 'success';
      case 'received':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'order_placed':
      case 'completed':
        return <CheckCircleIcon />;
      case 'received':
        return <PendingIcon />;
      case 'pending':
        return <ScheduleIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const handlePlaceOrder = (order: HospitalOrder) => {
    // Simulate order placement
    emrNotificationService.simulateOrderPlacement(
      order.caseId,
      order.hospital,
      0 // No delay for immediate response
    );
    
    // Update local state
    setOrders(prev => prev.map(o => 
      o.id === order.id 
        ? { 
            ...o, 
            status: 'order_placed' as const,
            orderPlacedAt: new Date().toISOString(),
            orderId: `ORD_${Math.random().toString(36).substr(2, 10).toUpperCase()}`
          }
        : o
    ));
  };

  const handleViewOrder = (order: HospitalOrder) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const getNotificationCount = () => {
    return notifications.filter(n => n.status === 'sent' || n.status === 'received').length;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HospitalIcon sx={{ fontSize: '2rem', color: '#1976d2', mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  UCLA Medical Center - EMR Portal
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Prior Authorization & Order Management System
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={getNotificationCount()} color="primary">
                <NotificationsIcon />
              </Badge>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  loadOrders();
                  loadNotifications();
                  setRefreshKey(prev => prev + 1);
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* EMR Integration Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ComputerIcon sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="h6">EMR Integration Status</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {orders.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Orders
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {orders.filter(o => o.status === 'order_placed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders Placed
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {orders.filter(o => o.status === 'received').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Orders
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent EMR Notifications
            </Typography>
            <List>
              {notifications.slice(0, 5).map((notification, index) => (
                <ListItem key={notification.id}>
                  <ListItemIcon>
                    {getStatusIcon(notification.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.timestamp).toLocaleString()}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={notification.type.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(notification.status) as any}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Prior Authorization Orders
          </Typography>
          
          {orders.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Orders Yet</AlertTitle>
              Orders will appear here when authorizations are received from EPIC EMR.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Procedure</TableCell>
                    <TableCell>Authorization</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {order.patientName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {order.patientName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.patientId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.caseId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.procedure}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {order.authorizationNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(order.status)}
                          label={order.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(order.receivedAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrder(order)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {order.status === 'received' && (
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => handlePlaceOrder(order)}
                            >
                              Place Order
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onClose={() => setOrderDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            Order Details - {selectedOrder?.caseId}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Patient Information</Typography>
                  <Typography variant="body2">Name: {selectedOrder.patientName}</Typography>
                  <Typography variant="body2">ID: {selectedOrder.patientId}</Typography>
                  <Typography variant="body2">Provider: {selectedOrder.provider}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Authorization Details</Typography>
                  <Typography variant="body2">Case ID: {selectedOrder.caseId}</Typography>
                  <Typography variant="body2">Auth Number: {selectedOrder.authorizationNumber}</Typography>
                  <Typography variant="body2">Procedure: {selectedOrder.procedure}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Status Timeline</Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Authorization Received"
                    secondary={`Received at: ${new Date(selectedOrder.receivedAt).toLocaleString()}`}
                  />
                </ListItem>
                {selectedOrder.orderPlacedAt && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Order Placed"
                      secondary={`Placed at: ${new Date(selectedOrder.orderPlacedAt).toLocaleString()}`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalPortal;
