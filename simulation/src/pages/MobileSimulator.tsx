import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Settings } from 'lucide-react';

// Hooks
import { useCamera } from '../hooks/useCamera';
import { useGps } from '../hooks/useGps';
import { useOrientation } from '../hooks/useOrientation';

// Components
import { LevelBubble } from '../components/LevelBubble';
import { MeasurementOverlay } from '../components/MeasurementOverlay';
import { CaptureStatus } from '../components/CaptureStatus';
import { SurveyReport } from '../components/SurveyReport';

// Utils
import { calculateDistance, calculateTargetGps, calculateDbh, calculateTreeHeight } from '../utils/measurementUtils';

const MobileSimulator = () => {
    // 1. Hooks & Basic States
    const videoRef = useCamera();
    const currentGps = useGps();
    const { angle, roll, heading, rawAngle, motionLevel, getInterpolatedSensorData } = useOrientation();

    const [userHeight, setUserHeight] = useState(1.7);
    const [lux, setLux] = useState(650);
    const [isVertical, setIsVertical] = useState(true);
    const [captureStatus, setCaptureStatus] = useState<{ type: 'warning' | 'error' | 'success', message: string } | null>(null);
    const [measurement, setMeasurement] = useState<any | null>(null);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    // 2. Computed Values
    const currentDistance = useMemo(() => calculateDistance(rawAngle, userHeight), [rawAngle, userHeight]);
    const targetGps = useMemo(() => calculateTargetGps(currentGps, currentDistance, heading), [currentGps, currentDistance, heading]);

    // 3. Validation Logic
    useEffect(() => {
        const pitchInLimit = Math.abs(angle - 90) < 1.5;
        const rollInLimit = Math.abs(roll) < 1.5;
        const vertical = pitchInLimit && rollInLimit;
        setIsVertical(vertical);

        if (!vertical) {
            setCaptureStatus({ type: 'warning', message: '수평계를 중앙에 맞춰주세요' });
        } else if (lux < 500) {
            setCaptureStatus({ type: 'error', message: '조도가 너무 낮습니다 (주간 야외 권장)' });
        } else if (motionLevel > 0.1) {
            setCaptureStatus({ type: 'error', message: '흔들림 감지됨 (기기를 고정하세요)' });
        } else {
            setCaptureStatus(null);
        }
    }, [angle, roll, lux, motionLevel]);

    // 4. Action Handlers
    const handleCapture = () => {
        if (!isVertical || captureStatus?.type === 'error' || !videoRef.current || !canvasRef.current) return;

        const captureTime = performance.now();
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (vw * vh < 11000000) {
            alert(`해상도 미달: 현재 ${vw}x${vh}. 12MP급 기기를 사용해 주세요.`);
            return;
        }

        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, vw, vh);
        const photoData = canvas.toDataURL('image/jpeg', 0.9);

        const syncedPose = getInterpolatedSensorData(captureTime);

        // 품질 검사 시뮬레이션
        if (Math.random() > 0.98) {
            alert("역광이 감지되었습니다. 반대 방향에서 촬영해 주세요.");
            return;
        }

        const dist = currentDistance;
        const dbh = calculateDbh(dist, vw);
        const treeHeight = calculateTreeHeight(dist, syncedPose.p, userHeight);

        const measurementData = {
            photo: photoData,
            timestamp: new Date().toLocaleString(),
            solarInfo: {
                time: new Date().toTimeString().split(' ')[0],
                sunAltitude: "Calculated from timestamp/GPS"
            },
            exif: {
                focalLength: "4.25 mm (Wide-angle fixed)",
                sensorSize: "1/2.55\"",
                resolution: `${vw} x ${vh}`
            },
            gps: {
                current: { ...currentGps },
                target: targetGps,
                precision: "High-accuracy (WAAS/EGNOS enabled)"
            },
            pose: {
                pitch: parseFloat(syncedPose.p.toFixed(2)),
                roll: parseFloat(syncedPose.r.toFixed(2)),
                heading: parseFloat(syncedPose.h.toFixed(2)),
                gravity: { x: 0.05, y: -9.8, z: 0.12 }
            },
            tree: {
                species: "소나무 (Pinus densiflora)",
                dbh: parseFloat(dbh.toFixed(1)),
                height: parseFloat(treeHeight.toFixed(1)),
                crownWidth: parseFloat((dbh * 0.12).toFixed(1)),
                groundClearance: 2.15,
                distance: parseFloat(dist.toFixed(2)),
                lensHeight: userHeight,
                targetPointPixel: { x: Math.round(vw / 2), y: Math.round(vh * 0.5) }
            }
        };

        setMeasurement(measurementData);

        // 서버로 데이터 전송 (FastAPI 서버 연동 - 동적 호스트 설정)
        const serverHost = window.location.hostname;
        const apiUri = `http://${serverHost}:8000/api/measurements`;

        fetch(apiUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbh: measurementData.tree.dbh,
                height: measurementData.tree.height,
                species: measurementData.tree.species,
                healthScore: 85.0, // 시뮬레이션 기본값
                latitude: measurementData.gps.target.lat,
                longitude: measurementData.gps.target.lon
            })
        })
            .then(res => {
                if (res.ok) {
                    console.log('Data synced to server');
                    alert('✅ 분석 데이터가 서버로 전송되었습니다.');
                } else {
                    console.error('Server sync failed');
                    alert('❌ 서버 전송 실패: 서버 상태를 확인해 주세요.');
                }
            })
            .catch(err => {
                console.error('Network error during sync:', err);
                alert(`⚠️ 전송 오류: 네트워크 연결을 확인하세요.\n(서버 주소: ${apiUri})`);
            });
    };

    return (
        <div style={{
            width: '100vw', height: '100dvh', backgroundColor: '#1a1a1a', color: 'white',
            display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif',
            paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)',
            paddingLeft: 'var(--safe-area-left)', paddingRight: 'var(--safe-area-right)',
            position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />

                <CaptureStatus status={captureStatus} />

                {/* 가이드 라인 */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '100%', opacity: 0.5, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                    <svg viewBox="0 0 200 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                        <path d="M80 400 L80 280 Q80 260 60 250 Q20 230 20 160 Q20 0 100 0 Q180 0 180 160 Q180 230 140 250 Q120 260 120 280 L120 400" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="6,6" />
                        <line x1="100" y1="0" x2="100" y2="400" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    </svg>
                </div>

                <MeasurementOverlay distance={currentDistance} targetGps={targetGps} isVertical={isVertical} />

                {/* 센터 포인트 */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 12, pointerEvents: 'none' }}>
                    <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', width: '100%', height: '3px', backgroundColor: '#ff5252', boxShadow: '0 0 10px rgba(255, 82, 82, 0.8)' }} />
                        <div style={{ position: 'absolute', height: '100%', width: '3px', backgroundColor: '#ff5252', boxShadow: '0 0 10px rgba(255, 82, 82, 0.8)' }} />
                    </div>
                </div>

                <LevelBubble angle={angle} roll={roll} isVertical={isVertical} />

                {/* 촬영 버튼 */}
                <div style={{ position: 'absolute', left: '50%', bottom: '20px', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                        onClick={handleCapture}
                        disabled={!isVertical || captureStatus?.type === 'error'}
                        style={{
                            width: 'clamp(70px, 18vw, 90px)', height: 'clamp(70px, 18vw, 90px)', borderRadius: '50%',
                            backgroundColor: (isVertical && !captureStatus) ? '#4caf50' : 'rgba(51, 51, 51, 0.8)',
                            border: `3px solid ${(isVertical && !captureStatus) ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            cursor: (isVertical && !captureStatus) ? 'pointer' : 'not-allowed',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            boxShadow: (isVertical && !captureStatus) ? '0 0 30px rgba(76, 175, 80, 0.6)' : 'none',
                            transform: (isVertical && !captureStatus) ? 'scale(1.1)' : 'scale(1)',
                            pointerEvents: 'auto'
                        }}
                    >
                        <Camera size={36} color="white" strokeWidth={2.5} />
                    </button>
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: (isVertical && !captureStatus) ? '#4caf50' : '#888', textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '0.5px' }}>
                        {(isVertical && !captureStatus) ? 'READY' : 'WAITING'}
                    </div>
                </div>

                {/* 상단바 */}
                <div style={{ position: 'absolute', top: 0, width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none', zIndex: 1001 }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>TreeMap Mobile</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>CURR. LOCATION</span>
                            <Settings size={18} style={{ pointerEvents: 'auto', cursor: 'pointer', color: '#888' }} />
                        </div>
                        <div style={{
                            padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                        }}>
                            Lat: {currentGps.lat.toFixed(6)}<br />
                            Lon: {currentGps.lon.toFixed(6)}
                        </div>
                    </div>
                </div>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {measurement && (
                <SurveyReport measurement={measurement} onClose={() => setMeasurement(null)} />
            )}
        </div>
    );
};

export default MobileSimulator;
