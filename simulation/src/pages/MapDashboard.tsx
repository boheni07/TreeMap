import React from 'react';
import TreeViewMap from '../components/TreeViewMap';
import { Database, LayoutDashboard, List } from 'lucide-react';

const MapDashboard = () => {
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
                        <Database size={20} color="white" />
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
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>V 1.0.0</span>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main style={{ flex: 1, position: 'relative', display: 'flex' }}>
                {/* 왼쪽 사이드바 (정보창/통계) */}
                <aside style={{
                    width: '320px', backgroundColor: '#1e293b', borderRight: '1px solid #334155',
                    padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10
                }}>
                    <div>
                        <h2 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                            Survey Statistics
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Trees</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>--</div>
                            </div>
                            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>Avg DBH</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>--</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#10b981', lineHeight: '1.5' }}>
                            <strong>TIP:</strong> 지도上の마커를 클릭하면 수목의 상세 흉고직경과 수고 정보를 확인할 수 있습니다.
                        </p>
                    </div>
                </aside>

                {/* 지도 영역 */}
                <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                    <TreeViewMap />
                </div>
            </main>
        </div>
    );
};

export default MapDashboard;
