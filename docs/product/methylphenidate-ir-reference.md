# IR Methylphenidate PK Reference (근거 자료)

속방형 메틸페니데이트(immediate-release, 예: Ritalin / 페니드 속방정) 농도 곡선 근거 자료입니다. 검증 수치는 **FDA 승인 라벨만** 사용합니다([PK 모델 설계 원칙](pk-model-principles.md) 참고).

> 안전 경계: 성인 평균 추정치. 교육용이며 의료 조언이 아닙니다. 실제 농도·반응은 개인차가 큽니다.

## 1. 곡선 특징

- 빠르게 흡수되어 **단일 봉우리**(콘서타 같은 서방 상승 단계 없음).
- 초기 Tmax 약 **1.5시간**.
- 반감기 약 **3.0시간**.
- 작용 시간이 짧아 보통 하루 2~3회 분복.

## 2. 수치 데이터 (FDA IR 정제 라벨, 5mg TID 기준)

| 파라미터 | 값 (평균 ± SD) | 비고 |
|----------|----------------|------|
| Cmax | 4.2 ± 1.0 ng/mL | 5mg 3회/일 복합 프로파일 |
| 초기 Tmax1 | ~1.5 시간 | 단일 복용 초기 피크 |
| AUCinf | 38.0 ± 11.0 ng·h/mL | 15mg/일 (5mg×3) |
| t½ | 3.0 ± 0.5 시간 | |

## 3. 모델 보정 방식

- **AUC 앵커링**: 농도 스케일을 라벨 AUC/mg에 맞춘다. **AUC/mg = 38.0 ÷ 15 = 2.53 ng·h/mL per mg** → 단일 10mg 복용 AUC ≈ 25.3.
  - 이 값은 콘서타 라벨의 AUC/mg(2.32)와 **거의 일치**한다(같은 약물이므로 기대되는 결과). FDA 라벨만 쓰면 제형 간 절대 농도가 일관된다.
- ir.rate ≈ 1.45/h 로 단일 복용 Tmax ~1.5시간 재현.
- 라벨 Cmax 4.2는 5mg-TID 복합 피크이므로, 모델은 단일 10mg 복용 Cmax ≈ 4.1을 산출(라벨 값과 자연스럽게 부합).

## 출처 (Evidence)

| 자료 | 유형 | 신뢰도 | URL |
|------|------|--------|-----|
| FDA methylphenidate HCl IR 정제 라벨 (DailyMed) | 규제 기관 라벨 | 높음 | https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2bfb390f-ba99-4d21-8a9e-50fa8ec217c0 |
