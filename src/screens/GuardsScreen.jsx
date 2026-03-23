import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Shield, MapPin, Mail, CreditCard, Building, Trash2, Edit2, History, X, Navigation as NavigationIcon } from 'lucide-react';
import { collection, query, onSnapshot, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

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

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 15px;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #000;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: #F8F9FA;
  border: 1px solid #EEE;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  color: #000000;

  &:focus {
    border-color: #1A1A1A;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: #F8F9FA;
  border: 1px solid #EEE;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  appearance: none;
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
  margin-top: 10px;
  cursor: pointer;
`;

const GuardItem = styled.div`
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GuardInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const GuardName = styled.div`
  font-weight: 700;
  color: #1A1A1A;
`;

const GuardSub = styled.div`
  font-size: 12px;
  color: #000;
  margin-top: 4px;
`;

const GuardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionBtn = styled.button`
  background: ${props => props.$variant === 'danger' ? '#FFF5F5' : '#F8F9FA'};
  color: ${props => props.$variant === 'danger' ? '#FF4D4F' : '#1A1A1A'};
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 20px;
  padding: 24px;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Badge = styled.div`
  background: #E8F5E9;
  color: #2E7D32;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid #C8E6C9;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #4CAF50;
    border-radius: 50%;
    display: inline-block;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.7; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.7; }
  }
`;

const GuardsScreen = () => {
  const navigate = useNavigate();
  const { addUser } = useAuth();
  const [installations, setInstallations] = useState([]);
  const [guards, setGuards] = useState([]);

  // Form states
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [selectedInst, setSelectedInst] = useState('');

  // Editing state
  const [editingGuard, setEditingGuard] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInst, setEditInst] = useState('');

  useEffect(() => {
    // Listen to installations
    const unsubInst = onSnapshot(query(collection(db, 'installations')), (snap) => {
      setInstallations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching installations:", err);
    });

    // Listen to guards
    const qGuards = query(collection(db, 'users'), where('role', '==', 'guardia'));
    const unsubGuards = onSnapshot(qGuards, (snap) => {
      setGuards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching guards:", err);
    });

    return () => {
      unsubInst();
      unsubGuards();
    };
  }, []);

  const handleCreateGuard = async () => {
    if (!name || !rut || !address || !email || !selectedInst) {
      return alert('Completa todos los campos');
    }

    const res = await addUser(email, rut, name, 'guardia', {
      rut,
      address,
      assignedInstallationId: selectedInst
    });

    if (res.success) {
      setName('');
      setRut('');
      setAddress('');
      setEmail('');
      setSelectedInst('');
      alert('Guardia registrado con éxito');
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este guardia?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        alert('Guardia eliminado');
      } catch (err) {
        console.error(err);
        alert('Error al eliminar');
      }
    }
  };

  const openEdit = (g) => {
    setEditingGuard(g);
    setEditName(g.name || '');
    setEditRut(g.rut || '');
    setEditAddress(g.address || '');
    setEditEmail(g.email || '');
    setEditInst(g.assignedInstallationId || '');
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'users', editingGuard.id), {
        name: editName,
        rut: editRut,
        address: editAddress,
        email: editEmail,
        assignedInstallationId: editInst
      });
      setEditingGuard(null);
      alert('Perfil actualizado');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar');
    }
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Gestión de Guardias</Title>
      </Header>

      <Content>
        <Card>
          <CardTitle>Nuevo Guardia</CardTitle>
          
          <InputWrapper>
            <IconWrapper><Shield size={18} /></IconWrapper>
            <Input placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} />
          </InputWrapper>

          <InputWrapper>
            <IconWrapper><CreditCard size={18} /></IconWrapper>
            <Input placeholder="RUT" value={rut} onChange={e => setRut(e.target.value)} />
          </InputWrapper>

          <InputWrapper>
            <IconWrapper><MapPin size={18} /></IconWrapper>
            <Input placeholder="Dirección de domicilio" value={address} onChange={e => setAddress(e.target.value)} />
          </InputWrapper>

          <InputWrapper>
            <IconWrapper><Mail size={18} /></IconWrapper>
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          </InputWrapper>

          <InputWrapper>
            <IconWrapper><Building size={18} /></IconWrapper>
            <Select value={selectedInst} onChange={e => setSelectedInst(e.target.value)}>
              <option value="">Selecciona Instalación</option>
              {installations.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </Select>
          </InputWrapper>
          
          <CreateBtn onClick={handleCreateGuard}>
            <UserPlus size={18} />
            Registrar Guardia
          </CreateBtn>
        </Card>

        <CardTitle>Guardias Registrados</CardTitle>
        <div>
          {guards.map(g => {
            const inst = installations.find(i => i.id === g.assignedInstallationId);
            return (
              <GuardItem key={g.id}>
                <GuardInfo>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <GuardName>{g.name}</GuardName>
                {g.activeRoundId && <Badge>En Ronda</Badge>}
              </div>
                  <GuardSub>{g.email} | RUT: {g.rut}</GuardSub>
                  {inst && <GuardSub>Asignado a: <strong>{inst.name}</strong></GuardSub>}
                </GuardInfo>
                <GuardActions>
                  <ActionBtn onClick={() => navigate('/map', { state: { guardId: g.id } })}>
                    <NavigationIcon size={18} />
                  </ActionBtn>
                  <ActionBtn onClick={() => openEdit(g)}>
                    <Edit2 size={18} />
                  </ActionBtn>
                  <ActionBtn $variant="danger" onClick={() => handleDelete(g.id)}>
                    <Trash2 size={18} />
                  </ActionBtn>
                </GuardActions>
              </GuardItem>
            );
          })}
        </div>
      </Content>

      {editingGuard && (
        <ModalOverlay onClick={() => setEditingGuard(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <CardTitle style={{ marginBottom: 0 }}>Editar Guardia</CardTitle>
              <ActionBtn onClick={() => setEditingGuard(null)}>
                <X size={20} />
              </ActionBtn>
            </ModalHeader>
            <InputWrapper>
              <IconWrapper><Shield size={18} /></IconWrapper>
              <Input placeholder="Nombre Completo" value={editName} onChange={e => setEditName(e.target.value)} />
            </InputWrapper>
            <InputWrapper>
              <IconWrapper><CreditCard size={18} /></IconWrapper>
              <Input placeholder="RUT" value={editRut} onChange={e => setEditRut(e.target.value)} />
            </InputWrapper>
            <InputWrapper>
              <IconWrapper><MapPin size={18} /></IconWrapper>
              <Input placeholder="Dirección" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
            </InputWrapper>
            <InputWrapper>
              <IconWrapper><Mail size={18} /></IconWrapper>
              <Input placeholder="Email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </InputWrapper>
            <InputWrapper>
              <IconWrapper><Building size={18} /></IconWrapper>
              <Select value={editInst} onChange={e => setEditInst(e.target.value)}>
                <option value="">Selecciona Instalación</option>
                {installations.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </Select>
            </InputWrapper>
            <CreateBtn onClick={handleUpdate}>Actualizar Datos</CreateBtn>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default GuardsScreen;
