import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ChevronLeft, Building, MapPin, Trash2, Edit2, Clock, X, Plus, Search, Scan, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
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

const CHILE_REGIONS = [
  { region: "Arica y Parinacota", communes: ["Arica", "Camarones", "Putre", "General Lagos"] },
  { region: "Tarapacá", communes: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"] },
  { region: "Antofagasta", communes: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"] },
  { region: "Atacama", communes: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"] },
  { region: "Coquimbo", communes: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"] },
  { region: "Valparaíso", communes: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"] },
  { region: "Metropolitana de Santiago", communes: ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"] },
  { region: "Libertador Gral. B. O'Higgins", communes: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"] },
  { region: "Maule", communes: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"] },
  { region: "Ñuble", communes: ["Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"] },
  { region: "Biobío", communes: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualpén", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"] },
  { region: "La Araucanía", communes: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"] },
  { region: "Los Ríos", communes: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"] },
  { region: "Los Lagos", communes: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"] },
  { region: "Aysén del Gral. C. Ibañez del Campo", communes: ["Coyhaique", "Lago Verde", "Aisén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"] },
  { region: "Magallanes y de la Antártica Chilena", communes: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"] }
];

const Select = styled.select`
  width: 100%;
  padding: 12px;
  background: #F8F9FA;
  border: 1px solid #EEE;
  border-radius: 10px;
  margin-bottom: 15px;
  font-size: 14px;
  outline: none;
  color: #000000;
  &:focus { border-color: #1A1A1A; }
`;

const ScannerOverlayWrapper = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  z-index: 3000;
`;

const ScannerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  z-index: 10;
`;

const ScannerContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000;
  video {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

const ScannerBoxOverlay = styled.div`
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 250px; height: 250px;
  border: 3px solid #1A1A1A;
  border-radius: 12px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
`;

const GalleryBtnContainer = styled.div`
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  background: white;
  padding: 20px;
  border-radius: 20px 20px 0 0;
  z-index: 10;
  display: flex;
  justify-content: center;
`;

const ScannerActionBtn = styled.button`
  background: #1A1A1A;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InstallationsScreen = () => {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState([]);
  const [instName, setInstName] = useState('');
  const [instRegion, setInstRegion] = useState('');
  const [instComuna, setInstComuna] = useState('');
  const [instStreet, setInstStreet] = useState('');
  const [instNumber, setInstNumber] = useState('');

  // Editing state
  const [editingInst, setEditingInst] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editComuna, setEditComuna] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');

  // Sub-collections management
  const [showPointsModal, setShowPointsModal] = useState(null);
  const [pointsList, setPointsList] = useState([]);
  const [newPoint, setNewPoint] = useState('');
  const [newPointQR, setNewPointQR] = useState('');
  const [newPointQuestion, setNewPointQuestion] = useState('');

  const [sortBy, setSortBy] = useState('name'); // 'name', 'region', 'comuna'
  const [searchTerm, setSearchTerm] = useState('');

  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [schedulesList, setSchedulesList] = useState([]);
  const [newSchedule, setNewSchedule] = useState('');

  const [showSectionsModal, setShowSectionsModal] = useState(null);
  const [sectionsList, setSectionsList] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [isScanningAdmin, setIsScanningAdmin] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);

  useEffect(() => {
    const unsubInst = onSnapshot(collection(db, 'installations'), (snap) => {
      setInstallations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Error fetching installations:", err);
      alert("Error cargando instalaciones: " + err.message);
    });
    return unsubInst;
  }, []);

  const sortedInstallations = React.useMemo(() => {
    let filtered = [...installations];
    
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(lowSearch) ||
        i.region.toLowerCase().includes(lowSearch) ||
        i.comuna.toLowerCase().includes(lowSearch) ||
        i.address.toLowerCase().includes(lowSearch)
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'region') return a.region.localeCompare(b.region);
      if (sortBy === 'comuna') return a.comuna.localeCompare(b.comuna);
      return 0;
    });
  }, [installations, sortBy, searchTerm]);

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

  // Fetch sections when schedules modal opens
  useEffect(() => {
    if (!showScheduleModal) return;
    const q = query(collection(db, 'installations', showScheduleModal.id, 'sections'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setSectionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [showScheduleModal]);

  // Listen to sections when modal opens
  useEffect(() => {
    if (!showSectionsModal) return;
    const q = query(collection(db, 'installations', showSectionsModal.id, 'sections'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setSectionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [showSectionsModal]);

  // Also fetch sections when points modal opens
  useEffect(() => {
    if (!showPointsModal) return;
    const q = query(collection(db, 'installations', showPointsModal.id, 'sections'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setSectionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [showPointsModal]);

  const handleCreateInstallation = async () => {
    if (!instName || !instRegion || !instComuna || !instStreet || !instNumber) {
      return alert('Completa todos los campos de la instalación');
    }

    try {
      await addDoc(collection(db, 'installations'), {
        name: instName,
        region: instRegion,
        comuna: instComuna,
        street: instStreet,
        number: instNumber,
        address: `${instStreet} ${instNumber}`,
        createdAt: serverTimestamp()
      });
      setInstName('');
      setInstRegion('');
      setInstComuna('');
      setInstStreet('');
      setInstNumber('');
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
    setEditRegion(inst.region);
    setEditComuna(inst.comuna || '');
    setEditStreet(inst.street || inst.address?.split(' ').slice(0, -1).join(' ') || '');
    setEditNumber(inst.number || inst.address?.split(' ').slice(-1)[0] || '');
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'installations', editingInst.id), {
        name: editName,
        region: editRegion,
        comuna: editComuna,
        street: editStreet,
        number: editNumber,
        address: `${editStreet} ${editNumber}`
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
      return alert('Asigna un nombre y un código para el punto');
    }
    await addDoc(collection(db, 'installations', showPointsModal.id, 'markingPoints'), {
      name: newPoint,
      qrCode: newPointQR,
      question: newPointQuestion,
      sectionId: selectedSectionId || null,
      createdAt: serverTimestamp()
    });
    setNewPoint('');
    setNewPointQR('');
    setNewPointQuestion('');
    setSelectedSectionId('');
  };

  const handleDeletePoint = async (pointId) => {
    await deleteDoc(doc(db, 'installations', showPointsModal.id, 'markingPoints', pointId));
  };

  const handleAddSchedule = async () => {
    await addDoc(collection(db, 'installations', showScheduleModal.id, 'schedules'), {
      time: newSchedule,
      sectionId: selectedSectionId || null,
      createdAt: serverTimestamp()
    });
    setNewSchedule('');
    setSelectedSectionId('');
  };

  const handleDeleteSchedule = async (schedId) => {
    await deleteDoc(doc(db, 'installations', showScheduleModal.id, 'schedules', schedId));
  };

  const handleAddSection = async () => {
    if (!newSectionName) return;
    await addDoc(collection(db, 'installations', showSectionsModal.id, 'sections'), {
      name: newSectionName,
      createdAt: serverTimestamp()
    });
    setNewSectionName('');
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm('¿Eliminar esta sección? Los puntos asociados quedarán sin sección.')) {
      await deleteDoc(doc(db, 'installations', showSectionsModal.id, 'sections', sectionId));
    }
  };

  const startScanner = async () => {
    setIsScanningAdmin(true);
    setTimeout(async () => {
      if (Capacitor.isNativePlatform()) {
        const perms = await CapacitorCamera.checkPermissions();
        if (perms.camera !== 'granted') {
          const req = await CapacitorCamera.requestPermissions();
          if (req.camera !== 'granted') {
            alert('Se requiere acceso a la cámara para escanear puntos.');
            setIsScanningAdmin(false);
            return;
          }
        }
      }

      const qrCode = new Html5Qrcode('admin-scanner', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      });
      setScannerInstance(qrCode);

      const onScanSuccess = (decodedText) => {
        qrCode.stop().then(() => {
          qrCode.clear();
          setNewPointQR(decodedText);
          setIsScanningAdmin(false);
          setScannerInstance(null);
        }).catch(console.error);
      };

      try {
        await qrCode.start(
          { facingMode: "environment" },
          { fps: 15, aspectRatio: 1.0 },
          onScanSuccess
        );
      } catch (err) {
        console.error("Error starting QR Code scanner:", err);
      }
    }, 200);
  };

  const closeScanner = () => {
    if (scannerInstance && scannerInstance.isScanning) {
      scannerInstance.stop().then(() => {
        scannerInstance.clear();
      }).catch(console.error);
    }
    setIsScanningAdmin(false);
    setScannerInstance(null);
  };

  useEffect(() => {
    if (!isScanningAdmin && scannerInstance?.isScanning) {
      scannerInstance.stop().catch(console.error);
    }
    return () => {
      if (scannerInstance?.isScanning) {
        scannerInstance.stop().catch(console.error);
      }
    };
  }, [isScanningAdmin, scannerInstance]);

  const handleAdminImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("admin-reader-hidden");
      const decodedText = await html5QrCode.scanImage(file, true);
      setNewPointQR(decodedText);
      closeScanner();
    } catch (err) {
      alert("No se detectó ningún código en la imagen.");
    }
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
          
          <Select value={instRegion} onChange={e => { setInstRegion(e.target.value); setInstComuna(''); }}>
            <option value="">Seleccione Región</option>
            {CHILE_REGIONS.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
          </Select>

          <Select value={instComuna} onChange={e => setInstComuna(e.target.value)} disabled={!instRegion}>
            <option value="">Seleccione Comuna</option>
            {instRegion && CHILE_REGIONS.find(r => r.region === instRegion)?.communes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Input style={{ flex: 2 }} placeholder="Dirección (Calle)" value={instStreet} onChange={e => setInstStreet(e.target.value)} />
            <Input style={{ flex: 1 }} placeholder="Número" value={instNumber} onChange={e => setInstNumber(e.target.value)} />
          </div>
          
          <CreateBtn onClick={handleCreateInstallation}>
            <Building size={18} />
            Registrar Instalación
          </CreateBtn>
        </Card>

        <CardTitle style={{ marginBottom: '15px' }}>Instalaciones Registradas</CardTitle>
        
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <Input 
            placeholder="Buscar por nombre, región o comuna..." 
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
              style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '11px', fontWeight: '600' }}
            >
              <option value="name">Nombre</option>
              <option value="region">Región</option>
              <option value="comuna">Comuna</option>
            </select>
          </div>
        </div>
        <div>
          {sortedInstallations.map(i => (
            <InstallationItem key={i.id}>
              <InstName>{i.name}</InstName>
              <InstLoc>
                <MapPin size={14} />
                {i.address}, {i.comuna}, {i.region}
              </InstLoc>
              <InstActions>
                <ActionBtn onClick={() => setShowSectionsModal(i)}>
                  <Plus size={16} /> Secciones
                </ActionBtn>
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
            
            <Select value={editRegion} onChange={e => { setEditRegion(e.target.value); setEditComuna(''); }}>
              <option value="">Seleccione Región</option>
              {CHILE_REGIONS.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
            </Select>

            <Select value={editComuna} onChange={e => setEditComuna(e.target.value)} disabled={!editRegion}>
              <option value="">Seleccione Comuna</option>
              {editRegion && CHILE_REGIONS.find(r => r.region === editRegion)?.communes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Input style={{ flex: 2 }} placeholder="Calle" value={editStreet} onChange={e => setEditStreet(e.target.value)} />
              <Input style={{ flex: 1 }} placeholder="N°" value={editNumber} onChange={e => setEditNumber(e.target.value)} />
            </div>

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
                  placeholder="Código de QR escaneado..." 
                  value={newPointQR} 
                  onChange={e => setNewPointQR(e.target.value)}
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <ActionBtn onClick={startScanner} style={{ flex: 'none', background: '#1A1A1A', color: 'white', height: '100%', padding: '12px' }}>
                  <Scan size={20} />
                </ActionBtn>
              </div>

              <Input 
                placeholder="Pregunta (ej: ¿Está cerrado?)" 
                value={newPointQuestion} 
                onChange={e => setNewPointQuestion(e.target.value)} 
                style={{ marginBottom: 0 }}
              />

              <Select 
                value={selectedSectionId} 
                onChange={e => setSelectedSectionId(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="">Sin Sección (Opcional)</option>
                {sectionsList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>

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
                    {p.sectionId && (
                      <div style={{ fontSize: '11px', color: '#1A1A1A', fontWeight: '600' }}>
                        Sección: {sectionsList.find(s => s.id === p.sectionId)?.name || 'Cargando...'}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: '#999' }}>Código: {p.qrCode}</div>
                    {p.photoUrl && (
                      <div style={{ marginTop: '8px', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={p.photoUrl} alt="Punto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input 
                  type="time" 
                  value={newSchedule} 
                  onChange={e => setNewSchedule(e.target.value)} 
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <ActionBtn onClick={handleAddSchedule} style={{ flex: 'none', background: '#1A1A1A', color: 'white' }}>
                  <Plus size={20} />
                </ActionBtn>
              </div>
              <Select 
                value={selectedSectionId} 
                onChange={e => setSelectedSectionId(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="">Sección (Opcional)</option>
                {sectionsList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <SubList>
              {schedulesList.map(s => (
                <SubItem key={s.id}>
                  <div>
                    <SubText>{s.time} hrs</SubText>
                    {s.sectionId && (
                      <div style={{ fontSize: '11px', color: '#1A1A1A', fontWeight: '600' }}>
                        Sección: {sectionsList.find(sec => sec.id === s.sectionId)?.name || 'Cargando...'}
                      </div>
                    )}
                  </div>
                  <IconButton onClick={() => handleDeleteSchedule(s.id)}><Trash2 size={16}/></IconButton>
                </SubItem>
              ))}
              {schedulesList.length === 0 && <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>No hay horarios registrados</div>}
            </SubList>
          </Modal>
        </ModalOverlay>
      )}

      {/* Sections Modal */}
      {showSectionsModal && (
        <ModalOverlay onClick={() => setShowSectionsModal(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <CardTitle style={{ marginBottom: 0 }}>Secciones: {showSectionsModal.name}</CardTitle>
              <ActionBtn style={{ flex: 'none' }} onClick={() => setShowSectionsModal(null)}><X size={20}/></ActionBtn>
            </ModalHeader>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input 
                placeholder="Nombre de la sección (ej: Bodgas Norte)" 
                value={newSectionName} 
                onChange={e => setNewSectionName(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
              <ActionBtn onClick={handleAddSection} style={{ flex: 'none', background: '#1A1A1A', color: 'white' }}>
                <Plus size={20} />
              </ActionBtn>
            </div>
            <SubList>
              {sectionsList.map(s => (
                <SubItem key={s.id}>
                  <SubText>{s.name}</SubText>
                  <IconButton onClick={() => handleDeleteSection(s.id)}><Trash2 size={16}/></IconButton>
                </SubItem>
              ))}
              {sectionsList.length === 0 && <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>No hay secciones registradas</div>}
            </SubList>
          </Modal>
        </ModalOverlay>
      )}

      {/* Admin QR Scanner Modal */}
      {isScanningAdmin && (
        <ScannerOverlayWrapper>
          <ScannerHeader>
            <h3 style={{ margin: 0 }}>Escanear QR: {newPoint || 'Nuevo Punto'}</h3>
            <button onClick={closeScanner} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </ScannerHeader>
          
          <ScannerContainer>
            <div id="admin-scanner" style={{ width: '100%', height: '100%' }}></div>
            <ScannerBoxOverlay />
          </ScannerContainer>

          <GalleryBtnContainer>
            <input 
              type="file" 
              accept="image/*" 
              id="admin-file-upload" 
              hidden 
              onChange={handleAdminImageUpload} 
            />
            <ScannerActionBtn onClick={() => document.getElementById('admin-file-upload').click()}>
              <ImageIcon size={20} />
              Seleccionar desde Galería
            </ScannerActionBtn>
          </GalleryBtnContainer>
        </ScannerOverlayWrapper>
      )}
      <div id="admin-reader-hidden" style={{ display: 'none' }}></div>
    </Container>
  );
};

export default InstallationsScreen;
