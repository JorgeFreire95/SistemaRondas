import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  QrCode, 
  CheckCircle2, 
  Circle,
  Building,
  Clock
} from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8F9FA;
`;

const Header = styled.header`
  padding: 24px 20px;
  background: white;
  border-bottom: 1px solid #EEE;
  display: flex;
  align-items: center;
  gap: 15px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackBtn = styled.button`
  background: #F1F3F5;
  border: none;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #000;
`;

const Subtitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #2E7D32;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const PointsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PointCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${props => props.$scanned ? '#E8F5E9' : '#F1F3F5'};
  transition: all 0.2s;
`;

const PointInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const IconBox = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.$scanned ? '#E8F5E9' : '#F8F9FA'};
  color: ${props => props.$scanned ? '#4CAF50' : '#AAA'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PointText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PointName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #000;
  text-decoration: ${props => props.$scanned ? 'line-through' : 'none'};
`;

const PointStatus = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: ${props => props.$scanned ? '#4CAF50' : '#AAA'};
  text-transform: uppercase;
`;

const ScanBtn = styled.button`
  background: ${props => props.$scanned ? '#F8F9FA' : '#1A1A1A'};
  color: ${props => props.$scanned ? '#AAA' : 'white'};
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: ${props => props.$scanned ? 'default' : 'pointer'};
`;

const RoundScreen = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const roundTime = searchParams.get('time');
  const { user } = useAuth();
  const { isTracking, setIsTracking, currentRoundId, scannedPoints } = useLocation();
  const [points, setPoints] = useState([]);
  const [instName, setInstName] = useState('');

  useEffect(() => {
    if (!isTracking) {
      // If we are in this page, we should probably be tracking
      setIsTracking(true);
    }
  }, [isTracking]);

  useEffect(() => {
    if (user?.assignedInstallationId) {
      // Fetch installation name
      onSnapshot(doc(db, 'installations', user.assignedInstallationId), (snap) => {
        if (snap.exists()) setInstName(snap.data().name);
      }, (err) => {
        if (err.code !== 'permission-denied') console.error("Error fetching installation name:", err);
      });

      // Fetch points
      const q = query(
        collection(db, 'installations', user.assignedInstallationId, 'markingPoints'),
        orderBy('createdAt', 'asc')
      );
      const unsub = onSnapshot(q, (snap) => {
        setPoints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        if (err.code !== 'permission-denied') console.error("Error fetching marking points:", err);
      });
      return unsub;
    }
  }, [user]);

  // Points already scanned in THIS round
  const scannedPointIds = scannedPoints
    .filter(p => p.roundId === currentRoundId)
    .map(p => p.pointId);

  const handleScan = (pointId) => {
    navigate(`/scan?returnTo=/round/${scheduleId}?time=${roundTime}`);
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate('/')}>
          <ChevronLeft size={20} />
        </BackBtn>
        <HeaderInfo>
          <PageTitle>Ronda de las {roundTime}</PageTitle>
          <Subtitle>
            <Building size={12} /> {instName}
          </Subtitle>
        </HeaderInfo>
      </Header>

      <Content>
        <PointsList>
          {points.map(point => {
            const isScanned = scannedPointIds.includes(point.id);
            return (
              <PointCard key={point.id} $scanned={isScanned}>
                <PointInfo>
                  <IconBox $scanned={isScanned}>
                    {isScanned ? <CheckCircle2 size={22} /> : <MapPin size={22} />}
                  </IconBox>
                  <PointText>
                    <PointName $scanned={isScanned}>{point.name}</PointName>
                    <PointStatus $scanned={isScanned}>
                      {isScanned ? 'Completado' : 'Pendiente'}
                    </PointStatus>
                  </PointText>
                </PointInfo>
                
                {!isScanned && (
                  <ScanBtn onClick={() => handleScan(point.id)}>
                    <QrCode size={16} /> ESCANEAR
                  </ScanBtn>
                )}
                {isScanned && (
                  <CheckCircle2 size={24} color="#4CAF50" />
                )}
              </PointCard>
            );
          })}
        </PointsList>

        {points.length > 0 && scannedPointIds.length === points.length && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3 style={{ color: '#000', marginBottom: '10px' }}>¡Ronda Completada!</h3>
            <button 
              onClick={() => {
                setIsTracking(false);
                navigate('/');
              }}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              FINALIZAR Y VOLVER
            </button>
          </div>
        )}
      </Content>
    </Container>
  );
};

export default RoundScreen;
