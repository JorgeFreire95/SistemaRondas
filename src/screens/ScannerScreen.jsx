import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;

  /* Force video to cover the container to avoid double-view/padding issues */
  video {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  gap: 15px;
  z-index: 10;
`;

const BackBtn = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 8px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: white;
`;

const ScannerWrapper = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000;
`;

const Overlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  border: 3px solid #4CAF50;
  border-radius: 24px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
`;

const QuestionModal = styled.div`
  background: white;
  padding: 30px;
  border-radius: 24px;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;

const QuestionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #000000;
  margin: 0;
`;

const AnswerBtn = styled.button`
  flex: 1;
  padding: 15px 30px;
  border-radius: 12px;
  border: none;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  background: ${props => props.$no ? '#FFF0F0' : '#E8F5E9'};
  color: ${props => props.$no ? '#FF4D4F' : '#4CAF50'};
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const InfoBox = styled.div`
  position: absolute;
  bottom: 40px;
  left: 20px;
  right: 20px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  z-index: 10;
`;

const ScannerScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { user } = useAuth();
  const { addScannedPoint } = useLocation();
  const [lastData, setLastData] = useState(null);
  const [markingPoints, setMarkingPoints] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (!user?.assignedInstallationId) return;
    
    // Listen to marking points of the assigned installation
    const q = query(
      collection(db, 'installations', user.assignedInstallationId, 'markingPoints')
    );
    return onSnapshot(q, (snap) => {
      setMarkingPoints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching marking points:", err);
    });
  }, [user]);

  const handleAnswer = async (answer) => {
    const point = activeQuestion;
    setActiveQuestion(null);
    await addScannedPoint(lastData, {
      pointId: point.id,
      pointName: point.name,
      question: point.question,
      answer
    });
    alert(`Respuesta "${answer}" guardada para: ${point.name}`);
    if (returnTo) navigate(returnTo);
  };

  useEffect(() => {
    const initScanner = async () => {
      // Check and request native camera permissions only on native platforms
      if (Capacitor.isNativePlatform()) {
        const perms = await Camera.checkPermissions();
        if (perms.camera !== 'granted') {
          const req = await Camera.requestPermissions();
          if (req.camera !== 'granted') {
            alert('Se requiere acceso a la cámara para escanear puntos.');
            return;
          }
        }
      }

      const qrCode = new Html5Qrcode('reader');
      setScanner(qrCode);

      const onScanSuccess = async (decodedText) => {
        if (decodedText !== lastData) {
          setLastData(decodedText);
          
          // Check if this QR matches a predefined point
          const matchedPoint = markingPoints.find(p => p.qrCode === decodedText);
          
          if (matchedPoint && matchedPoint.question) {
            // Pause scanner/logic to show question
            setActiveQuestion(matchedPoint);
          } else {
            const success = await addScannedPoint(decodedText, matchedPoint ? {
              pointId: matchedPoint.id,
              pointName: matchedPoint.name
            } : {});
            if (success) {
               alert(matchedPoint ? `Punto detectado: ${matchedPoint.name}` : `Código desconocido: ${decodedText}`);
               if (returnTo) navigate(returnTo);
            }
          }
        }
      };

      const config = {
        fps: 20,
        aspectRatio: 1.0
      };

      try {
        await qrCode.start(
          { facingMode: "environment" }, 
          config, 
          onScanSuccess
        );
      } catch (err) {
        console.error("Error starting QR Code scanner:", err);
      }

      return () => {
        if (qrCode.isScanning) {
          qrCode.stop().then(() => {
            qrCode.clear();
          }).catch(console.error);
        }
      };
    };

    initScanner();
  }, [lastData, markingPoints]);

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Escanear Punto</Title>
      </Header>

      <ScannerWrapper>
        <div id="reader" style={{ width: '100%', height: '100%' }}></div>
        <Overlay />
      </ScannerWrapper>

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

      {lastData && !activeQuestion && (
        <InfoBox>
           <strong style={{ display: 'block', marginBottom: 5 }}>Último escaneo:</strong>
           <span style={{ fontSize: 14 }}>{lastData}</span>
        </InfoBox>
      )}
    </Container>
  );
};

export default ScannerScreen;
