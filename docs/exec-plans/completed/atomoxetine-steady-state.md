# 실행 계획: atomoxetine 정상상태 표현

## 목표

atomoxetine(스트라테라 외 국내 6종 = 프로필 1개)을 "당일 농도 곡선"이 아닌 **누적형(accumulation) 표현**으로 그린다. §9 결정(3번 방식)에 따라 두 부분으로 구성한다.

- **상단 — 효과 누적 진행**: 임상 효과가 수주에 걸쳐 쌓이는 시간 경과를 보여준다.
- **하단 — 정상상태 일일 농도 곡선**: 매일 같은 시간 복용 시 안정화된 하루 혈중 농도 곡선을 보여준다.

핵심 메시지: 자극제와 달리 **당일 즉효를 기대하지 말 것**, 효과는 수주에 걸쳐 나타나며 임의 중단 금지.

## 배경

- atomoxetine은 비자극제(선택적 노르에피네프린 재흡수 억제제). 국내 7개 브랜드(스트라테라/아토목신/아토세라/아토모테라/아목세틴/도모틴/환인)는 동일 성분·제형 → **프로필 1개**.
- **두 개의 다른 시간 척도**가 핵심:
  - 혈장 농도: 빠르게 흡수(Tmax 1~2h), 반감기 짧음(EM 5.2h) → **혈장 정상상태는 며칠 내** 도달.
  - 임상 효과: **수주(약 2~6주)에 걸쳐 누적** → 이게 "당일 곡선"이 부적합한 이유.
- 그래서 stimulant처럼 곡선 1개로는 오해를 부른다. 효과 누적(주 단위)과 혈장 일일 곡선(시간 단위)을 분리 표시한다.

## 현재 상태

- stimulant 3종(콘서타/페니드/메디키넷)은 당일 곡선으로 완료. 데모는 약물별 단일 곡선 렌더.
- atomoxetine 프로필·표현 없음. 모델은 `releaseProfile: immediate`로 일일 곡선을 계산할 수 있으나, 누적 표현용 로직·UI는 없음.

## 변경 범위

### 1. 데이터 (`prototype/pk-profiles.js`)

atomoxetine 프로필 추가:

```txt
id: "atomoxetine"
brandName: "스트라테라"            // 국내 대표 상품명
genericName: "atomoxetine"
drugClass: "non-stimulant"
modelKind: "accumulation"          // ★ 신규 필드 (stimulant은 "same-day-curve")

// 정상상태 일일 곡선용 PK (immediate 흡수)
releaseProfile: "immediate"
halfLifeHours: 5.2                 // EM(정상 대사자) 기준
release: { irFraction: 1.0, ir: { rate: ~1.0 } }   // Tmax ~1.5h 재현하도록 보정
peakTimeHours: 1.5

// 효과 누적용 (★ 신규 필드, PK 아님 — 임상 경과 가이드)
effectAccrual: {
  onsetWeeks: 2,                   // 효과가 느껴지기 시작
  stabilizeWeeks: 6,              // 효과 안정화(대략)
}

// 대사 다형성 주의 (CYP2D6): PM은 반감기 ~21.6h, 노출 증가
metabolismNote: "CYP2D6 저대사자(PM)는 반감기 ~21.6h로 노출이 크게 증가"
```

- 정상상태 일일 곡선의 **Y축은 정규화(%)** 로 표시한다(아래 의사결정 로그 참고).

### 2. 모델 (`prototype/effect-model.js` — 신규, 순수 함수)

PK가 아니므로 `pharmacokinetics.js`와 분리한다.

```txt
effectAccrualFraction(weeks, { onsetWeeks, stabilizeWeeks }) -> 0..1
```

- 단조 증가 포화 곡선(예: 0~onset는 완만, onset~stabilize에 가파르게 상승, stabilize 이후 ~1.0 평탄).
- 교육용 예시 곡선이며 임상 측정값이 아님(주석·문서에 명시).

정상상태 일일 곡선은 **기존 `buildConcentrationSeries` 재사용**(immediate 프로필). 반감기 5.2h·24h 간격이면 누적이 미미하므로 단일 복용 ≈ 정상상태. (BID 옵션은 추후.)

### 3. UI (`prototype/concentration-demo.html`)

`modelKind === "accumulation"` 이면 두 부분 렌더:

```txt
[효과 누적 진행 카드]
  - 0 → stabilizeWeeks 타임라인/진행 막대
  - "효과 발현 ~2주 · 안정화 ~6주" 칩
  - (옵션) "복용 N주차" 슬라이더로 현재 위치 표시
  - 문구: "혈중 농도가 아니라 임상 효과의 누적 경과입니다"

[정상상태 일일 농도 곡선 카드]  ← 기존 차트 컴포넌트 재사용
  - 하루(0~24h) 정규화 곡선, "정상상태" 라벨
  - 문구: "약을 매일 복용해 농도가 안정된 뒤의 하루 패턴입니다.
           이 일일 곡선은 효과의 세기를 나타내지 않습니다(효과는 위 누적 경과)."
```

- stimulant 경로(단일 곡선)는 그대로 유지. 분기만 추가.

## 제외 범위

- CYP2D6 PM/EM 별도 곡선 토글(추후). 이번엔 EM 기준 + 주의 문구만.
- BID(1일 2회) 분복 곡선(추후). 이번엔 1일 1회 기준.
- guanfacine/clonidine/viloxazine 등 다른 누적형 약물(해외, 추후). 단, 같은 표현 틀을 재사용하도록 설계.
- 절대 농도(ng/mL) 표시 — 정규화 %로 대체(의사결정 로그 참고).

## 관련 문서

- [attune-porting-spec.md](../../attune-porting-spec.md) §1(model_kind), §9(결정 4)
- [implementation-plan.md](../../implementation-plan.md) 4단계

## 관련 코드

- `prototype/pk-profiles.js` (프로필 + 신규 필드)
- `prototype/effect-model.js` (신규)
- `prototype/concentration-series.js` (정상상태 곡선 재사용)
- `prototype/concentration-demo.html` (누적형 분기 렌더)
- `prototype/model.test.mjs` (테스트)

## 작업 단계

1. atomoxetine 프로필 추가(스트라테라 라벨 PK로 일일 곡선 보정, EM 5.2h / Tmax ~1.5h). `modelKind`·`effectAccrual` 필드 도입.
2. `effect-model.js` 순수 함수 + 테스트.
3. 데모에 누적형 분기 UI(효과 누적 카드 + 정상상태 일일 곡선 카드) 추가.
4. 안전 문구·정보 시트 atomoxetine 버전.
5. 근거 문서 `docs/product/atomoxetine-reference.md` 작성, 인덱스 링크.
6. 계획서·porting-spec 상태 갱신.

## 검증 방법

- `effectAccrualFraction`: 0주=0 근처, onset 이후 상승, stabilize에서 ~1.0, 단조 증가 단위 테스트.
- 정상상태 일일 곡선: Tmax ~1.5h, 반감기 5.2h 감쇠 재현.
- 데모: atomoxetine 선택 시 2-카드 렌더, stimulant는 단일 곡선 유지(헤드리스 스크린샷).
- `npm test` / `npm run agent:verify` 통과.

## 위험 요소

- **효과 누적 곡선이 임상 측정값으로 오인될 위험** → "교육용 예시, 혈중 농도 아님" 문구 필수. 안전 문구 약화는 사람 리뷰(AGENTS.md).
- 두 시간 척도(시간 vs 주)를 한 화면에 두어 혼동 가능 → 카드 제목·축 단위 명확히.
- CYP2D6 다형성으로 개인 편차 큼 → 주의 문구.
- 데이터 정책: 효과 발현 주수는 라벨 PK 수치가 아니라 임상 가이드 → confidence 낮춤·출처 명시.

## 롤백 방법

- 단일 커밋으로 추가. 문제 시 해당 커밋 revert. 기존 stimulant 경로는 불변이므로 영향 없음.

## 의사결정 로그

- **정상상태 일일 곡선은 정규화 %로 표시**: 라벨에 깨끗한 atomoxetine Cmax/AUC 절대값이 없고(데이터 정책상 절대 스케일 앵커 곤란), 메시지가 "안정된 하루 패턴/타이밍"이라 절대 농도보다 정규화가 적절. 추후 라벨 AUC 확보 시 절대값 전환 가능.
- **반감기는 EM 5.2h 사용**: 라벨 평균(정상 대사자). PM(21.6h)은 별도 곡선 대신 주의 문구로 처리(이번 범위).
- **효과 누적은 PK가 아닌 별도 모델**: `effect-model.js`로 분리해 `pharmacokinetics.js` 순수성 유지.
- **FDA 검증(2026-06-28)**: 전체 Strattera 라벨 확인 결과 단일용량 Cmax/AUC 절대값이 없어 정규화 결정이 옳음. 효과 시점은 Clinical Studies(효능 시험 6~10주, 위약 대비 유의 ~8주)로 근거 보강, 안정화 6→8주로 조정. 누적 곡선 모양은 여전히 교육용 예시.

## 완료 조건

- atomoxetine 선택 시 효과 누적 카드 + 정상상태 일일 곡선 카드가 안전 문구와 함께 표시된다.
- stimulant 3종 경로는 회귀 없음.
- 테스트·검증 통과, 근거 문서·계획서 갱신 완료.

## 작업 후 문서 업데이트 목록

- `docs/product/atomoxetine-reference.md` (신규)
- `docs/product/index.md`, `docs/README.md` (링크)
- `docs/implementation-plan.md` (atomoxetine 완료 표시)
- 이 계획을 `docs/exec-plans/completed/`로 이동
