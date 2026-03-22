import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLocation } from '../context/LocationContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Overlay = styled.div`
  position: absolute;
  width: 250px;
  height: 250px;
  border: 2px solid #4CAF50;
  border-radius: 20px;
  pointer-events: none;
  z-index: 5;
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
  const { addScannedPoint } = useLocation();
  const [lastData, setLastData] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    const onScanSuccess = async (decodedText) => {
      if (decodedText !== lastData) {
        setLastData(decodedText);
        const success = await addScannedPoint(decodedText);
        if (success) {
           // Provide feedback, maybe a sound or vibration (Capacitor Haptics)
           alert(`Punto detectado: ${decodedText}`);
        }
      }
    };

    scanner.render(onScanSuccess);

    return () => {
      scanner.clear();
    };
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

      {lastData && (
        <InfoBox>
           <strong style={{ display: 'block', marginBottom: 5 }}>Último escaneo:</strong>
           <span style={{ fontSize: 14 }}>{lastData}</span>
        </InfoBox>
      )}
    </Container>
  );
};

export default ScannerScreen;
