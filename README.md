# TreeMap (Project Antigravity)

AI 기반의 모바일 수목 측정 및 자산 관리 플랫폼입니다. 스마트폰 센서(IMU, Camera, GPS)와 하이브리드 AI 모델(Edge-Cloud)을 결합하여 나무의 흉고직경(DBH), 수고, 위치 및 건강도를 정밀하게 측정합니다.

## 🚀 주요 기능

- **고정밀 수목 측정**: LiDAR 없이 스마트폰만으로 DBH, 수고, 수관폭, 지하고 측정.
- **실시간 스마트 가이드**: 수평계 및 1.2m 가이드 라인을 통한 정확한 측정 유도.
- **하이브리드 AI 보정**: Edge 단말의 실시간 분석과 Server의 고정밀 AI 보정 결합.
- **통합 대시보드**: 측정된 수목 데이터를 지도로 시각화하고 생육 정보를 관리.

## 🛠 기술 스택

### Frontend
- **React 18** + **Vite**
- **TypeScript**
- **Leaflet**: 지도 시각화
- **Lucide React**: 아이콘 시스템
- **Vanilla CSS**: 반응형 및 애니메이션 디자인

### Backend
- **FastAPI** (Python 3.10+)
- **SQLAlchemy**: ORM
- **SQLite**: 기본 데이터베이스
- **Vercel**: 서버리스 배포 환경 지원

### AI Models
- **YOLOv11-seg**: 수목 줄기 및 객체 분할
- **SAM (Segment Anything)**: 고정밀 경계 보정 (Server-side)
- **MiDaS v2.1 Small**: 단안 깊이 추정 (Edge-side)
- **MobileNetV3 / EfficientNet**: 수종 분류 및 건강도 진단

## 📂 프로젝트 구조

- `api/`: FastAPI 백엔드 코드 및 데이터베이스 모델
- `src/`: React 프론트엔드 소스 코드
- `docs/`: 시스템 상세 기술 문서
- `public/`: 정적 자산 (이미지, 아이콘 등)

## 🏁 시작하기

### 백엔드 실행
```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

### 프론트엔드 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📄 상세 문서
더 자세한 정보는 [`/docs`](./docs/system_overview.md) 폴더 내의 문서들을 참조하세요.

- [시스템 개요](./docs/system_overview.md)
- [기술 명세서](./docs/technical_specification.md)
- [모바일 연결 가이드](./docs/mobile_connection_guide.md)
