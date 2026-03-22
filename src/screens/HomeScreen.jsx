import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Map as MapIcon, 
  FileText, 
  Users, 
  LogOut, 
  Play, 
  Square, 
  Navigation 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F8F9FA;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #EEE;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 700;
  color: #1A1A1A;
`;

const UserRole = styled.span`
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const LogoutBtn = styled.button`
  background: #FFF0F0;
  color: #FF4D4F;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
`;

const Content = styled.main`
  flex: 1;
  padding: 24px;
`;

const StatusCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StatusTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0;
`;

const StatusVal = styled.span`
  font-size: 14px;
  color: ${props => props.active ? '#4CAF50' : '#FF4D4F'};
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const MenuBtn = styled.button`
  background: white;
  border: none;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
`;

const MenuText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
`;

const RoundAction = styled.button`
  background: ${props => props.active ? '#FF4D4F' : '#1A1A1A'};
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
  cursor: pointer;
`;

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const { isTracking, setIsTracking } = useLocation();
  const navigate = useNavigate();

  return (
    <Container>
      <Header>
        <UserInfo>
          <UserName>{user?.name}</UserName>
          <UserRole>{user?.role}</UserRole>
        </UserInfo>
        <LogoutBtn onClick={logout}>
          <LogOut size={20} />
        </LogoutBtn>
      </Header>

      <Content>
        {(user?.role === 'guardia' || user?.role === 'admin') && (
          <>
            <StatusCard>
              <StatusTitle>Ronda Actual</StatusTitle>
              <StatusVal active={isTracking}>
                {isTracking ? '● EN PROCESO' : '● DETENIDA'}
              </StatusVal>
            </StatusCard>

            <RoundAction 
              active={isTracking}
              onClick={() => setIsTracking(!isTracking)}
            >
              {isTracking ? <Square size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
              {isTracking ? 'DETENER RONDA' : 'INICIAR RONDA'}
            </RoundAction>

            <Grid>
              <MenuBtn onClick={() => navigate('/scan')}>
                <Shield size={32} color="#1A1A1A" />
                <MenuText>Escanear Punto</MenuText>
              </MenuBtn>

              <MenuBtn onClick={() => navigate('/map')}>
                <MapIcon size={32} color="#1A1A1A" />
                <MenuText>Ver Mapa</MenuText>
              </MenuBtn>
            </Grid>
          </>
        )}

        {(user?.role === 'admin' || user?.role === 'director') && (
          <Grid style={{ marginTop: 16 }}>
             <MenuBtn onClick={() => navigate('/reports')}>
                <FileText size={32} color="#1A1A1A" />
                <MenuText>Reportes</MenuText>
              </MenuBtn>

              {user?.role === 'admin' && (
                <MenuBtn onClick={() => navigate('/admin')}>
                  <Users size={32} color="#1A1A1A" />
                  <MenuText>Usuarios</MenuText>
                </MenuBtn>
              )}
          </Grid>
        )}
      </Content>
    </Container>
  );
};

export default HomeScreen;
