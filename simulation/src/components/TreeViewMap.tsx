import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 마커 아이콘 설정 (React 환경에서는 아이콘 경로 문제로 수동 설정이 필요할 수 있음)
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

// 지도를 특정 좌표로 이동시키는 컴포넌트
const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    map.setView(center, 16);
    return null;
};

const TreeViewMap = () => {
    const [trees, setTrees] = useState<TreeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTrees();
    }, []);

    const fetchTrees = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/measurements');
            if (response.ok) {
                const data = await response.json();
                setTrees(data);
            }
        } catch (error) {
            console.error('Failed to fetch trees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 초기 중심 좌표 (데이터가 없으면 서울 중심, 있으면 가장 최근 데이터 기준)
    const mapCenter: [number, number] = trees.length > 0
        ? [trees[trees.length - 1].latitude, trees[trees.length - 1].longitude]
        : [37.5665, 126.9780];

    if (isLoading) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', color: '#fff' }}>
                지도 데이터를 불러오는 중...
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ChangeView center={mapCenter} />
                {trees.map((tree) => (
                    <Marker key={tree.id} position={[tree.latitude, tree.longitude]}>
                        <Popup>
                            <div style={{ minWidth: '150px' }}>
                                <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>{tree.species}</h3>
                                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                    <strong>ID:</strong> {tree.id}<br />
                                    <strong>흉고직경 (DBH):</strong> {tree.dbh} cm<br />
                                    <strong>수고:</strong> {tree.height} m<br />
                                    <strong>건강도:</strong> {tree.health_score} 점<br />
                                    <strong>측정일:</strong> {new Date(tree.measured_at).toLocaleDateString()}<br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>Lat: {tree.latitude.toFixed(6)}, Lon: {tree.longitude.toFixed(6)}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* 데이터 새로고침 버튼 */}
            <button
                onClick={fetchTrees}
                style={{
                    position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
                    padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer',
                    backdropFilter: 'blur(5px)', fontWeight: 'bold'
                }}
            >
                데이터 새로고침
            </button>
        </div>
    );
};

export default TreeViewMap;
