import React, { createContext, useState, useEffect, useContext } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
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
    });
    return unsubscribe;
  }, [user]);

  const addScannedPoint = async (data) => {
    if (location && user) {
      try {
        await addDoc(collection(db, 'scannedPoints'), {
          data,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: serverTimestamp(),
          guardId: user.uid,
          guardName: user.name,
          roundId: currentRoundId || 'no-round',
        });
        return true;
      } catch (e) {
        console.error("Error adding document: ", e);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    let watchId;

    const startTracking = async () => {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') return;

      const roundDoc = await addDoc(collection(db, 'rounds'), {
        guardId: user.uid,
        guardName: user.name,
        startTime: serverTimestamp(),
        status: 'active'
      });
      setCurrentRoundId(roundDoc.id);

      watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      }, (pos) => {
        if (pos) {
          setLocation(pos);
          setLocationHistory(prev => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude }]);
        }
      });
    };

    if (isTracking && user) {
      startTracking();
    } else if (watchId) {
      Geolocation.clearWatch({ id: watchId });
      setCurrentRoundId(null);
    }

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  }, [isTracking]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isTracking,
        setIsTracking,
        locationHistory,
        scannedPoints,
        addScannedPoint,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
