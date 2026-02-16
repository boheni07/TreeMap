import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';

class SensorData {
  // IMU 데이터
  double? accelerometerX;
  double? accelerometerY;
  double? accelerometerZ;
  double? gyroscopeX;
  double? gyroscopeY;
  double? gyroscopeZ;
  double? magnetometerX;
  double? magnetometerY;
  double? magnetometerZ;
  double? devicePitch;
  double? deviceRoll;
  double? deviceAzimuth;
  
  // 환경 센서 데이터
  double? ambientLight;
  double? pressure;
  double? altitude;
  double? temperature;
  
  // 시스템 정보
  String? deviceModel;
  String? osVersion;
  String? appVersion;
}

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
  
  /// 현재 센서 데이터 수집
  Future<SensorData> collectSensorData() async {
    final data = SensorData();
    
    try {
      // 가속도계 데이터 수집
      final accelEvent = await accelerometerEventStream().first.timeout(Duration(seconds: 1));
      data.accelerometerX = accelEvent.x;
      data.accelerometerY = accelEvent.y;
      data.accelerometerZ = accelEvent.z;
      
      // 기기 기울기 계산 (피치와 롤)
      data.devicePitch = _calculatePitch(accelEvent.x, accelEvent.y, accelEvent.z);
      data.deviceRoll = _calculateRoll(accelEvent.x, accelEvent.y, accelEvent.z);
    } catch (e) {
      print('Failed to collect accelerometer data: $e');
    }
    
    try {
      // 자이로스코프 데이터 수집
      final gyroEvent = await gyroscopeEventStream().first.timeout(Duration(seconds: 1));
      data.gyroscopeX = gyroEvent.x;
      data.gyroscopeY = gyroEvent.y;
      data.gyroscopeZ = gyroEvent.z;
    } catch (e) {
      print('Failed to collect gyroscope data: $e');
    }
    
    try {
      // 자기계 데이터 수집
      final magEvent = await magnetometerEventStream().first.timeout(Duration(seconds: 1));
      data.magnetometerX = magEvent.x;
      data.magnetometerY = magEvent.y;
      data.magnetometerZ = magEvent.z;
      
      // 방위각 계산
      data.deviceAzimuth = _calculateAzimuth(magEvent.x, magEvent.y);
    } catch (e) {
      print('Failed to collect magnetometer data: $e');
    }
    
    // 시스템 정보 수집
    await _collectSystemInfo(data);
    
    return data;
  }
  
  /// 피치 각도 계산 (도)
  double _calculatePitch(double x, double y, double z) {
    return (atan2(-x, sqrt(y * y + z * z)) * 180 / pi);
  }
  
  /// 롤 각도 계산 (도)
  double _calculateRoll(double x, double y, double z) {
    return (atan2(y, z) * 180 / pi);
  }
  
  /// 방위각 계산 (도)
  double _calculateAzimuth(double x, double y) {
    double azimuth = (atan2(y, x) * 180 / pi);
    if (azimuth < 0) azimuth += 360;
    return azimuth;
  }
  
  /// 시스템 정보 수집
  Future<void> _collectSystemInfo(SensorData data) async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      final packageInfo = await PackageInfo.fromPlatform();
      
      data.appVersion = packageInfo.version;
      
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        data.deviceModel = '${androidInfo.manufacturer} ${androidInfo.model}';
        data.osVersion = 'Android ${androidInfo.version.release}';
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        data.deviceModel = iosInfo.model;
        data.osVersion = 'iOS ${iosInfo.systemVersion}';
      }
    } catch (e) {
      print('Failed to collect system info: $e');
    }
  }
}
