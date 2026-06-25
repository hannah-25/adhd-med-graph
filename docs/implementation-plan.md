# 구현 계획

## 1단계: 연구 워크스페이스 안정화

상태: 완료

- 참고 저장소는 `research/open-source/` 아래에 둡니다.
- 참고 저장소 원본 코드는 git에 포함하지 않습니다.
- 분석 결과와 프로젝트 문서만 Markdown으로 추적합니다.
- 루트 패키지 이름을 `adhd-med-graph`로 정리했습니다.
- 이전 정적 데모 파일은 루트에서 제거하고 참고 폴더에만 남겼습니다.

## 2단계: 깨끗한 프로토타입 모델 분리

`prototype/` 폴더를 만들고 독립 모듈을 구현합니다.

1. `pk-profiles.js`
   - 콘서타 OROS부터 시작합니다.
   - 카페인은 비교 입력으로 유지하되 제품 정체성에는 넣지 않습니다.
2. `dose-events.js`
   - 예정 복용, 실제 복용, 건너뜀, 보정 이벤트 형태를 정의합니다.
   - 반복 복용을 concrete event 목록으로 펼치는 helper를 만듭니다.
3. `pharmacokinetics.js`
   - 반감기, 흡수, 피크 정규화, OROS 이중 방출 로직을 독립 구현합니다.
   - 참고 오픈소스 코드를 복사하지 않습니다.
4. `concentration-series.js`
   - 차트용 정규화 시계열을 만듭니다.
   - OROS 약물은 IR/ER 구성 시계열도 함께 반환합니다.

완료 기준:

- 같은 콘서타 입력에서 참고 폴더의 원본 데모와 비슷한 곡선이 나옵니다.
- 모델이 DOM 없이 실행됩니다.
- 단순 입력으로 검증할 수 있습니다.

## 3단계: 목표 모바일 UI 프로토타입

참고 폴더의 기존 `index.html`을 계속 키우지 않고 새 데모 페이지를 만듭니다.

```txt
prototype/concentration-demo.html
```

화면은 에이튠 목표 경험을 기준으로 합니다.

- `콘서타 농도` 차트 카드
- 1차 피크, 최대 농도, 작용 종료 칩
- 정보 바텀시트
- 고급 보정 기능 잠금 오버레이
- 명확한 의료 안전 문구

완료 기준:

- 참고 이미지와 같은 구조를 갖습니다.
- 모바일 폭에서 텍스트가 겹치지 않습니다.
- 잠금 상태에서도 기본 그래프는 이해 가능합니다.

## 4단계: 근거와 PK 프로필 확장

다음 프로필을 순차적으로 추가합니다.

- Concerta OROS
- immediate-release methylphenidate
- 주요 methylphenidate ER 캡슐 패턴
- caffeine
- atomoxetine
- selected SSRI/SNRI long-term medications

각 프로필에는 다음을 포함합니다.

- source URL
- evidence label
- confidence level
- same-day effect인지 accumulation 모델인지
- safety caveat

## 5단계: 에이튠 이식 명세

로컬 프로토타입이 안정된 뒤에만 에이튠 전용 명세를 작성합니다.

```txt
docs/attune-porting-spec.md
```

명세에는 다음을 정의합니다.

- BE PK 메타데이터 형태
- FE API 타입 확장
- React 컴포넌트 경계
- 무료/잠금 기능 구분
- 정적 그래프 이미지에서 동적 그래프로 바꾸는 마이그레이션 경로

이 단계 전에는 에이튠 프로젝트 파일을 수정하지 않습니다.
