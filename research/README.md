# Research

`adhd-med-graph`의 참고 자료와 분석 문서를 모으는 폴더입니다.

## 목적

기존 오픈소스 약동학/복약 관련 프로젝트에서 쓸 만한 구조를 배우되, 원본 소스 코드를 이 프로토타입에 섞지 않는 것이 목적입니다.

## 구성

```txt
research/
├─ README.md
├─ open-source-analysis.md
└─ open-source/
   ├─ README.md
   ├─ adhd-med-caffeine-graph/
   ├─ PKPDsim/
   ├─ mrgsolve/
   └─ rxode2/
```

`open-source/` 아래의 clone/copy 폴더는 git에서 무시됩니다.

## 규칙

- 참고 저장소는 분석용으로만 사용합니다.
- 결론은 Markdown으로 남기고, 원본 소스 코드는 복사하지 않습니다.
- 참고 저장소를 의존하기 전에 라이선스와 commit hash를 기록합니다.
- 프로토타입 로직은 독립 구현을 우선합니다.
- GPL 계열 프로젝트는 개념 참고용으로만 봅니다.

## 현재 결론

참고 저장소에서 공통으로 가져갈 핵심 패턴은 event-based dosing입니다.

```txt
dose events + observation grid + model parameters -> simulated concentration
```

다음 프로토타입은 참고 폴더의 DOM 중심 원본 `app.js`를 계속 키우는 대신 이 구조를 채택해야 합니다.
