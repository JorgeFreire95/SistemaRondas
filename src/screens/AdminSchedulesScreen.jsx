import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Play, MapPin, Building } from 'lucide-react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useLocation } from '../context/LocationContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F8F9FA;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #EEE;
  gap: 15px;
`;

const BackBtn = styled.button`
  background: #F1F3F5;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
`;

const Content = styled.div`
  padding: 20px;
`;

const InstCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InstName = styled.h2`
  font-size: 16px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InstSub = styled.div`
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 15px;
  color: #666;
`;

const ScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ScheduleCard = styled.div`
  background: white;
  padding: 18px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  cursor: pointer;
  border-left: 4px solid #1A1A1A;

  &:active { transform: scale(0.98); }
`;

const ScheduleTime = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
`;

const StartIcon = styled.div`
  background: #E8F5E9;
  color: #2E7D32;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AdminSchedulesScreen = () => {
  const navigate = useNavigate();
  const { instId } = useParams();
  const { setAdminInstallationId, startNewRound } = useLocation();
  const [installation, setInstallation] = useState(null);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    // Set effective installation ID in context
    setAdminInstallationId(instId);
    
    // Fetch installation info
    const unsubInst = onSnapshot(doc(db, 'installations', instId), (snap) => {
      if (snap.exists()) setInstallation({ id: snap.id, ...snap.data() });
    });

    // Fetch schedules
    const q = query(collection(db, 'installations', instId, 'schedules'));
    const unsubSched = onSnapshot(q, (snap) => {
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubInst();
      unsubSched();
      // We don't clear adminInstallationId here to allow the round to continue 
      // if they navigate to RoundScreen, but we might want to clear it on unmount 
      // IF they are not starting a round. 
      // Actually, effectiveInstId is needed in RoundScreen.
    };
  }, [instId]);

  const handleStartRound = (sched) => {
    navigate(`/round/${sched.id}?time=${sched.time}`);
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Horarios de Ronda</Title>
      </Header>

      <Content>
        {installation && (
          <InstCard>
            <InstName><Building size={18} /> {installation.name}</InstName>
            <InstSub><MapPin size={14} /> {installation.address}, {installation.number}</InstSub>
            <InstSub><MapPin size={14} /> {installation.comuna}, {installation.region}</InstSub>
          </InstCard>
        )}

        <SectionTitle>PRÓXIMAS RONDAS</SectionTitle>
        
        <ScheduleList>
          {schedules.map(sched => (
            <ScheduleCard key={sched.id} onClick={() => handleStartRound(sched)}>
              <ScheduleTime>
                <Clock size={20} color="#666" />
                {sched.time} hrs
              </ScheduleTime>
              <StartIcon>
                <Play size={20} fill="currentColor" />
              </StartIcon>
            </ScheduleCard>
          ))}
          {schedules.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
              No hay horarios configurados para esta instalación.
            </div>
          )}
        </ScheduleList>
      </Content>
    </Container>
  );
};

export default AdminSchedulesScreen;
