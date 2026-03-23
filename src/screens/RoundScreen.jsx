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
  Clock,
  Keyboard,
  X,
  Play,
  Square
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db, storage } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionBtn = styled.button`
  background: ${props => props.$secondary ? '#F1F3F5' : '#1A1A1A'};
  color: ${props => props.$secondary ? '#495057' : 'white'};
  border: none;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 24px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const QuestionModal = styled.div`
  background: white;
  padding: 30px;
  border-radius: 28px;
  text-align: center;
  width: 90%;
  max-width: 340px;
  animation: slideUp 0.3s ease-out;
`;

const QuestionTitle = styled.h3`
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 25px;
  color: #1A1A1A;
`;

const AnswerBtn = styled.button`
  flex: 1;
  padding: 18px;
  border-radius: 16px;
  border: none;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  background: ${props => props.$no ? '#FFF0F0' : '#E8F5E9'};
  color: ${props => props.$no ? '#FF4D4F' : '#2E7D32'};
  transition: transform 0.1s;
  &:active { transform: scale(0.95); }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const Input = styled.input`
  padding: 14px;
  border: 1px solid #EEE;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  &:focus { border-color: #1A1A1A; }
`;

const PrimaryBtn = styled.button`
  background: ${props => props.$loading ? '#DDD' : '#1A1A1A'};
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  cursor: ${props => props.$loading ? 'default' : 'pointer'};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px;
  border: 1px solid #EEE;
  border-radius: 12px;
  min-height: 100px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #1A1A1A; }
`;

const StartRoundBtn = styled.button`
  background: ${props => props.$stop ? '#FF4D4F' : (props.$finish ? '#4CAF50' : '#1A1A1A')};
  color: white;
  border: none;
  padding: 16px;
  border-radius: 16px;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
  }
`;

const RoundScreen = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const roundTime = searchParams.get('time');
  const { user } = useAuth();
  const { isTracking, setIsTracking, currentRoundId, scannedPoints, markingPoints: points, addScannedPoint } = useLocation();
  const [instName, setInstName] = useState('');
  const [manualModal, setManualModal] = useState(null); // pointId if open
  const [manualCode, setManualCode] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const [observation, setObservation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null); // { answer, point }

  useEffect(() => {
    // We removed the auto-start logic to let the user click "INICIAR RONDA" manually
  }, []);

  useEffect(() => {
    if (user?.assignedInstallationId) {
      // Fetch installation name
      const unsub = onSnapshot(doc(db, 'installations', user.assignedInstallationId), (snap) => {
        if (snap.exists()) setInstName(snap.data().name);
      }, (err) => {
        if (err.code !== 'permission-denied') console.error("Error fetching installation name:", err);
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

  const handleManualSubmit = async () => {
    const point = points.find(p => p.id === manualModal);
    if (!point) return;

    if (manualCode.trim().toLowerCase() === String(point.qrCode || '').trim().toLowerCase()) {
      if (point.question) {
        setActiveQuestion(point);
        setManualModal(null);
      } else {
        const success = await addScannedPoint(manualCode.trim(), {
          pointId: point.id,
          pointName: point.name
        });
        if (success) {
          alert(`Punto "${point.name}" marcado con éxito.`);
          setManualModal(null);
          setManualCode('');
        }
      }
    } else {
      alert("El código ingresado no es correcto para este punto.");
    }
  };

  const handleAnswer = async (answer) => {
    const point = activeQuestion;
    setActiveQuestion(null);
    if (answer === 'NO') {
      setCurrentResponse({ answer, point });
      setIsAddingObservation(true);
    } else {
      const success = await addScannedPoint(manualCode.trim() || 'MANUAL', {
        pointId: point.id,
        pointName: point.name,
        question: point.question,
        answer,
        observation: ''
      });
      if (success) {
        alert("Punto marcado con éxito.");
        setManualCode('');
      }
    }
  };

  const handleConfirmObservation = async () => {
    if (!observation.trim()) return alert("Por favor, ingresa una observación.");
    setIsAddingObservation(false);
    const success = await addScannedPoint(manualCode.trim() || 'MANUAL', {
      pointId: currentResponse.point.id,
      pointName: currentResponse.point.name,
      question: currentResponse.point.question,
      answer: currentResponse.answer,
      observation: observation
    });
    if (success) {
      alert("Punto marcado con éxito.");
      setManualCode('');
      setObservation('');
      setCurrentResponse(null);
    }
  };



  const handleStartRound = async () => {
    if (Capacitor.isNativePlatform()) {
      const perms = await Geolocation.checkPermissions();
      if (perms.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          alert('Se requiere permiso de ubicación para iniciar la ronda.');
          return;
        }
      }
    }
    setIsTracking(true);
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
                
                {isTracking && !isScanned && (
                  <ButtonGroup>
                    <ActionBtn onClick={() => handleScan(point.id)}>
                      <QrCode size={14} /> ESCANEAR
                    </ActionBtn>
                    <ActionBtn $secondary onClick={() => setManualModal(point.id)}>
                      <Keyboard size={14} /> MANUAL
                    </ActionBtn>
                  </ButtonGroup>
                )}
                {isScanned && (
                  <CheckCircle2 size={24} color="#4CAF50" />
                )}
              </PointCard>
            );
          })}
        </PointsList>

        {isTracking && (
          <StartRoundBtn 
            $stop={scannedPointIds.length < points.length} 
            $finish={scannedPointIds.length === points.length}
            onClick={() => {
              setIsTracking(false);
              navigate('/');
            }}
          >
            {scannedPointIds.length === points.length ? <CheckCircle2 size={20} /> : <Square size={20} fill="#fff" />}
            {scannedPointIds.length === points.length ? 'FINALIZAR RONDA' : 'DETENER RONDA'}
          </StartRoundBtn>
        )}

        {!isTracking && points.length > 0 && (
          <StartRoundBtn onClick={handleStartRound}>
            <Play size={20} fill="#fff" /> INICIAR RONDA
          </StartRoundBtn>
        )}
      </Content>

      {manualModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Ingreso Manual</ModalTitle>
              <X size={20} onClick={() => setManualModal(null)} style={{ cursor: 'pointer' }} />
            </ModalHeader>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
              Ingresa el código para el punto: <strong>{points.find(p => p.id === manualModal)?.name}</strong>
            </p>
            <Input 
              placeholder="Ej: 0123456789"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              autoFocus
            />
            <PrimaryBtn onClick={handleManualSubmit}>CONFIRMAR</PrimaryBtn>
          </ModalContent>
        </ModalOverlay>
      )}

      {activeQuestion && (
        <ModalOverlay>
          <QuestionModal>
            <QuestionTitle>{activeQuestion.question}</QuestionTitle>
            <div style={{ display: 'flex', gap: '15px' }}>
              <AnswerBtn onClick={() => handleAnswer('SÍ')}>SÍ</AnswerBtn>
              <AnswerBtn $no onClick={() => handleAnswer('NO')}>NO</AnswerBtn>
            </div>
          </QuestionModal>
        </ModalOverlay>
      )}

      {isAddingObservation && (
        <ModalOverlay>
          <ModalContent>
             <ModalHeader>
                <ModalTitle>Añadir Observación</ModalTitle>
                <X size={20} onClick={() => { setIsAddingObservation(false); setCurrentResponse(null); }} style={{ cursor: 'pointer' }} />
             </ModalHeader>
             <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
               ¿Por qué respondiste que <strong>NO</strong>?
             </p>
             <TextArea 
               placeholder="Escribe los detalles aquí..."
               value={observation}
               onChange={(e) => setObservation(e.target.value)}
               autoFocus
             />
             <PrimaryBtn onClick={handleConfirmObservation}>CONFIRMAR</PrimaryBtn>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default RoundScreen;
