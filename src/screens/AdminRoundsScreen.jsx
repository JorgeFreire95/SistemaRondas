import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building, Search, MapPin, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: white;
  border: 1px solid #EEE;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);

  &:focus {
    border-color: #1A1A1A;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
`;

const InstList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InstCard = styled.div`
  background: white;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
  }
`;

const InstInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrapper = styled.div`
  background: #F1F3F5;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A1A1A;
`;

const InstText = styled.div`
  display: flex;
  flex-direction: column;
`;

const InstName = styled.span`
  font-weight: 700;
  font-size: 15px;
  color: #1A1A1A;
`;

const InstSub = styled.span`
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AdminRoundsScreen = () => {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'installations'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setInstallations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const filtered = installations.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.comuna || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </BackBtn>
        <Title>Realizar Ronda</Title>
      </Header>

      <Content>
        <SearchContainer>
          <SearchIcon><Search size={18} /></SearchIcon>
          <SearchInput 
            placeholder="Buscar instalación..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <InstList>
          {filtered.map(inst => (
            <InstCard key={inst.id} onClick={() => navigate(`/admin-schedules/${inst.id}`)}>
              <InstInfo>
                <IconWrapper><Building size={20} /></IconWrapper>
                <InstText>
                  <InstName>{inst.name}</InstName>
                  <InstSub><MapPin size={12} /> {inst.comuna}, {inst.region}</InstSub>
                </InstText>
              </InstInfo>
              <ChevronRight size={20} color="#CCC" />
            </InstCard>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
              No se encontraron instalaciones.
            </div>
          )}
        </InstList>
      </Content>
    </Container>
  );
};

export default AdminRoundsScreen;
