# CLAUDE.md - 개발 및 협업 가이드라인

이 문서는 AI 어시스턴트(Claude)와 사용자(User) 간의 효율적인 협업과 일관된 개발 품질을 유지하기 위한 원칙을 정의합니다. 모든 작업 시 본 가이드를 최우선으로 준수해야 합니다.

## 1. 언어 및 소통 (Language & Communication)
*   **기본 언어**: 모든 대화, 의견 제시, 결과 보고, 답변은 반드시 **한글(Korean)**로 작성합니다.
*   **명확성**: 모호한 표현을 피하고, 기술적 내용은 이해하기 쉽게 풀어서 설명하되 정확한 용어를 사용합니다.

## 2. 문서화 원칙 (Documentation Standards)
*   **한글 작성 원칙**: 프로젝트 내 생성하는 모든 마크다운(`*.md`) 문서는 **한글**로 작성하는 것을 원칙으로 합니다.
    *   예: `README.md`, `DEPLOY_GUIDE.md`, `API_DOCS.md` 등.
*   **예외**: 국제적 표준이나 관례상 영어가 필수적인 파일은 제외합니다.
    *   예: `LICENSE`, `CODEOWNERS` 등.

## 3. 개발 기본 원칙 (Development Principles)
본 원칙은 향후 다양한 프로젝트에 공통적으로 적용됩니다.

### 3.1 개발 방법론 (Development Methodology)
*   **스펙 주도 개발 (SDD)**: 개발은 코딩 이전에 기획서와 개발 백서(White Paper) 등 명확한 스펙 정의를 선행해야 합니다. 구현된 코드는 정의된 스펙을 충실히 반영해야 합니다.
*   **검증 주도 개발**: 기능 구현 후에는 브라우저 시뮬레이션 또는 코드 정적 분석을 통해 반드시 동작을 검증합니다.

### 3.2 코드 구조 및 아키텍처 (Code Architecture)
*   **모듈화 및 재사용성 (Modularity)**: 코드의 재사용성을 높이기 위해 기능 및 용도 단위로(예: Utils, Components, Services) 파일을 철저히 분리하여 생성하고 관리합니다.
*   **계층 분리**: 프론트엔드, 백엔드, 문서 등 성격이 다른 파일은 명확히 구분하여 관리합니다.

### 3.3 유지보수 및 최적화 (Maintenance & Optimization)
*   **지속적 업데이트**: 개발 백서(White Paper) 등 프로젝트 사양 문서는 개발 변경 사항을 수시로 반영하여 최신 상태(Source of Truth)를 유지합니다.
*   **가이드라인 동기화 (Guideline Sync)**: `CLAUDE.md` 내용 수정 시, `GEMINI.md` 등 다른 AI 어시스턴트용 가이드라인 파일에도 **반드시 동일한 변경 사항을 반영**하여 일관성을 유지해야 합니다.
*   **리소스 최적화 (Resource Logic)**: 개발하는 모든 프로젝트에는 **반드시 `.antigravityignore` 파일을 생성 및 관리**하여 시스템 메모리를 효율적으로 사용해야 합니다.
    *   빌드 생성물, 테스트 부산물 등 개발에 직접 필요하지 않은 파일은 분석 대상에서 제외합니다.

## 4. 버전 관리 (Version Control)
*   **커밋 메시지 (Commit Message)**: 커밋 메시지는 **한글과 영문을 병기**하여 작성합니다.
    *   형식: `type: English description (한글 설명)`
    *   예: `feat: Add receipt upload feature (영수증 업로드 기능 추가)`
*   **배포 원칙 (Workflow)**:
    *   **선 검토 후 배포 (Review First)**: 파일 생성/수정 시 즉시 커밋하지 않고, 사용자의 검토 및 승인이 완료되거나 기능이 안정화된 시점에 커밋/푸시합니다.
    *   **일괄 처리 (Batch Processing)**: 문서 수정 등은 일정한 주기로 모아서 배포하며, 사용자의 명시적 요청("올려줘")이 있을 때는 즉시 배포합니다.

## 5. 배포 및 릴리즈 (Deployment & Release)
*   **보안 릴리즈 (Secure Release)**: 소스 코드 전달 시에는 반드시 **클린 빌드(Clean Build)** 상태의 소스만 포함하며, 다음 항목들은 **엄격히 제외**해야 합니다.
    *   **버전 관리**: `.git`, `.svn` 등
    *   **빌드 생성물 (Build Artifacts)**:
        *   C#/C++ (Visual Studio): `bin/`, `obj/`, `*.exe`, `*.dll`, `*.pdb`, `*.suo`, `*.user`
        *   Java (IntelliJ/Eclipse): `target/`, `build/`, `out/`, `*.class`, `*.jar`
        *   Web/Node: `node_modules/`, `dist/`, `.next/`
    *   **IDE 설정**: `.vs/`, `.idea/`, `.vscode/`, `*.iml`
    *   **보안/설정**: `secrets.json`, `.env`, `appsettings.Development.json`, `backend/config` (API Key 포함 파일)
    *   **내부 문서**: `docs/` (내부 기획서), `GEMINI.md`, `CLAUDE.md` 등 협업 가이드
*   **스크립트 활용**: 위 규칙을 준수하기 위해 `dev-guidelines/scripts/create_release_zip.ps1` 와 같은 자동화 스크립트를 사용하여 실수를 방지합니다.
