import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, Camera as CameraIcon, X } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';


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
  cursor: ${props => props.$loading ? 'default' : 'pointer'};
  background: ${props => props.$loading ? '#DDD' : '#1A1A1A'};
`;

const PhotoPreview = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 16px;
  background: #F1F3F5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #DDD;
  position: relative;
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TakePhotoBtn = styled.button`
  background: #E8F5E9;
  color: #2E7D32;
  border: 2px dashed #2E7D32;
  padding: 20px;
  border-radius: 16px;
  width: 100%;
  font-weight: 800;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const ActionBtn = styled.button`
  background: #1A1A1A;
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
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
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleAnswer = async (answer) => {
    const point = activeQuestion;
    setActiveQuestion(null);
    if (answer === 'NO') {
      setCurrentResponse({ answer, point });
      setIsAddingObservation(true);
    } else {
      setCurrentResponse({ answer, point });
      setIsPhotoModalOpen(true);
    }
  };

  const handleConfirmObservation = async () => {
    if (!observation.trim()) return alert("Por favor, ingresa una observación.");
    setIsAddingObservation(false);
    setIsPhotoModalOpen(true);
  };

  const handleTakePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image) {
        setCapturedPhoto(`data:image/jpeg;base64,${image.base64String}`);
        setPhotoBase64(image.base64String);
      }
    } catch (e) {
      console.error("Camera error:", e);
    }
  };

  const handleFinalizeWithPhoto = async () => {
    if (!photoBase64) return alert("Por favor, toma una foto como evidencia.");
    
    setIsUploading(true);
    try {
      const { point, answer } = currentResponse;
      const docId = await addScannedPoint(point.name, {
        pointId: point.id,
        pointName: point.name,
        question: point.question,
        answer,
        observation: observation,
        qrCode: lastData || 'SCAN',
        roundTime: roundTime
      });

      if (docId) {
        await uploadPointPhoto(docId, photoBase64);
        setShowSuccess(true);
        if (navigator.vibrate) navigator.vibrate(50);
        
        // Brief delay for success animation then navigate back
        setTimeout(() => {
          if (returnTo) navigate(returnTo, { replace: true });
        }, 800);
      }
    } catch (e) {
      console.error("Error finalizing:", e);
      alert("Hubo un error al guardar la evidencia.");
    } finally {
      setIsUploading(false);
    }
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

      {isPhotoModalOpen && (
        <ModalOverlay>
          <ModalContent style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Evidencia Fotográfica</h3>
              <X size={20} onClick={() => { setIsPhotoModalOpen(false); setCapturedPhoto(null); setPhotoBase64(null); }} style={{ cursor: 'pointer' }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
              Captura una foto del sector para finalizar este punto.
            </p>

            {capturedPhoto ? (
              <PhotoPreview>
                <PreviewImg src={capturedPhoto} alt="Preview" />
                <ActionBtn 
                  style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  onClick={() => { setCapturedPhoto(null); setPhotoBase64(null); }}
                >
                  <X size={14} /> CAMBIAR
                </ActionBtn>
              </PhotoPreview>
            ) : (
              <TakePhotoBtn onClick={handleTakePicture}>
                <CameraIcon size={32} />
                <span>TOMAR FOTO</span>
              </TakePhotoBtn>
            )}

            <PrimaryBtn 
              $loading={isUploading} 
              disabled={isUploading || !photoBase64}
              onClick={handleFinalizeWithPhoto}
            >
              {isUploading ? 'SUBIENDO...' : 'GUARDAR Y FINALIZAR'}
            </PrimaryBtn>
          </ModalContent>
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
