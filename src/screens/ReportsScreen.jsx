import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Clock, User, Building, Trash2 } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, writeBatch, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

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
  flex: 1;
`;

const ClearBtn = styled.button`
  background: #FFF0F0;
  color: #FF4D4F;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.5; }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const PDFBtn = styled.button`
  background: #E8F5E9;
  color: #2E7D32;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;

const FilterBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 20px;
  background: #FFF;
  border-bottom: 2px solid #000;
`;

const FilterSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding: 16px 40px 16px 20px;
  border-radius: 16px;
  border: 3px solid ${props => props.$active ? '#000' : '#EEE'};
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 16px center;
  font-size: 18px;
  font-weight: 900;
  outline: none;
  width: 100%;
  color: #000 !important;
  cursor: pointer;
  transition: all 0.2s ease;
  
  option {
    color: #000 !important;
    background: white;
    font-size: 16px;
  }
  
  &:focus { 
    border-color: #000; 
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
  }
`;

const List = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ReportItem = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  gap: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.06);
    border-color: #000;
  }
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  background: #F0FDF4;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const Info = styled.div`
  flex: 1;
`;

const PointData = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 4px 0;
`;

const GuardLabel = styled.p`
  font-size: 12px;
  color: #000;
  margin: 0 0 12px 0;
`;

const Meta = styled.div`
  display: flex;
  gap: 15px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #000;
`;

const ReportsScreen = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { user } = useAuth();
  const { scannedPoints } = useLocation();
  const [isClearing, setIsClearing] = React.useState(false);
  const [installations, setInstallations] = React.useState({});
  const [selInst, setSelInst] = React.useState('all');
  const [selGuard, setSelGuard] = React.useState('all');
  const filterGuardId = routerLocation.state?.guardId;

  React.useEffect(() => {
    // If we're coming from a specific guard's profile, preset that guard
    if (filterGuardId) {
       const guard = scannedPoints.find(p => p.guardId === filterGuardId);
       if (guard) setSelGuard(guard.guardName);
    }
  }, [filterGuardId, scannedPoints.length]);

  React.useEffect(() => {
    // Fetch all installations to map IDs to Names
    const unsub = onSnapshot(collection(db, 'installations'), (snap) => {
      const instMap = {};
      snap.docs.forEach(doc => {
        instMap[doc.id] = doc.data().name;
      });
      setInstallations(instMap);
    });
    return unsub;
  }, []);

  const handleClear = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar TODOS los reportes? Esta acción no se puede deshacer.')) return;
    
    setIsClearing(true);
    try {
      const q = collection(db, 'scannedPoints');
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      alert('Todos los reportes han sido eliminados.');
    } catch (error) {
      console.error("Error clearing reports:", error);
      alert('Error al eliminar los reportes.');
    } finally {
      setIsClearing(false);
    }
  };

  const uniqueGuards = React.useMemo(() => {
    return Array.from(new Set(scannedPoints.map(p => p.guardName))).sort();
  }, [scannedPoints]);

  const uniqueInstIds = React.useMemo(() => {
    return Array.from(new Set(scannedPoints.map(p => p.installationId))).sort();
  }, [scannedPoints]);

  const filteredPoints = scannedPoints.filter(p => {
    const matchesInst = selInst === 'all' || p.installationId === selInst;
    const matchesGuard = selGuard === 'all' || p.guardName === selGuard;
    return matchesInst && matchesGuard;
  });

  const groupedRounds = React.useMemo(() => {
    const map = new Map();
    filteredPoints.forEach(point => {
      // Use roundId or generate a unique id for offline points without roundId
      const key = point.roundId && point.roundId !== 'no-round' ? point.roundId : `no-round-${point.timestamp?.toDate().getTime()}`;
      
      if (!map.has(key)) {
        map.set(key, {
          roundId: point.roundId,
          guardName: point.guardName,
          guardRole: point.guardRole,
          installationId: point.installationId,
          installationName: point.installationName,
          roundTime: point.roundTime,
          timestamp: point.timestamp,
          points: []
        });
      }
      map.get(key).points.push(point);
    });
    
    // Sort descending by timestamp
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.timestamp?.toDate().getTime() || 0;
      const timeB = b.timestamp?.toDate().getTime() || 0;
      return timeB - timeA;
    });
  }, [filteredPoints]);

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>
          {filterGuardId ? 'Historial del Guardia' : 'Historial de Rondas'}
        </Title>
        {(user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'cliente') && scannedPoints.length > 0 && (
          <HeaderActions>
            {user?.role === 'admin' && (
              <ClearBtn onClick={handleClear} disabled={isClearing}>
                <Trash2 size={18} />
                {isClearing ? 'Borrando...' : 'LIMPIAR'}
              </ClearBtn>
            )}
            <PDFBtn onClick={() => navigate('/pdf-reports')}>
              REPORTE PDF
            </PDFBtn>
          </HeaderActions>
        )}
      </Header>

      <FilterBar>
        <FilterSelect 
          value={selInst} 
          $active={selInst !== 'all'}
          onChange={(e) => setSelInst(e.target.value)}
        >
          <option value="all">📍 Todas las Instalaciones</option>
          {Object.keys(installations).sort((a,b) => installations[a].localeCompare(installations[b])).map(id => (
            <option key={id} value={id}>{installations[id]}</option>
          ))}
        </FilterSelect>

        <FilterSelect 
          value={selGuard} 
          $active={selGuard !== 'all'}
          onChange={(e) => setSelGuard(e.target.value)}
        >
          <option value="all">👤 Todos los Guardias</option>
          {uniqueGuards.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      <List>
        {groupedRounds.map((round) => {
          const installationName = round.installationName || installations[round.installationId] || 'Sistema';
          const timeLabel = round.roundTime ? `RONDA: ${round.roundTime}` : 'Ronda Libre';
          const dateLabel = round.timestamp?.toDate().toLocaleDateString('es-CL');
          const timeGroup = round.timestamp?.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

          return (
            <ReportItem 
              key={round.roundId || round.timestamp?.toDate().getTime()} 
              onClick={() => navigate('/round-details', { 
                state: { 
                  roundId: round.roundId,
                  guardName: round.guardName,
                  points: round.points,
                  roundTime: round.roundTime,
                  installationName
                } 
              })}
            >
              <IconBox>
                <Clock size={24} color="#4CAF50" />
              </IconBox>
              <Info>
                <PointData>
                  {timeLabel}
                </PointData>
              <GuardLabel>
                {round.guardRole ? (
                  <>
                    <span style={{ fontWeight: '800', color: '#1A1A1A' }}>
                      {round.guardRole === 'admin' ? 'Administrador' : 
                       round.guardRole === 'supervisor' ? 'Supervisor' : 
                       round.guardRole === 'cliente' ? 'Cliente' : 'Guardia'}
                    </span>: {round.guardName}
                  </>
                ) : (
                  <strong>{round.guardName}</strong>
                )}
              </GuardLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
                {installationName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    <Building size={12} /> {installationName}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F3F5', color: '#1A1A1A', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                  <MapPin size={12} /> {round.points.length} {round.points.length === 1 ? 'punto registrado' : 'puntos registrados'}
                </div>
              </div>
              <Meta style={{ marginTop: '12px' }}>
                <MetaItem>
                  <Calendar size={14} />
                  <span>{dateLabel || '...'}</span>
                </MetaItem>
                <MetaItem>
                  <Clock size={14} />
                  <span>{timeGroup || '...'}</span>
                </MetaItem>
              </Meta>
            </Info>
            </ReportItem>
          );
        })}
        {groupedRounds.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>No hay rondas registradas.</p>
        )}
      </List>
    </Container>
  );
};

export default ReportsScreen;
