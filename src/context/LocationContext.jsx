import React, { createContext, useState, useEffect, useContext } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  
  const lastSyncRef = React.useRef({ time: 0, coords: null });

  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [assignedInstData, setAssignedInstData] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [scannedPoints, setScannedPoints] = useState([]);
  const [markingPoints, setMarkingPoints] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [adminInstallationId, setAdminInstallationId] = useState(null);

  const effectiveInstId = adminInstallationId || user?.assignedInstallationId;

  // Fetch scanned points
  useEffect(() => {
    if (!user) return;

    const fetchScannedPoints = async () => {
      const { data, error } = await supabase
        .from('scanned_points')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setScannedPoints(data.map(d => ({
          id: d.id,
          data: d.data,
          pointId: d.point_id,
          pointName: d.point_name,
          question: d.question,
          answer: d.answer,
          observation: d.observation,
          qrCode: d.qr_code,
          photoUrl: d.photo_url,
          latitude: d.latitude,
          longitude: d.longitude,
          guardId: d.guard_id,
          guardName: d.guard_name,
          guardRole: d.guard_role,
          roundId: d.round_id,
          installationId: d.installation_id,
          installationName: d.installation_name,
          roundTime: d.round_time,
          timestamp: d.created_at
        })));
      }
    };

    fetchScannedPoints();

    // Realtime subscription
    const channel = supabase
      .channel('scanned-points')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scanned_points'
      }, () => {
        fetchScannedPoints();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Fetch marking points for assigned installation
  useEffect(() => {
    if (!effectiveInstId || effectiveInstId === 'no-installation') {
      setMarkingPoints([]);
      setLoadingPoints(false);
      return;
    }

    const fetchMarkingPoints = async () => {
      setLoadingPoints(true);
      let query = supabase
        .from('marking_points')
        .select('*')
        .eq('installation_id', effectiveInstId)
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      if (!error && data) {
        let pts = data.map(d => ({
          id: d.id,
          installationId: d.installation_id,
          sectionId: d.section_id,
          name: d.name,
          qrCode: d.qr_code,
          question: d.question,
          createdAt: d.created_at
        }));

        if (user?.role === 'guardia' && user?.assignedSectionId) {
          pts = pts.filter(p => p.sectionId === user.assignedSectionId);
        }

        setMarkingPoints(pts);
      }
      setLoadingPoints(false);
    };

    fetchMarkingPoints();

    const channel = supabase
      .channel('marking-points-' + effectiveInstId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marking_points',
        filter: `installation_id=eq.${effectiveInstId}`
      }, () => {
        fetchMarkingPoints();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [effectiveInstId, user?.assignedSectionId, user?.role]);

  // Fetch sections
  useEffect(() => {
    if (!effectiveInstId || effectiveInstId === 'no-installation') {
      setSections([]);
      return;
    }

    const fetchSections = async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('installation_id', effectiveInstId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        let secs = data.map(d => ({
          id: d.id,
          installationId: d.installation_id,
          name: d.name,
          createdAt: d.created_at
        }));

        if (user?.role === 'guardia' && user?.assignedSectionId) {
          secs = secs.filter(s => s.id === user.assignedSectionId);
        }

        setSections(secs);
      }
    };

    fetchSections();

    const channel = supabase
      .channel('sections-' + effectiveInstId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sections',
        filter: `installation_id=eq.${effectiveInstId}`
      }, () => {
        fetchSections();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [effectiveInstId, user?.assignedSectionId, user?.role]);

  // Fetch assigned installation info
  useEffect(() => {
    if (!effectiveInstId || effectiveInstId === 'no-installation') {
      setAssignedInstData(null);
      return;
    }

    const fetchInst = async () => {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('id', effectiveInstId)
        .single();

      if (!error && data) {
        setAssignedInstData(data);
      }
    };

    fetchInst();
  }, [effectiveInstId]);

  const addScannedPoint = async (data, extra = {}) => {
    if (location && user) {
      try {
        const { data: inserted, error } = await supabase
          .from('scanned_points')
          .insert({
            data,
            point_id: extra.pointId || null,
            point_name: extra.pointName || null,
            question: extra.question || null,
            answer: extra.answer || null,
            observation: extra.observation || null,
            qr_code: extra.qrCode || null,
            photo_url: extra.photoUrl || null,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            guard_id: user.id,
            guard_name: user.name,
            guard_role: user.role,
            round_id: currentRoundId || 'no-round',
            installation_id: effectiveInstId || null,
            installation_name: assignedInstData?.name || 'Sistema',
            round_time: extra.roundTime || roundData?.roundTime || null
          })
          .select('id')
          .single();

        if (error) throw error;
        return inserted.id;
      } catch (e) {
        console.error("Error adding scanned point:", e);
        return null;
      }
    }
    return null;
  };

  // Helper to convert base64 to Blob
  const base64ToBlob = (base64, contentType = 'image/jpeg') => {
    try {
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      return new Blob(byteArrays, { type: contentType });
    } catch (e) {
      console.error("Error converting base64 to blob:", e);
      return null;
    }
  };

  const uploadPointPhoto = async (docId, base64) => {
    if (!docId || !base64 || !user) return null;

    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        const fileName = `evidencias/${Date.now()}_att${attempts}.jpg`;
        const blob = base64ToBlob(base64);
        if (!blob) throw new Error("Could not convert base64 to blob");

        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('evidencias')
          .getPublicUrl(fileName);

        const downloadURL = urlData.publicUrl;

        await supabase
          .from('scanned_points')
          .update({ photo_url: downloadURL, photo_error: null })
          .eq('id', docId);

        return downloadURL;
      } catch (err) {
        console.error(`Attempt ${attempts} failed:`, err);
        if (attempts >= 3) {
          window.alert(`FALLO TOTAL (3 reintentos): ${err.message || 'unknown'}`);
          await supabase
            .from('scanned_points')
            .update({ photo_url: null, photo_error: `failed_after_3_tries` })
            .eq('id', docId);
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    return null;
  };

  // Effect for basic location watching
  useEffect(() => {
    let watchId;

    const startWatching = async () => {
      if (!user) return;

      if (Capacitor.isNativePlatform()) {
        try {
          const perms = await Geolocation.checkPermissions();
          if (perms.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
        } catch (e) {
          console.error("Error checking permissions:", e);
        }
      }

      watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }, (pos) => {
        if (pos) setLocation(pos);
      });
    };

    startWatching();

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  }, [user]);

  // Effect for managing active round status
  useEffect(() => {
    if (isTracking && user) {
      if (currentRoundId) return;

      const startRound = async () => {
        try {
          const { data, error } = await supabase
            .from('rounds')
            .insert({
              guard_id: user.id,
              guard_name: user.name,
              guard_role: user.role,
              status: 'active',
              installation_id: effectiveInstId || null,
              schedule_id: roundData?.scheduleId || null,
              round_time: roundData?.roundTime || null
            })
            .select('id')
            .single();

          if (error) throw error;
          setCurrentRoundId(data.id);

          await supabase
            .from('users')
            .update({ active_round_id: data.id })
            .eq('id', user.id);

          setLocationHistory([]);
        } catch (e) {
          console.error("Error starting round:", e);
        }
      };
      startRound();
    } else if (!isTracking && user) {
      const clearRound = async () => {
        try {
          if (currentRoundId) {
            await supabase
              .from('rounds')
              .update({ end_time: new Date().toISOString(), status: 'completed' })
              .eq('id', currentRoundId);
          }
          await supabase
            .from('users')
            .update({ active_round_id: null })
            .eq('id', user.id);
        } catch (e) {
          console.error("Error clearing round:", e);
        }
      };
      clearRound();
      setCurrentRoundId(null);
      setRoundData(null);
    }
  }, [isTracking, currentRoundId, user]);

  const startNewRound = (scheduleId, roundTime) => {
    setRoundData({ scheduleId, roundTime });
    setIsTracking(true);
  };

  const resumeRound = (roundId) => {
    setCurrentRoundId(roundId);
    setIsTracking(true);
  };

  // Sync path during active round (THROTTLED)
  useEffect(() => {
    if (isTracking && currentRoundId && location) {
      const now = Date.now();
      const coords = location.coords;
      
      let distanceMoved = 999;
      if (lastSyncRef.current.coords) {
        const last = lastSyncRef.current.coords;
        distanceMoved = Math.sqrt(
          Math.pow(coords.latitude - last.latitude, 2) + 
          Math.pow(coords.longitude - last.longitude, 2)
        ) * 111320;
      }

      if (now - lastSyncRef.current.time < 60000 && distanceMoved < 50) {
        return;
      }

      const syncPoint = async () => {
        try {
          lastSyncRef.current = { time: now, coords: { latitude: coords.latitude, longitude: coords.longitude } };

          await supabase
            .from('users')
            .update({
              current_lat: coords.latitude,
              current_lng: coords.longitude,
              last_location_update: new Date().toISOString(),
              active_round_id: currentRoundId
            })
            .eq('id', user.id);

          await supabase
            .from('round_paths')
            .insert({
              round_id: currentRoundId,
              lat: coords.latitude,
              lng: coords.longitude
            });
        } catch (err) {
          console.error("Error syncing location:", err);
        }
      };
      syncPoint();
    }
  }, [location, isTracking, currentRoundId]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isTracking,
        setIsTracking,
        locationHistory,
        scannedPoints,
        markingPoints,
        sections,
        loadingPoints,
        addScannedPoint,
        currentRoundId,
        startNewRound,
        resumeRound,
        setAdminInstallationId,
        effectiveInstId,
        uploadPointPhoto
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
