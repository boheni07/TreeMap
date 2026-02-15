import React from 'react';

interface LevelBubbleProps {
    angle: number;
    roll: number;
    isVertical: boolean;
}

export const LevelBubble: React.FC<LevelBubbleProps> = ({ angle, roll, isVertical }) => {
    return (
        <div style={{ position: 'absolute', top: '75%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 11, width: 0, height: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: 'clamp(100px, 28vw, 130px)', height: 'clamp(100px, 28vw, 130px)',
                    border: `3px solid ${isVertical ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.3)'}`,
                    borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)'
                }}>
                    <div style={{ position: 'absolute', width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ position: 'absolute', height: '100%', width: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <div style={{
                        width: '22%', height: '22%', borderRadius: '50%', transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        background: isVertical ? 'radial-gradient(circle at 35% 35%, #e8f5e9, #4caf50 70%, #1b5e20)' : 'radial-gradient(circle at 35% 35%, #ffebee, #f44336 70%, #b71c1c)',
                        transform: `translate(${roll * 3}px, ${(angle - 90) * 4}px)`,
                        boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(0,0,0,0.3), ${isVertical ? '0 0 25px rgba(76, 175, 80, 0.9)' : '0 0 20px rgba(244, 67, 54, 0.8)'}`,
                        zIndex: 1, position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(1px)' }} />
                    </div>
                </div>
                <span style={{ color: isVertical ? '#4caf50' : '#ff5252', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 'bold', marginTop: 12, textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '1px', whiteSpace: 'nowrap' }}>1.2M TARGET LEVEL</span>
            </div>
        </div>
    );
};
