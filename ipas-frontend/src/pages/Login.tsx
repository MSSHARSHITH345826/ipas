import React from 'react';
import { Box } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import '../style.css';
import { BASE_URL } from '../config';

const Login: React.FC = () => {
  return (
    <Box className="loginBG" sx={{ minHeight: '100vh', background: `url("${BASE_URL}/assets/images/generative-ai_resource_04.jpg") no-repeat top center/cover`, padding: '4rem 2rem' }}>
      <LoginForm />
    </Box>
  );
};

export default Login;
