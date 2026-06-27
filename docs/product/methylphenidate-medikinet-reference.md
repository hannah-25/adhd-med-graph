# Medikinet retard PK Reference (근거 자료)

메디키넷 리타드(Medikinet retard, methylphenidate 서방캡슐) 농도 곡선 근거 자료입니다. 검증 수치는 규제 기관 라벨(EU SmPC)만 사용합니다([PK 모델 설계 원칙](pk-model-principles.md) 참고).

> 안전 경계: 성인 평균 추정치. 교육용이며 의료 조언이 아닙니다. 실제 농도·반응은 개인차가 큽니다.

> 메디키넷은 FDA 미승인(유럽/국내 제품)이므로 EU SmPC를 1차 규제 출처로 한다.

## 1. 곡선 특징

- **50% 즉시방출(IR) + 50% 서방형(ER)**.
- 아침 식후 복용 시: IR이 빠른 초기 상승을 만들고, ER이 **3~4시간 플래토**를 형성한다(뚜렷한 2차 봉우리보다 평탄한 고원).
- 전체 최고 농도 Tmax 약 **2.75시간**.
- 반감기 약 **3.2시간**.
- 작용 시간 약 8시간.

## 2. 수치 데이터 (EU SmPC, 단일 20mg 식후)

| 파라미터 | 값 | 비고 |
|----------|-----|------|
| Cmax | 6.4 ng/mL | 단일 20mg, 아침 식후 |
| Tmax | 2.75 시간 | 전체 최고점 |
| AUC | 48.9 ng·h/mL | |
| t½ | 3.2 시간 | |

## 3. 모델 보정 방식

- **AUC 앵커링**: AUC/mg = 48.9 ÷ 20 = **2.45 ng·h/mL per mg** — 콘서타(2.32)·IR(2.53)과 일관.
- irFraction 0.50, ir.rate 1.2, ER Weibull(tLag 0, scale 2.25, shape 1.75)로 Tmax 2.75시간·Cmax 6.4·플래토 형태 재현.

## 출처 (Evidence)

| 자료 | 유형 | 신뢰도 | URL |
|------|------|--------|-----|
| Medikinet XL modified-release capsules SmPC (EMA/emc) | 규제 기관 라벨 | 높음 | https://www.medicines.org.uk/emc/product/313/smpc |
