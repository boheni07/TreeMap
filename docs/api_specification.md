# TreeMap API 상세 명세서

TreeMap 백엔드는 FastAPI를 사용하여 수목 측정 데이터의 수집, 저장 및 AI 분석 보정 프로세스를 관리합니다.

## 1. 기반 설정
- **Base URL**: `http://localhost:8000/api` (Local) 또는 `https://{project}.vercel.app/api` (Production)
- **Auth**: 현재 개발 단계로 별도의 인증 없이 활성화되어 있습니다.

## 2. 주요 엔드포인트

### 2.1 수목 데이터 업로드
- **URL**: `POST /trees`
- **Description**: 스마트폰에서 측정된 Raw 데이터와 이미지를 서버로 전송합니다.
- **Request Body**:
```json
{
  "species": "string",
  "dbh": 0.0,
  "height": 0.0,
  "crown_width": 0.0,
  "ground_clearance": 0.0,
  "gps_lat": 0.0,
  "gps_lon": 0.0,
  "device_model": "string",
  "image_data": "string (base64)"
}
```
- **Response**: 생성된 수목 객체 정보 (ID 포함)

### 2.2 수목 목록 조회
- **URL**: `GET /trees`
- **Description**: 저장된 모든 수목 데이터와 AI 보정값을 조회합니다.
- **Response**: `TreeMeasurement` 객체의 리스트

### 2.3 특정 수목 상세 조회
- **URL**: `GET /trees/{tree_id}`
- **Description**: 특정 ID를 가진 수목의 상세 정보와 AI 분석 상태를 확인합니다.

### 2.4 AI 분석 상태 확인
- **URL**: `GET /trees/{tree_id}/status`
- **Description**: 서버 사이드 AI 보정 작업의 완료 여부를 확인합니다.
- **Response**: `{"is_server_processed": bool, "confidence": float}`

## 3. 공통 모델 (Schema)

### TreeMeasurement
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | Integer | 고유 식별자 |
| `timestamp` | DateTime | 측정 시각 |
| `dbh` | Float | 현장 측정 흉고직경 (cm) |
| `height` | Float | 현장 측정 수고 (m) |
| `server_dbh` | Float | AI 보정 흉고직경 (cm) |
| `server_height` | Float | AI 보정 수고 (m) |
| `is_server_processed` | Boolean | 서버 AI 분석 완료 여부 |
| `confidence` | Float | AI 분석 확신도 (0.0~1.0) |
