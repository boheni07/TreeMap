# TreeMap 서버 시스템 상세 명세서 (Server System Specification)

본 문서는 TreeMap 시스템의 백엔드 서버 구조, 데이터 처리 파이프라인, AI 분석 엔진과의 통합 체계 및 데이터베이스 설계를 상세히 기술합니다.

---

## 1. 서버 아키텍처 (Server Architecture)

TreeMap 서버는 고성능 이미지 처리와 실시간 API 응답을 위해 **비동기 기반의 RESTful 아키텍처**를 채택하고 있습니다.

### 1.1 기술 스택
*   **Web Framework**: **FastAPI** (Python 3.10+) - 고성능 비동기 처리를 통한 빠른 데이터 수신.
*   **ORM**: **SQLAlchemy** - 객체 관계형 매핑을 통한 데이터베이스 추상화.
*   **Database**: **SQLite** (Local/Development) / **PostgreSQL** (Production) - 정형 데이터 및 수목 메타데이터 저장.
*   **AI Service Layer**: Python 기반의 독립적인 AI 분석 모듈로, API 요청 후 즉시 실행(Post-processing)됩니다.

---

## 2. 서버 데이터 처리 파이프라인 (Data Pipeline)

클라이언트로부터 전달받은 RAW 데이터를 정밀 정보로 변환하는 4단계 파이프라인입니다.

### 2.1 단계별 프로세스
1.  **데이터 수신 (Ingestion)**:
    - 모바일 단말로부터 이미지(Base64/Binary)와 센서 메타데이터를 수신합니다.
    - 스키마 검증(Pydantic 기반)을 통해 데이터의 정합성을 체크합니다.
2.  **RAW 데이터 저장 (Storage)**:
    - 수신된 모든 원본 측정값을 수목 상태 테이블(`TreeMeasurement`)에 즉시 저장합니다.
3.  **AI 분석 트리거 (AI Trigger)**:
    - 저장 직후 서버의 `TreeAIService`가 자동 호출됩니다.
    - 이미지 데이터를 고성능 모델(SAM, YOLO-Heavy)에 전달하여 정밀 분석을 수행합니다.
4.  **보정값 업데이트 (Calibration)**:
    - AI가 산출한 정밀 DBH, 수고, 건강도 및 확신도 점수를 기존 테이블의 `server_*` 필드에 업데이트합니다.
    - 분석 완료 시 상태(`is_server_processed`)를 업데이트하여 대시보드에 반영합니다.

---

## 3. 서버 사이드 AI 엔진 상세

서버 AI는 엣지 단말에서 수행 불가능한 고연산 모델을 통해 데이터의 신뢰성을 극대화합니다.

| 엔진 영역 | 사용 기술 | 상세 기능 |
| :--- | :--- | :--- |
| **정밀 분할 Layer** | **SAM (Segment Anything)** | 이미지 내 수목의 미세한 경계선을 추출하여 수관폭 및 줄기 굵기를 실제 비율로 재계산합니다. |
| **객체 탐지 Layer** | **YOLOv11-seg (Large)** | 고해상도 이미지에서 수목의 위치와 주변 환경을 더 높은 정확도로 탐지합니다. |
| **상태 분석 Layer** | **EfficientNet-B7** | 잎의 색상, 줄기 상처 등 미세 패턴을 분석하여 생육 임계치를 넘는지 판단합니다. |
| **식별 검증 Layer** | **Vision Transformer (ViT)** | 현장 사용자의 수종 입력을 AI가 재검토하여 데이터의 객관성을 확보합니다. |

---

## 4. 데이터베이스 설계 요약 (Database Schema)

수목의 전체 생애주기 관리를 위해 측정 원본값과 AI 보정값을 이원화하여 관리합니다.

*   **기본 정보**: 수종, 수집 타임스탬프, 기기 모델 등.
*   **현장 측정값 (Raw)**: `dbh`, `height`, `gps_lat`, `gps_lon` 등.
*   **서버 보정값 (Corrected)**: `server_dbh`, `server_height`, `server_confidence` 등.
*   **이미지 데이터**: RAW 스냅샷 및 AI 분석용 마스크 데이터 정보.

---

## 5. 시각화 및 대시보드 인터페이스

*   **REST API**: 관리 대시보드(`MapDashboard`)를 위한 데이터 조회 및 통계 API 제공.
*   **GeoJSON 지원**: 수목의 위치 정보를 GIS 시스템과 연동 가능한 표준 형식으로 변환하여 제공.
*   **AI 신뢰도 필터**: 신뢰도가 낮은(`confidence < 0.7`) 데이터를 별도로 관리자에게 알림.

---

*본 문서는 TreeMap 서버 시스템의 유지보수 및 확장성을 위한 공식 관리 지침으로 활용됩니다.*
