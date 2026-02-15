import { useState, useEffect } from 'react';

export const useGps = () => {
    const [currentGps, setCurrentGps] = useState({ lat: 37.5665, lon: 126.9780, alt: 25.0 });

    useEffect(() => {
        const geoWatch = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentGps({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    alt: pos.coords.altitude || 25.0
                });
            },
            (err) => console.warn("GPS error:", err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(geoWatch);
    }, []);

    return currentGps;
};
