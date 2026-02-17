import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 마커 아이콘 설정
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface TreeData {
    id: number;
    dbh: number;
    height: number;
    species: string;
    healthScore: number;

    // 위치 정보
    deviceLatitude?: number;  // 기기 위치 (스마트폰 GPS)
    deviceLongitude?: number;
    treeLatitude?: number;  // 나무 위치 (계산된 피사체 위치)
    treeLongitude?: number;
    adjustedTreeLatitude?: number; // 사용자 보정 위치
    adjustedTreeLongitude?: number;

    measured_at: string;

    // IMU 데이터
    accelerometerX?: number;
    accelerometerY?: number;
    accelerometerZ?: number;
    gyroscopeX?: number;
    gyroscopeY?: number;
    gyroscopeZ?: number;
    magnetometerX?: number;
    magnetometerY?: number;
    magnetometerZ?: number;
    devicePitch?: number;
    deviceRoll?: number;
    deviceAzimuth?: number;

    // 환경 센서 데이터
    ambientLight?: number;
    pressure?: number;
    altitude?: number;
    temperature?: number;

    // 카메라 메타데이터
    imageWidth?: number;
    imageHeight?: number;
    focalLength?: number;
    cameraDistance?: number;

    // 시스템 정보
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
}

const TreeViewMap = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);

    const [trees, setTrees] = useState<TreeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 데이터 가져오기
    useEffect(() => {
        const fetchTrees = async () => {
            try {
                const response = await fetch(`/api/measurements`);
                if (response.ok) {
                    const data = await response.json();
                    const validTrees = data.filter((t: any) =>
                        (t.treeLatitude != null || t.deviceLatitude != null) &&
                        (t.treeLatitude !== 0 || t.deviceLatitude !== 0)
                    );
                    setTrees(validTrees);
                }
            } catch (error) {
                console.error('Failed to fetch trees:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrees();
    }, []);

    // 2. 지도 초기화 (컨테이너가 DOM에 상주하므로 로딩 상태와 관계없이 안전하게 체크)
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        console.log("Initializing Leaflet map...");

        // 지도 객체 생성
        const map = L.map(mapRef.current, {
            zoomControl: false,
            center: [37.5665, 126.9780],
            zoom: 16
        });

        // 타일 레이어 추가
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // 마커 레이어 그룹 생성
        const layerGroup = L.layerGroup().addTo(map);

        mapInstance.current = map;
        markersLayer.current = layerGroup;

        // 즉시 크기 보정
        map.invalidateSize();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // 3. 로딩이 끝났을 때 지도 크기 재인식
    useEffect(() => {
        if (!isLoading && mapInstance.current) {
            setTimeout(() => {
                mapInstance.current?.invalidateSize();
            }, 50);
        }
    }, [isLoading]);

    // 4. 데이터 변경 시 마커 업데이트 및 시점 이동 (최신 데이터 센터)
    useEffect(() => {
        if (!mapInstance.current || !markersLayer.current) return;

        // 기존 마커 제거
        markersLayer.current.clearLayers();

        if (trees.length > 0) {
            let latestMarker: L.Marker | null = null;

            // 데이터 정렬 (ID 순으로 정렬하여 마지막이 가장 최근임이 확실하게 함)
            const sortedTrees = [...trees].sort((a, b) => a.id - b.id);


            sortedTrees.forEach((tree, index) => {
                // 센서 데이터 유무 확인 (null과 undefined 모두 체크)
                const hasSensorData = tree.devicePitch != null || tree.ambientLight != null;

                const popupContent = `
                    <div style="min-width: 280px; max-width: 400px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        ${tree.image_data ? `
                        <div style="position: relative; margin-bottom: 12px;">
                            <img src="${tree.image_data}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
                            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px;">ID: ${tree.id}</div>
                        </div>
                        ` : ''}
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">
                            <h3 style="margin: 0; color: #2c3e50; font-size: 1.2em;">${tree.species}</h3>
                            <span style="font-size: 11px; color: #666;">${new Date(tree.measured_at).toLocaleString('ko-KR')}</span>
                        </div>
                        
                        <!-- 주요 측정 수치 (Grid) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 15px; background: #f0f4f7; padding: 12px; border-radius: 10px; border: 1px solid #e0e6ed;">
                            <div style="text-align: center; border-right: 1px solid #d1d9e6;">
                                <div style="font-size: 9px; color: #78909c; font-weight: bold; text-transform: uppercase;">Chest DBH</div>
                                <div style="font-size: 18px; color: #d32f2f; font-weight: 900;">${tree.dbh}<small style="font-size: 10px; font-weight: 400; margin-left:1px;">cm</small></div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 9px; color: #78909c; font-weight: bold; text-transform: uppercase;">Total Height</div>
                                <div style="font-size: 18px; color: #2e7d32; font-weight: 900;">${tree.height}<small style="font-size: 10px; font-weight: 400; margin-left:1px;">m</small></div>
                            </div>
                            <div style="text-align: center; border-right: 1px solid #d1d9e6; margin-top: 8px; pt: 8px; border-top: 1px solid #d1d9e6;">
                                <div style="font-size: 9px; color: #78909c; font-weight: bold; text-transform: uppercase;">Crown Width</div>
                                <div style="font-size: 16px; color: #1b5e20; font-weight: 800;">${tree.crown_width || '-'}<small style="font-size: 10px; font-weight: 400;">m</small></div>
                            </div>
                            <div style="text-align: center; margin-top: 8px; pt: 8px; border-top: 1px solid #d1d9e6;">
                                <div style="font-size: 9px; color: #78909c; font-weight: bold; text-transform: uppercase;">Ground Clr.</div>
                                <div style="font-size: 16px; color: #0277bd; font-weight: 800;">${tree.ground_clearance || '-'}<small style="font-size: 10px; font-weight: 400;">m</small></div>
                            </div>
                        </div>

                        <div style="max-height: 250px; overflow-y: auto; padding-right: 5px; font-size: 12px; line-height: 1.6;">
                            <!-- 건강도 및 기본 정보 -->
                            <div style="background: #ffffff; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #4CAF50; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <strong>🌿 생육 상태 및 정보</strong><br/>
                                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                                    <span>활력도(Health):</span>
                                    <span style="font-weight: bold; color: ${tree.healthScore > 70 ? '#2e7d32' : '#f57c00'}">${tree.healthScore}%</span>
                                </div>
                            </div>
                            
                            <!-- 센서 및 환경 -->
                            <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #2196F3;">
                                <strong>📱 기기 센서 및 환경</strong><br/>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 5px; font-size: 11px;">
                                    ${tree.devicePitch != null ? `<div>Pitch: ${tree.devicePitch.toFixed(1)}°</div>` : ''}
                                    ${tree.deviceRoll != null ? `<div>Roll: ${tree.deviceRoll.toFixed(1)}°</div>` : ''}
                                    ${tree.deviceAzimuth != null ? `<div>Azimuth: ${tree.deviceAzimuth.toFixed(1)}°</div>` : ''}
                                    ${tree.ambientLight != null ? `<div>Light: ${tree.ambientLight.toFixed(0)} lx</div>` : ''}
                                    ${tree.pressure != null ? `<div>Pressure: ${tree.pressure.toFixed(1)} hPa</div>` : ''}
                                    ${tree.temperature != null ? `<div>Temp: ${tree.temperature.toFixed(1)}°C</div>` : ''}
                                    ${tree.altitude != null ? `<div>Altitude: ${tree.altitude.toFixed(1)} m</div>` : ''}
                                </div>
                            </div>

                            <!-- IMU 원시 데이터 -->
                            ${tree.accelerometerX != null || tree.gyroscopeX != null ? `
                            <div style="background: #f1f8e9; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #8bc34a;">
                                <strong>📊 IMU Raw Data</strong>
                                <div style="font-size: 10px; color: #555; margin-top: 4px;">
                                    ${tree.accelerometerX != null ? `<div>Acc: ${tree.accelerometerX.toFixed(3)}, ${tree.accelerometerY?.toFixed(3)}, ${tree.accelerometerZ?.toFixed(3)}</div>` : ''}
                                    ${tree.gyroscopeX != null ? `<div>Gyro: ${tree.gyroscopeX.toFixed(4)}, ${tree.gyroscopeY?.toFixed(4)}, ${tree.gyroscopeZ?.toFixed(4)}</div>` : ''}
                                    ${tree.magnetometerX != null ? `<div>Mag: ${tree.magnetometerX.toFixed(1)}, ${tree.magnetometerY?.toFixed(1)}, ${tree.magnetometerZ?.toFixed(1)}</div>` : ''}
                                </div>
                            </div>
                            ` : ''}

                            <!-- 카메라 및 시스템 -->
                            <div style="background: #fff3e0; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ff9800;">
                                <strong>📷 촬영 및 기기 정보</strong><br/>
                                <div style="font-size: 11px; margin-top: 4px;">
                                    <strong>해상도:</strong> ${tree.imageWidth} × ${tree.imageHeight}<br/>
                                    <strong>초점/거리:</strong> ${tree.focalLength}mm / ${tree.cameraDistance}m<br/>
                                    <strong>기기:</strong> ${tree.deviceModel} (${tree.osVersion})
                                </div>
                            </div>

                            <!-- GPS 정보 (정밀 비교) -->
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; border-left: 4px solid #607d8b;">
                                <strong style="color: #455a64;">📍 위치 정보 (3종 통합)</strong>
                                <div style="margin-top: 6px; font-size: 10.5px; color: #333;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                        <span style="color: #78909c;">📱 기기 GPS:</span>
                                        <span style="font-family: monospace;">${tree.deviceLatitude?.toFixed(7)}, ${tree.deviceLongitude?.toFixed(7)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                        <span style="color: #78909c;">🌳 산정 위치:</span>
                                        <span style="font-family: monospace;">${tree.treeLatitude?.toFixed(7)}, ${tree.treeLongitude?.toFixed(7)}</span>
                                    </div>
                                    ${tree.adjustedTreeLatitude ? `
                                    <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px dotted #bccad1; color: #d32f2f; font-weight: bold;">
                                        <span>📍 최종 보정:</span>
                                        <span style="font-family: monospace;">${tree.adjustedTreeLatitude.toFixed(7)}, ${tree.adjustedTreeLongitude?.toFixed(7)}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // 마커 수순: 보정 위치 > 나무 위치 > 기기 위치
                const markerLat = tree.adjustedTreeLatitude ?? tree.treeLatitude ?? tree.deviceLatitude ?? 0;
                const markerLon = tree.adjustedTreeLongitude ?? tree.treeLongitude ?? tree.deviceLongitude ?? 0;

                if (markerLat !== 0 && markerLon !== 0) {
                    const marker = L.marker([markerLat, markerLon], { icon: DefaultIcon })
                        .bindPopup(popupContent, { maxWidth: 400 })
                        .addTo(markersLayer.current!);

                    // 마지막 마커(가장 최근 등록) 저장
                    if (index === sortedTrees.length - 1) {
                        latestMarker = marker;
                    }
                }
            });


            // 마지막 데이터 위치로 시점 이동 및 팝업 열기
            if (latestMarker) {
                const lastTree = sortedTrees[sortedTrees.length - 1];
                const viewLat = lastTree.treeLatitude ?? lastTree.deviceLatitude ?? 0;
                const viewLon = lastTree.treeLongitude ?? lastTree.deviceLongitude ?? 0;

                if (viewLat !== 0 && viewLon !== 0) {
                    console.log(`Auto-focusing on latest tree: ${lastTree.species} at [${viewLat}, ${viewLon}]`);

                    // 지도가 완전히 렌더링된 후 이동하도록 지연 시간 최적화
                    setTimeout(() => {
                        if (mapInstance.current) {
                            mapInstance.current.flyTo([viewLat, viewLon], 18, {
                                animate: true,
                                duration: 1.5
                            });

                            // 이동 애니메이션이 끝난 후 팝업 열기
                            setTimeout(() => {
                                latestMarker?.openPopup();
                            }, 1600);
                        }
                    }, 300);
                }
            }
        }
    }, [trees]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#111' }}>
            {/* 컨테이너를 항상 렌더링하여 Ref가 유실되지 않도록 함 */}
            <div ref={mapRef} style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
            }} />

            {/* 로딩 오버레이 */}
            {isLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backgroundColor: '#1a1a1a', color: '#fff', zIndex: 1000
                }}>
                    지도 및 수목 데이터를 불러오는 중...
                </div>
            )}

            {/* 데이터 새로고침 버튼 */}
            {!isLoading && (
                <button
                    onClick={() => {
                        window.location.reload();
                    }}
                    style={{
                        position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
                        padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer',
                        backdropFilter: 'blur(5px)', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}
                >
                    데이터 새로고침
                </button>
            )}
        </div>
    );
};

export default TreeViewMap;
