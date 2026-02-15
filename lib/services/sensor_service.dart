import 'dart:async';
import 'package:sensors_plus/sensors_plus.dart';

class SensorService {
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  double _pitch = 0.0; // 기울기 (radians)

  // 싱글톤 패턴
  static final SensorService _instance = SensorService._internal();
  factory SensorService() => _instance;
  SensorService._internal();

  double get currentPitch => _pitch;

  void startListening(Function(double) onAngleChanged) {
    _accelerometerSubscription = accelerometerEvents.listen((AccelerometerEvent event) {
      // 단순화된 기울기 계산 (y축과 z축 활용)
      // 실제 구현 시에는 쿼터니언 또는 상보필터/EKF 권장
      _pitch = - (event.y / 9.81); 
      onAngleChanged(_pitch);
    });
  }

  void stopListening() {
    _accelerometerSubscription?.cancel();
  }

  bool isVertical(double toleranceDegrees) {
    // 90도 (수평 기준 수직) 여부 확인
    double pitchDegree = _pitch * (180 / 3.14159);
    return (pitchDegree.abs() - 90).abs() < toleranceDegrees;
  }
}
