import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { X } from 'lucide-react';

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
  width: 280px;
  height: 120px;
  border: 3px solid #4CAF50;
  border-radius: 12px;
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

const ObservationModal = styled.div`
  background: white;
  padding: 25px;
  border-radius: 24px;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-height: 100px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #4CAF50; }
`;

const PrimaryBtn = styled.button`
  background: #1A1A1A;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
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
  bottom: 0px;
  left: 0px;
  right: 0px;
  background: white;
  padding: 20px;
  border-radius: 20px 20px 0 0;
  z-index: 10;
  box-shadow: 0 -5px 15px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ManualInputWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const SubmitBtn = styled.button`
  background: #1A1A1A;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 48px;
  font-size: 14px;
`;

const ScannerScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { user } = useAuth();
  const { addScannedPoint, markingPoints, loadingPoints } = useLocation();
  const [lastData, setLastData] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const [observation, setObservation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null); // { answer, point }

  const processCode = async (code) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setLastData(trimmedCode);
    
    if (loadingPoints) {
      return alert('Buscando puntos en la base de datos... Reintenta en 5 segundos.');
    }

    // Check if this QR matches a predefined point
    console.log("Scanner: Processing code", trimmedCode, "against", markingPoints.length, "points");

    const matchedPoint = markingPoints.find(p => {
      const dbCode = String(p.qrCode || '').trim().toLowerCase();
      const inputCode = String(trimmedCode || '').trim().toLowerCase();
      return dbCode === inputCode;
    });
    
    if (matchedPoint && matchedPoint.question) {
      // Stop scanner to free camera for the observation photo
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
      setActiveQuestion(matchedPoint);
    } else {
      const success = await addScannedPoint(trimmedCode, matchedPoint ? {
        pointId: matchedPoint.id,
        pointName: matchedPoint.name
      } : {});

      if (success) {
        if (matchedPoint) {
           alert(`Punto detectado: ${matchedPoint.name}`);
          } else if (markingPoints.length === 0) {
           alert(`ERROR: No hay puntos cargados.\n\nInstalación: ${user?.assignedInstallationId}\n\nDetalles técnicos: la lista de puntos está vacía. Verifica que existan puntos en la subcolección 'markingPoints' de esta instalación.`);
        } else {
           const pInfo = markingPoints.map(p => `• ${p.name}: [${p.qrCode}]`).join('\n');
           const ptsIds = markingPoints.map(p => p.id).join(', ');
           alert(`Código "${trimmedCode}" no coincide con los puntos.\n\nInstalación: ${user?.assignedInstallationId}\nPuntos (${markingPoints.length}):\n${pInfo}\n\nIDs: ${ptsIds}`);
        }
        
        if (returnTo) navigate(returnTo);
      }
    }
  };

  const handleManualSubmit = () => {
    if (manualCode) {
      processCode(manualCode);
      setManualCode('');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const decodedText = await html5QrCode.scanImage(file, true);
      processCode(decodedText);
    } catch (err) {
      alert("No se detectó ningún código en la imagen.");
    }
  };

  const handleAnswer = async (answer) => {
    const point = activeQuestion;
    setActiveQuestion(null);
    if (answer === 'NO') {
      setCurrentResponse({ answer, point });
      setIsAddingObservation(true);
    } else {
      const success = await addScannedPoint(lastData || 'SCAN', {
        pointId: point.id,
        pointName: point.name,
        question: point.question,
        answer,
        observation: ''
      });
      if (success) {
        alert("Punto marcado con éxito.");
        if (returnTo) navigate(returnTo);
      }
    }
  };

  const handleConfirmObservation = async () => {
    if (!observation.trim()) return alert("Por favor, ingresa una observación.");
    setIsAddingObservation(false);
    const success = await addScannedPoint(lastData || 'SCAN', {
      pointId: currentResponse.point.id,
      pointName: currentResponse.point.name,
      question: currentResponse.point.question,
      answer: currentResponse.answer,
      observation: observation
    });
    if (success) {
      alert("Punto marcado con éxito.");
      setObservation('');
      setCurrentResponse(null);
      if (returnTo) navigate(returnTo);
    }
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

      const qrCode = new Html5Qrcode('reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF
        ]
      });
      setScanner(qrCode);

      const onScanSuccess = async (decodedText) => {
        if (decodedText !== lastData) {
          await processCode(decodedText);
        }
      };

      const config = {
        fps: 20,
        aspectRatio: 1.77
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
  }, [lastData]);

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

      {isAddingObservation && (
        <ModalOverlay>
           <ObservationModal>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Añadir Observación</h3>
                <X size={20} onClick={() => { setIsAddingObservation(false); setCurrentResponse(null); window.location.reload(); }} style={{ cursor: 'pointer' }} />
              </div>
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
           </ObservationModal>
        </ModalOverlay>
      )}

      {!activeQuestion && !isAddingObservation && !isUploading && (
        <InfoBox>
           <ManualInputWrapper>
             <StyledInput 
               placeholder="Código manual..." 
               value={manualCode}
               onChange={(e) => setManualCode(e.target.value)}
             />
             <input 
               type="file" 
               accept="image/*" 
               id="file-upload" 
               hidden 
               onChange={handleImageUpload} 
             />
             <SubmitBtn onClick={() => document.getElementById('file-upload').click()} title="Escanear desde imagen">
               <ImageIcon size={20} />
               <span>Galería</span>
             </SubmitBtn>
             <SubmitBtn onClick={handleManualSubmit} style={{ background: '#4CAF50' }}>
               OK
             </SubmitBtn>
           </ManualInputWrapper>
           
           {lastData && (
             <div style={{ borderTop: '1px solid #eee', paddingTop: 10 }}>
                <strong style={{ display: 'block', fontSize: 12, color: '#666' }}>Último escaneo:</strong>
                <span style={{ fontSize: 14 }}>{lastData}</span>
             </div>
           )}
        </InfoBox>
      )}

      <div id="reader-hidden" style={{ display: 'none' }}></div>
    </Container>
  );
};

export default ScannerScreen;
