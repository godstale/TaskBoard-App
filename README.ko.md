# TaskBoard App

[TaskOps](https://github.com/godstale/TaskOps) 프로젝트의 작업 현황을 시각화하는 Electron 데스크탑 앱.
TaskOps가 생성한 `taskops.db` SQLite 파일을 읽기 전용으로 참조합니다.

> English README → [README.md](README.md)

---

## 사전 요구사항

- Node.js 18+
- pnpm 8+
- [TaskOps](https://github.com/godstale/TaskOps) — TaskBoard는 TaskOps가 생성한 `taskops.db` 없이는 동작하지 않습니다.

---

## 설치

```bash
git clone https://github.com/godstale/TaskBoard-App.git
cd TaskBoard-App
pnpm install
```

> **Windows 주의사항**
> PowerShell에서 `pnpm` 실행 시 스크립트 실행 정책 오류가 발생할 수 있습니다.
> 아래 두 방법 중 하나를 사용하세요.
>
> **방법 1 — ExecutionPolicy 변경 (권장):**
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
>
> **방법 2 — cmd.exe 또는 Git Bash 사용:**
> PowerShell 대신 명령 프롬프트(cmd.exe)나 Git Bash에서 실행하면 정책 오류 없이 동작합니다.

> `better-sqlite3`는 네이티브 모듈입니다. Electron은 시스템 Node.js와 다른 V8 ABI를 사용하므로, `pnpm install` 시 `postinstall` 훅이 자동으로 Electron 전용 바이너리를 다운로드합니다.
>
> `electron` 또는 `better-sqlite3` 버전을 업그레이드했다면 아래 명령으로 수동 재빌드하세요:
> ```bash
> pnpm rebuild:native
> ```

---

## 실행

**빌드:**

```bash
pnpm build
```

**개발 모드 (Vite dev server + Electron 동시 실행):**

```bash
pnpm dev
```

> Vite 개발 서버(port 5173)를 띄운 뒤 Electron을 실행합니다.
> 앱 실행 후 OS 네이티브 폴더 선택 다이얼로그로 TaskOps 루트 폴더를 지정합니다.

**프로덕션 빌드 (배포용 바이너리):**

```bash
# 렌더러(React) + 메인 프로세스 빌드
pnpm build

# 설치 프로그램 패키징 (Windows: .exe NSIS, macOS: .dmg, Linux: .AppImage)
pnpm package
```

패키징 완료 후 `release/` 폴더에 인스톨러가 생성됩니다.

---

## TaskOps와 연동 방법

TaskOps를 실행하면 프로젝트 루트에 아래 파일들이 생성됩니다.

```
MyProject/                ← TaskOps 프로젝트 폴더 (VS Code에서 열린 폴더)
├── taskops.db            ← TaskOps가 생성하는 SQLite DB
├── TODO.md
├── TASK_OPERATIONS.md
├── AGENTS.md
├── SETTINGS.md
├── docs/plans/
└── resources/
```

TaskBoard는 이 구조에서 `taskops.db`를 찾기 위해 **프로젝트 폴더의 부모 디렉토리**를 루트로 받습니다.

```
workspace/                ← 폴더 선택 다이얼로그에서 이 폴더를 선택
└── MyProject/
    └── taskops.db
```

폴더 선택 다이얼로그에서 `workspace/` 폴더를 선택합니다.

TaskBoard는 지정된 폴더의 하위 디렉토리를 스캔하여 `taskops.db`가 있는 프로젝트를 모두 목록에 표시합니다.
여러 프로젝트를 동시에 관리하는 경우 공통 상위 폴더를 지정하면 됩니다.

DB 파일이 변경되면 chokidar(파일 감시) + 3초 폴링 fallback으로 자동 갱신됩니다.

---

## 화면 구성

| 화면 | 설명 |
|------|------|
| **Dashboard** | 요약 카드 + Epic/Task 계층 구조 |
| **Task Operations** | ReactFlow 노드-엣지 다이어그램 |
| **Resources** | 리소스 목록 + 타입 배지 |
| **Settings** | Key/Value 설정 테이블 |

---

## 테스트

```bash
# Vitest 단위 테스트
pnpm test

# Playwright E2E 테스트
pnpm test:e2e
```

샘플 DB 재생성:

```bash
node example/create-sample-db.js
```

---

## 프로젝트 구조

```
TaskBoard-App/
├── src/
│   ├── core/       # DB 연결·쿼리·파일 감시
│   ├── main/       # Electron 메인 프로세스 + IPC
│   └── renderer/   # React 18 렌더러 (화면, 컴포넌트)
├── tests/
│   ├── electron.test.ts    # Vitest 단위 테스트
│   └── e2e/                # Playwright E2E 테스트
└── example/
    ├── sample.db              # 샘플 SQLite DB (수동 테스트용)
    └── ...
```

아키텍처 상세 → [`docs/architecture.md`](docs/architecture.md)
변경 이력 → [`CHANGELOG.md`](CHANGELOG.md)

---

## 관련 프로젝트

- [TaskOps](https://github.com/godstale/TaskOps) — AI Agent용 프로젝트 관리 도구 (데이터 소스)
