# Atomoxetine PK Reference (근거 자료)

아토목세틴(스트라테라 외 국내 6종 = 동일 프로필) 표현 근거 자료입니다. 비자극제(NRI)이며 **누적형(accumulation)** 으로, 당일 단일 곡선 대신 ① 효과 누적 진행 + ② 정상상태 일일 곡선으로 표현합니다([데이터 출처 정책](concerta-pk-reference.md#데이터-출처-정책-2026-06-27), 설계: [atomoxetine-steady-state](../exec-plans/completed/atomoxetine-steady-state.md)).

> 안전 경계: 성인 평균/임상 경과 기반 추정. 교육용이며 의료 조언이 아닙니다. 효과가 느려도 임의 중단 금지, 의료진과 상의.

## 1. 두 개의 시간 척도 (핵심)

- **혈장 농도(시간 단위)**: 빠르게 흡수(Tmax 1~2h), 반감기 짧음 → 혈장 정상상태는 며칠 내 도달.
- **임상 효과(주 단위)**: 약 2~6주에 걸쳐 누적. → 당일 곡선이 효과를 대표하지 못하는 이유.

## 2. 수치 데이터 (FDA Strattera 라벨)

| 파라미터 | 값 | 비고 |
|----------|-----|------|
| Tmax | 1~2 시간 | 빠른 흡수 |
| 반감기 (EM) | 5.2 시간 | 정상 대사자 |
| 반감기 (PM) | 21.6 시간 | CYP2D6 저대사자 |
| 생체이용률 | 63% (EM) / 94% (PM) | |
| 단일용량 Cmax/AUC | (라벨에 없음) | 전체 라벨 확인 → 정규화 표시 |
| 효능 시험 기간 | 6~10 주 | Clinical Studies |
| 위약 대비 유의 개선 | ~8 주까지 확인 | Clinical Studies |

- **전체 FDA 라벨을 확인한 결과 단일 용량 Cmax/AUC 절대값이 없다** → 정상상태 일일 곡선은 **정규화(%)** 로 표시(검증된 결정).
- **효과 시점(FDA Clinical Studies 근거)**: ADHD 효능 시험 **6~10주**, 위약 대비 **유의한 개선이 약 8주까지** 확인. 모델은 안정화 ~8주로 설정.
- 누적 곡선의 *정확한 모양*(주별 곡선)은 라벨에 없으므로 **교육용 예시**이며 onsetWeeks(~2주)는 추정값이다.

## 3. 표현 방식

- **효과 누적 진행**: Weibull CDF 기반 단조 증가 곡선(발현 ~25%, 안정화 ~90%). `prototype/effect-model.js`.
- **정상상태 일일 곡선**: 기존 PK 모델 재사용(immediate, t½ 5.2h, Tmax ~1.5h), 정규화 표시. 반감기 5.2h·24h 간격이면 누적 미미 → 단일 복용 ≈ 정상상태.
- CYP2D6 PM은 별도 곡선 대신 주의 문구로 처리(이번 범위).

## 출처 (Evidence)

| 자료 | 유형 | 신뢰도 | URL |
|------|------|--------|-----|
| Strattera FDA 라벨 — Pharmacokinetics | 규제 기관 라벨 | 높음 | https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=309de576-c318-404a-bc15-660c2b1876fb |
| Strattera FDA 라벨 — Clinical Studies (효능 시험 6~10주, 유의 ~8주) | 규제 기관 라벨 | 중간 | https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=309de576-c318-404a-bc15-660c2b1876fb |
