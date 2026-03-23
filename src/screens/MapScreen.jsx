import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { ChevronLeft, Navigation as NavigationIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
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

const MapEvents = ({ onDrag, shouldFollow, center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldFollow && center) {
      map.setView(center, map.getZoom());
    }
  }, [center, shouldFollow, map]);

  useEffect(() => {
    const handleDrag = () => {
      onDrag();
    };
    map.on('dragstart', handleDrag);
    return () => map.off('dragstart', handleDrag);
  }, [map, onDrag]);

  return null;
};

const MapScreen = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { location, locationHistory, scannedPoints, currentRoundId } = useLocation();
  
  const monitorGuardId = routerLocation.state?.guardId;
  const [monitorData, setMonitorData] = useState(null);
  const [monitorPath, setMonitorPath] = useState([]);
  const [monitorScans, setMonitorScans] = useState([]);
  
  const [shouldFollow, setShouldFollow] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!monitorGuardId) return;

    // Listen to guard's current position and active round
    const unsubUser = onSnapshot(doc(db, 'users', monitorGuardId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMonitorData(data);
      }
    });

    return () => unsubUser();
  }, [monitorGuardId]);

  useEffect(() => {
    if (!monitorGuardId || !monitorData?.activeRoundId) {
      setMonitorPath([]);
      return;
    }

    // Listen to the active round's path
    const q = query(
      collection(db, 'rounds', monitorData.activeRoundId, 'path'),
      orderBy('timestamp', 'asc')
    );
    const unsubPath = onSnapshot(q, (snap) => {
      setMonitorPath(snap.docs.map(d => ({ lat: d.data().lat, lng: d.data().lng })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching monitor path:", err);
    });

    return () => unsubPath();
  }, [monitorGuardId, monitorData?.activeRoundId]);

  useEffect(() => {
    if (!monitorGuardId || !monitorData?.activeRoundId) {
      setMonitorScans([]);
      return;
    }

    // Listen to scanned points for this specific round
    const q = query(
      collection(db, 'scannedPoints'),
      where('roundId', '==', monitorData.activeRoundId)
    );
    const unsubScans = onSnapshot(q, (snap) => {
      const s = snap.docs.map(d => ({ 
        id: d.id, 
        lat: d.data().latitude, 
        lng: d.data().longitude,
        timestamp: d.data().timestamp 
      }));
      // Sort chronologically
      setMonitorScans(s.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0)));
    });

    return () => unsubScans();
  }, [monitorGuardId, monitorData?.activeRoundId]);

  const currentCoords = monitorGuardId 
    ? (monitorData?.currentLat ? [monitorData.currentLat, monitorData.currentLng] : null)
    : (location ? [location.coords.latitude, location.coords.longitude] : null);

  const defaultCenter = [-34.6037, -58.3816];

  const polylinePositions = React.useMemo(() => {
    if (monitorGuardId) {
      return monitorPath.map(p => [p.lat, p.lng]);
    }
    return locationHistory.map(p => [p.lat, p.lng]);
  }, [monitorGuardId, monitorPath, locationHistory]);

  const scanPathPositions = React.useMemo(() => {
    if (monitorGuardId) {
      return monitorScans.map(s => [s.lat, s.lng]);
    }
    // Personal mode: filter current scannedPoints by the active roundId
    if (!currentRoundId) return [];
    
    const activePoints = scannedPoints
      .filter(p => p.roundId === currentRoundId)
      .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
    
    return activePoints.map(p => [p.latitude, p.longitude]);
  }, [monitorGuardId, monitorScans, scannedPoints, currentRoundId]);

  const displayedScannedPoints = React.useMemo(() => {
    if (monitorGuardId) return monitorScans;
    if (!currentRoundId) return [];
    return scannedPoints.filter(p => p.roundId === currentRoundId);
  }, [monitorGuardId, monitorScans, scannedPoints, currentRoundId]);

  const handleDrag = React.useCallback(() => {
    setShouldFollow(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>{monitorGuardId ? `Monitoreo: ${monitorData?.name || 'Guardia'}` : 'Ubicación Real-Time'}</Title>
      </Header>

      <MapWrapper style={{ position: 'relative', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!mapReady ? (
          <div>Cargando mapa...</div>
        ) : (
          <MapContainer 
            center={currentCoords || defaultCenter} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {currentCoords && (
              <MapEvents 
                center={currentCoords}
                shouldFollow={shouldFollow}
                onDrag={handleDrag}
              />
            )}

            {currentCoords && (
               <Marker position={currentCoords}>
                 <Popup>{monitorGuardId ? 'Guardia' : 'Tu ubicación'}</Popup>
               </Marker>
            )}

            {polylinePositions.length > 1 && (
              <Polyline positions={polylinePositions} color="#1A1A1A" weight={3} opacity={0.4} />
            )}

            {scanPathPositions.length > 1 && (
              <Polyline positions={scanPathPositions} color="#4CAF50" weight={5} dashArray="10, 10" />
            )}

            {displayedScannedPoints.map((point) => (
              <Marker key={point.id} position={monitorGuardId ? [point.lat, point.lng] : [point.latitude, point.longitude]}>
                <Popup>Punto: {point.data || 'Escaneado'}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        
        {mapReady && !shouldFollow && (
          <RecenterBtn onClick={() => setShouldFollow(true)}>
            Recentrar y Seguir
          </RecenterBtn>
        )}
      </MapWrapper>
    </Container>
  );
};

export default MapScreen;
