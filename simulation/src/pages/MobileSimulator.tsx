import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Settings, X, Save, Wifi } from 'lucide-react';

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

    // Server Settings State
    const [serverIp, setServerIp] = useState(localStorage.getItem('TREEMAP_SERVER_IP') || window.location.hostname);
    const [showSettings, setShowSettings] = useState(false);
    const [tempIp, setTempIp] = useState(serverIp);

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
    const handleSaveSettings = () => {
        localStorage.setItem('TREEMAP_SERVER_IP', tempIp);
        setServerIp(tempIp);
        setShowSettings(false);
        alert(`서버 주소가 ${tempIp}로 설정되었습니다.`);
    };

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

        // 서버로 데이터 전송 (FastAPI 서버 연동 - 동적/설정 호스트)
        const apiUri = `http://${serverIp}:8000/api/measurements`;

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
                    alert(`❌ 서버 전송 실패: 서버 상태를 확인해 주세요.\n(응답 코드: ${res.status})`);
                }
            })
            .catch(err => {
                console.error('Network error during sync:', err);
                alert(`⚠️ 전송 오류: 네트워크 연결을 확인하세요.\n서버 주소: ${apiUri}\n\n도움말: PC와 스마트폰이 같은 Wi-Fi에 연결되어 있는지 확인하고, 필요시 '설정(톱니바퀴)'에서 PC의 IP 주소를 직접 입력하세요.`);
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
                        <div style={{
                            padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '12px', textAlign: 'right', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                        }}>
                            Server IP: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{serverIp}</span><br />
                            Lat: {currentGps.lat.toFixed(6)}<br />
                            Lon: {currentGps.lon.toFixed(6)}
                        </div>
                    </div>
                </div>

                {/* 설정 플로팅 버튼 - 클릭 보장 및 시인성 확보 */}
                <button
                    onClick={() => setShowSettings(true)}
                    style={{
                        position: 'absolute', top: '20px', right: '20px', zIndex: 2000,
                        width: '44px', height: '44px', borderRadius: '12px',
                        backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        cursor: 'pointer', backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        pointerEvents: 'auto'
                    }}
                >
                    <Settings size={24} />
                </button>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* 서버 설정 모달 */}
            {showSettings && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
                }}>
                    <div style={{
                        width: '85%', maxWidth: '400px', backgroundColor: '#1e293b', borderRadius: '20px',
                        padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>서버 연결 상세 설정</h3>
                            <X size={24} onClick={() => setShowSettings(false)} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                                BACKEND PC IP ADDRESS
                            </label>
                            <input
                                type="text"
                                value={tempIp}
                                onChange={(e) => setTempIp(e.target.value)}
                                placeholder="예: 192.168.0.10"
                                style={{
                                    width: '100%', padding: '12px 16px', backgroundColor: '#0f172a',
                                    border: '1px solid #334155', borderRadius: '10px', color: 'white',
                                    fontSize: '16px', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                            <p style={{ margin: 0 }}>💡 <strong>도움말:</strong></p>
                            <ol style={{ paddingLeft: '18px', margin: '4px 0 0 0' }}>
                                <li>PC와 스마트폰을 같은 Wi-Fi에 연결합니다.</li>
                                <li>PC에서 `ipconfig`로 확인된 IPv4 주소를 입력하세요.</li>
                                <li>기본값은 브라우저 접속 주소입니다.</li>
                            </ol>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            style={{
                                width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white',
                                border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <Save size={20} />
                            설정 저장 및 적용
                        </button>
                    </div>
                </div>
            )}

            {measurement && (
                <SurveyReport measurement={measurement} onClose={() => setMeasurement(null)} />
            )}
        </div>
    );
};

export default MobileSimulator;
