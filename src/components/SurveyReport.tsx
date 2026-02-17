import React, { useState, useEffect, useRef } from 'react';
import { TreePine, MapPin, CheckCircle2, Navigation } from 'lucide-react';
import L from 'leaflet';

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
    onConfirm: (finalData: any) => void;
}

export const SurveyReport: React.FC<SurveyReportProps> = ({ measurement, onClose, onConfirm }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [adjustedGps, setAdjustedGps] = useState({ lat: measurement.gps.target.lat, lon: measurement.gps.target.lon });
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = L.map(mapRef.current, {
            center: [measurement.gps.target.lat, measurement.gps.target.lon],
            zoom: 19,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // 정중앙 십자선 마커 (지도 이동 시 항상 중앙)
        const centerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div style="position: relative; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center;">
                    <div style="position: absolute; width: 2px; height: 40px; background: #ff5252;"></div>
                    <div style="position: absolute; width: 40px; height: 2px; background: #ff5252;"></div>
                    <div style="position: absolute; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #ff5252; background: white;"></div>
                </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        // 실제 기기 위치 표시 (파란색 도트)
        L.circleMarker([measurement.gps.current.lat, measurement.gps.current.lon], {
            radius: 8,
            fillColor: "#2196f3",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map).bindPopup("내 위치 (기기 GPS)");

        // 지도 이동 시 중앙 좌표 업데이트
        map.on('move', () => {
            const center = map.getCenter();
            setAdjustedGps({ lat: center.lat, lon: center.lng });
        });

        return () => {
            map.remove();
        };
    }, []);

    const handleFinalConfirm = () => {
        setIsSyncing(true);

        // 3종 GPS 데이터를 포함한 최종 페이로드 구성
        const finalPayload = {
            dbh: measurement.tree.dbh,
            height: measurement.tree.height,
            crownWidth: measurement.tree.crownWidth,
            groundClearance: measurement.tree.groundClearance,
            species: measurement.tree.species,
            healthScore: 90.0,

            // 3종 GPS 데이터 전송
            deviceLatitude: measurement.gps.current.lat,
            deviceLongitude: measurement.gps.current.lon,
            treeLatitude: measurement.gps.target.lat,  // 산정 위치
            treeLongitude: measurement.gps.target.lon,
            adjustedTreeLatitude: adjustedGps.lat,    // 사용자 조정 위치
            adjustedTreeLongitude: adjustedGps.lon,

            // 센서 데이터
            devicePitch: measurement.pose.pitch,
            deviceRoll: measurement.pose.roll,
            deviceAzimuth: measurement.pose.heading,
            accelerometerX: measurement.pose.gravity.x,
            accelerometerY: measurement.pose.gravity.y,
            accelerometerZ: measurement.pose.gravity.z,

            // 메타데이터
            imageWidth: parseInt(measurement.exif.resolution.split('x')[0]),
            imageHeight: parseInt(measurement.exif.resolution.split('x')[1]),
            focalLength: 4.25,
            cameraDistance: measurement.tree.distance,
            deviceModel: "iPhone 15 Pro (Simulator)",
            osVersion: "iOS 17.4",
            appVersion: "1.2.0",
            imageData: measurement.photo
        };

        onConfirm(finalPayload);
    };

    return (
        <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', color: 'white', zIndex: 3000,
            display: 'flex', flexDirection: 'column', padding: '15px', paddingBottom: 'env(safe-area-inset-bottom)', overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: 'env(safe-area-inset-top)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TreePine size={24} color="#4caf50" style={{ marginRight: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>측정 데이터 검토 및 보정</h2>
                </div>
                <button onClick={onClose} style={{ border: 'none', backgroundColor: '#333', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>취소</button>
            </div>

            {/* 위치 보정 지도 섹션 */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                    <MapPin size={16} color="#ff5252" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>나무 위치 정밀 보정 (중앙에 맞추세요)</span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #444' }}>
                    <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
                    {/* 지도 정중앙 가이드 UI */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, pointerEvents: 'none' }}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #ff5252', borderRadius: '50%' }}></div>
                    </div>
                </div>
                <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#1e1e1e', borderRadius: '8px', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>보정 좌표: {adjustedGps.lat.toFixed(6)}, {adjustedGps.lon.toFixed(6)}</span>
                    <span style={{ color: '#4caf50' }}>지도를 드래그하여 보정</span>
                </div>
            </div>

            {/* 데이터 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                <div style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.15)', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#4caf50', fontWeight: 'bold' }}>🌳 수목 분석 데이터</div>
                        <img src={measurement.photo} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div><span style={{ color: '#888', fontSize: '10px' }}>수고 (H)</span><div style={{ fontWeight: 'bold', color: '#fff' }}>{measurement.tree.height} m</div></div>
                        <div><span style={{ color: '#888', fontSize: '10px' }}>흉고직경 (D)</span><div style={{ fontWeight: 'bold', color: '#4caf50' }}>{measurement.tree.dbh} cm</div></div>
                        <div><span style={{ color: '#888', fontSize: '10px' }}>수관폭 (W)</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.crownWidth} m</div></div>
                        <div><span style={{ color: '#888', fontSize: '10px' }}>지하고 (C)</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.groundClearance} m</div></div>
                    </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '10px', color: '#2196f3', fontWeight: 'bold', marginBottom: '8px' }}>📍 기기/산정 위치</div>
                    <div style={{ fontSize: '10px', color: '#ccc', lineHeight: '1.5' }}>
                        Device: {measurement.gps.current.lat.toFixed(5)}...<br />
                        Calc: {measurement.gps.target.lat.toFixed(5)}...
                    </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '10px', color: '#ff9800', fontWeight: 'bold', marginBottom: '8px' }}>📐 자세 정보</div>
                    <div style={{ fontSize: '10px', color: '#ccc', lineHeight: '1.5' }}>
                        Pitch: {measurement.pose.pitch}°<br />
                        Heading: {measurement.pose.heading}°
                    </div>
                </div>
            </div>

            {/* 최종 전송 버튼 */}
            <button
                onClick={handleFinalConfirm}
                disabled={isSyncing}
                style={{
                    width: '100%', padding: '18px', backgroundColor: '#4caf50', color: 'white',
                    border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '18px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                    boxShadow: '0 10px 25px rgba(76, 175, 80, 0.4)',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    opacity: isSyncing ? 0.7 : 1,
                    marginBottom: '30px'
                }}
            >
                {isSyncing ? (
                    '전송 중...'
                ) : (
                    <>
                        <CheckCircle2 size={24} />
                        최종 데이터 전송 및 저장
                    </>
                )}
            </button>
        </div>
    );
};
