# 2026 METAmobility 자율주행 자동차 경진대회

**자이카 카메라·초음파 인식 및 실차 시험 · 장려상**

**2026년 11월 5~6일 모항해나루 호텔에서 열린 대회에서 장려상을 받았습니다.**

자이카에 카메라와 초음파 센서를 사용해 기본 주행 3회와 AI 주행 2회로 구성된 트랙을 준비했습니다. 현장에서는 주행 파일을 유지하고 인식 모듈을 수정하며 신호등 출발, 차선 추종, 라바콘 통과, AR 표지 인식을 시험했습니다.

- 출발 신호는 세 원 중 오른쪽 등이 밝아지는 순간입니다. 카메라 노출과 허프 원 검출 반지름을 조정하고, 출발한 뒤에도 차량이 계속 주행하도록 신호 처리 방식을 점검했습니다.
- 첫 회차 S자 구간에서 속도가 빠르면 AR 표지를 놓쳤습니다. 해당 구간의 속도 명령을 12로 낮추고, 마지막 표지를 지난 뒤 급우회전에서 차선을 다시 잡는 문제를 추적했습니다.
- AI 주행에서는 노란 횡단보도 주변의 장애물을 기준으로 오른쪽 회피, 직진, 차선 복귀 순서를 설계했습니다. 현장 시험에서 드러난 차선 이탈과 장애물 회피 후 차선 재인식이 주요 개선 과제였습니다.

## 현장 개발 · 조명 환경에 맞춘 신호등 인식 개선

**천장 조명과 출발 신호등을 구분하도록 카메라 노출과 인식 코드를 조정했습니다.** 밝은 실내 조명도 원형으로 검출될 수 있어, 현장에서 카메라 노출과 허프 원 검출 반지름을 조정하며 신호등의 세 원을 인식하는 조건을 점검했습니다. 오른쪽 초록 신호를 출발 신호로 판단하고, 출발 후에는 신호가 화면에서 사라져도 주행을 이어가도록 처리 방식을 개선했습니다.

실차 카메라 화면과 검출 결과를 보면서 코드를 수정하고 트랙에서 다시 시험했습니다. 아래 인식 화면에는 신호등 세 원과 `GREEN` 판정이 표시되어 있습니다.

| | |
| --- | --- |
| <a href="assets/development-setup.jpg"><img src="assets/thumbnails/development-setup-74f2a6.jpg" alt="트랙 옆 노트북과 개발 환경" width="260" height="173"></a> | <a href="assets/vehicle-code-test.jpg"><img src="assets/thumbnails/vehicle-code-test-adf070.jpg" alt="자이카를 연결하고 현장에서 인식 코드를 수정하는 환경" width="260" height="173"></a> |
| <a href="assets/traffic-light-detection.jpg"><img src="assets/thumbnails/traffic-light-detection-331c5d.jpg" alt="천장 조명이 있는 실내에서 신호등 세 원을 검출하고 GREEN을 표시한 화면" width="260" height="173"></a> |  |

## 대회 영상 · 57초 현장 브이로그

영상에서 뽑은 대표 장면입니다. 사진을 누르면 원본 영상을 열 수 있습니다.

| | |
| --- | --- |
| <a href="https://raw.githubusercontent.com/zxvxh/zxvxh/main/projects/METAmobility_자율주행_자동차_경진대회/assets/competition-vlog.mp4"><img src="assets/thumbnails/vlog-preview-1-5f701f.jpg" alt="라바콘 사이를 주행하는 자이카 · 영상 13초" width="260" height="173"></a> | <a href="https://raw.githubusercontent.com/zxvxh/zxvxh/main/projects/METAmobility_자율주행_자동차_경진대회/assets/competition-vlog.mp4"><img src="assets/thumbnails/vlog-preview-2-57eee2.jpg" alt="노트북으로 코드를 수정하는 현장 · 영상 23초" width="260" height="173"></a> |
| <a href="https://raw.githubusercontent.com/zxvxh/zxvxh/main/projects/METAmobility_자율주행_자동차_경진대회/assets/competition-vlog.mp4"><img src="assets/thumbnails/vlog-preview-3-b2d9b3.jpg" alt="트랙 위에서 주행 중인 자이카 · 영상 43초" width="260" height="173"></a> |  |

[전체 영상 보기](https://raw.githubusercontent.com/zxvxh/zxvxh/main/projects/METAmobility_자율주행_자동차_경진대회/assets/competition-vlog.mp4) · [영상 파일 다운로드](assets/competition-vlog.mp4?raw=true)

## 수상 및 현장 사진

**장려상 · 전북대학교 드라이브쓰루 팀 · 2026년 11월 6일**

[장려상 상장 PDF 보기](assets/award-certificate.pdf)

| | |
| --- | --- |
| <a href="assets/award.jpg"><img src="assets/thumbnails/award-c148c7.jpg" alt="장려상 수상 사진" width="260" height="173"></a> | <a href="assets/event.jpg"><img src="assets/thumbnails/event-93e460.jpg" alt="대회 현장 안내" width="260" height="173"></a> |

[전체 포트폴리오](../../README.md)
