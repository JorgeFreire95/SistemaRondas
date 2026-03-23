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
        {filteredPoints.map((point) => {
          const installationName = point.installationName || installations[point.installationId] || 'Sistema';
          return (
            <ReportItem 
              key={point.id} 
              onClick={() => navigate('/map', { 
                state: { 
                  roundId: point.roundId,
                  guardName: point.guardName
                } 
              })}
            >
              <IconBox>
                <MapPin size={24} color="#4CAF50" />
              </IconBox>
              <Info>
                <PointData>
                  {point.pointName || point.data}
                </PointData>
              <GuardLabel>
                {point.guardRole ? (
                  <>
                    <span style={{ fontWeight: '800', color: '#1A1A1A' }}>
                      {point.guardRole === 'admin' ? 'Administrador' : 
                       point.guardRole === 'supervisor' ? 'Supervisor' : 
                       point.guardRole === 'cliente' ? 'Cliente' : 'Guardia'}
                    </span>: {point.guardName}
                  </>
                ) : (
                  <strong>{point.guardName}</strong>
                )}
              </GuardLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {installationName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    <Building size={12} /> {installationName}
                  </div>
                )}
                {point.roundTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F3F5', color: '#1A1A1A', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                    <Clock size={12} /> RONDA: {point.roundTime}
                  </div>
                )}
                {!point.roundTime && (
                  <div style={{ color: '#999', fontSize: '10px' }}>Horario no registrado</div>
                )}
              </div>
              {point.question && (
                <div style={{ marginBottom: '12px', padding: '10px', background: '#F8F9FA', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '4px' }}>{point.question}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      background: point.answer === 'SÍ' ? '#E8F5E9' : '#FFF0F0',
                      color: point.answer === 'SÍ' ? '#2E7D32' : '#FF4D4F'
                    }}>{point.answer}</span>
                    {point.observation && <span style={{ fontSize: '12px', color: '#444' }}>- {point.observation}</span>}
                  </div>
                </div>
              )}
              <Meta>
                <MetaItem>
                  <Calendar size={14} />
                  <span>{point.timestamp?.toDate().toLocaleDateString() || '...'}</span>
                </MetaItem>
                <MetaItem>
                  <Clock size={14} />
                  <span>{point.timestamp?.toDate().toLocaleTimeString() || '...'}</span>
                </MetaItem>
              </Meta>
            </Info>
            </ReportItem>
          );
        })}
        {scannedPoints.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>No hay puntos registrados.</p>
        )}
      </List>
    </Container>
  );
};

export default ReportsScreen;
