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
    health_score: number;
    latitude: number;
    longitude: number;
    measured_at: string;
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
                const serverHost = window.location.hostname;
                const response = await fetch(`http://${serverHost}:8000/api/measurements`);
                if (response.ok) {
                    const data = await response.json();
                    const validTrees = data.filter((t: any) =>
                        t.latitude !== null && t.longitude !== null &&
                        t.latitude !== 0 && t.longitude !== 0
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
                const popupContent = `
                    <div style="min-width: 150px;">
                        <h3 style="margin: 0 0 10px 0; borderBottom: 1px solid #ddd; padding-bottom: 5px;">${tree.species}</h3>
                        <div style="font-size: 13px; line-height: 1.6;">
                            <strong>ID:</strong> ${tree.id}<br />
                            <strong>흉고직경 (DBH):</strong> ${tree.dbh} cm<br />
                            <strong>수고:</strong> ${tree.height} m<br />
                            <strong>측정일:</strong> ${new Date(tree.measured_at).toLocaleDateString()}<br />
                            <span style="font-size: 11px; color: #666;">Lat: ${tree.latitude.toFixed(6)}</span>
                        </div>
                    </div>
                `;

                const marker = L.marker([tree.latitude, tree.longitude], { icon: DefaultIcon })
                    .bindPopup(popupContent)
                    .addTo(markersLayer.current!);

                // 마지막 마커(가장 최근 등록) 저장
                if (index === sortedTrees.length - 1) {
                    latestMarker = marker;
                }
            });

            // 마지막 데이터 위치로 시점 이동 및 팝업 열기
            if (latestMarker) {
                const lastTree = sortedTrees[sortedTrees.length - 1];
                mapInstance.current.setView([lastTree.latitude, lastTree.longitude], 17); // 조금 더 줌인하여 강조

                // 마운트 직후나 대량 데이터 처리 시 팝업 열기가 무시될 수 있으므로 약간의 지연 후 실행
                setTimeout(() => {
                    latestMarker?.openPopup();
                }, 100);
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
