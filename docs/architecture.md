# 구조 설계

이 문서는 `adhd-med-graph`의 목표 구조를 정의합니다.

## 목표

에이튠에 이식하기 전에 브라우저에서 작게 검증할 수 있는 ADHD 약물 농도 그래프 프로토타입을 만듭니다. 목표는 데모 코드, 오픈소스 참고 코드, 에이튠 이식용 모델을 섞지 않는 것입니다.

## 현재 구조 판단

기존 루트 앱은 시각적 기준선과 계산 기준선으로는 유용했지만, 최종 구조로는 적절하지 않았습니다. 그래서 원본 데모는 `research/open-source/adhd-med-caffeine-graph/`로 분리하고, 루트에서는 제거했습니다.

- 원본 `app.js` 안에는 상태, 프리셋, PK 계산, DOM 렌더링, canvas 렌더링, localStorage, 안전 문구가 모두 들어 있습니다.
- 반복 복용이 명시적 dose event가 아니라 농도 계산 함수 내부에서 처리됩니다.
- 그래프 샘플 생성이 렌더링 흐름 안에 들어 있습니다.
- 원본 코드는 plain JavaScript이고, 에이튠 FE는 React/TypeScript 기반입니다.

따라서 루트는 문서와 패키지 메타데이터만 유지하고, 다음 단계부터는 별도 `prototype/` 레이어를 만드는 것이 맞습니다.

## 목표 모듈

```txt
prototype/
├─ pk-profiles.js
├─ dose-events.js
├─ pharmacokinetics.js
├─ concentration-series.js
├─ concentration-demo.html
└─ styles.css
```

### `pk-profiles.js`

약물·제형 단위 메타데이터를 정의합니다.

```js
{
  id: "concerta-oros",
  displayName: "콘서타 서방정",
  genericName: "methylphenidate",
  halfLifeHours: 3.5,
  releaseProfile: "oros-dual",
  peakTimeHours: 6.8,
  irFraction: 0.22,
  irPeakTimeHours: 1.5,
  erPeakTimeHours: 6.8,
  effectStartHours: 1,
  effectEndHours: 12.5,
  evidence: []
}
```

### `dose-events.js`

사용자별 복용 이벤트를 정의합니다. 약물 프로필과 분리되어야 합니다.

```js
{
  medicationId: "concerta-oros",
  amountMg: 18,
  takenAtHour: 6.5,
  source: "scheduled"
}
```

반복 복용 스케줄은 농도 계산 전에 구체적인 dose event 목록으로 펼칩니다.

### `pharmacokinetics.js`

순수 계산 함수만 둡니다.

- 반감기에서 소실률 계산
- 피크 시간에서 흡수율 역산
- 단일 복용 기여도 계산
- OROS 이중 방출 계산
- IR/ER 구성 곡선 계산

DOM, localStorage, canvas 코드는 들어가면 안 됩니다.

### `concentration-series.js`

약물 프로필, 복용 이벤트, 샘플링 그리드를 받아 차트용 시계열을 만듭니다.

```js
buildConcentrationSeries({
  profile,
  doseEvents,
  grid: { startHour: 0, endHour: 24, stepMinutes: 10 }
})
```

예상 출력:

```js
[
  { hour: 0, percent: 0, raw: 0 },
  { hour: 0.167, percent: 4.2, raw: 0.76 }
]
```

### UI 레이어

이미지 참고 화면처럼 모바일 제품 화면에 맞춘 구조를 실험합니다.

- 농도 차트 카드
- 정보 아이콘
- 1차 피크/최대 농도/작용 종료 칩
- 개인 보정 기능 잠금 오버레이
- 설명 바텀시트

## 에이튠 이식 관점

나중에 에이튠으로 옮길 때 예상 매핑은 다음과 같습니다.

- `pk-profiles.js` -> BE 약물 PK 메타데이터 또는 FE fallback 상수
- `dose-events.js` -> 사용자 복약 스케줄과 복용 로그
- `concentration-series.js` -> FE 유틸 또는 테스트 가능한 모델
- 차트 UI -> React 컴포넌트, Recharts 또는 SVG

따라서 핵심 모델 코드는 프레임워크에 의존하지 않아야 합니다.
