# TreeMap 시스템 기술 명세서 (Technical Specification)

본 문서는 TreeMap 시스템의 아키텍처, 데이터 수집 프로세스, 엣지 측정 알고리즘 및 서버 사이드 정밀 AI 모델에 대한 구체적인 기술 명세를 제공합니다.

---

## 1. 시스템 아키텍처 개요

TreeMap은 현장에서의 즉각적인 데이터 수집과 서버에서의 고정밀 분석을 결합한 **Edge-Cloud 하이브리드 아키텍처**를 채택하고 있습니다.

### 1.1 서비스 구성
*   **Mobile Client (Edge)**: 스마트폰 내장 센서(Camera, IMU, GPS)를 활용하여 현장에서 실시간 수목 측정 및 1차 데이터 처리를 수행합니다.
*   **Backend Server (Cloud)**: 수집된 Raw 데이터를 저장하고, GPU 기반의 고성능 AI 모델을 통해 측정값의 오차를 정밀 보정하며 통합 대시보드를 제공합니다.
*   **AI Service**: 이미지 세그멘테이션(YOLOv11-seg, SAM) 및 건강도 분석 모델을 독립적인 서비스 레이어로 운영합니다.

---

## 2. 스마트폰 데이터 수집 프로세스

사용자가 스마트폰을 통해 수목을 촬영하고 데이터를 저장하기까지의 기술적 워크플로우입니다.

### 2.1 사용자 프로세스 (Field Workflow)
1.  **조준 (Aiming)**: 스마트폰을 수목 하단(지표면)에 수직으로 조준합니다.
2.  **유효성 검사**: 시스템이 실시간으로 기기의 기울기(Pitch/Roll > 1.5°), 조도(Lux < 500), 흔들림(Motion)을 체크하여 측정 최적 상태인지 확인합니다.
3.  **촬영 (Capture)**: 유효성이 검증되면 버튼이 활성화되며, 촬영 시 센서 데이터와 이미지가 동기화되어 스냅샷으로 저장됩니다.
4.  **1차 결과 확인**: 엣지 알고리즘으로 계산된 흉고직경(DBH), 수고, 예상 위치를 리포트 형태로 확인합니다.
5.  **서버 전송**: 확인된 데이터를 백엔드 API로 업로드합니다.

### 2.2 수집 정보 항목
| 카테고리 | 데이터 항목 | 기술적 소스 |
| :--- | :--- | :--- |
| **이미지** | RAW JPEG (High Res) | Camera API |
| **기기 자세** | Pitch, Roll, Heading, Gravity | IMU (Accelerometer, Gyro) |
| **위치 정보** | Latitude, Longitude, Altitude | GNSS (GPS/GLONASS) |
| **환경 데이터** | Ambient Light (Lux), Pressure | Light Sensor, Barometer |
| **기기 사양** | Focal Length, Sensor Size, Model | Metadata / Hardcoded |

---

## 3. 측정 알고리즘 및 AI 모델

### 3.1 엣지 단말 AI 모델 (Edge AI - On-Device)
스마트폰의 제한된 리소스를 고려하여 저지연(Low Latency)과 실시간성에 최적화된 경량 모델을 사용합니다.

| 분석 항목 | 사용 모델 | 모델 특징 및 역할 |
| :--- | :--- | :--- |
| **깊이 추정** | **MiDaS v2.1 Small** | 단안 카메라 이미지를 통해 픽셀별 상대 깊이를 추정합니다. 하이브리드 센서 융합을 통해 이를 실제 거리(m)로 변환합니다. |
| **이미지 분할** | **YOLOv11n-seg (TFLite)** | 수목의 줄기(Trunk) 영역을 실시간으로 탐지하고 마스크를 생성합니다. DBH(흉고직경) 계산의 기초 데이터를 제공합니다. |
| **수종 식별** | **MobileNetV3** | 현장에서 주요 가로수 수종(소나무, 은행나무 등)을 즉시 분류합니다. 추론 속도가 매우 빠르며 리소스 소모가 적습니다. |
| **건강도 분석** | **EfficientNet-Lite** | 잎과 줄기의 텍스처를 분석하여 1차 건강도 점수(Screening)를 산출합니다. |

---

### 3.2 서버 사이드 정밀 AI 모델 (Server-side AI)
서버에 도달한 데이터는 고해상도 처리와 높은 연산 성능이 필요한 고성능 모델 파이프라인을 통과하여 엣지의 오차를 보정합니다.

#### A. 고정밀 세그멘테이션 및 기하 보정
*   **모델**: **SAM (Segment Anything Model)** + **YOLOv11-seg (Heavy)**
*   **상세**: 
    - YOLOv11-seg로 수목 객체를 탐지한 후, SAM을 사용하여 정밀한 경계선(Boundary)을 추출합니다.
    - 이를 통해 엣지에서 계산된 마스크 오차를 보정하고, 수관폭(Crown Width)과 지하고(Ground Clearance)를 센티미터 단위로 정밀하게 재산출합니다.

#### B. 정밀 수종 교차 검증 및 건강도
*   **모델**: **ViT (Vision Transformer)** + **EfficientNet-B7**
*   **상세**:
    - **ViT**: 엣지에서 식별된 수종 결과를 교차 검증하여 식별 오류를 최소화합니다 (Species Cross-Verification).
    - **EfficientNet-B7**: 가장 큰 모델 사이즈를 사용하여 잎의 미세한 병충해 징후나 줄기 부패 상태를 정밀 분석합니다.

#### C. AI 보정 알고리즘 (Hybrid Calibration)
*   **Confidence Fusion**: 엣지 측정값과 서버 AI 분석값 사이의 가중치를 계산합니다. 서버 AI의 확신도(`server_confidence`)가 높을 경우 서버 보정값을 최종 데이터로 채택합니다.
*   **Scaling Recovery**: 이미지 내의 참조 객체(Reference Object)가 없을 경우, 스마트폰 IMU 데이터와 SAM의 기하 분석을 결합하여 실제 스케일을 복원(Scale Recovery)합니다.

---

## 4. 데이터 보정 체계 (Hybrid Calibration)

TreeMap은 **[현장 측정값]**과 **[서버 보정값]**을 명확히 분리하여 저장합니다.

| 구분 | Field Raw (스마트폰) | Server AI (정밀 보정) |
| :--- | :--- | :--- |
| **정확도** | ±10~15% (센서 오차 포함) | ±2~5% (AI 기하 보정 적용) |
| **주요 용도** | 현장 즉시 확인용 | 자산 관리 표준 데이터 |
| **저장 필드** | `dbh`, `height` 등 | `server_dbh`, `server_height` 등 |

---

*본 문서는 TreeMap 시스템의 기술적 투명성을 보장하며, 향후 시스템 고도화의 기준점으로 활용됩니다.*
