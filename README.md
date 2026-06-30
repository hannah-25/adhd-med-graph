# adhd-med-graph

ADHD 약물의 **혈중 농도(PK)·약효 그래프 모델**을 Attune(에이튠)에 이식하기 전에 검증하는 로컬 프로토타입입니다. 계산 모델·데이터 구조·UI 패턴을 작게 실험하되, 그대로 `attune-be`/`attune-fe`로 옮길 수 있도록 **프레임워크 비의존 순수 모듈**로 분리해 둡니다.

> 이 저장소는 Attune 코드를 직접 수정하지 않습니다. 실제 이식은 [docs/attune-porting-spec.md](docs/attune-porting-spec.md)를 사람이 리뷰한 뒤 각 저장소에서 별도 작업으로 진행합니다.

## 현재 상태

- `prototype/`에 동작하는 프로토타입이 구현돼 있습니다 — 순수 모델 모듈 + 브라우저 데모 2종 + 테스트.
- 약물 4종: **콘서타 · 페니드(IR) · 메디키넷 리타드 · 아토목세틴**. 모두 FDA 라벨 / EMA SmPC 등 공식 근거에 보정.
- 모델·표현 원칙은 [docs/product/pk-model-principles.md](docs/product/pk-model-principles.md), 이식 명세는 [docs/attune-porting-spec.md](docs/attune-porting-spec.md)에 정리돼 있습니다.

## 빠른 시작

```bash
# 1) 순수 모델 테스트
node --test prototype/model.test.mjs

# 2) 데모 실행 — prototype/ 를 정적 서버로 서빙 (ES 모듈이므로 file:// 불가)
npx serve prototype
#   또는: python -m http.server -d prototype 8731

# 브라우저에서 열기
#   /concentration-demo.html        약물 혈중 농도 그래프
#   /personal-response-demo.html    저널 기록 오버레이(개인 반응)
```

## 폴더 구조

```txt
prototype/
├─ pharmacokinetics.js          # 1-compartment PK 커널(소실·방출·시간 grid) — 내부
├─ concentration-series.js      # buildConcentrationSeries: 차트용 시계열 생성
├─ dose-events.js               # 복용 이벤트 생성 / 스케줄 전개
├─ pk-profiles.js               # 약물·제형 메타데이터 + 근거(4종)
├─ effect-model.js              # 누적형(아토목세틴) 주 단위 효과 누적 곡선
├─ pd-calibration.js            # 저널 기록 → PD 관찰/요약 (순수)
├─ attune-journal-fixtures.js   # Attune형 합성 저널 데이터(태그·페르소나)
├─ concentration-demo.html      # 데모 1: 약물 농도 그래프
├─ personal-response-demo.html  # 데모 2: 개인 반응(저널 오버레이)
├─ personal-response-demo.js
├─ styles.css
└─ model.test.mjs               # node --test 대상

docs/
├─ attune-porting-spec.md           # 이식 명세(BE 테이블 / FE 타입 / 마이그레이션 / 결정 기록)
└─ product/pk-model-principles.md   # 모델·근거·표현 원칙
```

## 핵심 데이터 흐름

UI 상태에서 직접 계산하지 않고 작은 재사용 모델로 분리합니다. 이 경계가 곧 **그대로 이식하는** 이유입니다.

```txt
pkProfile + doseEvents + samplingGrid
   → buildConcentrationSeries(...)
   → series: [{ hour, raw(ng/mL), percent(%peak) }]
   → 차트 UI (Recharts / SVG)
```

| 입력 | 의미 |
|------|------|
| `pkProfile` | 반감기·피크 시간·방출 프로파일·작용 구간·근거 등 약물/제형 메타데이터 |
| `doseEvents` | 예정/실제 복용량과 복용 시각 |
| `samplingGrid` | 그래프 시간 범위와 샘플 간격 |
| `concentrationSeries` | canvas/SVG/Recharts에 넣는 정규화 시계열 |

## 모듈 API (이식 대상)

| 모듈 | 주요 export | 반환/역할 |
|------|-------------|-----------|
| `pk-profiles.js` | `profiles`, `getProfile(id)`, `concertaOros` 등 | 약물 메타데이터(반감기·방출 파라미터·`reference`·`evidence`) |
| `dose-events.js` | `createDoseEvent`, `expandSchedule`, `activeDoseEvents` | 복용 이벤트 생성/전개(다회 복용 누적의 입력) |
| `concentration-series.js` | `buildConcentrationSeries({profile, doseEvents, grid})` | `{ series:[{hour,raw,percent}], components:{ir,er}, stats:{cmaxRaw,tmaxHour,peakHour} }` |
| `effect-model.js` | `effectAccrualFraction`, `buildEffectAccrualSeries` | 누적형 약물(아토목세틴)의 **주 단위** 효과 누적 |
| `pd-calibration.js` | `buildPdCalibrationModel`, `PD_SIGNAL`, `classifyJournalTag`, `summarizePdObservations` | 시간 단위 저널 기록 → PD 관찰/서술 요약 |

## 약물 & 근거

| 약물 | id | 모델 종류 | 1차 출처 |
|------|----|-----------|---------|
| 콘서타(OROS) | `concerta-oros` | 당일 곡선 | FDA Label (18mg: Cmax 3.7 / Tmax 6.8h / AUC 41.8 / t½ 3.5h) |
| 페니드(IR) | `methylphenidate-ir` | 당일 곡선 | FDA IR Label |
| 메디키넷 리타드 | `methylphenidate-medikinet` | 당일 곡선 | EMA SmPC (FDA 미승인) |
| 아토목세틴 | `atomoxetine` | 누적형(정규화 %) | FDA Strattera Label + 동료심사(효과 궤적) |

> 약물마다 **최고 품질의 공식 근거**를 쓰고 출처를 억지로 통일하지 않습니다. 모델의 가정·한계는 [pk-model-principles.md](docs/product/pk-model-principles.md)에 공개합니다.

## 데모

- **concentration-demo.html** — 약물·용량 선택, 복용 시간, **오후 추가 복용(1·2차 용량 독립 선택)**, IR/ER 구성 곡선 토글, 누적형(아토목세틴) 주 단위 효과, 근거 출처, "국내 사용·병용·급여" 안내 카드.
- **personal-response-demo.html** — 집단 PK 곡선 위에 시간 단위 저널 기록을 **신호 종류별 점**으로 오버레이. 약물 4종 전환, **흡수속도(Tmax) 드래그** 보정(개인 흡수율 차이), 점 툴팁, 서술형 PD 요약. → Attune의 "개인 반응 보정" PRO 기능 원형.

## Attune 이식

순수 모델 모듈은 프레임워크 의존이 없어 **TS로 그대로 포팅**합니다(처음부터 모델/UI를 분리한 목적).

- **BE** = PK 파라미터의 원천(source of truth). `medication_pk_profiles` 테이블로 `pk-profiles.js` 구조를 1:1 매핑.
- **FE** = 곡선 계산기. `pharmacokinetics`/`concentration-series`/`dose-events`를 TS로 옮기고 Recharts로 표시. 기존 정적 이미지/가짜 곡선을 동적 카드로 교체.
- 테이블 스키마, FE 타입(`PkProfile`), `doseEvents` 매핑, 무료/PRO 구분, 정적→동적 마이그레이션, 결정 기록은 **[docs/attune-porting-spec.md](docs/attune-porting-spec.md)** 참조.

## 의료 안전

이 프로젝트는 의료 조언이나 복용 지시가 아닙니다. 그래프는 **교육용 추정치**이며 실제 혈중 농도·효과·부작용·개인 반응은 크게 다를 수 있습니다. PK는 임상 효과와 같지 않습니다. 복용량이나 복용 시간 변경은 반드시 처방 의료진과 상의해야 합니다. 안전 문구는 이식 시 카드/바텀시트에 **그대로** 옮깁니다.
