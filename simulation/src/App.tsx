import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings, TreePine, Info } from 'lucide-react';

const TreeSurveySimulator = () => {
    const [angle, setAngle] = useState(90); // pitch (vertical)
    const [roll, setRoll] = useState(0);    // roll (horizontal)
    const [userHeight, setUserHeight] = useState(1.7);
    const [isVertical, setIsVertical] = useState(true);
    const [currentGps, setCurrentGps] = useState({ lat: 37.5665, lon: 126.9780, alt: 25.0 }); // 서울 기본값
    const [heading, setHeading] = useState(0); // 북쪽 기준 방위각
    const [lux, setLux] = useState(650);       // 시뮬레이션 조도
    const [motionLevel, setMotionLevel] = useState(0); // 흔들림 정도
    const [rawAngle, setRawAngle] = useState(90);      // 스냅되지 않은 정밀 각도
    const [captureStatus, setCaptureStatus] = useState<{ type: 'warning' | 'error' | 'success', message: string } | null>(null);

    const [measurement, setMeasurement] = useState<{
        photo: string;
        timestamp: string;
        solarInfo: { time: string; sunAltitude: string };
        exif: { focalLength: string; sensorSize: string; resolution: string };
        gps: { current: typeof currentGps; target: typeof currentGps; precision: string };
        pose: { pitch: number; roll: number; heading: number; gravity: { x: number; y: number; z: number } };
        sensorLog: Array<{ t: number; a: { x: number; y: number; z: number }; g: { x: number; y: number; z: number } }>;
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
        serverPayload: any;
    } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // 1. 카메라 스트림
        const enableCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 4000 },
                        height: { ideal: 3000 }
                    }
                });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };
        enableCamera();

        // 2. GPS 정보 수집
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

        // 3. 자이로 센서 (DeviceOrientation) 연동
        let lastAngle = 90;
        let lastRollValue = 0;
        const smoothingFactor = 0.05; // 극한의 묵직한(Damped) 이동을 위해 감도 하향
        const stepUnit = 0.5; // 단계별 이동 단위
        const magnetThreshold = 2.0; // 자석 효과 범위 (더 강력하게 센터에 붙음)

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.alpha !== null) setHeading(e.alpha);

            if (e.beta !== null) {
                const smoothed = (e.beta * smoothingFactor) + (lastAngle * (1 - smoothingFactor));
                setRawAngle(smoothed); // 정밀 거리 계산용 (스냅 없음)

                let stepped = Math.round(smoothed / stepUnit) * stepUnit;
                if (Math.abs(stepped - 90) < magnetThreshold) stepped = 90; // 강력한 자석 효과
                setAngle(stepped);

                // 흔들림(Motion) 계산
                const delta = Math.abs(e.beta - lastAngle);
                setMotionLevel(prev => (delta * 0.2) + (prev * 0.8));
                lastAngle = smoothed;
            }

            if (e.gamma !== null) {
                const smoothedValue = (e.gamma * smoothingFactor) + (lastRollValue * (1 - smoothingFactor));
                let stepped = Math.round(smoothedValue / stepUnit) * stepUnit;
                if (Math.abs(stepped) < magnetThreshold) stepped = 0; // 강력한 자석 효과
                setRoll(stepped);
                lastRollValue = smoothedValue;
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
            navigator.geolocation.clearWatch(geoWatch);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    useEffect(() => {
        // 자석 효과 및 수직 상태 판단
        const pitchInLimit = Math.abs(angle - 90) < 1.5;
        const rollInLimit = Math.abs(roll) < 1.5;
        const vertical = pitchInLimit && rollInLimit;
        setIsVertical(vertical);

        // 정밀 촬영 조건 검증
        if (!vertical) {
            setCaptureStatus({ type: 'warning', message: '수평계를 중앙에 맞춰주세요' });
        } else if (lux < 500) {
            setCaptureStatus({ type: 'error', message: '조도가 너무 낮습니다 (주간 야외 권장)' });
        } else if (motionLevel > 0.1) { // 0.1로 임계값 조정
            setCaptureStatus({ type: 'error', message: '흔들림 감지됨 (기기를 고정하세요)' });
        } else {
            setCaptureStatus(null);
        }
    }, [angle, roll, lux, motionLevel]);

    const currentDistance = React.useMemo(() => {
        const diff = userHeight - 1.2;
        const tiltFromHorizontal = rawAngle - 90;

        // 조준점이 수평 이하로 0.3도 이상 내려갔을 때만 거리 계산 (수평 근처는 무한대 방지)
        if (tiltFromHorizontal < 0.3) return 0;

        const d = diff / Math.tan(tiltFromHorizontal * Math.PI / 180);
        return Math.min(Math.max(0, d), 50); // 최대 50m로 제한하여 안정성 확보
    }, [rawAngle, userHeight]);

    const calculateTargetGps = () => {
        const R = 6378137;
        const dLat = (currentDistance * Math.cos(heading * Math.PI / 180)) / R;
        const dLon = (currentDistance * Math.sin(heading * Math.PI / 180)) / (R * Math.cos(currentGps.lat * Math.PI / 180));
        return {
            lat: currentGps.lat + (dLat * 180 / Math.PI),
            lon: currentGps.lon + (dLon * 180 / Math.PI),
            alt: currentGps.alt
        };
    };

    const targetGps = calculateTargetGps();

    const handleCapture = () => {
        if (!isVertical || captureStatus?.type === 'error' || !videoRef.current || !canvasRef.current) return;

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

        // 가상 품질 검합
        if (Math.random() > 0.98) {
            alert("역광이 감지되었습니다. 반대 방향에서 촬영해 주세요.");
            return;
        }

        const dist = currentDistance;
        const dbh = 2 * dist * Math.tan(((150 * (60 / 4000)) * Math.PI / 180) / 2) * 100;
        const treeHeight = dist * Math.tan(Math.max(0.01, (110 - angle) * Math.PI / 180)) + userHeight;

        const targetX = Math.round(vw / 2);
        const targetY = Math.round(vh * 0.75);

        setMeasurement({
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
                pitch: parseFloat(angle.toFixed(2)),
                roll: parseFloat(roll.toFixed(2)),
                heading: parseFloat(heading.toFixed(2)),
                gravity: { x: 0.05, y: -9.8, z: 0.12 }
            },
            sensorLog: Array.from({ length: 10 }).map((_, i) => ({
                t: Date.now() - (1000 - i * 100),
                a: { x: 0.01, y: 9.8, z: 0.05 },
                g: { x: 0, y: 0.1, z: 0 }
            })),
            tree: {
                species: "소나무 (Pinus densiflora)",
                dbh: parseFloat(dbh.toFixed(1)),
                height: parseFloat(treeHeight.toFixed(1)),
                crownWidth: parseFloat((dbh * 0.12).toFixed(1)),
                groundClearance: 2.15,
                distance: parseFloat(dist.toFixed(2)),
                lensHeight: userHeight,
                targetPointPixel: { x: targetX, y: targetY }
            },
            serverPayload: {
                depth_engine: "DTP-v4",
                correction_matrix: "calibrated_android_v12",
                ai_inference_status: "ready_for_payload"
            }
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

                {/* 촬영 가이드 안내 메시지 */}
                {captureStatus && (
                    <div style={{
                        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: captureStatus.type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(255, 152, 0, 0.9)',
                        padding: '10px 20px', borderRadius: '30px', color: 'white', fontWeight: 'bold',
                        fontSize: '14px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}>
                        <Info size={18} />
                        {captureStatus.message}
                    </div>
                )}

                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '100%', opacity: 0.5, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                    <svg viewBox="0 0 200 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                        <path d="M80 400 L80 280 Q80 260 60 250 Q20 230 20 160 Q20 0 100 0 Q180 0 180 160 Q180 230 140 250 Q120 260 120 280 L120 400" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="6,6" />
                        <line x1="100" y1="0" x2="100" y2="400" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    </svg>
                </div>

                <div style={{
                    position: 'absolute', left: 'clamp(10px, 4vw, 20px)', top: '75%', transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap', padding: 'clamp(8px, 2vh, 12px) clamp(10px, 3vw, 16px)',
                    backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(15px)', borderRadius: '16px',
                    border: `1px solid ${isVertical ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                    display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.5vh, 12px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 20, pointerEvents: 'none', maxWidth: '40vw'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: '#888', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>DISTANCE</span>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: isVertical ? '#4caf50' : 'white', fontFamily: 'monospace' }}>
                                {currentDistance > 0 ? currentDistance.toFixed(1) : '---'}
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

                <div style={{ position: 'absolute', top: '75%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 11, width: 0, height: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: 'clamp(100px, 28vw, 130px)', height: 'clamp(100px, 28vw, 130px)',
                            border: `3px solid ${isVertical ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.3)'}`,
                            borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ position: 'absolute', width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <div style={{ position: 'absolute', height: '100%', width: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            {/* 센터 포인트: 빨간색 + 표식 */}
                            <div style={{ position: 'absolute', width: '40%', height: 3.5, backgroundColor: '#ff5252', boxShadow: '0 0 10px rgba(255, 82, 82, 0.8)', zIndex: 2 }} />
                            <div style={{ position: 'absolute', height: '40%', width: 3.5, backgroundColor: '#ff5252', boxShadow: '0 0 10px rgba(255, 82, 82, 0.8)', zIndex: 2 }} />
                            <div style={{
                                width: '22%', height: '22%', borderRadius: '50%', transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                background: isVertical ? 'radial-gradient(circle at 35% 35%, #e8f5e9, #4caf50 70%, #1b5e20)' : 'radial-gradient(circle at 35% 35%, #ffebee, #f44336 70%, #b71c1c)',
                                transform: `translate(${roll * 3}px, ${(angle - 90) * 4}px)`,
                                boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(0,0,0,0.3), ${isVertical ? '0 0 25px rgba(76, 175, 80, 0.9)' : '0 0 20px rgba(244, 67, 54, 0.8)'}`,
                                zIndex: 1, position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(1px)' }} />
                            </div>
                        </div>
                        <span style={{ color: isVertical ? '#4caf50' : '#ff5252', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 'bold', marginTop: 12, textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '1px', whiteSpace: 'nowrap' }}>1.2M TARGET</span>
                    </div>
                </div>

                <div style={{ position: 'absolute', top: 0, width: '100%', padding: 'clamp(12px, 3vh, 20px) 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none', zIndex: 30 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 4vw, 18px)' }}>TreeMap AI</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', marginRight: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: '#888', fontWeight: 'bold' }}>CURR. LOCATION</span>
                            <Settings size={18} style={{ pointerEvents: 'auto', cursor: 'pointer', color: '#888' }} />
                        </div>
                        <div style={{
                            padding: '8px 14px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'monospace', fontSize: 'clamp(9px, 2.2vw, 11px)', textAlign: 'left', color: '#eee', minWidth: '140px'
                        }}>
                            Lat: {currentGps.lat.toFixed(6)}<br />
                            Lon: {currentGps.lon.toFixed(6)}
                        </div>
                    </div>
                </div>

                <div style={{ position: 'absolute', left: '25%', bottom: 'clamp(40px, 10vh, 80px)', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {measurement && (
                <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', color: 'white', zIndex: 100,
                    display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: 'env(safe-area-inset-bottom)', overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', marginTop: 'env(safe-area-inset-top)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <TreePine size={24} color="#4caf50" style={{ marginRight: '10px' }} />
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Tree Survey Report</h2>
                        </div>
                        <button onClick={() => setMeasurement(null)} style={{ border: 'none', backgroundColor: '#333', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
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
            )}
        </div>
    );
};

export default TreeSurveySimulator;
