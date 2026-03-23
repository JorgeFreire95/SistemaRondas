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
  const [locationHistory, setLocationHistory] = useState([]);
  const [scannedPoints, setScannedPoints] = useState([]);

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
          roundId: currentRoundId || 'no-round',
          installationId: user.assignedInstallationId || 'no-installation'
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
      const startRound = async () => {
        try {
          const roundDoc = await addDoc(collection(db, 'rounds'), {
            guardId: user.uid,
            guardName: user.name,
            startTime: serverTimestamp(),
            status: 'active',
            installationId: user.assignedInstallationId || 'no-installation'
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
    }
  }, [isTracking]);

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
        addScannedPoint,
        currentRoundId
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
