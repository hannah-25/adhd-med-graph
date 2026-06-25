# 오픈소스 분석

이 문서는 참고 중인 오픈소스 프로젝트와, 그 프로젝트에서 안전하게 배울 수 있는 구조를 정리합니다.

## 구조 판단

현재 패키지 구조는 연구용 sandbox로는 적절합니다.

- 루트에는 문서와 패키지 메타데이터만 남아 있습니다.
- 원본 정적 데모는 `research/open-source/adhd-med-caffeine-graph/`에 분리되어 있습니다.
- 참고 저장소는 `research/open-source/` 아래에 분리되어 있습니다.
- 참고 저장소 원본 코드는 git에서 무시됩니다.
- 추적되는 Markdown 문서가 라이선스 경계를 설명합니다.

다만 아직 최종 구현 구조는 아닙니다. 다음 단계는 참고 폴더의 원본 `app.js`에 코드를 더 넣는 것이 아니라, `prototype/` 폴더에 작은 모델 모듈을 만드는 것입니다.

## 참고 저장소

| Project | Local Path | Commit | License | Use |
| --- | --- | --- | --- | --- |
| adhd-med-caffeine-graph | `research/open-source/adhd-med-caffeine-graph` | `09cbe18fc3b16f81b7d0f2fe8cc976d93685ae09` | No license file found | 원본 정적 데모입니다. upstream 라이선스 확인 전까지 동작/UX 참고용으로만 사용합니다. |
| PKPDsim | `research/open-source/PKPDsim` | `16a1cd5dc2eed8cbaf0808426ee7ee25a0e5a698` | MIT + file LICENSE | regimen, dose amount, dose time, observation time, covariate, simulation workflow 개념 참고에 가장 좋습니다. |
| mrgsolve | `research/open-source/mrgsolve` | `375d791766b76bb078c1f113f23c71045b5ee2a8` | GPL >= 2 | `amt`, `ii`, `addl`, `time` 같은 event object 개념 참고용입니다. 코드는 복사하지 않습니다. |
| rxode2 | `research/open-source/rxode2` | `8a0bed0ec14c35c82994c58dd7abb1d1684818f4` | GPL >= 3 | event table과 sampling grid 개념 참고용입니다. 코드는 복사하지 않습니다. |

## 가져갈 패턴

### Dose Events

가장 중요한 개선점은 복용을 명시적 event로 모델링하는 것입니다.

```js
{
  medicationId: "concerta-oros",
  amountMg: 18,
  takenAtHour: 6.5,
  source: "scheduled"
}
```

이 구조는 예정 복용, 실제 복용, 건너뜀, 지연 복용, 향후 개인화 보정을 모두 표현하기 쉽습니다.

### Sampling Grid

관찰/샘플링 시간도 명시적으로 둡니다.

```js
{
  startHour: 0,
  endHour: 24,
  stepMinutes: 10
}
```

이렇게 하면 차트 해상도와 모델 계산이 UI 렌더링에서 분리됩니다.

### PK Profile

약물 단위 메타데이터와 사용자 복용 데이터는 분리합니다.

```js
{
  id: "concerta-oros",
  halfLifeHours: 3.5,
  releaseProfile: "oros-dual",
  irFraction: 0.22,
  irPeakTimeHours: 1.5,
  erPeakTimeHours: 6.8
}
```

### 반복 복용

반복 스케줄은 시뮬레이션 전에 구체적인 dose event 목록으로 펼칩니다. 현재 `concentrationRawAt()` 내부에 반복 합산을 숨기는 방식보다 명확합니다.

## 하지 않을 것

- GPL 소스 코드를 이 프로젝트에 복사하지 않습니다.
- 라이선스가 없는 원본 데모를 제품 코드처럼 재사용하지 않습니다.
- 루트 데모에 에이튠 전용 동작을 계속 추가하지 않습니다.
- 참고 clone과 추적되는 프로토타입 소스를 섞지 않습니다.

## 다음 단계

다음 구조를 만듭니다.

```txt
prototype/
├─ pk-profiles.js
├─ dose-events.js
├─ pharmacokinetics.js
├─ concentration-series.js
└─ concentration-demo.html
```

그 다음 event-based model로 콘서타 OROS 곡선을 다시 만들고, 참고 폴더에 보관한 원본 데모의 곡선과 비교합니다.
