import React from 'react';
import { Container } from '@mui/material';
import Dashboard from '../components/visualizations/Dashboard';

const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth={false} sx={{ py: 0 }}>
      <Dashboard />
    </Container>
  );
};

export default DashboardPage; 