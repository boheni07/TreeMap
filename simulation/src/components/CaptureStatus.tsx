import React from 'react';
import { Info } from 'lucide-react';

interface CaptureStatusProps {
    status: { type: 'warning' | 'error' | 'success', message: string } | null;
}

export const CaptureStatus: React.FC<CaptureStatusProps> = ({ status }) => {
    if (!status) return null;

    return (
        <div style={{
            position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: status.type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(255, 152, 0, 0.9)',
            padding: '10px 20px', borderRadius: '30px', color: 'white', fontWeight: 'bold',
            fontSize: '14px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
            <Info size={18} />
            {status.message}
        </div>
    );
};
