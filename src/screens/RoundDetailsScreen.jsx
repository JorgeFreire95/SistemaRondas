import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Clock, Building, Map as MapIcon, CheckCircle2 } from 'lucide-react';

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
  position: sticky;
  top: 0;
  z-index: 100;
`;

const BackBtn = styled.button`
  background: #F1F3F5;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  flex: 1;
`;

const Content = styled.div`
  padding: 20px;
`;

const SummaryCard = styled.div`
  background: #1A1A1A;
  color: white;
  padding: 24px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: white;
`;

const SummaryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #CCC;
`;

const MetaTags = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 5px;
`;

const Tag = styled.div`
  background: rgba(255,255,255,0.1);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MapButton = styled.button`
  background: #4CAF50;
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
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const PointList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PointCard = styled.div`
  background: white;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid #EEE;
  display: flex;
  gap: 15px;
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  background: #F0FDF4;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const PointInfo = styled.div`
  flex: 1;
`;

const PointName = styled.h3`
  font-size: 16px;
  font-weight: 800;
  color: #1A1A1A;
  margin: 0 0 4px 0;
`;

const PointTime = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  font-weight: 600;
`;

const QuestionBox = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 12px;
  border: 1px solid #EEE;
`;

const QuestionText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #666;
  margin-bottom: 6px;
`;

const AnswerBadge = styled.span`
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  background: ${props => props.$yes ? '#E8F5E9' : '#FFF0F0'};
  color: ${props => props.$yes ? '#2E7D32' : '#FF4D4F'};
`;

const ObservationText = styled.div`
  font-size: 13px;
  color: #444;
  margin-top: 8px;
  font-style: italic;
`;

const EvidenceImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  margin-top: 12px;
  border: 2px solid #EEE;
  cursor: pointer;
  transition: transform 0.2s;
  &:active { transform: scale(0.98); }
`;

const EvidenceLoading = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFF9C4;
  color: #F57F17;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  margin-top: 8px;
  border: 1px solid #FFE082;
`;

const DiagnosticBadge = styled.div`
  display: inline-flex;
  flex-direction: column;
  padding: 8px 12px;
  background: #FFF0F0;
  color: #FF4D4F;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
  margin-top: 8px;
  border: 1px solid #FFCCC7;
  cursor: help;
`;

// Función auxiliar para parsear timestamps que han perdido sus métodos por react-router
const getSafeDate = (ts) => {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

const RoundDetailsScreen = () => {
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { roundId, guardName, points, roundTime, installationName } = location.state || {};

  if (!points || points.length === 0) {
    return (
      <Container>
        <Header>
          <BackBtn onClick={() => navigate(-1)}><ChevronLeft size={20} /></BackBtn>
          <Title>Detalle de Ronda</Title>
        </Header>
        <Content style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
          No se encontraron datos para esta ronda.
        </Content>
      </Container>
    );
  }

  // Sort points by timestamp ascending
  const sortedPoints = [...points].sort((a, b) => {
    const timeA = getSafeDate(a.timestamp).getTime();
    const timeB = getSafeDate(b.timestamp).getTime();
    return timeA - timeB;
  });

  const firstPointDate = getSafeDate(sortedPoints[0].timestamp).toLocaleDateString('es-CL');

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}><ChevronLeft size={20} /></BackBtn>
        <Title>Detalle de Ronda</Title>
      </Header>

      <Content>
        <SummaryCard>
          <SummaryTitle>Ronda: {roundTime || 'Sin horario base'}</SummaryTitle>
          <SummaryInfo>
            Guardia: {guardName}
          </SummaryInfo>
          <MetaTags>
            <Tag><Building size={14} /> {installationName || 'Instalación no registrada'}</Tag>
            <Tag><Calendar size={14} /> {firstPointDate}</Tag>
            <Tag><CheckCircle2 size={14} /> {points.length} puntos marcados</Tag>
          </MetaTags>
        </SummaryCard>

        <MapButton onClick={() => navigate('/map', { state: { roundId, guardName } })}>
          <MapIcon size={20} /> Ver ruta en el Mapa
        </MapButton>

        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '15px', color: '#1A1A1A' }}>
          Puntos Escaneados
        </h3>

        <PointList>
          {sortedPoints.map(point => {
            const time = getSafeDate(point.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            return (
              <PointCard key={point.id}>
                <IconBox>
                  <MapPin size={24} color="#4CAF50" />
                </IconBox>
                <PointInfo>
                  <PointName>{point.pointName || point.data}</PointName>
                  <PointTime>
                    <Clock size={12} /> {time} hrs
                  </PointTime>

                  {point.question && (
                    <QuestionBox>
                      <QuestionText>{point.question}</QuestionText>
                      <div>
                        <AnswerBadge $yes={point.answer === 'SÍ'}>{point.answer}</AnswerBadge>
                      </div>
                      {point.observation && (
                        <ObservationText>Obs: {point.observation}</ObservationText>
                      )}
                    </QuestionBox>
                  )}

                  {point.photoUrl && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>
                        Evidencia del Sector:
                      </div>
                      {point.photoUrl === 'pending' ? (
                        <EvidenceLoading>
                          <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #F57F17', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                          SUBIENDO EVIDENCIA...
                        </EvidenceLoading>
                      ) : point.photoUrl && point.photoUrl.startsWith('http') ? (
                        <EvidenceImage 
                          src={point.photoUrl} 
                          alt="Evidencia" 
                          onClick={() => window.open(point.photoUrl, '_blank')}
                        />
                      ) : point.photoError ? (
                        <DiagnosticBadge onClick={() => alert("Error técnico: " + point.photoError)}>
                          ⚠️ ERROR DE SUBIDA
                          <span style={{ fontWeight: 400, opacity: 0.8, fontSize: '9px' }}>Toca para ver detalle</span>
                        </DiagnosticBadge>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#AAA' }}>Sin foto</span>
                      )}
                    </div>
                  )}
                </PointInfo>
              </PointCard>
            );
          })}
        </PointList>
      </Content>
    </Container>
  );
};

export default RoundDetailsScreen;
