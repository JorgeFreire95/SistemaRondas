import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogIn, LogOut, CheckCircle2, MapPin, Building, User as UserIcon } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { supabase } from '../config/supabase';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';


const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8F9FA;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #EEE;
  gap: 15px;
  z-index: 10;
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
  color: #1A1A1A;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const BigButton = styled.button`
  background: ${props => props.$type === 'ingreso' ? '#1A1A1A' : 'white'};
  color: ${props => props.$type === 'ingreso' ? 'white' : '#1A1A1A'};
  border: ${props => props.$type === 'ingreso' ? 'none' : '2px solid #1A1A1A'};
  border-radius: 20px;
  width: 100%;
  padding: 30px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);

  &:active {
    transform: scale(0.98);
  }
`;

const ScannerContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #000;
  position: relative;
  
  video {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  border: 4px solid #4CAF50;
  border-radius: 20px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.6);
`;

const ResultCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 20px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  text-align: center;
`;

const ResultName = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
`;

const ResultRut = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
  margin-bottom: 8px;
`;

const ResultLocation = styled.div`
  background: #F1F3F5;
  padding: 12px 16px;
  border-radius: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
`;

const LocationTitle = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: #888;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LocationName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
`;

const ConfirmBtn = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  width: 100%;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const CancelBtn = styled.button`
  background: transparent;
  color: #FF4D4F;
  border: none;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const LoadingText = styled.div`
  color: white;
  font-size: 16px;
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 20;
`;

const extractRut = (text) => {
  if (!text) return null;
  // Intenta encontrar RUN=12345678-9 (Cédula nueva)
  const runMatch = text.match(/RUN=([0-9]+-[0-9kK])/i);
  if (runMatch && runMatch[1]) {
    return runMatch[1].toUpperCase();
  }
  
  // Si es solo texto que parece RUT (e.g. 12345678-9)
  const plainRutMatch = text.match(/^[0-9]+-[0-9kK]$/i);
  if (plainRutMatch) {
    return text.trim().toUpperCase();
  }

  // Devolver el texto limpio en caso de que sea otro formato
  return text.trim();
};

const AttendanceScreen = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'ingreso', 'salida' o null
  const [scanner, setScanner] = useState(null);
  const [scannedUser, setScannedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let qrCode = null;

    const startScanner = async () => {
      if (!mode || scannedUser) return;

      if (Capacitor.isNativePlatform()) {
        const perms = await Camera.checkPermissions();
        if (perms.camera !== 'granted') {
          const req = await Camera.requestPermissions();
          if (req.camera !== 'granted') {
            alert('Se requiere acceso a la cámara para escanear.');
            setMode(null);
            return;
          }
        }
      }

      qrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.PDF_417
        ]
      });
      setScanner(qrCode);

      const onScanSuccess = async (decodedText) => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        try {
          // Stop scanner to show result without awaiting to prevent strict state throwing
          if (qrCode.isScanning) {
            qrCode.stop().catch(console.error);
          }

          const rut = extractRut(decodedText);
          
          // Buscar usuario en Supabase
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('rut', rut);
          
          if (usersError || !usersData || usersData.length === 0) {
            alert(`No se encontró ningún usuario con el RUT: ${rut}`);
            setMode(null);
          } else {
            const userData = usersData[0];
            const user = { 
              id: userData.id, 
              name: userData.name, 
              rut: userData.rut,
              assignedInstallationId: userData.assigned_installation_id,
              assignedSectionId: userData.assigned_section_id
            };
            
            let instName = null;
            let secName = null;

            try {
              if (user.assignedInstallationId) {
                const { data: instData } = await supabase
                  .from('installations')
                  .select('name')
                  .eq('id', user.assignedInstallationId)
                  .single();
                if (instData) {
                  instName = instData.name;
                  if (user.assignedSectionId) {
                    const { data: secData } = await supabase
                      .from('sections')
                      .select('name')
                      .eq('id', user.assignedSectionId)
                      .single();
                    if (secData) secName = secData.name;
                  }
                }
              }
            } catch (permError) {
              console.warn("No se pudieron obtener los nombres de ubicación:", permError);
            }

            setScannedUser({ 
              ...user, 
              assignedInstallationName: instName, 
              assignedSectionName: secName 
            });
          }
        } catch (error) {
          console.error("Error validando QR:", error);
          alert("Error: " + error.message);
          setMode(null);
        } finally {
          setIsProcessing(false);
        }
      };

      try {
        await qrCode.start(
          { facingMode: "environment" },
          { fps: 10, aspectRatio: 1.0 },
          onScanSuccess
        );
      } catch (err) {
        console.error("Error iniciando cámara:", err);
      }
    };

    if (mode && !scannedUser) {
      setTimeout(() => startScanner(), 100);
    }

    return () => {
      if (qrCode && qrCode.isScanning) {
        qrCode.stop().then(() => qrCode.clear()).catch(console.error);
      }
    };
  }, [mode, scannedUser]);

  const handleConfirm = async () => {
    if (!scannedUser) return;
    try {
      await supabase.from('attendance').insert({
        user_id: scannedUser.id,
        user_name: scannedUser.name || 'Sin nombre',
        rut: scannedUser.rut,
        assigned_installation_id: scannedUser.assignedInstallationId || null,
        assigned_installation_name: scannedUser.assignedInstallationName || null,
        assigned_section_id: scannedUser.assignedSectionId || null,
        assigned_section_name: scannedUser.assignedSectionName || null,
        type: mode
      });
      alert(`Registro de ${mode} correcto`);
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert('Error al registrar la asistencia');
    }
  };

  const cancelProcess = () => {
    setScannedUser(null);
    setMode(null);
  };

  if (!mode) {
    return (
      <Container>
        <Header>
          <BackBtn onClick={() => navigate('/login')}>
            <ChevronLeft size={20} />
          </BackBtn>
          <Title>Registrar Asistencia</Title>
        </Header>
        <Content>
          <BigButton $type="ingreso" onClick={() => setMode('ingreso')}>
            <LogIn size={28} /> Confirmar Ingreso
          </BigButton>
          <BigButton $type="salida" onClick={() => setMode('salida')}>
            <LogOut size={28} /> Confirmar Salida
          </BigButton>
        </Content>
      </Container>
    );
  }

  return (
    <Container style={{ background: scannedUser ? '#F8F9FA' : '#000' }}>
      <Header>
        <BackBtn onClick={cancelProcess}>
          <ChevronLeft size={20} color="#1A1A1A" />
        </BackBtn>
        <Title>{mode === 'ingreso' ? 'Ingreso' : 'Salida'}</Title>
      </Header>

      {!scannedUser ? (
        <ScannerContainer>
          {isProcessing && <LoadingText>Procesando...</LoadingText>}
          <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
          <ScanOverlay />
        </ScannerContainer>
      ) : (
        <Content>
          <ResultCard>
            <CheckCircle2 size={48} color="#4CAF50" />
            <div>
              <ResultName>{scannedUser.name}</ResultName>
              <ResultRut>RUT: {scannedUser.rut}</ResultRut>
            </div>
            
            {scannedUser.assignedInstallationName && (
              <ResultLocation>
                <LocationTitle><Building size={12}/> Instalación Asignada</LocationTitle>
                <LocationName>{scannedUser.assignedInstallationName}</LocationName>
                {scannedUser.assignedSectionName && (
                   <>
                     <LocationTitle style={{ marginTop: '8px' }}><MapPin size={12}/> Sección</LocationTitle>
                     <LocationName>{scannedUser.assignedSectionName}</LocationName>
                   </>
                )}
              </ResultLocation>
            )}
            <ConfirmBtn onClick={handleConfirm}>
              Confirmar {mode === 'ingreso' ? 'Ingreso' : 'Salida'}
            </ConfirmBtn>
            <CancelBtn onClick={cancelProcess}>
              Cancelar
            </CancelBtn>
          </ResultCard>
        </Content>
      )}
    </Container>
  );
};

export default AttendanceScreen;
