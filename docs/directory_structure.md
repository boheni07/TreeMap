# TreeMap 디렉토리 구조 안내

본 문서는 프로젝트의 전체 폴더 구성과 각 파일의 역할에 대해 설명합니다.

## 1. 전체 디렉토리 트리

```text
TreeMap/
├── api/                # 백엔드 (FastAPI)
│   ├── index.py        # API 엔드포인트 정의
│   ├── models.py       # SQLAlchemy DB 모델
│   ├── database.py     # DB 연결 및 세션 관리
│   ├── schemas.py      # Pydantic 데이터 검증 스키마
│   └── services/       # AI 분석 및 비즈니스 로직
├── src/                # 프론트엔드 (React)
│   ├── App.tsx         # 메인 라우팅 및 앱 진입점
│   ├── components/     # 재사용 가능한 UI 컴포넌트
│   │   ├── TreeViewMap.tsx    # 지도 시각화 핵심 컴포넌트
│   │   └── MobileSimulator.tsx # 모바일 앱 시뮬레이터
│   ├── pages/          # 대시보드 및 서비스 페이지
│   └── utils/          # 공통 유틸리티 함수
├── docs/               # 시스템 기술 및 가이드 문서
├── public/             # 정적 리소스 (이미지, 폰트 등)
├── package.json        # Node.js 패키지 관리
├── requirements.txt    # Python 패키지 관리
├── vercel.json         # Vercel 배포 설정
└── vite.config.ts      # Vite 빌드 설정
```

## 2. 주요 폴더 설명

### `api/` (Backend)
- FastAPI를 기반으로 하며, Vercel Serverless Functions 환경에 최적화되어 있습니다.
- `index.py`는 모든 API의 입구이며, `services/`에서 AI 추론을 호출합니다.

### `src/` (Frontend)
- React와 TypeScript를 사용하여 구축되었습니다.
- `components/` 내의 `MobileSimulator`는 실제 스마트폰이 없는 환경에서도 고유의 센서 데이터를 시뮬레이션하여 측정 프로세스를 테스트할 수 있게 합니다.

### `docs/` (Documentation)
- 시스템의 무결성을 유지하기 위한 기술 문서들이 포함되어 있습니다.
- 모든 문서는 한국어로 작성되며 시스템 아키텍처, API, DB 정보 등을 다룹니다.

### `public/` (Assets)
- 지도 마커 아이콘, 수목 실루엣 오버레이 이미지 등 UI에 필요한 정적 자산이 포함됩니다.
