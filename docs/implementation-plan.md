# 구현 계획

## 1단계: 워크스페이스 정리

상태: 완료

- 이전 참고 이미지, 레퍼런스 자료, 실행 프로토타입을 삭제했습니다.
- 새 그래프는 기존 참고 자료를 전제로 하지 않고 다시 설계합니다.
- 프로젝트 문서와 하네스만 남깁니다.
- 루트 패키지 이름을 `adhd-med-graph`로 정리했습니다.

## 2단계: 깨끗한 프로토타입 모델 분리

상태: 완료 (콘서타 OROS)

`prototype/` 폴더를 만들고 독립 모듈을 구현합니다.

1. `pk-profiles.js`
   - 새 설계에서 선택한 1차 약물부터 시작합니다.
2. `dose-events.js`
   - 예정 복용, 실제 복용, 건너뜀, 보정 이벤트 형태를 정의합니다.
   - 반복 복용을 concrete event 목록으로 펼치는 helper를 만듭니다.
3. `pharmacokinetics.js`
   - 반감기, 흡수, 피크 정규화, OROS 이중 방출 로직을 독립 구현합니다.
   - 외부 참고 소스 코드를 복사하지 않습니다.
4. `concentration-series.js`
   - 차트용 정규화 시계열을 만듭니다.
   - OROS 약물은 IR/ER 구성 시계열도 함께 반환합니다.

완료 기준:

- 단순 입력에서 의도한 곡선 형태가 재현됩니다.
- 모델이 DOM 없이 실행됩니다.
- 단순 입력으로 검증할 수 있습니다.

## 3단계: 목표 모바일 UI 프로토타입

상태: 완료 (콘서타)

- `prototype/concentration-demo.html` + `prototype/styles.css` 구현.
- 모델 모듈을 `<script type="module">`에서 직접 import, 계산은 모델에만 둠.
- SVG 차트(전체 곡선 + 효과 구간 음영 + IR 봉우리/Cmax 마커), IR/ER 구성 곡선 토글, 용량 세그먼트, 정보 바텀시트, 잠금(PRO) 오버레이, 의료 안전 문구 포함.
- 약물 전환 지원(프로필 레지스트리 기반): 약물별로 곡선·용량 옵션·칩·설명이 동적으로 바뀜. 단일 봉우리(속방형) 약물은 1차 피크 칩과 IR/ER 토글을 자동 숨김. `?med=<id>` 딥링크 지원.
- 용량 비교를 위해 Y축은 약물별 최대 용량 기준 고정.

새 데모 페이지를 만듭니다.

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

- 모바일 폭에서 텍스트가 겹치지 않습니다.
- 기본 그래프와 안전 문구를 이해할 수 있습니다.

## 4단계: 근거와 PK 프로필 확장

상태: 진행 중. **프로필 단위 = 성분 × 제형(브랜드 무관)**. Attune이 한국 제품이므로 국내 약 우선.

### 우선순위 1 — 국내 (성분 2개 = 프로필 6개)

- [x] MPH · OROS 서방정 (콘서타) — `concerta-oros`
- [x] MPH · 속방정 (페니드) — `methylphenidate-ir`. 단일 봉우리, FDA IR 라벨 기준(t½ 3.0h, Tmax ~1.5h, AUC/mg 2.53)
- [~] MPH · 서방캡슐 beads (메타데이트 CD) — **제외**: 국내 공급 중단(2019). 기본 선택지 부적절.
- [x] MPH · 서방캡슐 (메디키넷 리타드) — `methylphenidate-medikinet`. EU SmPC 기준(50% IR + 50% ER, Cmax 6.4 @2.75h, AUC 48.9, t½ 3.2h), IR 피크 + 3~4h 플래토
- [~] MPH · 조절방출캡슐 (비스펜틴) — **제외**: 국내 미사용.
- [x] atomoxetine · 캡슐 (스트라테라 외 국내 6종 = 동일 프로필 1개) — `atomoxetine`. 누적형: 효과 누적 진행(주 단위) + 정상상태 일일 곡선(정규화) 2-카드 표현. `effect-model.js` 신규. ([attune-porting-spec.md](attune-porting-spec.md) §9)

국내 자극제(MPH) 곡선은 **콘서타·페니드·메디키넷 3종으로 완료**(메타데이트 CD·비스펜틴은 국내 미사용으로 제외). atomoxetine까지 완료되어 **국내 ADHD 약 프로필이 모두 갖춰졌다**.

### 우선순위 2 — 해외 (확장 시)

성분 × 제형으로 묶는다. 새 모델이 필요한 건 경피 패치(Daytrana)뿐이고, 나머지는 파라미터/반감기 변경 + 누적형 표현이다.

- d-MPH (Focalin / XR), MPH ER 변형(Aptensio XR, Quillivant, QuilliChew, Cotempla, Ritalin LA), 지연방출(Jornay PM), 프로드러그(Azstarys)
- 경피 패치(Daytrana) — 새 zero-order 흡수 모델 필요
- 암페타민(Adderall/XR, Vyvanse, Dexedrine, Evekeo, Mydayis, Dyanavel, Zenzedi, Desoxyn) — 같은 모델, 반감기 ~10–13h
- 알파2 작용제(Intuniv 구안파신, Kapvay 클로니딘), NRI(Qelbree 빌록사진) — 누적형 → 정상상태 표현

제외: SSRI/SNRI는 ADHD 약이 아니므로 제외한다. 카페인은 모델 테스트용 옵션으로만 둔다.

각 프로필에는 다음을 포함합니다.

- source URL
- evidence label
- confidence level
- same-day effect인지 accumulation 모델인지
- safety caveat

## 5단계: 에이튠 이식 명세

상태: 초안 완료 — [docs/attune-porting-spec.md](attune-porting-spec.md)

실제 attune-be/attune-fe 구조를 읽고(수정 없음) 명세를 작성했습니다. 핵심: 현재 혈중 농도 그래프는 정적 이미지(`Medication.graphUrl`)이며, 이를 PK 모델 기반 동적 곡선으로 점진 전환합니다.

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
