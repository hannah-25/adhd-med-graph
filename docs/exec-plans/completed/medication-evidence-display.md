# 실행 계획: 약물 근거·출처·설명 페이지 노출

## 목표

지금까지 구현한 약물(콘서타·페니드·메디키넷·스트라테라)의 **출처·근거·설명**을 데모 페이지에 함께 보이게 한다. 현재는 evidence가 `pk-profiles.js`와 근거 문서에만 있고 데모에는 안 보인다(설명은 ℹ 바텀시트에만).

## 배경

- 각 프로필은 이미 구조화된 데이터를 가짐:
  - `evidence[]`: `{ source, url, type, confidence, note }`
  - `reference`: `{ calibrationDoseMg, cmaxNgPerMl, tmaxHours, aucNgHPerMl }`
  - `halfLifeHours`, `releaseProfile`, `modelKind`, (atomoxetine) `metabolismNote`, `effectAccrual`
- 데모는 이미 `profiles`를 import → **데이터 기반 렌더링이면 4개 약 + 향후 약 자동 커버**(하드코딩 불필요).
- 설명 문구(`sheet[]`)는 현재 데모 UI 설정에 있고 바텀시트에서만 노출.

## 현재 상태

- 페이지에 보이는 것: 헤더, 차트+칩, (atomoxetine) 효과 누적, 안전 문구.
- 안 보이는 것: 출처/링크, confidence, 핵심 수치 표, "왜 이 모양인가" 설명(시트 안에만).

## 변경 범위

### 1. 데모 UI — 약물별 카드 3종 추가 (데이터 기반)

차트 카드 아래에 순서대로:

1. **설명 카드** ("이 약은?")
   - 기존 `sheet[]` 문구를 **상시 노출 카드**로 표시(바텀시트 → 페이지 본문).
   - ℹ 버튼/시트는 제거(설명이 이미 보이므로) — 의사결정 로그 참고.

2. **핵심 수치 카드** (`reference` + 프로필 필드 기반 표)
   - 행: 제형(releaseProfile 한글), Tmax, Cmax, AUC, 반감기, (모델 종류).
   - atomoxetine: Cmax/AUC = "(정규화)" 표기, `effectAccrual`(발현/안정화 주) 추가.
   - 값 없음(null)은 "—" 또는 설명 텍스트.

3. **근거 & 출처 카드** (`evidence[]` 반복 렌더)
   - 각 항목: **유형 배지** + **신뢰도 배지** + source + note + (url 있으면) "원문 보기" 링크.
   - 유형 한글 매핑: regulatory-label→규제 라벨, peer-reviewed→동료심사, model-form-reference→모델 방법론, clinical-guidance→임상 가이드, derived-estimate→파생 추정.
   - 신뢰도 색상: 높음(초록)·중간(노랑)·낮음(회색).
   - 링크는 새 탭(`target=_blank rel=noopener`).

### 2. 스타일 (`styles.css`)

- 배지(.badge, 색상 변형), 출처 리스트(.source-item), 링크, 수치 표(.kv) 스타일 추가.

### 3. 데이터 위치 정리(가능하면)

- evidence·reference: **프로필에서 그대로 사용**(이식 가능, BE 원천).
- 설명 문구(`sheet[]`): 당분간 데모 UI 설정 유지(향후 BE/프로필 이관은 별도). 의사결정 로그.

## 제외 범위

- 설명 문구를 BE/프로필로 이관(이식 명세 단계에서 다룸).
- 근거 문서(`docs/product/*-reference.md`) 내용 변경 — 이미 충분, 링크만 데모에서 노출 고려(선택).
- 새 약물 추가.

## 관련 문서

- [attune-porting-spec.md](../../attune-porting-spec.md) §2(FE 타입), §8(안전)
- [implementation-plan.md](../../implementation-plan.md)
- 약물별 근거 문서 `docs/product/*-reference.md`

## 관련 코드

- `prototype/concentration-demo.html` (카드 3종 + 렌더 함수)
- `prototype/styles.css` (배지·출처·표 스타일)
- `prototype/pk-profiles.js` (데이터 원천 — 변경 없음 예상)

## 작업 단계

1. `styles.css`에 배지·출처·수치표 스타일 추가.
2. 데모에 설명·핵심수치·근거출처 카드 마크업 추가.
3. 렌더 함수: `renderExplanation()`, `renderFacts()`, `renderEvidence()` — 모두 현재 `profile`/`medConfig` 기반.
4. 유형/신뢰도 한글·색상 매핑 헬퍼.
5. ℹ 바텀시트 제거 및 관련 코드 정리(설명 상시 노출로 대체).
6. 4개 약 각각 헤드리스 스크린샷으로 확인.

## 검증 방법

- 약물 4종 전환 시 설명·수치·근거 카드가 각 프로필 데이터로 정확히 렌더되는지 스크린샷.
- 링크 url이 evidence와 일치하는지 확인.
- 모델 변경 없음 → `npm test` 13개 유지, `npm run agent:verify` 통과.
- 모바일 폭에서 배지·표·링크 겹침 없음.

## 위험 요소

- 의료 정보 노출이 **조언·보증으로 오인**되지 않도록: confidence 배지·"교육용 추정"·안전 문구 유지. 안전 문구 약화 금지(AGENTS.md).
- 외부 링크(FDA/저널)는 정보 출처로만; 새 탭·noopener.
- 카드가 늘어 페이지가 길어짐 → 순서·간결성 유지.

## 롤백 방법

- 단일 커밋. 문제 시 revert. 모델·프로필 데이터는 불변이라 영향 적음.

## 의사결정 로그

- **설명을 상시 노출 카드로**(바텀시트 제거): "같이 보이게" 요구에 부합, 시트 토글 복잡도 제거.
- **evidence/reference는 프로필에서 직접 렌더**: 단일 출처(이식 가능), 약 추가 시 자동 반영.
- **설명 문구는 데모 UI 설정 유지**: 이식 시 BE 이관은 별도 단계.

## 완료 조건

- 4개 약 모두 페이지에서 설명·핵심수치·출처(링크 포함)·신뢰도가 보인다.
- 자극제/누적형 양 모드 정상, 테스트·검증 통과.

## 작업 후 문서 업데이트 목록

- 이 계획을 `completed/`로 이동.
- 필요 시 `attune-porting-spec.md` §2에 "evidence/reference를 FE에 노출" 항목 보강.
