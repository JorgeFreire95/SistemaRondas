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
  color: #666;
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

const SeedButton = styled.button`
  background: transparent;
  color: #1A1A1A;
  border: 1px solid #1A1A1A;
  border-radius: 12px;
  width: 100%;
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
`;

const LoginScreen = () => {
  const { login, addUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email.trim(), password.trim());
    if (res.success) {
      navigate('/');
    } else {
      alert(res.message);
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    const res = await addUser('guardia@test.com', '123456', 'Guardia de Prueba', 'guardia');
    if (res.success) alert('Guardia creado: guardia@test.com / 123456');
    else alert(res.message);
  };

  const handleSeedAdmin = async () => {
    const res = await addUser('admin@test.com', '123456', 'Admin de Prueba', 'admin');
    if (res.success) alert('Admin creado: admin@test.com / 123456');
    else alert(res.message);
  };

  return (
    <Container>
      <Card>
        <Title>Sistema de Rondas</Title>
        <Subtitle>Inicie sesión para continuar</Subtitle>
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
          <SeedButton type="button" onClick={handleSeed}>Crear Guardia de Prueba</SeedButton>
          <SeedButton type="button" onClick={handleSeedAdmin} style={{ marginTop: '8px', borderColor: '#007bff', color: '#007bff' }}>
            Crear Administrador de Prueba
          </SeedButton>
        </form>
      </Card>
    </Container>
  );
};

export default LoginScreen;
