import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Shield, MapPin, Mail, CreditCard, Building, Trash2, Edit2, History, X, Navigation as NavigationIcon, Search } from 'lucide-react';
import { supabase } from '../config/supabase';
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
  const { addUser, user } = useAuth();
  const [installations, setInstallations] = useState([]);
  const [guards, setGuards] = useState([]);
  const [allSections, setAllSections] = useState({}); // { instId: [sections] }

  // Form states
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [rutDv, setRutDv] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [selectedInst, setSelectedInst] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sortBy, setSortBy] = useState('asc'); // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingGuard, setEditingGuard] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editRutDv, setEditRutDv] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInst, setEditInst] = useState('');
  const [editSectionId, setEditSectionId] = useState('');

  useEffect(() => {
    const fetchInstallations = async () => {
      const { data } = await supabase.from('installations').select('*');
      if (data) setInstallations(data.map(d => ({ id: d.id, name: d.name, address: d.address, region: d.region, comuna: d.comuna })));
    };
    fetchInstallations();

    const fetchGuards = async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'guardia');
      if (data) setGuards(data.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        rut: d.rut,
        dv: d.dv,
        address: d.address,
        assignedInstallationId: d.assigned_installation_id,
        assignedSectionId: d.assigned_section_id,
        activeRoundId: d.active_round_id
      })));
    };
    fetchGuards();

    const channel = supabase
      .channel('guards-screen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchGuards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'installations' }, () => fetchInstallations())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (installations.length === 0) return;
    const fetchAllSections = async () => {
      const { data } = await supabase.from('sections').select('*').order('created_at', { ascending: true });
      if (data) {
        const grouped = {};
        data.forEach(s => {
          if (!grouped[s.installation_id]) grouped[s.installation_id] = [];
          grouped[s.installation_id].push({ id: s.id, name: s.name });
        });
        setAllSections(grouped);
      }
    };
    fetchAllSections();
  }, [installations]);

  // Sections for creation form (reactive to selectedInst)
  const sections = allSections[selectedInst] || [];

  // Sections for editing form (reactive to editInst)
  const editSections = allSections[editInst] || [];

  const sortedGuards = React.useMemo(() => {
    let filtered = [...guards];

    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(g => 
        (g.name || '').toLowerCase().includes(lowSearch) ||
        (g.email || '').toLowerCase().includes(lowSearch) ||
        (g.rut || '').toLowerCase().includes(lowSearch)
      );
    }

    return filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (sortBy === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
  }, [guards, sortBy, searchTerm]);

  const handleCreateGuard = async () => {
    if (!name || !rut || !rutDv || !address || !email || !selectedInst) {
      return alert('Completa todos los campos');
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const res = await addUser(email, rut.trim(), name, 'guardia', {
      rut: rut.trim(),
      dv: rutDv.trim().toUpperCase(),
      address,
      assignedInstallationId: selectedInst,
      assignedSectionId: selectedSectionId || null
    });

    if (res.success) {
      setName('');
      setRut('');
      setRutDv('');
      setAddress('');
      setEmail('');
      setSelectedInst('');
      setSelectedSectionId('');
      alert('Guardia registrado con éxito');
    } else {
      let msg = res.message;
      if (msg.includes('email-already-in-use')) {
        msg = 'ESTE EMAIL YA ESTÁ REGISTRADO EN EL SISTEMA. Verifica en la consola de Firebase si el usuario existe en Authentication pero no en la base de datos.';
      }
      alert('Error: ' + msg);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este guardia?')) {
      try {
        await supabase.from('users').delete().eq('id', id);
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
    
    if (g.rut && g.rut.includes('-')) {
      const parts = g.rut.split('-');
      setEditRut(parts[0]);
      setEditRutDv(parts[1]);
    } else {
      setEditRut(g.rut || '');
      setEditRutDv('');
    }

    setEditAddress(g.address || '');
    setEditEmail(g.email || '');
    setEditInst(g.assignedInstallationId || '');
    setEditSectionId(g.assignedSectionId || '');
  };

  const handleUpdate = async () => {
    try {
      await supabase.from('users').update({
        name: editName,
        rut: editRut.trim(),
        dv: editRutDv.trim().toUpperCase(),
        address: editAddress,
        email: editEmail,
        assigned_installation_id: editInst,
        assigned_section_id: editSectionId || null
      }).eq('id', editingGuard.id);
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
        {(user?.role !== 'supervisor' && user?.role !== 'cliente') && (
          <Card>
            <CardTitle>Nuevo Guardia</CardTitle>
            
            <InputWrapper>
              <IconWrapper><Shield size={18} /></IconWrapper>
              <Input placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} />
            </InputWrapper>

            <InputWrapper style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <IconWrapper><CreditCard size={18} /></IconWrapper>
                <Input placeholder="RUT (Sin dígito)" value={rut} onChange={e => setRut(e.target.value.replace(/\D/g, ''))} style={{ marginBottom: 0 }} />
              </div>
              <Input 
                placeholder="DV" 
                value={rutDv} 
                onChange={e => setRutDv(e.target.value)} 
                maxLength={1}
                style={{ width: '80px', marginBottom: 0 }} 
              />
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

            <InputWrapper>
              <IconWrapper><Building size={18} /></IconWrapper>
              <Select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedInst}>
                <option value="">Selecciona Sección (Opcional)</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </Select>
            </InputWrapper>
            
            <CreateBtn onClick={handleCreateGuard} disabled={isSubmitting}>
              <UserPlus size={18} />
              {isSubmitting ? 'REGISTRANDO...' : 'Registrar Guardia'}
            </CreateBtn>
          </Card>
        )}

        <CardTitle style={{ marginBottom: '15px' }}>Guardias Registrados</CardTitle>
        
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <Input 
            placeholder="Buscar por nombre, RUT o email..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', marginBottom: 0 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>ORDENAR:</span>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '11px', fontWeight: '600', background: 'white' }}
            >
              <option value="asc">A-Z (Ascendente)</option>
              <option value="desc">Z-A (Descendente)</option>
            </select>
          </div>
        </div>
        <div>
          {sortedGuards.map(g => {
            const inst = installations.find(i => i.id === g.assignedInstallationId);
            return (
              <GuardItem key={g.id}>
                <GuardInfo>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <GuardName>{g.name}</GuardName>
                {g.activeRoundId && <Badge>En Ronda</Badge>}
              </div>
                  <GuardSub>{g.email} | RUT: {g.rut}{g.dv ? `-${g.dv}` : ''}</GuardSub>
                  {inst && (
                    <GuardSub>
                      Asignado a: <strong>{inst.name}</strong> 
                      {g.assignedSectionId && (
                        <> - { (allSections[inst.id]?.find(s => s.id === g.assignedSectionId)?.name) || 'Punto de control' }</>
                      )}
                    </GuardSub>
                  )}
                </GuardInfo>
                <GuardActions>
                  <ActionBtn onClick={() => navigate('/map', { state: { guardId: g.id } })}>
                    <NavigationIcon size={18} />
                  </ActionBtn>
                  { (user?.role !== 'supervisor' && user?.role !== 'cliente') && (
                    <>
                      <ActionBtn onClick={() => openEdit(g)}>
                        <Edit2 size={18} />
                      </ActionBtn>
                      <ActionBtn $variant="danger" onClick={() => handleDelete(g.id)}>
                        <Trash2 size={18} />
                      </ActionBtn>
                    </>
                  )}
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
            <InputWrapper style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <IconWrapper><CreditCard size={18} /></IconWrapper>
                <Input placeholder="RUT (Sin dígito)" value={editRut} onChange={e => setEditRut(e.target.value.replace(/\D/g, ''))} style={{ marginBottom: 0 }} />
              </div>
              <Input 
                placeholder="DV" 
                value={editRutDv} 
                onChange={e => setEditRutDv(e.target.value)} 
                maxLength={1}
                style={{ width: '80px', marginBottom: 0 }} 
              />
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

            <InputWrapper>
              <IconWrapper><Building size={18} /></IconWrapper>
              <Select value={editSectionId} onChange={e => setEditSectionId(e.target.value)} disabled={!editInst}>
                <option value="">Selecciona Sección (Opcional)</option>
                {editSections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
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
