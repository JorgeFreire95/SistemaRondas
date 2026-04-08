import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Download, Calendar, MapPin, User as UserIcon, Search, Filter } from 'lucide-react';
import { supabase } from '../config/supabase';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  border-bottom: 2px solid #000;
  gap: 15px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const BackBtn = styled.button`
  background: #F1F3F5;
  border: none;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  flex: 1;
  color: #000;
`;

const Content = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const FilterCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid #EEE;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 700;
  color: #666;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #EEE;
  font-size: 15px;
  outline: none;
  width: 100%;
  &:focus { border-color: #000; }
`;

const Select = styled.select`
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #EEE;
  font-size: 15px;
  outline: none;
  width: 100%;
  background: white;
  &:focus { border-color: #000; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const GenerateBtn = styled.button`
  background: #000;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
  transition: transform 0.2s;
  &:active { transform: scale(0.98); }
  &:disabled { background: #CCC; cursor: not-allowed; }
`;

const ResultsInfo = styled.div`
  margin-bottom: 15px;
  font-size: 14px;
  color: #888;
  font-weight: 600;
`;

const PDFScreen = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [installations, setInstallations] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selInst, setSelInst] = useState('all');
  const [selGuard, setSelGuard] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      const { data: instData } = await supabase.from('installations').select('id, name');
      if (instData) {
        const instMap = {};
        instData.forEach(d => instMap[d.id] = d.name);
        setInstallations(instMap);
      }

      const { data: scansData } = await supabase.from('scanned_points').select('*').order('created_at', { ascending: false });
      if (scansData) {
        setScans(scansData.map(d => ({
          id: d.id,
          guardName: d.guard_name,
          guardRole: d.guard_role,
          installationId: d.installation_id,
          installationName: d.installation_name,
          pointName: d.point_name,
          data: d.data,
          roundTime: d.round_time,
          answer: d.answer,
          question: d.question,
          observation: d.observation,
          timestamp: d.created_at
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const uniqueGuards = useMemo(() => {
    return Array.from(new Set(scans.map(p => p.guardName))).sort();
  }, [scans]);

  const filteredData = scans.filter(item => {
    const date = item.timestamp ? new Date(item.timestamp) : null;
    if (!date) return false;

    const itemDateStr = date.toISOString().split('T')[0];
    const isInDateRange = itemDateStr >= startDate && itemDateStr <= endDate;
    const matchesInst = selInst === 'all' || item.installationId === selInst;
    const matchesGuard = selGuard === 'all' || item.guardName === selGuard;

    return isInDateRange && matchesInst && matchesGuard;
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Reporte de Rondas de Seguridad", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Rango: ${startDate} al ${endDate}`, 14, 35);

    // Table
    const tableColumn = ["Fecha/Hora", "Guardia", "Instalación", "Punto", "Ronda", "Respuesta", "Obs."];
    const tableRows = [];

    filteredData.forEach(item => {
      const roleLabel = item.guardRole === 'admin' ? '(Adm.)' : 
                        item.guardRole === 'supervisor' ? '(Superv.)' : 
                        item.guardRole === 'cliente' ? '(Cli.)' : 
                        item.guardRole === 'director' ? '(Dir.)' : '';
      
      const rowData = [
        item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A',
        `${item.guardName || 'N/A'} ${roleLabel}`,
        item.installationName || installations[item.installationId] || 'N/A',
        item.pointName || item.data || 'N/A',
        item.roundTime || 'N/A',
        item.answer || (item.question ? 'Sin resp.' : '-'),
        item.observation || '-',
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        6: { cellWidth: 'auto' }
      }
    });

    const fileName = `Reporte_Rondas_${startDate}_${endDate}.pdf`;

    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          const base64Data = doc.output('datauristring').split(',')[1];
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          await Share.share({
            title: 'Reporte de Rondas',
            text: 'Aquí está tu reporte PDF de rondas de seguridad.',
            url: result.uri,
            dialogTitle: 'Compartir o Guardar PDF'
          });
        } catch (err) {
          console.error("Error nativo al guardar PDF:", err);
          alert("Error al intentar abrir el PDF en el dispositivo: " + err.message);
        }
      })();
    } else {
      doc.save(fileName);
    }
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ChevronLeft size={24} color="#000" />
        </BackBtn>
        <Title>Generar Reporte PDF</Title>
      </Header>

      <Content>
        <FilterCard>
          <Grid>
            <div>
              <Label><Calendar size={14} /> Desde</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div>
              <Label><Calendar size={14} /> Hasta</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </Grid>

          <Grid>
            <div>
              <Label><MapPin size={14} /> Instalación</Label>
              <Select value={selInst} onChange={(e) => setSelInst(e.target.value)}>
                <option value="all">Todas</option>
                {Object.keys(installations).map(id => (
                  <option key={id} value={id}>{installations[id]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label><UserIcon size={14} /> Guardia</Label>
              <Select value={selGuard} onChange={(e) => setSelGuard(e.target.value)}>
                <option value="all">Todos</option>
                {uniqueGuards.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </div>
          </Grid>

          <GenerateBtn 
            onClick={generatePDF} 
            disabled={filteredData.length === 0}
          >
            <Download size={20} />
            DESCARGAR PDF ({filteredData.length})
          </GenerateBtn>
        </FilterCard>

        {loading ? (
          <ResultsInfo>Cargando datos...</ResultsInfo>
        ) : (
          <ResultsInfo>
            {filteredData.length === 0 
              ? "No se encontraron resultados para los filtros seleccionados." 
              : `Se encontraron ${filteredData.length} marcaciones.`}
          </ResultsInfo>
        )}
      </Content>
    </Container>
  );
};

export default PDFScreen;
