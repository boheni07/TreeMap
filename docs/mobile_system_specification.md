# TreeMap 모바일 시스템 상세 명세서 (Mobile System Specification)

본 문서는 스마트폰 단말에서 실행되는 TreeMap 모바일 어플리케이션의 내부 구조, 센서 데이터 처리 프로세스 및 단계별 사용자 워크플로우를 상세히 기술합니다.

---

## 1. 모바일 앱 시스템 구조 (Mobile Architecture)

TreeMap 모바일은 저사양 및 고사양 스마트폰 모두에서 안정적인 측정이 가능하도록 **레이어드 아키텍처(Layered Architecture)**를 채택하고 있습니다.

### 1.1 주요 컴포넌트 레이어
*   **UI/Interface Layer (React/Flutter)**: 측정을 위한 뷰파인더, 수평계(Level Bubble), 실시간 오버레이 및 리포트 화면을 제공합니다.
*   **Sensor Fusion Layer**: 가속도계, 자이로스코프, 지자기 센서 데이터를 실시간으로 동기화하여 기기의 정확한 자세(Pose)를 추정합니다.
*   **Edge AI Engine (TFLite)**: `MiDaS`(깊이), `YOLO-seg`(객체 분할) 등의 경량 모델을 구동하여 현장 즉시 분석을 수행합니다.
*   **Networking Layer**: 오프라인 상태에서 데이터를 큐잉하고, 네트워크 복구 시 서버 API로 벌크 전송(Photo + Metadata)합니다.

---

## 2. 데이터 수집 및 처리 프로세스 (Data Pipeline)

### 2.1 단계별 수집 프로세스
1.  **환경 세팅 (Environment Setup)**:
    - 카메라 권한 획득 및 GNSS(GPS) 수신 대기.
    - 사용자 신장 기반 눈높이($h_{lens}$) 설정.
2.  **실시간 모니터링 (Live Validation)**:
    - **수평 검사**: Pitch $90^\circ \pm 1.5^\circ$, Roll $0^\circ \pm 1.5^\circ$ 범위를 벗어날 경우 촬영 차단.
    - **조도 검사**: 조도 센서값이 500 Lux 미만일 경우 경고 표시.
    - **모션 검사**: 기기 흔들림 임계값(Motion Level) 초과 시 촬영 차단.
3.  **동기화 캡처 (Synced Capture)**:
    - 촬영 버튼 클릭 시, 동일 타임스탬프의 **[이미지 + 센서 벡터 + GPS 위치]**를 원자적으로 결합하여 저장.
4.  **로컬 추론 및 계산 (Edge Inference)**:
    - `calculateDistance()`: 센서 기울기 기반 거리 산출.
    - `calculateDbh()`: 이미지 내 줄기 픽셀 폭 기반 흉고직경 계산.
    - `calculateTargetGps()`: 위치 투영 알고리즘을 통한 수목 좌표 생성.

---

## 3. 스마트폰 센서 활용 상세

| 센서명 | 데이터 타입 | 시스템 활용 용도 |
| :--- | :--- | :--- |
| **가속도계 (Accelerometer)** | $3$-Axis gravity | 기기의 수평 및 수직 기울기 감지 (Pitch/Roll) |
| **자이로스코프 (Gyroscope)** | Angular velocity | 촬영 시 미세 흔들림 보정 및 포즈 추정 보조 |
| **지자기 센서 (Magnetometer)** | Magnetic field | 수목의 방위각(Azimuth/Heading) 측정 (Target GPS용) |
| **GNSS 리시버** | Lat, Lon, Alt | 기기의 현재 위치 및 고도 정보 획득 |
| **조도 센서 (Light Sensor)** | Illuminance (Lux) | 이미지 분석의 신뢰도를 확보하기 위한 환경 검사 |
| **기압계 (Barometer)** | Pressure | 고도 측정의 정밀도 향상을 위한 보정 데이터 |

---

## 4. 모바일 최적화 기술 (Optimization)

*   **Low-Latency Feedback**: 센서 데이터를 60Hz 이상의 주기로 스캔하여 수평계 UI에 즉각 반영합니다.
*   **Dynamic Resolution**: 기기 성능에 따라 Preview 해상도를 동적으로 조절하며, 캡처 시에만 고해상도 이미지를 사용합니다.
*   **Battery Management**: 측정 대기 모드에서는 AI 추론 주기를 낮추어 전력 소모를 최소화합니다.

---

*본 문서는 TreeMap 모바일 클라이언트의 기술적 무결성을 유지하기 위한 표준 문서입니다.*
