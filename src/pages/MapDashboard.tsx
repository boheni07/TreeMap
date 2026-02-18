import React, { useEffect, useState } from 'react';
import TreeViewMap from '../components/TreeViewMap';
import AdminLayout from '../components/AdminLayout';

interface TreeData {
    id: number;
    dbh: number;
    height: number;
    species: string;
    healthScore: number;
    deviceLatitude?: number;
    deviceLongitude?: number;
    treeLatitude?: number;
    treeLongitude?: number;
    adjustedTreeLatitude?: number;
    adjustedTreeLongitude?: number;
    measured_at: string;
}

const MapDashboard = () => {
    const [trees, setTrees] = useState<TreeData[]>([]);
    const [stats, setStats] = useState({ total: 0, avgDbh: 0 });

    const [focusTarget, setFocusTarget] = useState<{ lat: number, lng: number, id: number } | null>(null);

    // 선택된 항목이 목록 뷰바깥에 있을 경우 자동 스크롤
    useEffect(() => {
        if (focusTarget?.id) {
            const element = document.getElementById(`activity-item-${focusTarget.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [focusTarget]);

    useEffect(() => {
        fetchTrees();
    }, []);

    const fetchTrees = async () => {
        try {
            const response = await fetch(`/api/measurements`);
            if (response.ok) {
                const data = await response.json();
                setTrees(data);

                // 통계 계산
                const total = data.length;
                const avgDbh = total > 0
                    ? data.reduce((acc: number, cur: TreeData) => acc + cur.dbh, 0) / total
                    : 0;
                setStats({ total, avgDbh });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleTreeClick = (tree: TreeData) => {
        // 좌표 우선순위: 보정 > 산정 > 기기
        const lat = tree.adjustedTreeLatitude ?? tree.treeLatitude ?? tree.deviceLatitude ?? 0;
        const lng = tree.adjustedTreeLongitude ?? tree.treeLongitude ?? tree.deviceLongitude ?? 0;

        if (lat !== 0 && lng !== 0) {
            setFocusTarget({ lat, lng, id: tree.id });
        } else {
            alert("위치 정보가 없는 데이터입니다.");
        }
    };

    return (
        <AdminLayout>
            {/* 왼쪽 사이드바 (정보창/통계) */}
            <aside style={{
                width: '320px', backgroundColor: '#1e293b', borderRight: '1px solid #334155',
                padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10
            }}>
                <div>
                    <h2 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                        Survey Overview
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TOTAL MEASUREMENTS</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#10b981' }}>{stats.total}</div>
                        </div>
                        <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>AVERAGE DBH (CM)</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#3b82f6' }}>{stats.avgDbh.toFixed(1)}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <h2 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                        Recent Activity (Last 10)
                    </h2>
                    <div style={{ fontSize: '13px', color: '#64748b', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                        {trees.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {trees.slice(-10).reverse().map(tree => (
                                    <li
                                        key={tree.id}
                                        id={`activity-item-${tree.id}`}
                                        onClick={() => handleTreeClick(tree)}
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #334155',
                                            backgroundColor: focusTarget?.id === tree.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                            borderLeft: focusTarget?.id === tree.id ? '3px solid #10b981' : '3px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            borderRadius: '0 4px 4px 0'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = focusTarget?.id === tree.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent';
                                        }}
                                    >
                                        <div style={{ color: '#e2e8f0', fontWeight: '500', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{tree.species}</span>
                                            <span style={{ fontSize: '10px', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px' }}>ID: {tree.id}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                            {new Date(tree.measured_at).toLocaleString()}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : "No recent activity"}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#10b981', lineHeight: '1.5' }}>
                        <strong>TIP:</strong> 목록을 클릭하면 해당 위치로 이동합니다.
                    </p>
                </div>
            </aside>

            {/* 지도 영역 */}
            <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
                <TreeViewMap
                    focusTarget={focusTarget}
                    onSelectTarget={(target) => setFocusTarget(target)}
                />
            </div>
        </AdminLayout>
    );
};

export default MapDashboard;
