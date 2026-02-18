import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
    Search, Download, ExternalLink, RefreshCw, X, Calendar,
    Smartphone, MapPin, Activity, ShieldCheck, Gauge, Layers,
    Sun, Thermometer, Wind, Compass, Cpu, Database
} from 'lucide-react';

interface TreeData {
    id: number;
    species: string;
    dbh: number;
    height: number;
    healthScore: number;
    measured_at: string;

    // Physical attributes
    crownWidth?: number;
    groundClearance?: number;

    // GPS Positions
    deviceLatitude: number;
    deviceLongitude: number;
    treeLatitude: number;
    treeLongitude: number;
    adjustedTreeLatitude?: number;
    adjustedTreeLongitude?: number;

    // Sensors
    devicePitch?: number;
    deviceRoll?: number;
    deviceAzimuth?: number;
    ambientLight?: number;
    pressure?: number;
    altitude?: number;
    temperature?: number;

    // IMU Data
    accelerometerX?: number;
    accelerometerY?: number;
    accelerometerZ?: number;
    gyroscopeX?: number;
    gyroscopeY?: number;
    gyroscopeZ?: number;
    magnetometerX?: number;
    magnetometerY?: number;
    magnetometerZ?: number;

    // Technical Metadata
    imageWidth?: number;
    imageHeight?: number;
    focalLength?: number;
    cameraDistance?: number;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
    imageData?: string;

    // Server AI Results
    isServerProcessed?: number;
    serverProcessedAt?: string;
    serverSpecies?: string;
    serverDbh?: number;
    serverHeight?: number;
    serverCrownWidth?: number;
    serverGroundClearance?: number;
    serverHealthScore?: number;
    serverConfidence?: number;
}

const MeasurementsList = () => {
    const [trees, setTrees] = useState<TreeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTree, setSelectedTree] = useState<TreeData | null>(null);

    useEffect(() => {
        fetchTrees();
    }, []);

    const fetchTrees = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/measurements');
            if (response.ok) {
                const data = await response.json();
                setTrees(data.reverse()); // Latest first
            }
        } catch (error) {
            console.error('Failed to fetch measurements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTrees = trees.filter(tree =>
        tree.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tree.id.toString().includes(searchTerm)
    );

    const handleExportCSV = () => {
        if (filteredTrees.length === 0) {
            alert("No data to export.");
            return;
        }

        // Define headers (excluding imageData)
        const headers = [
            "ID", "Species", "DBH(cm)", "Height(m)", "Health(%)", "Measured At",
            "Device Model", "OS Version", "App Version",
            "Tree Lat", "Tree Lng", "Device Lat", "Device Lng", "Adj Lat", "Adj Lng",
            "Focal Length(mm)", "Camera Dist(m)", "Resolution",
            "Crown Width(m)", "Ground Clearance(m)",
            "Temp(C)", "Pressure(hPa)", "Light(lx)", "Altitude(m)",
            "Pitch", "Roll", "Azimuth",
            "AccelX", "AccelY", "AccelZ", "GyroX", "GyroY", "GyroZ"
        ];

        const rows = filteredTrees.map(t => [
            t.id, t.species, t.dbh.toFixed(2), t.height.toFixed(2), t.healthScore, t.measured_at,
            t.deviceModel || "", t.osVersion || "", t.appVersion || "",
            t.treeLatitude, t.treeLongitude, t.deviceLatitude, t.deviceLongitude,
            t.adjustedTreeLatitude || "", t.adjustedTreeLongitude || "",
            t.focalLength || "", t.cameraDistance || "", `${t.imageWidth}x${t.imageHeight}`,
            t.crownWidth || "", t.groundClearance || "",
            t.temperature || "", t.pressure || "", t.ambientLight || "", t.altitude || "",
            t.devicePitch || "", t.deviceRoll || "", t.deviceAzimuth || "",
            t.accelerometerX || "", t.accelerometerY || "", t.accelerometerZ || "",
            t.gyroscopeX || "", t.gyroscopeY || "", t.gyroscopeZ || ""
        ]);

        // Build CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(val => `"${val}"`).join(","))
        ].join("\n");

        // Create Blob and Download
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tree_measurements_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                {/* Upper Toolbar */}
                <div style={{
                    padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid #334155'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Measurements Database</h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search trees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
                                    padding: '8px 12px 8px 36px', color: 'white', fontSize: '14px', width: '300px', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={fetchTrees} style={toolbarButtonStyle}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={handleExportCSV}
                            style={{ ...toolbarButtonStyle, backgroundColor: '#10b981', color: 'white', border: 'none' }}
                        >
                            <Download size={16} />
                            Export Data
                        </button>
                    </div>
                </div>

                {/* Table View */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#334155' }}>
                                <tr>
                                    <th style={thStyle}>ID</th>
                                    <th style={thStyle}>Species</th>
                                    <th style={thStyle}>DBH (cm)</th>
                                    <th style={thStyle}>Height (m)</th>
                                    <th style={thStyle}>Health</th>
                                    <th style={thStyle}>AI Status</th>
                                    <th style={thStyle}>Measured At</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading Data...</td></tr>
                                ) : filteredTrees.map((tree) => (
                                    <tr key={tree.id} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={tdStyle}>{tree.id}</td>
                                        <td style={{ ...tdStyle, color: '#10b981', fontWeight: '600' }}>{tree.species}</td>
                                        <td style={tdStyle}>{tree.dbh.toFixed(1)}</td>
                                        <td style={tdStyle}>{tree.height.toFixed(1)}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                                                backgroundColor: tree.healthScore > 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: tree.healthScore > 80 ? '#10b981' : '#f59e0b', fontWeight: 'bold'
                                            }}>
                                                {tree.healthScore}%
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            {tree.isServerProcessed ? (
                                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ShieldCheck size={14} /> Completed
                                                </span>
                                            ) : (
                                                <span style={{ color: '#f59e0b' }}>Pending...</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>{new Date(tree.measured_at).toLocaleString()}</td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => setSelectedTree(tree)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#3b82f6',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold'
                                                }}
                                            >
                                                Details <ExternalLink size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Comprehensive Detail Modal */}
            {selectedTree && (
                <div style={modalOverlayStyle}>
                    <div style={modalContainerStyle}>
                        {/* Header */}
                        <div style={modalHeaderStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ backgroundColor: '#10b981', padding: '8px', borderRadius: '10px' }}>
                                    <Database size={24} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>SYSTEMATIC MEASUREMENT REPORT</h3>
                                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>Record ID: {selectedTree.id} • Species: {selectedTree.species}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTree(null)} style={closeButtonStyle}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body Container */}
                        <div style={modalBodyStyle}>
                            {/* Left Panel: Visuals & Summary */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={imageContainerStyle}>
                                    {selectedTree.imageData ? (
                                        <img src={selectedTree.imageData} alt="Tree" style={imageStyle} />
                                    ) : (
                                        <div style={placeholderImageStyle}>NO IMAGE CAPTURED</div>
                                    )}
                                </div>

                                <div style={summaryGridStyle}>
                                    <SummaryCard label="DBH" value={selectedTree.dbh} unit="cm" icon={<Gauge size={16} />} />
                                    <SummaryCard label="HEIGHT" value={selectedTree.height} unit="m" icon={<Layers size={16} />} />
                                    <SummaryCard label="HEALTH" value={selectedTree.healthScore} unit="%" icon={<Activity size={16} />} />
                                    <SummaryCard label="CROWN" value={selectedTree.crownWidth} unit="m" icon={<Sun size={16} />} />
                                </div>

                                {/* Server AI Analysis Comparison */}
                                <div style={aiReportBoxStyle}>
                                    <div style={sectionHeaderStyle}><ShieldCheck size={16} /> SERVER AI ANALYTICS</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                                        <AIValueRow label="AI Species" value={selectedTree.serverSpecies || '-'} />
                                        <AIValueRow label="Confidence" value={selectedTree.serverConfidence ? `${(selectedTree.serverConfidence * 100).toFixed(1)}%` : '-'} />
                                        <AIValueRow label="Server DBH" value={selectedTree.serverDbh?.toString() || '-'} unit="cm" />
                                        <AIValueRow label="Server Height" value={selectedTree.serverHeight?.toString() || '-'} unit="m" />
                                    </div>
                                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                                        Processed: {selectedTree.serverProcessedAt ? new Date(selectedTree.serverProcessedAt).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Systematic Data Tabs/Sections */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Section: Location */}
                                <div style={dataSectionStyle}>
                                    <div style={sectionHeaderStyle}><MapPin size={16} /> GEOSPATIAL DATA</div>
                                    <div style={grid2ColStyle}>
                                        <DataRow label="Device GPS" value={`${selectedTree.deviceLatitude.toFixed(6)}, ${selectedTree.deviceLongitude.toFixed(6)}`} />
                                        <DataRow label="Tree Est." value={`${selectedTree.treeLatitude.toFixed(6)}, ${selectedTree.treeLongitude.toFixed(6)}`} />
                                        <DataRow label="Final Adj." value={selectedTree.adjustedTreeLatitude ? `${selectedTree.adjustedTreeLatitude.toFixed(6)}, ${selectedTree.adjustedTreeLongitude?.toFixed(6)}` : 'N/A'} highlight />
                                    </div>
                                </div>

                                {/* Section: Environmental Sensors */}
                                <div style={dataSectionStyle}>
                                    <div style={sectionHeaderStyle}><Sun size={16} /> ENVIRONMENTAL SENSORS</div>
                                    <div style={grid3ColStyle}>
                                        <SensorBox icon={<Thermometer size={14} />} label="Temp" value={selectedTree.temperature} unit="°C" />
                                        <SensorBox icon={<Gauge size={14} />} label="Pressure" value={selectedTree.pressure} unit="hPa" />
                                        <SensorBox icon={<Sun size={14} />} label="Light" value={selectedTree.ambientLight} unit="lx" />
                                        <SensorBox icon={<Layers size={14} />} label="Altitude" value={selectedTree.altitude} unit="m" />
                                        <SensorBox icon={<Compass size={14} />} label="Pitch" value={selectedTree.devicePitch} unit="°" />
                                        <SensorBox icon={<Compass size={14} />} label="Roll" value={selectedTree.deviceRoll} unit="°" />
                                    </div>
                                </div>

                                {/* Section: IMU Raw DATA */}
                                <div style={dataSectionStyle}>
                                    <div style={sectionHeaderStyle}><Activity size={16} /> IMU INERTIAL DATA</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <IMURow label="ACCEL (X,Y,Z)" values={[selectedTree.accelerometerX, selectedTree.accelerometerY, selectedTree.accelerometerZ]} />
                                        <IMURow label="GYRO (X,Y,Z)" values={[selectedTree.gyroscopeX, selectedTree.gyroscopeY, selectedTree.gyroscopeZ]} />
                                        <IMURow label="MAG (X,Y,Z)" values={[selectedTree.magnetometerX, selectedTree.magnetometerY, selectedTree.magnetometerZ]} />
                                    </div>
                                </div>

                                {/* Section: Hardware & Meta */}
                                <div style={dataSectionStyle}>
                                    <div style={sectionHeaderStyle}><Cpu size={16} /> HARDWARE & CAMERA SPECS</div>
                                    <div style={grid2ColStyle}>
                                        <DataRow label="Device" value={selectedTree.deviceModel} />
                                        <DataRow label="OS/App" value={`${selectedTree.osVersion} / v${selectedTree.appVersion}`} />
                                        <DataRow label="Resolution" value={`${selectedTree.imageWidth}×${selectedTree.imageHeight}`} />
                                        <DataRow label="Distance" value={`${selectedTree.cameraDistance?.toFixed(2)} m`} />
                                        <DataRow label="Focal Len." value={`${selectedTree.focalLength} mm`} />
                                        <DataRow label="Timestamp" value={new Date(selectedTree.measured_at).toLocaleString()} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={modalFooterStyle}>
                            <button onClick={() => window.print()} style={secondaryButtonStyle}>Print Report</button>
                            <button onClick={() => setSelectedTree(null)} style={primaryButtonStyle}>Close Report</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

// --- Sub-Components & Styles ---

const SummaryCard = ({ label, value, unit, icon }: any) => (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {icon} {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
            {value?.toFixed(1) || '-'} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#94a3b8' }}>{unit}</span>
        </div>
    </div>
);

const AIValueRow = ({ label, value, unit }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
        <span style={{ color: '#94a3b8' }}>{label}:</span>
        <span style={{ color: '#10b981', fontWeight: 'bold' }}>{value} {unit}</span>
    </div>
);

const DataRow = ({ label, value, highlight }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{label}</div>
        <div style={{ fontSize: '13px', color: highlight ? '#10b981' : '#e2e8f0', fontFamily: 'monospace' }}>{value || '-'}</div>
    </div>
);

const SensorBox = ({ icon, label, value, unit }: any) => (
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'center', gap: '3px' }}>{icon} {label}</div>
        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 'bold' }}>{value?.toFixed(1) || '-'} <small style={{ fontSize: '10px', fontWeight: 'normal' }}>{unit}</small></div>
    </div>
);

const IMURow = ({ label, values }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{label}</span>
        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3b82f6' }}>
            {values.map((v: any, i: number) => (
                <span key={i} style={{ marginLeft: '8px' }}>{v?.toFixed(3) || '0.000'}</span>
            ))}
        </div>
    </div>
);

// CSS objects
const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 2000,
    display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)'
};

const modalContainerStyle: React.CSSProperties = {
    backgroundColor: '#1e293b', width: '1000px', maxHeight: '95vh',
    borderRadius: '20px', border: '1px solid #334155',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
};

const modalHeaderStyle: React.CSSProperties = {
    padding: '20px 32px', borderBottom: '1px solid #334155',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e293b'
};

const modalBodyStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto', padding: '32px',
    display: 'grid', gridTemplateColumns: '420px 1fr', gap: '32px'
};

const imageContainerStyle: React.CSSProperties = {
    width: '100%', height: '320px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #334155'
};

const imageStyle: React.CSSProperties = {
    width: '100%', height: '100%', objectFit: 'cover'
};

const placeholderImageStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#0f172a', display: 'flex',
    justifyContent: 'center', alignItems: 'center', color: '#475569', fontSize: '14px', fontWeight: 'bold'
};

const summaryGridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'
};

const aiReportBoxStyle: React.CSSProperties = {
    backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px', padding: '16px'
};

const dataSectionStyle: React.CSSProperties = {
    padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid #334155'
};

const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '12px', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center',
    gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '12px', letterSpacing: '0.05em'
};

const grid2ColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const grid3ColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' };

const modalFooterStyle: React.CSSProperties = {
    padding: '20px 32px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#1e293b'
};

const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: '#10b981', border: 'none', padding: '12px 28px', borderRadius: '10px',
    color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
};

const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: '#334155', border: 'none', padding: '12px 28px', borderRadius: '10px',
    color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
};

const toolbarButtonStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b',
    border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px',
    color: '#e2e8f0', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
};

const closeButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' };

const thStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '16px', fontSize: '14px', color: '#e2e8f0' };

export default MeasurementsList;
