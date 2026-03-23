import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building, MapPin, Trash2, Edit2, Clock, X, Plus, Scan } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
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
`;

const Content = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
`;

const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background: #F8F9FA;
  border: 1px solid #EEE;
  border-radius: 10px;
  margin-bottom: 15px;
  font-size: 14px;
  outline: none;
  color: #000000;

  &:focus {
    border-color: #1A1A1A;
  }
`;

const CreateBtn = styled.button`
  background: #1A1A1A;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px;
  width: 100%;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const InstallationItem = styled.div`
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
`;

const InstName = styled.div`
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 4px;
`;

const InstLoc = styled.div`
  font-size: 13px;
  color: #000;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
`;

const InstActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #F1F3F5;
`;

const ActionBtn = styled.button`
  background: ${props => props.$variant === 'danger' ? '#FFF5F5' : '#F8F9FA'};
  color: ${props => props.$variant === 'danger' ? '#FF4D4F' : '#1A1A1A'};
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$variant === 'danger' ? '#FFEDED' : '#EEE'};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 2000;
`;

const Modal = styled.div`
  background: white;
  width: 100%;
  max-width: 450px;
  border-radius: 24px;
  padding: 24px;
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SubList = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SubItem = styled.div`
  background: #F8F9FA;
  padding: 12px 15px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubText = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #FF4D4F;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const InstallationsScreen = () => {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState([]);
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instComuna, setInstComuna] = useState('');
  const [instRegion, setInstRegion] = useState('');

  // Editing state
  const [editingInst, setEditingInst] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editComuna, setEditComuna] = useState('');
  const [editRegion, setEditRegion] = useState('');

  // Sub-collections management
  const [showPointsModal, setShowPointsModal] = useState(null);
  const [pointsList, setPointsList] = useState([]);
  const [newPoint, setNewPoint] = useState('');
  const [newPointQR, setNewPointQR] = useState('');
  const [newPointQuestion, setNewPointQuestion] = useState('');
  const [isScanningPoint, setIsScanningPoint] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [schedulesList, setSchedulesList] = useState([]);
  const [newSchedule, setNewSchedule] = useState('');

  useEffect(() => {
    const unsubInst = onSnapshot(collection(db, 'installations'), (snap) => {
      setInstallations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching installations:", err);
    });
    return unsubInst;
  }, []);

  // Listen to points when modal opens
  useEffect(() => {
    if (!showPointsModal) return;
    const q = query(collection(db, 'installations', showPointsModal.id, 'markingPoints'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setPointsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [showPointsModal]);

  // Listen to schedules when modal opens
  useEffect(() => {
    if (!showScheduleModal) return;
    const q = query(collection(db, 'installations', showScheduleModal.id, 'schedules'), orderBy('time', 'asc'));
    return onSnapshot(q, (snap) => {
      setSchedulesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [showScheduleModal]);

  const handleCreateInstallation = async () => {
    if (!instName || !instAddress || !instComuna || !instRegion) {
      return alert('Completa todos los campos de la instalación');
    }

    try {
      await addDoc(collection(db, 'installations'), {
        name: instName,
        address: instAddress,
        comuna: instComuna,
        region: instRegion,
        createdAt: serverTimestamp()
      });
      setInstName('');
      setInstAddress('');
      setInstComuna('');
      setInstRegion('');
      alert('Instalación registrada con éxito');
    } catch (e) {
      console.error(e);
      alert('Error al registrar instalación');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta instalación?')) {
      try {
        await deleteDoc(doc(db, 'installations', id));
        alert('Instalación eliminada');
      } catch (err) {
        console.error(err);
        alert('Error al eliminar');
      }
    }
  };

  const openEdit = (inst) => {
    setEditingInst(inst);
    setEditName(inst.name);
    setEditAddress(inst.address);
    setEditComuna(inst.comuna);
    setEditRegion(inst.region);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'installations', editingInst.id), {
        name: editName,
        address: editAddress,
        comuna: editComuna,
        region: editRegion
      });
      setEditingInst(null);
      alert('Instalación actualizada');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar');
    }
  };

  const handleAddPoint = async () => {
    if (!newPoint || !newPointQR) {
      return alert('Asigna un nombre y escanea un código para el punto');
    }
    await addDoc(collection(db, 'installations', showPointsModal.id, 'markingPoints'), {
      name: newPoint,
      qrCode: newPointQR,
      question: newPointQuestion,
      createdAt: serverTimestamp()
    });
    setNewPoint('');
    setNewPointQR('');
    setNewPointQuestion('');
  };

  const startScanner = () => {
    setIsScanningPoint(true);
    // Allow DOM to update
    setTimeout(async () => {
      const qrScanner = new Html5Qrcode('point-scanner');
      try {
        const config = { 
          fps: 15, 
          qrbox: { width: 250, height: 150 }, // Rectangular for barcodes
          aspectRatio: 1.0
        };
        await qrScanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            setNewPointQR(decodedText);
            qrScanner.stop().then(() => {
              qrScanner.clear();
              setIsScanningPoint(false);
            });
          }
        );
        // Store scanner instance to stop it manually if needed
        window._currentScanner = qrScanner;
      } catch (err) {
        console.error(err);
        setIsScanningPoint(false);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (window._currentScanner) {
      window._currentScanner.stop().then(() => {
        window._currentScanner.clear();
        setIsScanningPoint(false);
      });
    } else {
      setIsScanningPoint(false);
    }
  };

  const handleDeletePoint = async (pointId) => {
    await deleteDoc(doc(db, 'installations', showPointsModal.id, 'markingPoints', pointId));
  };

  const handleAddSchedule = async () => {
    if (!newSchedule) return;
    await addDoc(collection(db, 'installations', showScheduleModal.id, 'schedules'), {
      time: newSchedule,
      createdAt: serverTimestamp()
    });
    setNewSchedule('');
  };

  const handleDeleteSchedule = async (schedId) => {
    await deleteDoc(doc(db, 'installations', showScheduleModal.id, 'schedules', schedId));
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Gestión de Instalaciones</Title>
      </Header>

      <Content>
        <Card>
          <CardTitle>Nueva Instalación</CardTitle>
          <Input placeholder="Nombre de la Instalación" value={instName} onChange={e => setInstName(e.target.value)} />
          <Input placeholder="Dirección" value={instAddress} onChange={e => setInstAddress(e.target.value)} />
          <Input placeholder="Comuna" value={instComuna} onChange={e => setInstComuna(e.target.value)} />
          <Input placeholder="Región" value={instRegion} onChange={e => setInstRegion(e.target.value)} />
          
          <CreateBtn onClick={handleCreateInstallation}>
            <Building size={18} />
            Registrar Instalación
          </CreateBtn>
        </Card>

        <CardTitle>Instalaciones Registradas</CardTitle>
        <div>
          {installations.map(i => (
            <InstallationItem key={i.id}>
              <InstName>{i.name}</InstName>
              <InstLoc>
                <MapPin size={14} />
                {i.address}, {i.comuna}, {i.region}
              </InstLoc>
              <InstActions>
                <ActionBtn onClick={() => setShowPointsModal(i)}>
                  <MapPin size={16} /> Puntos
                </ActionBtn>
                <ActionBtn onClick={() => setShowScheduleModal(i)}>
                  <Clock size={16} /> Horas
                </ActionBtn>
                <ActionBtn onClick={() => openEdit(i)}>
                  <Edit2 size={16} />
                </ActionBtn>
                <ActionBtn $variant="danger" onClick={() => handleDelete(i.id)}>
                  <Trash2 size={16} />
                </ActionBtn>
              </InstActions>
            </InstallationItem>
          ))}
        </div>
      </Content>

      {/* Edit Modal */}
      {editingInst && (
        <ModalOverlay onClick={() => setEditingInst(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <CardTitle style={{ marginBottom: 0 }}>Editar Instalación</CardTitle>
              <ActionBtn style={{ flex: 'none' }} onClick={() => setEditingInst(null)}><X size={20}/></ActionBtn>
            </ModalHeader>
            <Input placeholder="Nombre" value={editName} onChange={e => setEditName(e.target.value)} />
            <Input placeholder="Dirección" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
            <Input placeholder="Comuna" value={editComuna} onChange={e => setEditComuna(e.target.value)} />
            <Input placeholder="Región" value={editRegion} onChange={e => setEditRegion(e.target.value)} />
            <CreateBtn onClick={handleUpdate}>Actualizar</CreateBtn>
          </Modal>
        </ModalOverlay>
      )}

      {/* Marking Points Modal */}
      {showPointsModal && (
        <ModalOverlay onClick={() => setShowPointsModal(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <CardTitle style={{ marginBottom: 0 }}>Puntos de Marcague: {showPointsModal.name}</CardTitle>
              <ActionBtn style={{ flex: 'none' }} onClick={() => setShowPointsModal(null)}><X size={20}/></ActionBtn>
            </ModalHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input 
                placeholder="Nombre del punto (ej: Bodega)" 
                value={newPoint} 
                onChange={e => setNewPoint(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input 
                  placeholder="Código QR (escanea abajo)" 
                  value={newPointQR} 
                  readOnly
                  style={{ marginBottom: 0, flex: 1, background: '#EEE' }}
                />
                <ActionBtn onClick={startScanner} style={{ flex: 'none', background: '#1A1A1A', color: 'white' }}>
                  <Scan size={20} />
                </ActionBtn>
              </div>
              
              {isScanningPoint && (
                <div style={{ position: 'relative' }}>
                  <div id="point-scanner" style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}></div>
                  <ActionBtn 
                    onClick={stopScanner} 
                    style={{ 
                      position: 'absolute', 
                      bottom: '10px', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      width: 'auto',
                      background: 'rgba(255,255,255,0.9)',
                      padding: '8px 15px'
                    }}
                  >
                    <X size={16} /> Cancelar Escaneo
                  </ActionBtn>
                </div>
              )}

              <Input 
                placeholder="Pregunta (ej: ¿Está cerrado?)" 
                value={newPointQuestion} 
                onChange={e => setNewPointQuestion(e.target.value)} 
                style={{ marginBottom: 0 }}
              />

              <CreateBtn onClick={handleAddPoint}>
                <Plus size={20} /> Guardar Punto
              </CreateBtn>
            </div>
            <SubList>
              {pointsList.map(p => (
                <SubItem key={p.id}>
                  <div>
                    <SubText>{p.name}</SubText>
                    {p.question && <div style={{ fontSize: '11px', color: '#666' }}>Pregunta: {p.question}</div>}
                    <div style={{ fontSize: '10px', color: '#999' }}>QR: {p.qrCode}</div>
                  </div>
                  <IconButton onClick={() => handleDeletePoint(p.id)}><Trash2 size={16}/></IconButton>
                </SubItem>
              ))}
              {pointsList.length === 0 && <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>No hay puntos registrados</div>}
            </SubList>
          </Modal>
        </ModalOverlay>
      )}

      {/* Schedules Modal */}
      {showScheduleModal && (
        <ModalOverlay onClick={() => setShowScheduleModal(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <CardTitle style={{ marginBottom: 0 }}>Horarios: {showScheduleModal.name}</CardTitle>
              <ActionBtn style={{ flex: 'none' }} onClick={() => setShowScheduleModal(null)}><X size={20}/></ActionBtn>
            </ModalHeader>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input 
                type="time" 
                value={newSchedule} 
                onChange={e => setNewSchedule(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
              <ActionBtn onClick={handleAddSchedule} style={{ flex: 'none', background: '#1A1A1A', color: 'white' }}>
                <Plus size={20} />
              </ActionBtn>
            </div>
            <SubList>
              {schedulesList.map(s => (
                <SubItem key={s.id}>
                  <SubText>{s.time} hrs</SubText>
                  <IconButton onClick={() => handleDeleteSchedule(s.id)}><Trash2 size={16}/></IconButton>
                </SubItem>
              ))}
              {schedulesList.length === 0 && <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>No hay horarios registrados</div>}
            </SubList>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default InstallationsScreen;
