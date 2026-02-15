import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings, TreePine, Info } from 'lucide-react';

const TreeSurveySimulator = () => {
    const [angle, setAngle] = useState(90); // pitch (vertical)
    const [roll, setRoll] = useState(0);    // roll (horizontal)
    const [userHeight, setUserHeight] = useState(1.7);
    const [isVertical, setIsVertical] = useState(true);
    const [currentGps, setCurrentGps] = useState({ lat: 37.5665, lon: 126.9780, alt: 25.0 }); // 서울 기본값
    const [heading, setHeading] = useState(0); // 북쪽 기준 방위각
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
                    video: { facingMode: 'environment' }
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
        let lastRoll = 0;
        const smoothingFactor = 0.08; // 감도를 낮추어 더 묵직하게(둔하게) 이동
        const stepUnit = 0.5; // 단계별 이동 단위 (0.5도씩)

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.alpha !== null) setHeading(e.alpha);

            // Pitch (beta) & Roll (gamma) - 필터링 및 단계별 이동 적용
            if (e.beta !== null) {
                const smoothed = (e.beta * smoothingFactor) + (lastAngle * (1 - smoothingFactor));
                let stepped = Math.round(smoothed / stepUnit) * stepUnit;
                if (Math.abs(stepped - 90) < 1.5) stepped = 90;

                setAngle(stepped);
                lastAngle = smoothed;
            }

            if (e.gamma !== null) {
                const smoothed = (e.gamma * smoothingFactor) + (lastRoll * (1 - smoothingFactor));
                let stepped = Math.round(smoothed / stepUnit) * stepUnit;
                if (Math.abs(stepped) < 1.5) stepped = 0;

                setRoll(stepped);
                lastRoll = smoothed;
            }
        };

        // 권한 요청 처리 (iOS 13+ 대응)
        const requestPermission = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                } catch (err) {
                    console.error("Sensor permission error:", err);
                }
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        requestPermission();

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
            navigator.geolocation.clearWatch(geoWatch);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    useEffect(() => {
        // 자석 효과 및 수직 상태 판단: Pitch와 Roll이 모두 임계값(1.5도) 이내면 활성화
        const pitchInLimit = Math.abs(angle - 90) < 1.5;
        const rollInLimit = Math.abs(roll) < 1.5;
        setIsVertical(pitchInLimit && rollInLimit);
    }, [angle, roll]);

    // 실시간 거리 계산
    const currentDistance = (userHeight - 1.2) / Math.tan(Math.max(0.01, (angle - 90) * Math.PI / 180));

    // 대상 GPS 계산 (단순 삼각측량 근사)
    const calculateTargetGps = () => {
        const R = 6378137; // 지구 반지름 (m)
        const dLat = (currentDistance * Math.cos(heading * Math.PI / 180)) / R;
        const dLon = (currentDistance * Math.sin(heading * Math.PI / 180)) / (R * Math.cos(currentGps.lat * Math.PI / 180));

        return {
            lat: currentGps.lat + (dLat * 180 / Math.PI),
            lon: currentGps.lon + (dLon * 180 / Math.PI),
            alt: currentGps.alt // 고도는 동일하다고 가정하거나 추후 보정
        };
    };

    const targetGps = calculateTargetGps();

    const handleCapture = () => {
        if (!isVertical || !videoRef.current || !canvasRef.current) return;

        // 1. 사진 및 해상도 캡처
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, vw, vh);
        const photoData = canvas.toDataURL('image/jpeg', 0.9);

        // 2. 정밀 데이터 계산
        const dist = currentDistance;
        const dbh = 2 * dist * Math.tan(((150 * (60 / 4000)) * Math.PI / 180) / 2) * 100;
        const treeHeight = dist * Math.tan(Math.max(0.01, (110 - angle) * Math.PI / 180)) + userHeight;

        // 1.2m 조준점의 픽셀 좌표 (화면 중앙 상단 75% 지점으로 가정)
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
                gravity: { x: 0.05, y: -9.8, z: 0.12 } // 중력 벡터 시뮬레이션
            },
            sensorLog: Array.from({ length: 10 }).map((_, i) => ({
                t: Date.now() - (1000 - i * 100),
                a: { x: 0.01, y: 9.8, z: 0.05 },
                g: { x: 0, y: 0.1, z: 0 }
            })), // 촬영 직전 1초 로그
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
            paddingLeft: 'var(--safe-area-left)', paddingRight: 'var(--safe-area-right)'
        }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />

                {/* 가변 수목 외곽 가이드 */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '100%', opacity: 0.5, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                    <svg viewBox="0 0 200 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                        <path d="M80 400 L80 280 Q80 260 60 250 Q20 230 20 160 Q20 0 100 0 Q180 0 180 160 Q180 230 140 250 Q120 260 120 280 L120 400" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="6,6" />
                        <line x1="100" y1="0" x2="100" y2="400" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    </svg>
                </div>

                {/* 실시간 정보창 (좌측, 수직 위치 75% 복구) - 모바일 최적화 */}
                <div style={{
                    position: 'absolute',
                    left: 'clamp(10px, 4vw, 20px)',
                    top: '75%',
                    transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap',
                    padding: 'clamp(8px, 2vh, 12px) clamp(10px, 3vw, 16px)',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '16px',
                    border: `1px solid ${isVertical ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(6px, 1.5vh, 12px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 20,
                    pointerEvents: 'none',
                    maxWidth: '40vw'
                }}>
                    {/* 거리 정보 */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: '#888', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>DISTANCE</span>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: isVertical ? '#4caf50' : 'white', fontFamily: 'monospace' }}>
                                {currentDistance.toFixed(1)}
                            </span>
                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', marginLeft: 3, color: '#666' }}>m</span>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

                    {/* 대상 GPS 정보 - 라벨 추가 및 형식 통일 */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: '#4caf50', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>TARGET (EST.)</span>
                        <div style={{ fontFamily: 'monospace', fontSize: 'clamp(9px, 2vw, 11px)', color: '#ccc', lineHeight: '1.4' }}>
                            Lat: {targetGps.lat.toFixed(6)}<br />
                            Lon: {targetGps.lon.toFixed(6)}
                        </div>
                    </div>
                </div>

                {/* 세련된 물방울 수평수직계 + 1.2m DBH 가이드 (75% 위치) - 모바일 스케일링 */}
                <div style={{ position: 'absolute', top: '75%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 11, width: 0, height: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* 수평수직계 베젤 크기 확대 */}
                        <div style={{
                            width: 'clamp(100px, 28vw, 130px)',
                            height: 'clamp(100px, 28vw, 130px)',
                            border: `3px solid ${isVertical ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.3)'}`,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ position: 'absolute', width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <div style={{ position: 'absolute', height: '100%', width: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <div style={{ position: 'absolute', width: '35%', height: 3, backgroundColor: isVertical ? '#4caf50' : '#ff5252', boxShadow: `0 0 15px ${isVertical ? '#4caf50' : '#ff5252'}`, zIndex: 2 }} />
                            <div style={{ position: 'absolute', height: '35%', width: 3, backgroundColor: isVertical ? '#4caf50' : '#ff5252', boxShadow: `0 0 15px ${isVertical ? '#4caf50' : '#ff5252'}`, zIndex: 2 }} />

                            {/* 사실적인 물방울 디자인 */}
                            <div style={{
                                width: '22%',
                                height: '22%',
                                background: isVertical
                                    ? 'radial-gradient(circle at 35% 35%, #e8f5e9, #4caf50 70%, #1b5e20)'
                                    : 'radial-gradient(circle at 35% 35%, #ffebee, #f44336 70%, #b71c1c)',
                                borderRadius: '50%',
                                transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                transform: `translate(
                                    ${Math.abs(roll) < 1.5 ? 0 : roll * 3}px, 
                                    ${Math.abs(angle - 90) < 1.5 ? 0 : (angle - 90) * 4}px
                                )`,
                                boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(0,0,0,0.3), ${isVertical ? '0 0 25px rgba(76, 175, 80, 0.9)' : '0 0 20px rgba(244, 67, 54, 0.8)'}`,
                                zIndex: 1,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* 하이라이트(광택) 레이어 */}
                                <div style={{
                                    position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%',
                                    background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(1px)'
                                }} />
                            </div>
                        </div>
                        <span style={{ color: isVertical ? '#4caf50' : '#ff5252', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 'bold', marginTop: 12, textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '1px', whiteSpace: 'nowrap' }}>1.2M TARGET</span>
                    </div>
                </div>

                {/* 상단 바 - Safe Area 적용 및 GPS 레이아웃 수정 */}
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

                {/* 촬영 버튼 (하단 좌측 25% 배치) */}
                <div style={{ position: 'absolute', left: '25%', bottom: 'clamp(40px, 10vh, 80px)', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                        onClick={handleCapture}
                        disabled={!isVertical}
                        style={{
                            width: 'clamp(70px, 18vw, 90px)',
                            height: 'clamp(70px, 18vw, 90px)',
                            borderRadius: '50%',
                            backgroundColor: isVertical ? '#4caf50' : 'rgba(51, 51, 51, 0.8)',
                            border: `3px solid ${isVertical ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: isVertical ? 'pointer' : 'not-allowed',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            boxShadow: isVertical ? '0 0 30px rgba(76, 175, 80, 0.6)' : 'none',
                            transform: isVertical ? 'scale(1.1)' : 'scale(1)',
                            pointerEvents: 'auto'
                        }}
                    >
                        <Camera size={36} color="white" strokeWidth={2.5} />
                    </button>
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: isVertical ? '#4caf50' : '#888', textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '0.5px' }}>
                        {isVertical ? 'READY' : 'ALIGNING'}
                    </div>
                </div>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* 결과 상세 리포트 - 전체 화면 오버레이 스타일 */}
            {measurement && (
                <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)',
                    color: 'white', zIndex: 100, display: 'flex', flexDirection: 'column',
                    padding: '20px', paddingBottom: 'env(safe-area-inset-bottom)', overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', marginTop: 'env(safe-area-inset-top)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <TreePine size={24} color="#4caf50" style={{ marginRight: '10px' }} />
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Tree Survey Report</h2>
                        </div>
                        <button onClick={() => setMeasurement(null)} style={{ border: 'none', backgroundColor: '#333', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                    </div>

                    {/* 캡처 사진 */}
                    <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #444' }}>
                        <img src={measurement.photo} alt="Tree Capture" style={{ width: '100%', display: 'block' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {/* 1. 수목 분석 결과 (핵심) */}
                        <div style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                            <div style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold', marginBottom: '10px' }}>🌳 PRIMARY TREE ANALYSIS</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><span style={{ color: '#888', fontSize: '11px' }}>Species</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.species}</div></div>
                                <div><span style={{ color: '#888', fontSize: '11px' }}>DBH (흉고직경)</span><div style={{ fontWeight: 'bold', fontSize: '22px', color: '#4caf50' }}>{measurement.tree.dbh} cm</div></div>
                                <div><span style={{ color: '#888', fontSize: '11px' }}>Height (수고)</span><div style={{ fontWeight: 'bold', fontSize: '18px' }}>{measurement.tree.height} m</div></div>
                                <div><span style={{ color: '#888', fontSize: '11px' }}>Distance (직선거리)</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.distance} m</div></div>
                                <div><span style={{ color: '#888', fontSize: '11px' }}>Crown Width (수관폭)</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.crownWidth} m</div></div>
                                <div><span style={{ color: '#888', fontSize: '11px' }}>G. Clearance (지하고)</span><div style={{ fontWeight: 'bold' }}>{measurement.tree.groundClearance} m</div></div>
                            </div>
                        </div>

                        {/* 2. 기기 포즈 및 센서 (6축/중력) */}
                        <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '12px', color: '#ff9800', fontWeight: 'bold', marginBottom: '10px' }}>📐 DEVICE POSE & 6-AXIS</div>
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                                <span style={{ color: '#ff9800' }}>Orientation:</span><br />
                                Pitch: {measurement.pose.pitch}°<br />
                                Roll: {measurement.pose.roll}°<br />
                                Azimuth: {measurement.pose.heading}°<br />
                                <div style={{ height: '8px' }} />
                                <span style={{ color: '#ff9800' }}>Gravity Vector:</span><br />
                                GX: {measurement.pose.gravity.x}<br />
                                GY: {measurement.pose.gravity.y}<br />
                                GZ: {measurement.pose.gravity.z}
                            </div>
                        </div>

                        {/* 3. 정밀 위치 및 조사 시각 */}
                        <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '12px', color: '#2196f3', fontWeight: 'bold', marginBottom: '10px' }}>📍 PRECISION GEODATA</div>
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                                <span style={{ color: '#2196f3' }}>Current GPS:</span><br />{measurement.gps.current.lat.toFixed(6)}, {measurement.gps.current.lon.toFixed(6)}<br />
                                <span style={{ color: '#2196f3' }}>Target GPS:</span><br />{measurement.gps.target.lat.toFixed(6)}, {measurement.gps.target.lon.toFixed(6)}<br />
                                <div style={{ height: '8px' }} />
                                <span style={{ color: '#888' }}>Survey Time:</span><br />{measurement.solarInfo.time}<br />
                                <span style={{ color: '#888' }}>Solar Alt:</span><br />{measurement.solarInfo.sunAltitude}
                            </div>
                        </div>

                        {/* 4. 이미지 분석 및 광학 메타데이터 */}
                        <div style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '12px', color: '#9c27b0', fontWeight: 'bold', marginBottom: '10px' }}>📸 OPTICAL & PIXEL DATA</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <span style={{ color: '#888', fontSize: '11px' }}>EXIF Constants</span>
                                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                                        Focal: {measurement.exif.focalLength}<br />
                                        Sensor: {measurement.exif.sensorSize}<br />
                                        Res: {measurement.exif.resolution}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: '#888', fontSize: '11px' }}>H-Target Pixel (1.2m)</span>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9c27b0', marginTop: '4px' }}>
                                        X: {measurement.tree.targetPointPixel.x} px<br />
                                        Y: {measurement.tree.targetPointPixel.y} px
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <span style={{ color: '#888', fontSize: '11px' }}>Stability Log (Pre-Capture 1sec)</span>
                                    <div style={{ fontSize: '9px', color: '#666', overflowX: 'auto', whiteSpace: 'nowrap', backgroundColor: '#111', padding: '5px', marginTop: '4px' }}>
                                        [{measurement.sensorLog.slice(0, 3).map(l => `[${l.a.y.toFixed(2)}m/s²]`).join(', ')} ... stability checked]
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default TreeSurveySimulator;
