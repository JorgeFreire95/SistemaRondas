import React, { createContext, useState, useEffect, useContext } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Helper for 'Black Box' diagnostics
  const addDebugLog = async (step, details = {}) => {
    // DISABLED for Quota Rescue: Too many writes for Spark Plan.
    // console.log("Debug Log (Simulated):", step, details);
  };

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'scannedPoints'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const points = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScannedPoints(points);
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching scanned points:", err);
    });
    return unsubscribe;
  }, [user]);

  // Global listener for marking points of the assigned installation
  useEffect(() => {
    if (!effectiveInstId || effectiveInstId === 'no-installation') {
      setMarkingPoints([]);
      setLoadingPoints(false);
      return;
    }

    setLoadingPoints(true);
    const q = query(
      collection(db, 'installations', effectiveInstId, 'markingPoints'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let pts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter points if the user is a guard assigned to a specific section
      if (user?.role === 'guardia' && user?.assignedSectionId) {
        pts = pts.filter(p => p.sectionId === user.assignedSectionId);
      }
      
      setMarkingPoints(pts);
      setLoadingPoints(false);
    }, (err) => {
      setLoadingPoints(false);
      if (err.code !== 'permission-denied') console.error("Error fetching marking points:", err);
    });

    return unsubscribe;
  }, [effectiveInstId, user?.assignedSectionId, user?.role]);

  // Global listener for sections of the assigned installation
  useEffect(() => {
    if (!effectiveInstId || effectiveInstId === 'no-installation') {
      setSections([]);
      return;
    }
    const q = query(
      collection(db, 'installations', effectiveInstId, 'sections'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let secs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter sections if the user is a guard assigned to a specific section
      if (user?.role === 'guardia' && user?.assignedSectionId) {
        secs = secs.filter(s => s.id === user.assignedSectionId);
      }
      
      setSections(secs);
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching sections:", err);
    });
    return unsubscribe;
  }, [effectiveInstId, user?.assignedSectionId, user?.role]);

  // Global listener for assigned installation info
  useEffect(() => {
    if (!effectiveInstId || effectiveInstId === 'no-installation') {
      setAssignedInstData(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'installations', effectiveInstId), (snap) => {
      if (snap.exists()) setAssignedInstData({ id: snap.id, ...snap.data() });
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Error fetching assigned inst:", err);
    });

    return unsub;
  }, [effectiveInstId]);

  const addScannedPoint = async (data, extra = {}) => {
    if (location && user) {
      try {
        const docRef = await addDoc(collection(db, 'scannedPoints'), {
          data,
          ...extra,
          photoUrl: extra.photoUrl || null, // Ensure field exists
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: serverTimestamp(),
          guardId: user.uid,
          guardName: user.name,
          guardRole: user.role,
          roundId: currentRoundId || 'no-round',
          installationId: effectiveInstId || 'no-installation',
          installationName: assignedInstData?.name || 'Sistema',
          roundTime: extra.roundTime || roundData?.roundTime || null
        });
        return docRef.id;
      } catch (e) {
        console.error("Error adding document: ", e);
        return null;
      }
    }
    return null;
  };

  const uploadPointPhoto = async (docId, base64) => {
    if (!docId) { alert("Diagnostic: Missing DocID"); return; }
    if (!base64) { alert("Diagnostic: Missing Photo Data"); return; }
    if (!user) { alert("Diagnostic: Missing User Auth"); return; }
    
    await addDebugLog("upload_start", { docId, dataSize: base64.length });

    // WATCHDOG: Force clear 'pending' status after 50 seconds (longer for retries)
    const watchdog = setTimeout(async () => {
      try {
        console.warn("Watchdog triggered: Upload timeout.");
        await updateDoc(doc(db, 'scannedPoints', docId), {
          photoUrl: null,
          photoError: 'timeout_50s'
        });
        await addDebugLog("upload_timeout", { docId });
      } catch (e) {
        console.error("Watchdog update failed:", e);
      }
    }, 50000);

    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        await addDebugLog("upload_attempt", { docId, attempt: attempts });
        
        const fileName = `evidencias_rondas/${Date.now()}_att${attempts}.jpg`;
        const storageRef = ref(storage, fileName);
        
        // Use uploadString with 'base64'
        await uploadString(storageRef, base64, 'base64');
        const downloadURL = await getDownloadURL(storageRef);
        
        clearTimeout(watchdog);
        await updateDoc(doc(db, 'scannedPoints', docId), {
          photoUrl: downloadURL,
          photoError: null
        });
        
        await addDebugLog("upload_success", { docId, url: downloadURL });
        return downloadURL;
      } catch (err) {
        console.error(`Attempt ${attempts} failed:`, err);
        await addDebugLog("upload_fail", { docId, attempt: attempts, error: err.code || err.message });
        
        if (attempts >= 3) {
          clearTimeout(watchdog);
          window.alert(`FALLO TOTAL (3 reintentos): ${err.code || err.message}`);
          await updateDoc(doc(db, 'scannedPoints', docId), {
            photoUrl: null,
            photoError: `failed_after_3_tries_${err.code || 'unknown'}`
          });
        } else {
          // Wait 2 seconds before next attempt
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    return null;
  };

  // Effect for basic location watching (always on when logged in)
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
        if (pos) {
          setLocation(pos);
        }
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
      if (currentRoundId) return; // Already have a round (resuming)

      const startRound = async () => {
        try {
          const roundDoc = await addDoc(collection(db, 'rounds'), {
            guardId: user.uid,
            guardName: user.name,
            guardRole: user.role,
            startTime: serverTimestamp(),
            status: 'active',
            installationId: effectiveInstId || 'no-installation',
            scheduleId: roundData?.scheduleId || null,
            roundTime: roundData?.roundTime || null
          });
          setCurrentRoundId(roundDoc.id);
          
          // Sync immediately to user doc for admin visibility
          await updateDoc(doc(db, 'users', user.uid), {
            activeRoundId: roundDoc.id
          });

          setLocationHistory([]); // Reset history for new round
        } catch (e) {
          console.error("Error starting round:", e);
        }
      };
      startRound();
    } else if (!isTracking && user) {
      // Clear active round from user profile
      const clearRound = async () => {
        try {
          if (currentRoundId) {
            await updateDoc(doc(db, 'rounds', currentRoundId), {
              endTime: serverTimestamp(),
              status: 'completed'
            });
          }
          await updateDoc(doc(db, 'users', user.uid), {
            activeRoundId: null
          });
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

  // Effect for syncing path to Firestore during an active round (THROTTLED for Quota Rescue)
  useEffect(() => {
    if (isTracking && currentRoundId && location) {
      const now = Date.now();
      const coords = location.coords;
      
      // Calculate distance if we have previous coords
      let distanceMoved = 999;
      if (lastSyncRef.current.coords) {
        const last = lastSyncRef.current.coords;
        distanceMoved = Math.sqrt(
          Math.pow(coords.latitude - last.latitude, 2) + 
          Math.pow(coords.longitude - last.longitude, 2)
        ) * 111320; // Approx meters
      }

      // ONLY SYNC if 60 seconds passed OR moved more than 50 meters
      if (now - lastSyncRef.current.time < 60000 && distanceMoved < 50) {
        return; 
      }

      const syncPoint = async () => {
        try {
          lastSyncRef.current = { time: now, coords: { latitude: coords.latitude, longitude: coords.longitude } };
          
          const newPoint = { lat: coords.latitude, lng: coords.longitude };
          
          await updateDoc(doc(db, 'users', user.uid), {
            currentLat: coords.latitude,
            currentLng: coords.longitude,
            lastLocationUpdate: serverTimestamp(),
            activeRoundId: currentRoundId
          });

          await addDoc(collection(db, 'rounds', currentRoundId, 'path'), {
            ...newPoint,
            timestamp: serverTimestamp()
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
