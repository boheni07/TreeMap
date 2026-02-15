/**
 * 두 값 사이를 선형 보간합니다.
 */
export const lerp = (v1: number, v2: number, t: number) => v1 + (v2 - v1) * t;

/**
 * 현재 위치와 거리, 방위각을 기반으로 타겟의 GPS 좌표를 계산합니다.
 */
export const calculateTargetGps = (currentGps: { lat: number; lon: number; alt: number }, distance: number, heading: number) => {
    const R = 6378137; // 지구 반지름 (m)
    const dLat = (distance * Math.cos(heading * Math.PI / 180)) / R;
    const dLon = (distance * Math.sin(heading * Math.PI / 180)) / (R * Math.cos(currentGps.lat * Math.PI / 180));

    return {
        lat: currentGps.lat + (dLat * 180 / Math.PI),
        lon: currentGps.lon + (dLon * 180 / Math.PI),
        alt: currentGps.alt
    };
};

/**
 * 각도와 사용자 높이를 기반으로 거리를 계산합니다.
 */
export const calculateDistance = (rawAngle: number, userHeight: number) => {
    const diff = userHeight - 1.2;
    const tiltFromHorizontal = rawAngle - 90;

    // 조준점이 수평 이하로 0.3도 이상 내려갔을 때만 거리 계산
    if (tiltFromHorizontal < 0.3) return 0;

    const d = diff / Math.tan(tiltFromHorizontal * Math.PI / 180);
    return Math.min(Math.max(0, d), 50); // 최대 50m로 제한
};

/**
 * 흉고직경(DBH)을 계산합니다.
 * @param dist 거리(m)
 * @param vw 비디오 너비(px)
 */
export const calculateDbh = (dist: number, vw: number) => {
    // 기존 로직 유지: 상수값들은 추후 보정이 필요할 수 있음
    return 2 * dist * Math.tan(((150 * (60 / vw)) * Math.PI / 180) / 2) * 100;
};

/**
 * 수고(Tree Height)를 계산합니다.
 */
export const calculateTreeHeight = (dist: number, syncedPitch: number, userHeight: number) => {
    return dist * Math.tan(Math.max(0.01, (110 - syncedPitch) * Math.PI / 180)) + userHeight;
};
