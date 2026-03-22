import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Clock } from 'lucide-react';
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

const List = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ReportItem = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  background: #F0FDF4;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const Info = styled.div`
  flex: 1;
`;

const PointData = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 4px 0;
`;

const GuardLabel = styled.p`
  font-size: 12px;
  color: #666;
  margin: 0 0 12px 0;
`;

const Meta = styled.div`
  display: flex;
  gap: 15px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
`;

const ReportsScreen = () => {
  const navigate = useNavigate();
  const { scannedPoints } = useLocation();

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Historial de Rondas</Title>
      </Header>

      <List>
        {scannedPoints.map((point) => (
          <ReportItem key={point.id}>
            <IconBox>
              <MapPin size={24} color="#4CAF50" />
            </IconBox>
            <Info>
              <PointData>Punto: {point.data}</PointData>
              <GuardLabel>Guardia: {point.guardName}</GuardLabel>
              <Meta>
                <MetaItem>
                  <Calendar size={14} />
                  <span>{point.timestamp?.toDate().toLocaleDateString() || '...'}</span>
                </MetaItem>
                <MetaItem>
                  <Clock size={14} />
                  <span>{point.timestamp?.toDate().toLocaleTimeString() || '...'}</span>
                </MetaItem>
              </Meta>
            </Info>
          </ReportItem>
        ))}
        {scannedPoints.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>No hay puntos registrados.</p>
        )}
      </List>
    </Container>
  );
};

export default ReportsScreen;
