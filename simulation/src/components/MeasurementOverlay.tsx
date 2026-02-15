import React from 'react';

interface MeasurementOverlayProps {
    distance: number;
    targetGps: { lat: number; lon: number };
    isVertical: boolean;
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({ distance, targetGps, isVertical }) => {
    return (
        <div style={{
            position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
            whiteSpace: 'nowrap', padding: '12px 16px',
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', borderRadius: '16px',
            border: `1px solid ${isVertical ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
            display: 'flex', flexDirection: 'column', gap: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 50, pointerEvents: 'none'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: '#888', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>DISTANCE</span>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: isVertical ? '#4caf50' : 'white', fontFamily: 'monospace' }}>
                        {distance > 0 ? distance.toFixed(1) : '---'}
                    </span>
                    <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', marginLeft: 3, color: '#666' }}>m</span>
                </div>
            </div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: '#4caf50', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>TARGET (EST.)</span>
                <div style={{ fontFamily: 'monospace', fontSize: 'clamp(9px, 2vw, 11px)', color: '#ccc', lineHeight: '1.4' }}>
                    Lat: {targetGps.lat.toFixed(6)}<br />
                    Lon: {targetGps.lon.toFixed(6)}
                </div>
            </div>
        </div>
    );
};
