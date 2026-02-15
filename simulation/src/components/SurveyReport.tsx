import React from 'react';
import { TreePine } from 'lucide-react';

interface SurveyReportProps {
    measurement: {
        photo: string;
        timestamp: string;
        solarInfo: { time: string; sunAltitude: string };
        exif: { focalLength: string; sensorSize: string; resolution: string };
        gps: { current: any; target: any; precision: string };
        pose: { pitch: number; roll: number; heading: number; gravity: any };
        tree: {
            species: string;
            dbh: number;
            height: number;
            crownWidth: number;
            groundClearance: number;
            distance: number;
            lensHeight: number;
            targetPointPixel: { x: number; y: number };
        };
    };
    onClose: () => void;
}

export const SurveyReport: React.FC<SurveyReportProps> = ({ measurement, onClose }) => {
    return (
        <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', color: 'white', zIndex: 100,
            display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: 'env(safe-area-inset-bottom)', overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', marginTop: 'env(safe-area-inset-top)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TreePine size={24} color="#4caf50" style={{ marginRight: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Tree Survey Report</h2>
                </div>
                <button onClick={onClose} style={{ border: 'none', backgroundColor: '#333', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
            </div>

            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #444' }}>
                <img src={measurement.photo} alt="Tree Capture" style={{ width: '100%', display: 'block' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <div style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold', marginBottom: '10px' }}>🌳 PRIMARY TREE ANALYSIS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>Species</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.species}</div></div>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>DBH (흉고직경)</span><div style={{ fontWeight: 'bold', fontSize: '22px', color: '#4caf50' }}>{measurement.tree.dbh} cm</div></div>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>Height (수고)</span><div style={{ fontWeight: 'bold', fontSize: '18px' }}>{measurement.tree.height} m</div></div>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>Distance (직선거리)</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.distance} m</div></div>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>Crown Width</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.crownWidth} m</div></div>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>G. Clearance</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.groundClearance} m</div></div>
                    </div>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '12px', color: '#ff9800', fontWeight: 'bold', marginBottom: '10px' }}>📐 DEVICE POSE & 6-AXIS</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        Pitch: {measurement.pose.pitch}°<br />
                        Roll: {measurement.pose.roll}°<br />
                        Azimuth: {measurement.pose.heading}°<br />
                        Gravity-Y: {measurement.pose.gravity.y}
                    </div>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '12px', color: '#2196f3', fontWeight: 'bold', marginBottom: '10px' }}>📍 PRECISION GEODATA</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        Target Lat: {measurement.gps.target.lat.toFixed(6)}<br />
                        Target Lon: {measurement.gps.target.lon.toFixed(6)}<br />
                        Survey: {measurement.solarInfo.time}
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px' }}>
                    <div style={{ fontSize: '12px', color: '#9c27b0', fontWeight: 'bold', marginBottom: '10px' }}>📸 OPTICAL & PIXEL DATA</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>Exif Focal</span><div style={{ fontSize: '12px' }}>{measurement.exif.focalLength}</div></div>
                        <div><span style={{ color: '#888', fontSize: '11px' }}>H-Target Pxl</span><div style={{ fontSize: '12px' }}>X:{measurement.tree.targetPointPixel.x} Y:{measurement.tree.targetPointPixel.y}</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
