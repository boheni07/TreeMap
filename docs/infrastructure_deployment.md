# TreeMap 인프라 및 배포 가이드

TreeMap은 Vercel 환경에서 서버리스(Serverless) 형태로 운영되거나 로컬 개발 서버에서 즉시 실행될 수 있도록 구성되어 있습니다.

## 1. Vercel 배포 아키텍처 (Cloud)

- **Frontend**: Vite로 빌드된 정적 파일이 Vercel의 CDN을 통해 배포됩니다.
- **Backend**: `api/` 폴더 내의 Python 코드가 Vercel Serverless Functions로 동작합니다.
- **설정 파일**: `vercel.json`을 통해 정적 페이지 라우팅과 API 재작성(Rewrite) 규칙이 관리됩니다.

### 배포 절차
1. GitHub 저장소와 Vercel 프로젝트를 연결합니다.
2. Vercel이 `package.json`과 `vercel.json`을 인식하여 빌드 프로세스를 시작합니다.
3. 배포 완료 후 `https://{your-app}.vercel.app` 주소가 생성됩니다.

## 2. 로컬 개발 환경 (Local)

### 요구 사양
- Node.js 18+
- Python 3.10+

### 서버 실행 (FastAPI)
```bash
# 가상환경 권장
pip install -r requirements.txt
python main.py
```
- 기본 포트: `8000`
- API 문서(Swagger): `http://localhost:8000/docs`

### 클라이언트 실행 (React)
```bash
npm install
npm run dev
```
- 기본 포트: `5173`

## 3. 환경 설정 (Configuration)

### Vercel 전용 설정 (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "api/index.py" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```
- 모든 `/api/*` 요청은 파이썬 백엔드로 전달됩니다.
- 나머지는 SPA(Single Page Application) 라우팅을 위해 프론트엔드 `index.html`로 전달됩니다.

### 데이터베이스 관리
- 로컬 환경에서는 `api/tree_map.db` 파일로 SQLite가 자동 생성됩니다.
- 서버리스 환경에서는 데이터 지속성을 위해 별도의 외부 DB(PostgreSQL 등) 연결이 권장됩니다.
