import React, { createContext, useState, useEffect, useContext } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [roundData, setRoundData] = useState(null); // { scheduleId, roundTime }
  const [assignedInstData, setAssignedInstData] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [scannedPoints, setScannedPoints] = useState([]);
  const [markingPoints, setMarkingPoints] = useState([]);
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
      const pts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMarkingPoints(pts);
      setLoadingPoints(false);
    }, (err) => {
      setLoadingPoints(false);
      if (err.code !== 'permission-denied') console.error("Error fetching marking points:", err);
    });

    return unsubscribe;
  }, [effectiveInstId]);

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
        await addDoc(collection(db, 'scannedPoints'), {
          data,
          ...extra,
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
        return true;
      } catch (e) {
        console.error("Error adding document: ", e);
        return false;
      }
    }
    return false;
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

  // Effect for syncing path to Firestore during an active round
  useEffect(() => {
    if (isTracking && currentRoundId && location) {
      const newPoint = { lat: location.coords.latitude, lng: location.coords.longitude };
      
      // Update local history
      setLocationHistory(prev => {
        // Prevent duplicate consecutive points if needed, but for now simple append
        return [...prev, newPoint];
      });

      // Sync to Firestore
      const syncPoint = async () => {
        try {
          // Sync live location to user doc for remote monitoring
          await updateDoc(doc(db, 'users', user.uid), {
            currentLat: location.coords.latitude,
            currentLng: location.coords.longitude,
            lastLocationUpdate: serverTimestamp(),
            activeRoundId: currentRoundId
          });

          // Add to permanent path history
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
        loadingPoints,
        addScannedPoint,
        currentRoundId,
        startNewRound,
        resumeRound,
        setAdminInstallationId,
        effectiveInstId
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
