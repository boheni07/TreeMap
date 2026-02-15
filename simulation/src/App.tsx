import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings, TreePine, Info } from 'lucide-react';

const TreeSurveySimulator = () => {
    const [angle, setAngle] = useState(90);
    const [userHeight, setUserHeight] = useState(1.7);
    const [isVertical, setIsVertical] = useState(true);
    const [measurement, setMeasurement] = useState<{ dbh: number; height: number; species: string } | null>(null);
    const [currentGps, setCurrentGps] = useState({ lat: 37.5665, lon: 126.9780, alt: 25.0 }); // 서울 기본값
    const [heading, setHeading] = useState(0); // 북쪽 기준 방위각
    const videoRef = useRef<HTMLVideoElement>(null);

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
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.alpha !== null) setHeading(e.alpha);

            // beta: 앞뒤 기울기 (-180 ~ 180), 기기를 세웠을 때 약 90도
            if (e.beta !== null) {
                // 부드러운 움직임을 위해 일부 보정하거나 그대로 사용
                // 여기서는 시뮬레이터 로직에 맞게 beta 값을 angle로 직접 사용
                setAngle(e.beta);
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
        // 자석 효과: 1.5도 이내면 수직(isVertical)으로 판단
        setIsVertical(Math.abs(angle - 90) < 1.5);
    }, [angle]);

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
        if (!isVertical) return;

        const dbh = 2 * currentDistance * Math.tan(((150 * (60 / 4000)) * Math.PI / 180) / 2) * 100;

        setMeasurement({
            dbh: parseFloat(dbh.toFixed(1)),
            height: 12.5,
            species: "소나무 (Pinus densiflora)"
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
                                transition: 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                transform: `translateY(${Math.abs(angle - 90) < 1.5 ? 0 : (angle - 90) * 4}px)`,
                                boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(0,0,0,0.3), ${isVertical ? '0 0 20px rgba(76, 175, 80, 0.8)' : '0 0 20px rgba(244, 67, 54, 0.8)'}`,
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

                {/* 하단 제어부 - Safe Area 하단 여백 및 터치 최적화 */}
                <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '20px 20px clamp(40px, 10vh, 80px) 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 30 }}>
                    <button
                        onClick={handleCapture}
                        disabled={!isVertical}
                        style={{
                            width: 'clamp(70px, 18vw, 85px)',
                            height: 'clamp(70px, 18vw, 85px)',
                            borderRadius: '50%',
                            backgroundColor: isVertical ? '#4caf50' : '#333',
                            border: 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: isVertical ? 'pointer' : 'not-allowed',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            boxShadow: isVertical ? '0 0 25px rgba(76, 175, 80, 0.6)' : 'none',
                            transform: isVertical ? 'scale(1.05)' : 'scale(1)'
                        }}
                    >
                        <Camera size={32} color="white" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* 결과 패널 */}
            {measurement && (
                <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderTop: '1px solid #444', borderRadius: '20px 20px 0 0', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <Info size={18} color="#4caf50" style={{ marginRight: '8px' }} />
                        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>측정 완료</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888' }}>수종</div>
                            <div style={{ fontWeight: 'bold' }}>{measurement.species}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888' }}>흉고직경 (DBH)</div>
                            <div style={{ fontWeight: 'bold', fontSize: '20px' }}>{measurement.dbh} cm</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888' }}>수고 (Height)</div>
                            <div style={{ fontWeight: 'bold' }}>{measurement.height} m</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888' }}>대상 위치 (Lat)</div>
                            <div style={{ fontWeight: 'bold' }}>{targetGps.lat.toFixed(6)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888' }}>대상 위치 (Lon)</div>
                            <div style={{ fontWeight: 'bold' }}>{targetGps.lon.toFixed(6)}</div>
                        </div>
                    </div>
                    <button onClick={() => setMeasurement(null)} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>닫기</button>
                </div>
            )
            }
        </div >
    );
};

export default TreeSurveySimulator;
