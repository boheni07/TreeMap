import 'package:flutter/material.dart';
import '../services/sensor_service.dart';
import '../services/measurement_service.dart';
import 'dart:math' as math;

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final SensorService _sensorService = SensorService();
  final MeasurementService _measurementService = MeasurementService();
  
  double _currentAngle = 0.0;
  bool _isVertical = false;
  double _userHeight = 1.7; // 기본값 (미터)

  @override
  void initState() {
    super.initState();
    _sensorService.startListening((angle) {
      setState(() {
        _currentAngle = angle;
        _isVertical = _sensorService.isVertical(2.0); // 2도 오차 허용
      });
    });
  }

  @override
  void dispose() {
    _sensorService.stopListening();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. 카메라 프리뷰 (Placeholder)
          Container(
            color: Colors.black,
            child: const Center(
              child: Text(
                'Camera Preview Here',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),

          // 2. 수목 가이드 실루엣 오버레이
          Center(
            child: Opacity(
              opacity: 0.3,
              child: Icon(
                Icons.park,
                size: MediaQuery.of(context).size.width * 0.8,
                color: Colors.white,
              ),
            ),
          ),

          // 3. 스마트 가이드 UI (Custom Paint)
          CustomPaint(
            size: Size.infinite,
            painter: GuidePainter(
              angle: _currentAngle,
              isVertical: _isVertical,
              userHeight: _userHeight,
            ),
          ),

          // 4. 컨트롤 레이어
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '수목 측정 모드',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.settings, color: Colors.white),
                        onPressed: () {
                          // 사용자 키 설정 팝업 등
                        },
                      ),
                    ],
                  ),
                ),
                
                // 캡처 버튼
                Padding(
                  padding: const EdgeInsets.only(bottom: 40),
                  child: FloatingActionButton.large(
                    onPressed: _isVertical ? () {
                      // 측정 로직 실행
                    } : null,
                    backgroundColor: _isVertical ? Colors.green : Colors.grey,
                    child: const Icon(Icons.camera_alt),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class GuidePainter extends CustomPainter {
  final double angle;
  final bool isVertical;
  final double userHeight;

  GuidePainter({
    required this.angle,
    required this.isVertical,
    required this.userHeight,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    
    // 1. 물방울 수평계 (Water Drop Level)
    final levelPaint = Paint()
      ..color = isVertical ? Colors.green.withOpacity(0.8) : Colors.red.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    // 수평계 배경 원
    canvas.drawCircle(center, 40, levelPaint);
    
    // 물방울 위치 계산 (angle에 따라 이동)
    double offset = angle * 50; // 단순 시각화
    canvas.drawCircle(
      Offset(center.dx, center.dy + offset),
      10,
      levelPaint..style = PaintingStyle.fill,
    );

    // 2. 1.2m 가변 센터포인트 (DBH 측정 지점)
    // 렌즈 높이와 화각에 따른 1.2m 지점의 픽셀 위치 계산 로직 필요
    // 여기서는 화면 중앙 상단에 RED Crosshair 표시 (가변 위치 시뮬레이션)
    final crosshairPaint = Paint()
      ..color = Colors.red
      ..strokeWidth = 2.0;

    double y12m = size.height * 0.4; // 실제로는 사용자 키 기반 계산 필요
    canvas.drawLine(Offset(center.dx - 20, y12m), Offset(center.dx + 20, y12m), crosshairPaint);
    canvas.drawLine(Offset(center.dx, y12m - 20), Offset(center.dx, y12m + 20), crosshairPaint);
    
    final textPainter = TextPainter(
      text: const TextSpan(
        text: '1.2m (DBH)',
        style: TextStyle(color: Colors.red, fontSize: 12),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(center.dx + 25, y12m - 6));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
