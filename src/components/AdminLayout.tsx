import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, TreeDeciduous } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

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
                <div
                    onClick={() => navigate('/admin')}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                    <div style={{ backgroundColor: '#10b981', padding: '6px', borderRadius: '8px' }}>
                        <TreeDeciduous size={20} color="white" />
                    </div>
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.025em' }}>
                        TreeMap Admin Service
                    </h1>
                </div>

                <nav style={{ display: 'flex', gap: '24px' }}>
                    <div
                        onClick={() => navigate('/admin')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: location.pathname === '/admin' ? '#10b981' : '#94a3b8',
                            cursor: 'pointer', fontWeight: location.pathname === '/admin' ? '500' : 'normal'
                        }}
                    >
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </div>
                    <div
                        onClick={() => navigate('/admin/measurements')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: location.pathname === '/admin/measurements' ? '#10b981' : '#94a3b8',
                            cursor: 'pointer', fontWeight: location.pathname === '/admin/measurements' ? '500' : 'normal'
                        }}
                    >
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
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
