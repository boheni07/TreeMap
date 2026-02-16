import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import MobileSimulator from './pages/MobileSimulator';
import MapDashboard from './pages/MapDashboard';

// Global Styles for Leaflet
import 'leaflet/dist/leaflet.css';
import './index.css';

// Simple Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>App Crash Detected</h1>
                    <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'left', maxWidth: '90%', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const App = () => {
    React.useEffect(() => {
        console.log("App mounted");
    }, []);

    return (
        <ErrorBoundary>
            <div style={{
                width: '100%',
                height: '100%',
                minHeight: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Routes>
                    {/* 현장용 모바일 시뮬레이터 (기본 경로) */}
                    <Route path="/" element={<MobileSimulator />} />

                    {/* 서버 관리용 지도 서비스 */}
                    <Route path="/admin" element={<MapDashboard />} />

                    {/* 잘못된 경로 접근 시 기본 홈으로 이동 */}
                    <Route path="*" element={<MobileSimulator />} />
                </Routes>
            </div>
        </ErrorBoundary>
    );
};

export default App;
