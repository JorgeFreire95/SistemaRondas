import React, { useState, useEffect } from 'react';
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
  Navigation,
  Building,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  font-size: 11px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
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
  color: ${props => props.$active ? '#4CAF50' : '#FF4D4F'};
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
  background: ${props => props.$active ? '#FF4D4F' : '#1A1A1A'};
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

const InstCard = styled.div`
  background: #E8F5E9;
  border: 1px solid #C8E6C9;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InstHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2E7D32;
  font-weight: 700;
  font-size: 14px;
`;

const InstNameText = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #1A1A1A;
`;

const InstAddr = styled.div`
  font-size: 13px;
  color: #000;
`;

const Checklist = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  margin-bottom: 20px;
`;

const ChecklistTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 15px;
  color: #1A1A1A;
`;

const CheckItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F1F3F5;
  &:last-child { border: none; }
`;

const CheckText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$done ? '#999' : '#1A1A1A'};
  text-decoration: ${props => props.$done ? 'line-through' : 'none'};
`;

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const { isTracking, setIsTracking, currentRoundId, scannedPoints } = useLocation();
  const navigate = useNavigate();
  const [assignedInst, setAssignedInst] = useState(null);
  const [markingPoints, setMarkingPoints] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    if (user?.assignedInstallationId) {
      // Fetch assigned installation
      const unsubInst = onSnapshot(doc(db, 'installations', user.assignedInstallationId), (snap) => {
        if (snap.exists()) setAssignedInst(snap.data());
      }, (err) => {
        if (err.code !== 'permission-denied') console.error("Error fetching installation:", err);
      });

      // Fetch marking points for checklist
      const q = query(collection(db, 'installations', user.assignedInstallationId, 'markingPoints'), orderBy('createdAt', 'asc'));
      const unsubPoints = onSnapshot(q, (snap) => {
        setMarkingPoints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        if (err.code !== 'permission-denied') console.error("Error fetching points:", err);
      });

      // Fetch schedules
      const qSched = query(collection(db, 'installations', user.assignedInstallationId, 'schedules'), orderBy('time', 'asc'));
      const unsubSched = onSnapshot(qSched, (snap) => {
        setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        if (err.code !== 'permission-denied') console.error("Error fetching schedules:", err);
      });

      return () => {
        unsubInst();
        unsubPoints();
        unsubSched();
      };
    }
  }, [user]);

  // Round summary
  const roundScannedIds = React.useMemo(() => {
    if (!currentRoundId) return new Set();
    return new Set(scannedPoints.filter(p => p.roundId === currentRoundId).map(p => p.pointId));
  }, [scannedPoints, currentRoundId]);

  return (
    <Container>
      <Header>
        <UserInfo>
          <UserName>{user?.name}</UserName>
          <UserRole>
            {user?.role} 
            {assignedInst && (
              <>
                <span style={{ color: '#DDD' }}>•</span>
                <span style={{ color: '#2E7D32' }}>{assignedInst.name}</span>
              </>
            )}
          </UserRole>
        </UserInfo>
        <LogoutBtn onClick={logout}>
          <LogOut size={20} />
        </LogoutBtn>
      </Header>

      <Content>
        {(user?.role === 'guardia' || user?.role === 'admin') && (
          <>

            {!isTracking && schedules.length > 0 && (
              <Checklist style={{ background: '#F8F9FA', border: '1px dashed #DDD' }}>
                <ChecklistTitle style={{ fontSize: '14px', color: '#666' }}>Próximas Rondas Programadas</ChecklistTitle>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {schedules.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => navigate(`/round/${s.id}?time=${s.time}`)}
                      style={{ 
                        background: 'white', 
                        padding: '8px 15px', 
                        borderRadius: '20px', 
                        fontSize: '13px', 
                        fontWeight: '700', 
                        border: '1px solid #EEE', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Clock size={14} color="#000" /> {s.time}
                    </div>
                  ))}
                </div>
              </Checklist>
            )}

            {isTracking && markingPoints.length > 0 && (
              <Checklist>
                <ChecklistTitle>Checklist de Ronda</ChecklistTitle>
                {markingPoints.map(point => {
                  const isScanned = roundScannedIds.has(point.id);
                  return (
                    <CheckItem key={point.id}>
                      <CheckText $done={isScanned}>{point.name}</CheckText>
                      {isScanned ? (
                        <CheckCircle2 size={20} color="#4CAF50" fill="#E8F5E9" />
                      ) : (
                        <Circle size={20} color="#DDD" />
                      )}
                    </CheckItem>
                  );
                })}
              </Checklist>
            )}


            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <MenuBtn onClick={() => navigate('/map')} style={{ width: '100%' }}>
                <MapIcon size={32} color="#1A1A1A" />
                <MenuText>Ver Mapa</MenuText>
              </MenuBtn>
            </div>
          </>
        )}

        {(user?.role === 'admin' || user?.role === 'director') && (
          <Grid style={{ marginTop: 16 }}>
             <MenuBtn onClick={() => navigate('/reports')}>
                <FileText size={32} color="#1A1A1A" />
                <MenuText>Reportes</MenuText>
              </MenuBtn>

              {user?.role === 'admin' && (
                <>
                  <MenuBtn onClick={() => navigate('/admin')}>
                    <Users size={32} color="#1A1A1A" />
                    <MenuText>Usuarios</MenuText>
                  </MenuBtn>
                  <MenuBtn onClick={() => navigate('/installations')}>
                    <Building size={32} color="#1A1A1A" />
                    <MenuText>Instalaciones</MenuText>
                  </MenuBtn>
                  <MenuBtn onClick={() => navigate('/guards')}>
                    <Shield size={32} color="#1A1A1A" />
                    <MenuText>Guardias</MenuText>
                  </MenuBtn>
                </>
              )}
          </Grid>
        )}
      </Content>
    </Container>
  );
};

export default HomeScreen;
