import React, { useEffect, useState } from 'react';
import TreeViewMap from '../components/TreeViewMap';
import { Database, LayoutDashboard, List, TreeDeciduous } from 'lucide-react';

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

const MapDashboard = () => {
    const [trees, setTrees] = useState<TreeData[]>([]);
    const [stats, setStats] = useState({ total: 0, avgDbh: 0 });

    useEffect(() => {
        fetchTrees();
    }, []);

    const fetchTrees = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/measurements');
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

    return (
        <div style={{
            width: '100vw', height: '100dvh', backgroundColor: '#0f172a', color: '#f8fafc',
            display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* 상단 네비게이션바 */}
            <header style={{
                height: '60px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', zIndex: 1001, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#10b981', padding: '6px', borderRadius: '8px' }}>
                        <TreeDeciduous size={20} color="white" />
                    </div>
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.025em' }}>
                        TreeMap Admin Service
                    </h1>
                </div>

                <nav style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', cursor: 'pointer', fontWeight: '500' }}>
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                        <List size={18} />
                        <span>Measurements</span>
                    </div>
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', padding: '4px 12px', border: '1px solid #334155', borderRadius: '20px' }}>
                        Server: Connected
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
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

                    <div style={{ marginTop: '20px' }}>
                        <h2 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                            Recent Activity
                        </h2>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {trees.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '200px' }}>
                                    {trees.slice(-5).reverse().map(tree => (
                                        <li key={tree.id} style={{ padding: '8px', borderBottom: '1px solid #334155' }}>
                                            <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{tree.species}</div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>{new Date(tree.measured_at).toLocaleString()}</div>
                                        </li>
                                    ))}
                                </ul>
                            ) : "No recent activity"}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#10b981', lineHeight: '1.5' }}>
                            <strong>TIP:</strong> 지도상의 마커를 클릭하면 상세 측정값을 실시간으로 조회할 수 있습니다.
                        </p>
                    </div>
                </aside>

                {/* 지도 영역 */}
                <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
                    <TreeViewMap />
                </div>
            </main>
        </div>
    );
};

export default MapDashboard;
