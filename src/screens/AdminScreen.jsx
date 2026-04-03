import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, UserPlus, Shield, Mail, CreditCard, 
  MapPin, Trash2, Edit2, X, Search, User, Briefcase
} from 'lucide-react';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
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
  position: sticky;
  top: 0;
  z-index: 100;
`;

const BackBtn = styled.button`
  background: #F1F3F5;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  flex: 1;
`;

const Content = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid #EEE;
`;

const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #000;
`;

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 15px;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #000;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 14px 14px 45px;
  background: #F8F9FA;
  border: 2px solid #F1F3F5;
  border-radius: 14px;
  font-size: 14px;
  outline: none;
  color: #000;
  transition: all 0.2s;
  &:focus { border-color: #000; background: #FFF; }
`;

const RoleSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const RoleBtn = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid ${props => props.$active ? '#000' : '#F1F3F5'};
  background: ${props => props.$active ? '#000' : '#F8F9FA'};
  color: ${props => props.$active ? 'white' : '#666'};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
`;

const CreateBtn = styled.button`
  background: #000;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 16px;
  width: 100%;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
  cursor: pointer;
  margin-top: 10px;
`;

const UserItem = styled.div`
  background: white;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #EEE;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 800;
  color: #000;
  font-size: 15px;
`;

const UserRoleBadge = styled.span`
  font-size: 10px;
  font-weight: 900;
  color: white;
  background: ${props => props.role === 'admin' ? '#000' : '#4dabf7'};
  padding: 2px 8px;
  border-radius: 6px;
  margin-left: 8px;
  text-transform: uppercase;
`;

const UserSub = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  font-weight: 500;
`;

const UserActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionBtn = styled.button`
  background: ${props => props.$variant === 'danger' ? '#FFF5F5' : '#F8F9FA'};
  color: ${props => props.$variant === 'danger' ? '#FF4D4F' : '#000'};
  border: none;
  padding: 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover { background: ${props => props.$variant === 'danger' ? '#FFEDED' : '#EEE'}; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const Modal = styled.div`
  background: white;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 24px;
  padding: 24px;
  position: relative;
`;

const AdminScreen = () => {
  const navigate = useNavigate();
  const { addUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('asc'); // 'asc', 'desc'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [rutDv, setRutDv] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');

  // Editing state
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editRutDv, setEditRutDv] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      // Filter out guards if they're managed elsewhere, or show all non-guards
      // The user asked for "gestion de usuario" (likely non-guards)
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = users.filter(u => u.role !== 'guardia'); // User asked for same form BUT without installation, which guards need.

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        (u.name || '').toLowerCase().includes(low) || 
        (u.email || '').toLowerCase().includes(low) ||
        (u.rut || '').toLowerCase().includes(low)
      );
    }

    return filtered.sort((a,b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortBy === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [users, searchTerm, sortBy]);

  const handleCreateUser = async () => {
    if (!email || !name || !rut || !rutDv) return alert('Por favor, completa los campos mínimos (Nombre, Email, RUT completo)');
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    const fullRut = `${rut.trim()}-${rutDv.trim().toUpperCase()}`;

    const res = await addUser(email, rut.trim(), name, role, { 
      rut: fullRut, 
      address,
      createdAt: new Date().toISOString()
    });

    if (res.success) {
      setEmail(''); setName(''); setRut(''); setRutDv(''); setAddress('');
      alert('Usuario ' + role + ' creado con éxito');
    } else {
      let msg = res.message;
      if (msg.includes('email-already-in-use')) {
        msg = 'ESTE EMAIL YA ESTÁ REGISTRADO EN EL SISTEMA. Verifica en la consola de Firebase si el usuario existe en Authentication pero no en la base de datos.';
      }
      alert('Error: ' + msg);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (uid) => {
    if (window.confirm('¿Eliminar este usuario de forma permanente?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        alert('Usuario eliminado');
      } catch (err) { console.error(err); alert('Error al eliminar'); }
    }
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setEditName(u.name || '');
    
    if (u.rut && u.rut.includes('-')) {
      const parts = u.rut.split('-');
      setEditRut(parts[0]);
      setEditRutDv(parts[1]);
    } else {
      setEditRut(u.rut || '');
      setEditRutDv('');
    }

    setEditAddress(u.address || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'admin');
  };

  const handleUpdate = async () => {
    try {
      const fullRut = `${editRut.trim()}-${editRutDv.trim().toUpperCase()}`;
      await updateDoc(doc(db, 'users', editingUser.uid), {
        name: editName,
        rut: fullRut,
        address: editAddress,
        email: editEmail,
        role: editRole
      });
      setEditingUser(null);
      alert('Usuario actualizado');
    } catch (err) { console.error(err); alert('Error al actualizar'); }
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}><ChevronLeft size={20} /></BackBtn>
        <Title>Gestión de Administradores</Title>
      </Header>

      <Content>
        <Card>
          <CardTitle>Añadir Nuevo Administrador</CardTitle>
          
          <InputWrapper>
            <IconWrapper><User size={18} /></IconWrapper>
            <Input placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} />
          </InputWrapper>

          <InputWrapper style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <IconWrapper><CreditCard size={18} /></IconWrapper>
              <Input placeholder="RUT (Sin dígito)" value={rut} onChange={e => setRut(e.target.value)} style={{ marginBottom: 0 }} />
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
            <Input placeholder="Email corporativo" value={email} onChange={e => setEmail(e.target.value)} />
          </InputWrapper>
          
          <CreateBtn onClick={handleCreateUser} disabled={isSubmitting}>
            <UserPlus size={20} /> {isSubmitting ? 'REGISTRANDO...' : 'Registrar Administrador'}
          </CreateBtn>
        </Card>

        <CardTitle>Administradores Registrados (Admins / Directores)</CardTitle>
        
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
              style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #EEE', fontSize: '12px', fontWeight: '700' }}
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
          </div>
        </div>

        <div>
          {sortedAndFilteredUsers.map(u => (
            <UserItem key={u.uid}>
              <UserInfo>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <UserName>{u.name}</UserName>
                  <UserRoleBadge role={u.role}>{u.role}</UserRoleBadge>
                </div>
                <UserSub>{u.email} | RUT: {u.rut || 'N/A'}</UserSub>
              </UserInfo>
              <UserActions>
                <ActionBtn onClick={() => openEdit(u)}><Edit2 size={18} /></ActionBtn>
                <ActionBtn $variant="danger" onClick={() => handleDelete(u.uid)}><Trash2 size={18} /></ActionBtn>
              </UserActions>
            </UserItem>
          ))}
          {sortedAndFilteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No se encontraron usuarios</div>
          )}
        </div>
      </Content>

      {editingUser && (
        <ModalOverlay onClick={() => setEditingUser(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <CardTitle style={{ marginBottom: 0 }}>Editar Usuario</CardTitle>
              <ActionBtn onClick={() => setEditingUser(null)}><X size={20} /></ActionBtn>
            </ModalHeader>
            <InputWrapper>
              <IconWrapper><User size={18} /></IconWrapper>
              <Input placeholder="Nombre" value={editName} onChange={e => setEditName(e.target.value)} />
            </InputWrapper>
            <InputWrapper style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <IconWrapper><CreditCard size={18} /></IconWrapper>
                <Input placeholder="RUT (Sin dígito)" value={editRut} onChange={e => setEditRut(e.target.value)} style={{ marginBottom: 0 }} />
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
            <CreateBtn onClick={handleUpdate}>Actualizar Datos</CreateBtn>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default AdminScreen;
