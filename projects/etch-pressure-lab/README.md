# AI-assisted PI Tuning for Chamber Pressure Control

김지호 · 전북대학교 전기공학과 · 반도체 공정설비 부트캠프 · 2026.11

[웹 실험실 열기](https://jiho-etch-pressure-lab.kjiho1023.chatgpt.site/) · [모델·실험 설계와 근거](MODEL.md) · [Python 재현 코드](analysis/experiment.py) · [브라우저 제어·추천 코드](dist/model.js)

## 무엇을 했나

모터 전류 PI 제어 경험을 식각 챔버 압력 문제에 적용한 개인 가상 실험 프로젝트입니다. 목표 압력에 빠르게 도달하면서 초과를 제한하는 PI 게인 조합을 찾고, AI가 다음에 시험할 조건을 추천하도록 구성했습니다.

- 문제·판정 기준 설정, 논문 기반 모델의 적용 범위 검토, 압력 파형과 제어 성능 비교, 대시보드 구성 및 발표를 수행했습니다.
- 구현·문서화 과정에 AI 도구를 활용했습니다. 실험값은 언어 모델이 임의로 생성한 숫자가 아니라 고정된 동역학 모델의 수치 계산값입니다.
- PI 제어기는 센서 압력으로 배기 밸브를 조절합니다. 가우시안 과정 기반 베이지안 최적화는 다음 PI 게인을 추천합니다.
- 실제 식각 장비의 실측 시험, 양산 적용 또는 수율 개선 프로젝트는 아닙니다.

## 웹 실험실

게인 직접 입력, 30초 압력 파형 재생, 목표 범위 도달 표시, 25·100·400조합 지도, 다음 조건 추천, CSV/JSON 업로드 분석 및 결과 다운로드를 구현했습니다. 업로드 데이터는 브라우저에서 처리합니다. 발표의 AI 성능 비교는 **기준 25조합** 실험이며, 확장 지도와 구분합니다.

## 실험과 결과

40 → 50 mTorr 압력 지령, Kp·Ki 각각 5단계, 동일한 초기 5조건과 총 10회 예산으로 비교했습니다. 목표는 초과율 ≤ 5%, 안정화 시간 ≤ 5초입니다. 초과율 분모는 목표 변화폭 10 mTorr입니다.

| 항목 | 고정 모델에서 얻은 결과 |
| --- | --- |
| AI의 E22 발견 시점 | 초기 5회를 포함한 9회차 |
| E22 게인 | Kp = 0.25, Ki = 0.10 s⁻¹ |
| E22 성능 | 안정화 2.66 s, 초과율 약 1.51% |
| 무작위 탐색의 10회 최선 안정화 시간 중앙값 | 10.59 s |
| 무작위 비교 범위 | 미실행 20조건 중 5개 선택: 15,504묶음 |

2.66초와 10.59초는 **찾아낸 제어 조건의 안정화 시간**이지 알고리즘 실행시간이나 개발기간이 아닙니다. E22는 전수 평가로 사후 확인한 25개 후보 내 최적 조건입니다. 단일 모델·초기점의 결과를 AI의 일반적 우월성이나 실제 비용 절감으로 해석하지 않습니다.

E06 대비 E22는 안정화가 빠르지만 밸브 누적 이동량은 15.02 → 32.02 %p로 증가합니다. 이는 실제 마모를 측정한 값이 아닙니다.

## 로컬 실행

저장소를 내려받은 뒤 아래 명령을 실행합니다.

```bash
cd projects/etch-pressure-lab
python3 -m http.server 8000 --directory dist
```

브라우저에서 http://localhost:8000 을 엽니다. 계산은 브라우저에서 수행합니다. 글꼴과 일부 대용량 다운로드는 공개 웹 실험실을 사용하므로 인터넷 연결이 필요합니다.

## 결과 재현

```bash
python3 -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows에서는 .venv\Scripts\activate
python -m pip install -r requirements.txt
python analysis/experiment.py
node analysis/verify_browser.cjs
```

Python 코드가 `dist/data/`에 25조건 결과, 75,025행 파형, AI 추천 기록, 무작위 전수 비교와 그래프를 생성합니다. `data.js`도 갱신합니다. 브라우저 검증 스크립트는 Python 결과와 JavaScript의 25조건 성능·10회 추천 순서를 비교합니다. 대용량 파형은 Git에 중복 저장하지 않고 코드로 재생성합니다.

## 근거와 한계

- Madhukar et al. (2002), *An Elementary Model for Control of a Semiconductor Etching Process*: [논문](https://epubs.siam.org/doi/10.1137/S0036144500382295). 가스 수지식의 구조를 참고했으며, 원 논문은 GaAs 열적 식각입니다. 본 프로젝트의 밸브 1차 지연과 모든 수치 계수는 교육용 가정입니다.
- Gelbart, Snoek & Adams (2014), *Bayesian Optimization with Unknown Constraints*: [논문](https://proceedings.mlr.press/r12/university14b.html). 제약조건을 고려하는 실험 추천의 근거이며 논문 전체 알고리즘을 그대로 재현한 것은 아닙니다.
- [전체 모델 설명](MODEL.md): 단위, 초기 조건, 포화·적분 처리, 수치 검증 및 한계.

실측 압력 파형을 통한 모델 식별, 센서 잡음·가스 유량 변화, 다른 초기점에서의 반복 평가는 후속 과제입니다. 삼성전자와 제휴하거나 삼성 장비를 재현한 서비스가 아닙니다.
