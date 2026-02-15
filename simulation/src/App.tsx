import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import MobileSimulator from './pages/MobileSimulator';
import MapDashboard from './pages/MapDashboard';

const App = () => {
    return (
        <Routes>
            {/* 현장용 모바일 시뮬레이터 (기본 경로) */}
            <Route path="/" element={<MobileSimulator />} />

            {/* 서버 관리용 지도 서비스 */}
            <Route path="/admin" element={<MapDashboard />} />

            {/* 잘못된 경로 접근 시 기본 홈으로 이동 (필요 시 404 페이지 추가 가능) */}
            <Route path="*" element={<MobileSimulator />} />
        </Routes>
    );
};

export default App;
