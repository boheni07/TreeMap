import 'dart:math' as math;

class MeasurementService {
  /// 거리 계산 (d)
  /// d = H * tan(90° - alpha)
  /// [lensHeight]: 지면으로부터 카메라 렌즈까지의 높이 (m)
  /// [alpha]: 가속도/자이로 센서로 측정된 지면 방향과의 각도 (radians)
  double calculateDistance(double lensHeight, double alpha) {
    // 90도 - alpha (alpha가 지면과의 각도일 때)
    double theta = (math.pi / 2) - alpha;
    return lensHeight * math.tan(theta);
  }

  /// 흉고직경 (DBH) 계산
  /// [pixelWidth]: 1.2m 지점에서의 트렁크 마스크 픽셀 너비
  /// [distance]: 위에서 계산된 수목과의 거리 (m)
  /// [imageWidth]: 원본 이미지의 픽셀 너비
  /// [hfov]: 카메라의 수평 화각 (Horizontal Field of View, degrees)
  double calculateDBH(double pixelWidth, double distance, double imageWidth, double hfov) {
    // 1픽셀당 차지하는 각도
    double anglePerPixel = hfov / imageWidth;
    
    // 객체가 차지하는 총 각도 (degrees)
    double objectAngle = pixelWidth * anglePerPixel;
    
    // 실제 너비 (cm 단위로 변환)
    // w = 2 * d * tan(angle / 2)
    double widthInMeters = 2 * distance * math.tan((objectAngle * math.pi / 180) / 2);
    
    return widthInMeters * 100; // m -> cm
  }

  /// 수고 (Tree Height) 계산
  /// [distance]: 수목과의 거리 (m)
  /// [bottomAngle]: 나무 밑동을 향한 카메라 각도 (radians)
  /// [topAngle]: 나무 꼭대기를 향한 카메라 각도 (radians)
  /// [lensHeight]: 렌즈 높이 (m)
  double calculateTreeHeight(double distance, double bottomAngle, double topAngle, double lensHeight) {
    // 삼각측량: h = d * (tan(topAngle) + tan(bottomAngle))
    // 각도가 수평(0도) 기준일 때
    return distance * (math.tan(topAngle) + math.tan(bottomAngle));
  }
}
