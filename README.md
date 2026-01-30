# 💱 실시간 환율 계산기 (Currency Exchange Calculator)

모던한 디자인과 강력한 오프라인 기능을 갖춘 웹 기반 환율 계산기입니다.
네이버 금융 API를 기반으로 전 세계 주요 통화의 실시간 환율을 제공하며, 인터넷 연결 없이도 내장된 데이터를 통해 언제 어디서나 계산할 수 있습니다.

![App Icon](./icon.png)

## ✨ 주요 기능

*   **실시간 환율 연동**: 실시간 환율 정보를 가져와 정확한 계산을 지원합니다.
*   **강력한 오프라인 모드**: 인터넷이 끊겨도 내장된 최신 환율 데이터로 즉시 계산 가능합니다.
*   **직관적인 UI**:
    *   **천단위 콤마 자동 입력**: 금액 입력 시 자동으로 콤마(,)가 적용되어 보기 편합니다.
    *   **스마트 검색**: 국가명이나 화폐 코드로 원하는 통화를 빠르게 찾을 수 있습니다.
*   **여행자 전용 옵션**:
    *   **팁(Service Charge)**: %, 정액, **합산(Total)** 모드를 지원하여 팁을 포함한 총액으로도 쉽게 계산할 수 있습니다.
    *   **세금(Tax) & 수수료(Fee)**: 추가 비용을 포함한 최종 금액을 한눈에 확인합니다.
    *   **설정 자동 저장**: 입력한 팁, 세금, 수수료 설정은 앱을 종료해도 유지됩니다.
*   **편의 기능**:
    *   **Clear(C) 버튼**: 입력 필드마다 제공되는 버튼으로 값을 손쉽게 초기화할 수 있습니다.
    *   **입력 검증**: 합산 모드 시 실수 방지를 위한 스마트한 검증 알림을 제공합니다.
*   **모바일 최적화 (PWA)**: 앱처럼 설치하여 전체 화면으로 사용할 수 있습니다.
*   **단독 실행 모드**: 별도 서버 없이 파일 하나(`standalone.html`)만 폰에 넣어도 작동합니다.

## 📱 설치 및 사용 방법

### 1. 웹 앱으로 사용 (추천)
이 저장소를 **GitHub Pages**에 배포하면 웹 앱으로 사용할 수 있습니다.
사이트 접속 후 브라우저(Chrome/Safari) 메뉴에서 **"홈 화면에 추가"**를 누르면 앱처럼 설치됩니다.

### 2. 오프라인 파일 모드
서버 없이 사용하고 싶다면 `standalone.html` 파일을 스마트폰에 복사하세요.
파일을 열기만 하면 모든 기능이 작동합니다.

## 🛠 기술 스택

*   **Core**: HTML5, CSS3, JavaScript (Vanilla)
*   **Styling**: Custom CSS (Glassmorphism Design), Responsive Flex/Grid
*   **Data**: Naver Finance API (via CORS Proxy)
*   **API**: Geolocation API (위치 기반 국가 자동 감지)

## 📂 프로젝트 구조

```
📦 obsidian-feynman
 ┣ 📜 index.html        # 메인 웹 앱 소스
 ┣ 📜 app.js            # 핵심 로직 (환율 계산, UI 핸들링)
 ┣ 📜 styles.css        # 스타일시트 (다크 모드, 반응형)
 ┣ 📜 standalone.html   # [배포용] CSS/JS가 하나로 합쳐진 단독 파일
 ┣ 📜 manifest.json     # PWA 설치 설정 파일
 ┣ 📜 icon.png          # 앱 아이콘
 ┗ 📜 README.md         # 프로젝트 설명
```

## 📝 라이선스

This project is open source and available under the [MIT License](LICENSE).
