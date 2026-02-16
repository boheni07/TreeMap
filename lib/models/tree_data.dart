class TreeData {
  // 기본 측정 데이터
  final double dbh; // 흉고직경 (cm)
  final double height; // 수고 (m)
  final String species; // 수종
  final double healthScore; // 건강도 점수 (0-100)
  final DateTime measuredAt;
  
  // 위치 정보
  final double? deviceLatitude; // 기기 위치 (스마트폰 GPS)
  final double? deviceLongitude;
  final double? treeLatitude; // 나무 위치 (계산된 피사체 위치)
  final double? treeLongitude;
  
  // IMU 데이터 (관성 측정 장치)
  final double? accelerometerX;
  final double? accelerometerY;
  final double? accelerometerZ;
  final double? gyroscopeX;
  final double? gyroscopeY;
  final double? gyroscopeZ;
  final double? magnetometerX;
  final double? magnetometerY;
  final double? magnetometerZ;
  final double? devicePitch; // 기기 피치 각도 (도)
  final double? deviceRoll; // 기기 롤 각도 (도)
  final double? deviceAzimuth; // 방위각 (도)
  
  // 환경 센서 데이터
  final double? ambientLight; // 주변 조도 (lux)
  final double? pressure; // 대기압 (hPa)
  final double? altitude; // 고도 (m)
  final double? temperature; // 온도 (°C)
  
  // 카메라 메타데이터
  final int? imageWidth; // 이미지 너비 (px)
  final int? imageHeight; // 이미지 높이 (px)
  final double? focalLength; // 초점 거리 (mm)
  final double? cameraDistance; // 카메라-수목 거리 (m)
  
  // 시스템 정보
  final String? deviceModel; // 기기 모델명
  final String? osVersion; // OS 버전
  final String? appVersion; // 앱 버전

  TreeData({
    required this.dbh,
    required this.height,
    required this.species,
    required this.healthScore,
    required this.measuredAt,
    // 위치 정보
    this.deviceLatitude,
    this.deviceLongitude,
    this.treeLatitude,
    this.treeLongitude,
    // 센서 데이터
    this.accelerometerX,
    this.accelerometerY,
    this.accelerometerZ,
    this.gyroscopeX,
    this.gyroscopeY,
    this.gyroscopeZ,
    this.magnetometerX,
    this.magnetometerY,
    this.magnetometerZ,
    this.devicePitch,
    this.deviceRoll,
    this.deviceAzimuth,
    this.ambientLight,
    this.pressure,
    this.altitude,
    this.temperature,
    this.imageWidth,
    this.imageHeight,
    this.focalLength,
    this.cameraDistance,
    this.deviceModel,
    this.osVersion,
    this.appVersion,
  });

  Map<String, dynamic> toJson() {
    final json = {
      'dbh': dbh,
      'height': height,
      'species': species,
      'healthScore': healthScore,
      'measuredAt': measuredAt.toIso8601String(),
    };
    
    // 선택적 필드는 null이 아닐 때만 추가
    // 위치 정보
    if (deviceLatitude != null) json['deviceLatitude'] = deviceLatitude;
    if (deviceLongitude != null) json['deviceLongitude'] = deviceLongitude;
    if (treeLatitude != null) json['treeLatitude'] = treeLatitude;
    if (treeLongitude != null) json['treeLongitude'] = treeLongitude;
    // 센서 데이터
    if (accelerometerX != null) json['accelerometerX'] = accelerometerX;
    if (accelerometerY != null) json['accelerometerY'] = accelerometerY;
    if (accelerometerZ != null) json['accelerometerZ'] = accelerometerZ;
    if (gyroscopeX != null) json['gyroscopeX'] = gyroscopeX;
    if (gyroscopeY != null) json['gyroscopeY'] = gyroscopeY;
    if (gyroscopeZ != null) json['gyroscopeZ'] = gyroscopeZ;
    if (magnetometerX != null) json['magnetometerX'] = magnetometerX;
    if (magnetometerY != null) json['magnetometerY'] = magnetometerY;
    if (magnetometerZ != null) json['magnetometerZ'] = magnetometerZ;
    if (devicePitch != null) json['devicePitch'] = devicePitch;
    if (deviceRoll != null) json['deviceRoll'] = deviceRoll;
    if (deviceAzimuth != null) json['deviceAzimuth'] = deviceAzimuth;
    if (ambientLight != null) json['ambientLight'] = ambientLight;
    if (pressure != null) json['pressure'] = pressure;
    if (altitude != null) json['altitude'] = altitude;
    if (temperature != null) json['temperature'] = temperature;
    if (imageWidth != null) json['imageWidth'] = imageWidth;
    if (imageHeight != null) json['imageHeight'] = imageHeight;
    if (focalLength != null) json['focalLength'] = focalLength;
    if (cameraDistance != null) json['cameraDistance'] = cameraDistance;
    if (deviceModel != null) json['deviceModel'] = deviceModel;
    if (osVersion != null) json['osVersion'] = osVersion;
    if (appVersion != null) json['appVersion'] = appVersion;
    
    return json;
  }
}
