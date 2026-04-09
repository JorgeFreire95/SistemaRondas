import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, LogIn, LogOut, Calendar, Clock, User, Building, Trash2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const ClearBtn = styled.button`
  background: #FFF0F0;
  color: #FF4D4F;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
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
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Content = styled.div`
  padding: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 14px 14px 45px;
  background: white;
  border: 1px solid #EEE;
  border-radius: 14px;
  font-size: 14px;
  outline: none;
  color: #000;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  &:focus { border-color: #000; }
`;

const RecordItem = styled.div`
  background: white;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  border: 1px solid #EEE;
  gap: 15px;
`;

const IconWrapper = styled.div`
  background: ${props => props.$type === 'ingreso' ? '#E8F5E9' : '#FFF0F0'};
  color: ${props => props.$type === 'ingreso' ? '#4CAF50' : '#FF4D4F'};
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RecordInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const RecordName = styled.div`
  font-weight: 800;
  color: #000;
  font-size: 15px;
  margin-bottom: 4px;
`;

const RecordSub = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RecordTime = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const TimeText = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: #1A1A1A;
`;

const DateText = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #888;
`;

const FilterWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const FilterBtn = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: ${props => props.$active ? '#000' : 'white'};
  color: ${props => props.$active ? 'white' : '#666'};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid ${props => props.$active ? '#000' : '#EEE'};
`;

const AdminAttendanceScreen = () => {
  const navigate = useNavigate();
  const [isClearing, setIsClearing] = useState(false);
  const [records, setRecords] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [allSections, setAllSections] = useState({});
  const [usersInfo, setUsersInfo] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');

  useEffect(() => {
    const fetchData = async () => {
      const { data: recData } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
      if (recData) setRecords(recData.map(d => ({
        id: d.id,
        userId: d.user_id,
        userName: d.user_name,
        userRole: d.user_role,
        rut: d.rut,
        type: d.type,
        timestamp: d.created_at,
        assignedInstallationId: d.installation_id,
        assignedInstallationName: d.installation_name,
        assignedSectionId: d.section_id,
        assignedSectionName: d.section_name
      })));

      const { data: instData } = await supabase.from('installations').select('*');
      if (instData) setInstallations(instData);

      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) {
        const uDict = {};
        usersData.forEach(u => { uDict[u.id] = u; });
        setUsersInfo(uDict);
      }

      const { data: secData } = await supabase.from('sections').select('*');
      if (secData) {
        const grouped = {};
        secData.forEach(s => {
          if (!grouped[s.installation_id]) grouped[s.installation_id] = [];
          grouped[s.installation_id].push({ id: s.id, name: s.name });
        });
        setAllSections(grouped);
      }
    };
    fetchData();

    const channel = supabase
      .channel('admin-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const filteredRecords = useMemo(() => {
    let filtered = records;
    
    if (filterType !== 'todos') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.userName || '').toLowerCase().includes(low) || 
        (r.rut || '').toLowerCase().includes(low)
      );
    }

    return filtered;
  }, [records, searchTerm, filterType]);

  const formatDate = (timestamp) => {
    if (!timestamp) return { date: '--/--/----', time: '--:--' };
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleClear = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar TODOS los registros de asistencia? Esta acción no se puede deshacer.')) return;
    
    setIsClearing(true);
    try {
      await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('Todos los registros han sido eliminados.');
    } catch (error) {
      console.error("Error clearing attendance records:", error);
      alert('Error al eliminar los registros.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdfDoc = new jsPDF();
    pdfDoc.text("Reporte de Asistencia", 14, 15);
    
    const tableColumn = ["Fecha", "Hora", "Tipo", "Nombre", "RUT", "Instalacion", "Seccion"];
    const tableRows = [];

    filteredRecords.forEach(record => {
      const { date, time } = formatDate(record.timestamp);
      const instId = record.assignedInstallationId || usersInfo[record.userId]?.assigned_installation_id;
      const secId = record.assignedSectionId || usersInfo[record.userId]?.assigned_section_id;

      const instName = record.assignedInstallationName || (instId ? installations.find(i => i.id === instId)?.name : '');
      const secName = record.assignedSectionName || ((instId && secId) ? allSections[instId]?.find(s => s.id === secId)?.name : '');

      const recordData = [
        date,
        time,
        record.type === 'ingreso' ? 'Ingreso' : 'Salida',
        record.userName || 'Usuario',
        record.rut || '',
        instName || 'N/A',
        secName || 'N/A'
      ];
      tableRows.push(recordData);
    });

    autoTable(pdfDoc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0] }
    });

    pdfDoc.save("Reporte_Asistencia.pdf");
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}><ChevronLeft size={20} /></BackBtn>
        <Title>Registro de Asistencia</Title>
        <HeaderActions>
          <ClearBtn onClick={handleClear} disabled={isClearing}>
            <Trash2 size={16} />
            {isClearing ? 'BORRANDO...' : 'LIMPIAR'}
          </ClearBtn>
          <PDFBtn onClick={handleDownloadPDF}>
            REPORTE PDF
          </PDFBtn>
        </HeaderActions>
      </Header>

      <Content>
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <Input 
            placeholder="Buscar por nombre o RUT del guardia..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <FilterWrapper>
          <FilterBtn $active={filterType === 'todos'} onClick={() => setFilterType('todos')}>
            Todos
          </FilterBtn>
          <FilterBtn $active={filterType === 'ingreso'} onClick={() => setFilterType('ingreso')}>
            Ingresos
          </FilterBtn>
          <FilterBtn $active={filterType === 'salida'} onClick={() => setFilterType('salida')}>
            Salidas
          </FilterBtn>
        </FilterWrapper>

        <div>
          {filteredRecords.map(record => {
            const { date, time } = formatDate(record.timestamp);
            
            const instId = record.assignedInstallationId || usersInfo[record.userId]?.assigned_installation_id;
            const secId = record.assignedSectionId || usersInfo[record.userId]?.assigned_section_id;

            const instName = record.assignedInstallationName || (instId ? installations.find(i => i.id === instId)?.name : null);
            const secName = record.assignedSectionName || ((instId && secId) ? allSections[instId]?.find(s => s.id === secId)?.name : null);

            return (
              <RecordItem key={record.id}>
                <IconWrapper $type={record.type}>
                  {record.type === 'ingreso' ? <LogIn size={24} /> : <LogOut size={24} />}
                </IconWrapper>
                <RecordInfo>
                  <RecordName>{record.userName || 'Usuario'}</RecordName>
                  <RecordSub><User size={12}/> RUT: {record.rut}</RecordSub>
                  {instName && (
                    <RecordSub style={{ color: '#2E7D32', marginTop: '4px' }}>
                      <Building size={12}/> Instalación: {instName} {secName ? `(${secName})` : ''}
                    </RecordSub>
                  )}
                </RecordInfo>
                <RecordTime>
                  <TimeText>{time} hrs</TimeText>
                  <DateText>{date}</DateText>
                </RecordTime>
              </RecordItem>
            );
          })}
          {filteredRecords.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 20px', background: 'white', borderRadius: '16px' }}>
              <Calendar size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
              <div>No hay registros de asistencia que coincidan con la búsqueda.</div>
            </div>
          )}
        </div>
      </Content>
    </Container>
  );
};

export default AdminAttendanceScreen;
