import 'dart:math' as math;

class MeasurementService {
  /// 거리 계산 (d) 
  /// [lensHeight]: 지면으로부터 카메라 렌즈까지의 높이 (m)
  /// [angleInDegrees]: 기기의 기울기 (Pitch, degrees. 수평이 0도, 아래가 +, 위가 -)
  double calculateDistance(double lensHeight, double angleInDegrees) {
    // 각도를 라디안으로 변환
    double alpha = angleInDegrees * math.pi / 180;
    
    // d = H * tan(90° - alpha) -> alpha가 수평 기준이면 d = H / tan(alpha)
    // 여기서는 alpha가 수평(0)에서 아래(+90)일 때: d = H * tan(90 - alpha)
    // 더 안정적인 계산: d = H * tan((90 - angleInDegrees) * pi / 180)
    return lensHeight * math.tan((90 - angleInDegrees) * math.pi / 180);
  }

  /// 흉고직경 (DBH) 계산
  /// [pixelWidth]: 1.2m 지점에서의 트렁크 마스크 픽셀 너비
  /// [distance]: 수목과의 거리 (m)
  /// [imageWidth]: 원본 이미지의 픽셀 너비 (예: 1080)
  /// [hfov]: 카메라의 수평 화각 (Horizontal Field of View, degrees. 보통 60~70)
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
  /// [bottomAngleDeg]: 나무 밑동 각도 (degrees)
  /// [topAngleDeg]: 나무 꼭대기 각도 (degrees)
  double calculateTreeHeight(double distance, double bottomAngleDeg, double topAngleDeg) {
    double bRad = bottomAngleDeg * math.pi / 180;
    double tRad = topAngleDeg * math.pi / 180;
    
    // h = d * (tan(top) + tan(bottom))
    return distance * (math.tan(tRad) + math.tan(bRad));
  }
}
