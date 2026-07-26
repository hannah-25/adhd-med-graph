# adhd-med-graph

ADHD 약물 농도·약효 그래프를 에이튠에 넣기 전에 검증하는 로컬 프로토타입입니다.

이 저장소의 목적은  에이튠에 옮겨도 되는 계산 모델·데이터 구조·모바일 UI 패턴을 먼저 작게 실험하는 것입니다. 이 단계에서는 에이튠 `attune-be`, `attune-fe` 프로젝트를 수정하지 않습니다.

## 현재 상태

- 루트에는 프로젝트 문서와 패키지 메타데이터만 둡니다.
- 실제 새 구현은 다음 단계에서 `prototype/` 폴더에 만듭니다.
- 패키지 이름은 `package.json` 기준 `adhd-med-graph`입니다.

## 폴더 구조

```txt
.
├─ package.json
├─ README.md
├─ docs/
│  ├─ architecture.md
│  └─ implementation-plan.md
└─ research/
   ├─ README.md
```

## 실행

현재 루트에는 실행 앱이 없습니다. 이전 정적 데모는 참고용으로 `research/open-source/adhd-med-caffeine-graph/`에 보관되어 있습니다. 새 실행 프로토타입은 `prototype/concentration-demo.html`로 만들 예정입니다.

## 목표 구조

다음 버전은 UI 상태에서 바로 계산하지 않고, 작은 재사용 모델로 분리합니다.

```txt
pkProfile + doseEvents + samplingGrid -> concentrationSeries -> chart UI
```

- `pkProfile`: 반감기, 피크 시간, 방출 프로파일, 약효 구간 같은 약물·제형 메타데이터
- `doseEvents`: 예정 또는 실제 복용량과 복용 시각
- `samplingGrid`: 그래프 시간 범위와 샘플 간격
- `concentrationSeries`: canvas, SVG, Recharts 등에 넣을 수 있는 정규화된 시계열 데이터


## 의료 안전

이 프로젝트는 의료 조언이나 복용 지시가 아닙니다. 그래프는 교육용 추정치이며 실제 혈중 농도, 효과, 부작용, 개인 반응은 크게 다를 수 있습니다. 복용량이나 복용 시간 변경은 처방 의료진과 상의해야 합니다.
