# 에이튠 이식 명세 (Attune Porting Spec)

이 문서는 로컬 프로토타입(`prototype/`)의 콘서타 혈중 농도 그래프를 `attune-be`/`attune-fe`로 옮기기 위한 **설계 명세**입니다.

> 범위 경계: 이 문서는 명세만 정의합니다. 이 문서 작성 단계에서 에이튠 저장소 코드를 수정하지 않습니다 (AGENTS.md). 실제 이식은 본 명세를 사람이 리뷰한 뒤 각 저장소에서 별도 작업으로 진행합니다.
>
> 아래 에이튠 파일 경로·타입은 2026-06-27 기준 읽기 전용 조사 결과이며, 실제 이식 시 최신 상태를 다시 확인해야 합니다.

## 0. 현재 에이튠 상태 (조사 결과)

### BE (`attune-be`, Java/Spring, hexagonal)

- `attune/medication/domain/model/Medication.java` — 표준 약물 메타데이터 엔티티. 현재 필드: `name`, `genericName`, `effect`, `sideEffect`, `description`, **`graphUrl`(혈중 농도 그래프 = 정적 이미지 URL)**, `imageUrl`, `formulation`, `typicalDosageRange`, `drugClass`, `sourceUrl`.
- `MedicationDosage.java` — 약물별 용량 옵션(`amount` BigDecimal, `isActive`).
- 사용자별: `UserMedication`, `UserMedicationSchedule`(`doseTime`), `UserMedicationLog`(`takenAt`, `status`).
- `MedicationDetailResponse` (record) → API 응답. `graphUrl`이 `bloodConcentrationGraph` 필드로 노출됨.

### FE (`attune-fe`, React + TS + Vite, PWA, Recharts 2.15.2 이미 의존)

- `src/app/api/medication.ts` — `MedicationStandard` 타입에 `bloodConcentrationGraph: string`.
- `src/pages/medication/MedicationInfoPage.tsx` — "혈중 농도 추이" 카드. **현재 동작**:
  - `bloodConcentrationGraph`(이미지 URL)가 있으면 `<img>`로 표시.
  - 없으면 하드코딩된 가짜 SVG 곡선(`BloodConcentrationChart`, 실제 데이터 아님)을 표시.
- `MedicationLogStatus = 'TAKEN' | 'SKIPPED' | 'MISSED'`, `MedicationSchedule.doseTime`, `MedicationProfileLog.takenAt`.

**결론**: 혈중 농도 그래프는 현재 **정적 이미지(또는 가짜 곡선)**다. 이식 목표는 이를 **PK 모델 기반 동적 곡선**으로 교체하는 것이며, 마이그레이션 경로가 자연스럽게 존재한다.

## 1. BE PK 메타데이터 형태

프로토타입 `pkProfile`(반감기·방출 파라미터·근거)을 BE에 둔다. 두 가지 안:

| 안 | 방식 | 장단점 |
|----|------|--------|
| **A (권장)** | `medication_pk_profiles` 테이블 신설 (Medication과 1:1) | 중첩 방출 파라미터·근거를 정규화. 약물 메타데이터 오염 없음. 마이그레이션 안전 |
| B | `Medication`에 컬럼/`JSON` 추가 | 빠르지만 엔티티 비대, 방출 파라미터 nesting 표현이 어색 |

권장 엔티티(안 A) 필드:

```txt
medication_pk_profiles
- medication_id (FK, unique)
- release_profile           ENUM: immediate | oros-dual | er-capsule | simple
- half_life_hours           DECIMAL
- ir_fraction               DECIMAL        -- oros/er만
- ir_release_rate           DECIMAL        -- IR 1차 방출 rate (per hour)
- er_t_lag_hours            DECIMAL        -- Weibull tLag
- er_scale_hours            DECIMAL        -- Weibull scale (A)
- er_shape                  DECIMAL        -- Weibull shape (b)
- effect_start_hours        DECIMAL
- effect_end_hours          DECIMAL
- peak_time_hours           DECIMAL        -- 표시용
- calibration_dose_mg       DECIMAL        -- 근거 기준 용량
- cmax_ng_per_ml            DECIMAL
- tmax_hours                DECIMAL
- auc_ng_h_per_ml           DECIMAL
- model_kind                ENUM: same-day-curve | accumulation   -- §5 참고
- evidence (JSON 또는 별도 테이블)  -- source, type, confidence, note
- safety_caveat             TEXT
```

- 이 필드들은 `prototype/pk-profiles.js`의 `concertaOros` 구조와 1:1 대응한다.
- **`Medication.graphUrl`은 제거한다.** 조사 결과 사용처가 없고 데이터도 채워져 있지 않다(2026-06-27). 빈 값일 때 FE는 이미지가 아니라 가짜 곡선을 보여주므로 보존할 정적 자산이 없다. 동적 곡선이 완전한 대체재이므로 fallback으로 남길 이유가 없다(마이그레이션 §7).
  - 삭제 전 확인: `graph_url` 컬럼을 생성·시드한 마이그레이션(Flyway/Liquibase 또는 `docs/sql`)이 있으면 컬럼 드롭 마이그레이션을 함께 추가한다.
- `model_kind`로 "당일 농도 곡선"(`same-day-curve`) 약과 "누적"(`accumulation`) 약을 구분한다. atomoxetine/SSRI 등 `accumulation` 약물은 당일 곡선 대신 **별도 정상상태(steady-state) 표현**을 쓴다(§9 결정, 별도 설계 필요).

## 2. FE API 타입 확장

`MedicationDetailResponse` / `MedicationStandard`에 `pkProfile`을 추가하고, **`bloodConcentrationGraph` 필드는 제거한다**(§1의 `graphUrl` 삭제와 함께). FE의 가짜 `BloodConcentrationChart` 컴포넌트와 `<img>` 분기도 같이 제거한다.

```ts
// 추가 타입 (src/app/api/medication.ts)
export type PkReleaseProfile = 'immediate' | 'oros-dual' | 'er-capsule' | 'simple';

export type PkProfile = {
  releaseProfile: PkReleaseProfile;
  halfLifeHours: number;
  irFraction?: number;
  ir?: { rate: number };
  er?: { tLagHours: number; scaleHours: number; shape: number };
  effectStartHours: number;
  effectEndHours: number;
  peakTimeHours: number;
  reference: { calibrationDoseMg: number; cmaxNgPerMl: number; tmaxHours: number; aucNgHPerMl: number };
  modelKind: 'same-day-curve' | 'accumulation';
  evidence: { source: string; type: string; confidence: 'high' | 'medium' | 'low'; note?: string }[];
  safetyCaveat?: string;
};

// MedicationStandard에 추가
//   pkProfile?: PkProfile;   // 있으면 동적 곡선, 없으면 bloodConcentrationGraph 폴백
```

## 3. 모델 코드 이식 (프레임워크 비의존 → 그대로 포팅)

프로토타입의 순수 모델은 프레임워크 의존이 없으므로 **그대로 TS로 옮긴다**. 이게 처음부터 모델/UI를 분리한 이유다.

| 프로토타입 | 이식 위치 (제안) | 변경 |
|-----------|------------------|------|
| `prototype/pharmacokinetics.js` | `src/app/lib/pk/pharmacokinetics.ts` | JS→TS 타입만 추가, 로직 동일 |
| `prototype/concentration-series.js` | `src/app/lib/pk/concentration-series.ts` | 동일 |
| `prototype/dose-events.js` | `src/app/lib/pk/dose-events.ts` | 동일 |
| `prototype/pk-profiles.js` | BE에서 내려주므로 **FE는 fallback 상수만** (`src/app/lib/pk/fallback-profiles.ts`) | BE 미배포 약물 대비 |

- BE가 PK 파라미터의 **원천(source of truth)**, FE 모델 코드는 곡선 **계산기**.
- 프로토타입 저장소를 모델 코드의 정본으로 유지하고, 변경 시 양쪽을 동기화(또는 추후 공용 패키지화 검토 — TODO(judyjjj106, 2026-09-30, 공용 npm 패키지화 여부 결정)).

## 4. doseEvents 매핑 (개인화 곡선의 핵심)

프로토타입 `doseEvent { medicationId, amountMg, takenAtHour, source }`를 에이튠 데이터에서 만든다.

| 프로토타입 필드 | 에이튠 출처 |
|-----------------|-------------|
| `amountMg` | `MedicationSummary.dosageAmount` / `MedicationDosage.amount` |
| `takenAtHour` | 예정: `MedicationSchedule.doseTime` → 그날 0시 기준 시(hour)로 변환 / 실제: `MedicationProfileLog.takenAt` |
| `source` | `UserMedicationLog.status`: `TAKEN`→taken, `SKIPPED`→skipped, `MISSED`→skipped, 미기록 예정→scheduled |

- **표준 곡선**(무료): 단일 표준 용량 1회 복용 기준 → §0의 정적 이미지를 정확히 대체.
- **개인화 곡선**(잠금/PRO): 사용자의 실제 `doseTime`·로그를 펼쳐 다회 복용 누적 곡선 생성. `expandSchedule`/`activeDoseEvents` 재사용.

## 5. React 컴포넌트 경계

```txt
<MedicationConcentrationCard>     // 데이터 페칭 + 시리즈 생성(컨테이너)
  └─ <ConcentrationChart>          // 순수 표시 (series만 받음, 계산 없음)
  └─ <ConcentrationChips>          // 1차 피크 / 최대 농도 / 작용 종료
  └─ <ConcentrationInfoSheet>      // 정보 바텀시트
  └─ (locked) <PersonalCalibrationOverlay>
```

- `<ConcentrationChart>`는 **계산 로직 없음** — `buildConcentrationSeries` 결과(`{hour, raw, percent}[]`)만 받아 그린다. 프로토타입 데모의 경계와 동일.
- 렌더링: **Recharts 사용**(이미 의존). `AreaChart`+`Area`(전체), `Line`(IR/ER 토글), `ReferenceArea`(효과 구간), `ReferenceDot`(IR 봉우리/Cmax). SVG 직접 그리기 대비 축·반응형·접근성 이득.
- `MedicationInfoPage.tsx`의 가짜 `BloodConcentrationChart`와 `<img>` 분기를 이 카드로 교체.
- 스타일은 에이튠 컨벤션(Tailwind, NanumSquare)에 맞춤. 프로토타입 `styles.css`는 시각 레퍼런스로만 사용.

## 6. 무료 / 잠금 기능 구분

| 기능 | 구분 | 비고 |
|------|------|------|
| 표준 용량 단일 곡선 | 무료 | 정적 이미지의 직접 대체 |
| 용량 선택(18/27/36/54 등) 곡선 비교 | 무료 | `MedicationDosage` 옵션 활용 |
| IR/ER 구성 곡선 토글 | 무료 | 교육적 정보, 구현 비용 낮음 (§9 결정) |
| 실제 복용 로그 기반 다회 누적 곡선 | **PRO** | 개인화 |
| 개인 반응 보정(체중·대사) | **PRO** | 프로토타입의 잠금 오버레이와 동일 |

## 7. 정적 → 동적 마이그레이션 경로

정적 자산(채워진 이미지)이 없으므로 병행 운영(parallel-run)이 불필요하다. **직접 교체(cutover)** 한다.

1. **BE**: `medication_pk_profiles` 추가, `pkProfile`을 API로 내려준다. `Medication.graphUrl` 컬럼과 `bloodConcentrationGraph` 응답 필드를 제거(필요 시 컬럼 드롭 마이그레이션 포함).
2. **데이터**: PK 프로필을 채운다(순서: 콘서타 → IR MPH → ER 캡슐류 …, 프로토타입 4단계와 동일).
3. **FE**: 가짜 `BloodConcentrationChart`와 `<img>` 분기를 동적 `<MedicationConcentrationCard>`로 교체.

PK 프로필이 아직 없는 약물은 농도 카드 자리에 **"준비 중" 안내**를 표시한다(카드 숨김 아님). 콘서타 1종부터 점진 확장하므로 미보유 약물이 다수인 초기를 정직하게 다룬다(§9 결정).

## 8. 의료 안전 (이식 필수)

- 프로토타입의 안전 문구("교육용 추정치, 의료 조언 아님, 복용 변경은 의료진과 상의")를 **카드/바텀시트에 그대로 이식**한다.
- `evidence`/`confidence`를 활용해 "평균 추정" 성격을 UI에 표기한다.
- 안전 문구 약화는 사람 리뷰 필요(AGENTS.md).

## 9. 결정 기록 (2026-06-27 확정)

| # | 결정 사항 | 결론 |
|---|-----------|------|
| 1 | BE PK 파라미터 저장 방식 | **별도 테이블** `medication_pk_profiles` (안 A). §1 |
| 2 | PK 프로필 없는 약물 표시 | **"준비 중" 안내** (카드 숨김 아님). §7 |
| 3 | IR/ER 구성 곡선 토글 | **무료**. §6 |
| 4 | `accumulation` 약물(atomoxetine/SSRI) | **별도 정상상태(steady-state) 표현** 사용 (당일 곡선 비사용). §1 · 별도 설계 필요 |
| 5 | 모델 코드 동기화 | **수동 동기화** (프로토타입이 정본). 이식 약물이 늘면 공용 패키지화 재검토 — TODO(judyjjj106, 2026-09-30, 공용 npm 패키지화 여부 결정) |

### 후속 설계 항목

- 결정 4의 정상상태 표현은 `accumulation` 약물을 4단계에서 추가할 때 별도로 설계한다(당일 곡선 모델과 다른 표현·근거 필요).
