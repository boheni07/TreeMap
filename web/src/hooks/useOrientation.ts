import { useState, useEffect, useRef } from 'react';
import { lerp } from '../utils/measurementUtils';

export interface OrientationData {
    angle: number;
    roll: number;
    heading: number;
    rawAngle: number;
    motionLevel: number;
}

export const useOrientation = () => {
    const [orientation, setOrientation] = useState<OrientationData>({
        angle: 90,
        roll: 0,
        heading: 0,
        rawAngle: 90,
        motionLevel: 0
    });

    const sensorBuffer = useRef<Array<{ t: number, p: number, r: number, h: number }>>([]);

    // 이 값들은 상태로 관리하기보다 메모리에 유지 (성능 최적화)
    const lastAngleRef = useRef(90);
    const lastRollRef = useRef(0);

    const smoothingFactor = 0.05;
    const stepUnit = 0.5;
    const magnetThreshold = 2.0;

    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            const now = performance.now();
            const rawH = e.alpha || 0;
            const rawP = e.beta || 90;
            const rawR = e.gamma || 0;

            sensorBuffer.current.push({ t: now, p: rawP, r: rawR, h: rawH });
            if (sensorBuffer.current.length > 100) sensorBuffer.current.shift();

            let newAngle = orientation.angle;
            let newRawAngle = orientation.rawAngle;
            let newRoll = orientation.roll;
            let newMotionLevel = orientation.motionLevel;

            if (e.beta !== null) {
                const smoothed = (e.beta * smoothingFactor) + (lastAngleRef.current * (1 - smoothingFactor));
                newRawAngle = smoothed;

                let stepped = Math.round(smoothed / stepUnit) * stepUnit;
                if (Math.abs(stepped - 90) < magnetThreshold) stepped = 90;
                newAngle = stepped;

                const delta = Math.abs(e.beta - lastAngleRef.current);
                newMotionLevel = (delta * 0.2) + (newMotionLevel * 0.8);
                lastAngleRef.current = smoothed;
            }

            if (e.gamma !== null) {
                const smoothedValue = (e.gamma * smoothingFactor) + (lastRollRef.current * (1 - smoothingFactor));
                let stepped = Math.round(smoothedValue / stepUnit) * stepUnit;
                if (Math.abs(stepped) < magnetThreshold) stepped = 0;
                newRoll = stepped;
                lastRollRef.current = smoothedValue;
            }

            setOrientation({
                angle: newAngle,
                roll: newRoll,
                heading: rawH,
                rawAngle: newRawAngle,
                motionLevel: newMotionLevel
            });
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const getInterpolatedSensorData = (targetTime: number) => {
        const buffer = sensorBuffer.current;
        if (buffer.length < 2) return { p: orientation.angle, r: orientation.roll, h: orientation.heading };

        let idx = -1;
        for (let i = 0; i < buffer.length - 1; i++) {
            if (buffer[i].t <= targetTime && buffer[i + 1].t >= targetTime) {
                idx = i;
                break;
            }
        }

        if (idx === -1) {
            const last = buffer[buffer.length - 1];
            return { p: last.p, r: last.r, h: last.h };
        }

        const f1 = buffer[idx];
        const f2 = buffer[idx + 1];
        const ratio = (targetTime - f1.t) / (f2.t - f1.t);

        return {
            p: lerp(f1.p, f2.p, ratio),
            r: lerp(f1.r, f2.r, ratio),
            h: lerp(f1.h, f2.h, ratio)
        };
    };

    return { ...orientation, getInterpolatedSensorData };
};
