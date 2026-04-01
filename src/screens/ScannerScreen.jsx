import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  width: 250px;
  height: 250px;
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

const SuccessOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
  gap: 20px;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SuccessCircle = styled.div`
  width: 80px;
  height: 80px;
  background: #E8F5E9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4CAF50;
`;

const SuccessText = styled.h2`
  color: #1A1A1A;
  font-weight: 800;
  margin: 0;
`;



const ScannerScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { user } = useAuth();
  const { addScannedPoint, uploadPointPhoto, markingPoints, loadingPoints } = useLocation();
  const roundTime = searchParams.get('time');
  const [lastData, setLastData] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const scannerRef = useRef(null);
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const [observation, setObservation] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
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
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      // Vibration for detection
      if (navigator.vibrate) navigator.vibrate(50);
      setActiveQuestion(matchedPoint);
    } else {
      // Non-blocking submission for raw points or matched simple points
      addScannedPoint(matchedPoint ? matchedPoint.name : trimmedCode, matchedPoint ? {
        pointId: matchedPoint.id,
        pointName: matchedPoint.name,
        qrCode: trimmedCode,
        roundTime: roundTime
      } : {
        qrCode: trimmedCode,
        roundTime: roundTime
      });

      // Immediate vibration and navigation back without waiting for DB response.
      if (navigator.vibrate) navigator.vibrate(50);
      if (returnTo) navigate(returnTo, { replace: true });
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

  const takeSectorPhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 20, // Even lighter for instant processing
        allowEditing: false,
        resultType: CameraResultType.Base64, 
        source: CameraSource.Camera,
        width: 500 // Ultra-compact for speed
      });

      if (image && image.base64String) {
        return image.base64String;
      }
    } catch (err) {
      console.error("Error taking photo:", err);
    }
    return null;
  };

  const handleAnswer = async (answer) => {
    const point = activeQuestion;
    setActiveQuestion(null);
    if (answer === 'NO') {
      setCurrentResponse({ answer, point });
      setIsAddingObservation(true);
    } else {
      // Photo is required for points with questions
      const base64 = await takeSectorPhoto();
      if (!base64) {
         alert("La foto es obligatoria para marcar el punto.");
         setActiveQuestion(point); // Re-open question if cancelled
         return;
      }

      // STEP 1: Mark point IMMEDIATELY in Firestore (with 'pending' status)
      const docId = await addScannedPoint(point.name, {
        pointId: point.id,
        pointName: point.name,
        question: point.question,
        answer,
        observation: '',
        qrCode: lastData || 'SCAN',
        roundTime: roundTime,
        photoUrl: 'pending' 
      });

      // UI FIRST: Show success immediately then process upload in background
      setShowSuccess(true);
      if (navigator.vibrate) navigator.vibrate(50);

      // STEP 2: Background upload (Async)
      setTimeout(() => {
        uploadPointPhoto(docId, base64);
      }, 50);

      setTimeout(() => {
        if (returnTo) navigate(returnTo, { replace: true });
      }, 600); // Snappy transition (600ms)
    }
  };

  const handleConfirmObservation = async () => {
    if (!observation.trim()) return alert("Por favor, ingresa una observación.");
    setIsAddingObservation(false);
    
    // Photo is required for points with questions
    const base64 = await takeSectorPhoto();
    if (!base64) {
       alert("La foto es obligatoria para completar la observación.");
       setIsAddingObservation(true); // Re-open observation if photo fails/cancelled
       return;
    }

    // STEP 1: Mark point IMMEDIATELY in Firestore (with 'pending' status)
    const docId = await addScannedPoint(currentResponse.point.name, {
      pointId: currentResponse.point.id,
      pointName: currentResponse.point.name,
      question: currentResponse.point.question,
      answer: currentResponse.answer,
      observation: observation,
      qrCode: lastData || 'SCAN',
      roundTime: roundTime,
      photoUrl: 'pending'
    });

    // UI FIRST
    setShowSuccess(true);
    if (navigator.vibrate) navigator.vibrate(50);
    
    // STEP 2: Background upload
    setTimeout(() => {
      uploadPointPhoto(docId, base64);
    }, 50);
    
    setObservation('');
    setCurrentResponse(null);
    
    setTimeout(() => {
      if (returnTo) navigate(returnTo, { replace: true });
    }, 600); 
  };



  useEffect(() => {
    let isMounted = true;

    const stopAndClear = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (err) {
          console.error("Error during scanner cleanup:", err);
        } finally {
          scannerRef.current = null;
        }
      }
    };

    const initScanner = async () => {
      // Always cleanup before starting a new instance
      await stopAndClear();

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
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF
        ]
      });

      if (!isMounted) {
        qrCode.clear();
        return;
      }

      scannerRef.current = qrCode;

      const onScanSuccess = async (decodedText) => {
        // Use a local check to avoid double-processing if lastData updates slowly
        if (isMounted) {
          await processCode(decodedText);
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
    };

    initScanner();

    return () => {
      isMounted = false;
      stopAndClear();
    };
  }, [roundTime, returnTo]); // Removed lastData from dependencies to avoid re-init upon scan success.

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

      {showSuccess && (
        <SuccessOverlay>
           <SuccessCircle>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
           </SuccessCircle>
           <SuccessText>Punto Registrado</SuccessText>
           <span style={{ fontSize: 13, color: '#666' }}>Subiendo evidencia en segundo plano...</span>
        </SuccessOverlay>
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

      {lastData && (
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          right: '20px', 
          background: 'rgba(0,0,0,0.6)', 
          padding: '10px 15px', 
          borderRadius: '12px',
          color: 'white',
          zIndex: 10,
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
           <strong style={{ display: 'block', fontSize: 10, color: '#AAA', textTransform: 'uppercase' }}>Código Detectado:</strong>
           <span style={{ fontSize: 14, fontWeight: '700' }}>{lastData}</span>
        </div>
      )}

      <div id="reader-hidden" style={{ display: 'none' }}></div>
    </Container>
  );
};

export default ScannerScreen;
