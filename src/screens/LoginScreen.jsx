import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #F8F9FA;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #000;
  font-size: 14px;
  margin-bottom: 32px;
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  background: #F1F3F5;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  transition: all 0.3s;

  &:focus-within {
    border-color: #1A1A1A;
    background: white;
  }
`;

const Input = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  margin-left: 12px;
  font-size: 16px;
  outline: none;
  color: #1A1A1A;
`;

const Button = styled.button`
  background: #1A1A1A;
  color: white;
  border: none;
  border-radius: 12px;
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.9;
  }
`;

const AttendanceBtn = styled.button`
  background: white;
  color: #1A1A1A;
  border: 2px solid #1A1A1A;
  border-radius: 12px;
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s;

  &:hover {
    background: #F8F9FA;
  }
`;



const ErrorMsg = styled.div`
  background: #FFF0F0;
  color: #FF4D4F;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid #FFD6D6;
`;

const LoginScreen = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    const res = await login(email.trim(), password.trim());
    if (!res.success) {
      setError(res.message);
      setLoading(false);
    }
  };



  return (
    <Container>
      <Card>
        <Title>Sistema de Rondas</Title>
        <Subtitle>Inicie sesión para continuar</Subtitle>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <form onSubmit={handleLogin}>
          <InputGroup>
            <User size={20} color="#666" />
            <Input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <Lock size={20} color="#666" />
            <Input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>
          <Button type="submit">Ingresar</Button>
          <AttendanceBtn type="button" onClick={() => navigate('/attendance')}>
            Registrar Asistencia
          </AttendanceBtn>
        </form>
      </Card>
    </Container>
  );
};

export default LoginScreen;
