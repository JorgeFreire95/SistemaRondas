import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../context/LocationContext';

// Fix for default marker icons in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  z-index: 1000;
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

const MapWrapper = styled.div`
  flex: 1;
  width: 100%;
`;

const RecenterBtn = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: #1A1A1A;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 30px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const ChangeView = ({ center }) => {
  const map = useMap();
  if (center) map.setView(center, 15);
  return null;
}

const MapScreen = () => {
  const navigate = useNavigate();
  const { location, locationHistory, scannedPoints } = useLocation();

  const currentCoords = location ? [location.coords.latitude, location.coords.longitude] : [-33.4489, -70.6693]; // Default Santiago
  const polylinePositions = locationHistory.map(p => [p.lat, p.lng]);

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Ubicación Real-Time</Title>
      </Header>

      <MapWrapper>
        <MapContainer center={currentCoords} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <ChangeView center={currentCoords} />

          {location && (
             <Marker position={currentCoords}>
               <Popup>Ubicación Actual</Popup>
             </Marker>
          )}

          {locationHistory.length > 1 && (
            <Polyline positions={polylinePositions} color="#1A1A1A" weight={4} opacity={0.7} />
          )}

          {scannedPoints.map((point) => (
            <Marker key={point.id} position={[point.latitude, point.longitude]}>
              <Popup>Punto: {point.data}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </MapWrapper>

      <RecenterBtn onClick={() => {}}>Recentrar</RecenterBtn>
    </Container>
  );
};

export default MapScreen;
