import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
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

const RoleSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const RoleBtn = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${props => props.active ? '#1A1A1A' : '#EEE'};
  background: ${props => props.active ? '#1A1A1A' : 'white'};
  color: ${props => props.active ? 'white' : '#666'};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
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

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserItem = styled.div`
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
`;

const UserMain = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 600;
  color: #1A1A1A;
`;

const UserRole = styled.span`
  font-size: 11px;
  color: #000;
  font-weight: 700;
  text-transform: uppercase;
`;

const UserEmail = styled.span`
  font-size: 12px;
  color: #000;
`;

const AdminScreen = () => {
  const navigate = useNavigate();
  const { addUser } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('guardia');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching users:", err);
    });
    return unsub;
  }, []);

  const handleCreateUser = async () => {
    if (!email || !name) return alert('Completa los campos');
    const res = await addUser(email, password, name, role);
    if (res.success) {
      setEmail('');
      setName('');
      alert('Usuario creado');
    } else alert(res.message);
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Gestión de Usuarios</Title>
      </Header>

      <Content>
        <Card>
          <CardTitle>Nuevo Usuario</CardTitle>
          <Input placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" />
          
          <RoleSelector>
            {['guardia', 'admin', 'director'].map(r => (
              <RoleBtn key={r} active={role === r} onClick={() => setRole(r)}>
                {r.toUpperCase()}
              </RoleBtn>
            ))}
          </RoleSelector>

          <CreateBtn onClick={handleCreateUser}>
            <UserPlus size={18} />
            Crear Usuario
          </CreateBtn>
        </Card>

        <CardTitle>Lista de Usuarios</CardTitle>
        <UserList>
          {users.map(u => (
            <UserItem key={u.id}>
              <UserMain>
                <UserName>{u.name}</UserName>
                <UserRole>{u.role}</UserRole>
              </UserMain>
              <UserEmail>{u.email}</UserEmail>
            </UserItem>
          ))}
        </UserList>
      </Content>
    </Container>
  );
};

export default AdminScreen;
