# 검증 범위와 실행 방법

Mindustry v160.7의 실제 서버 엔진에서 검사한다. 실제 플레이 데이터가 아닌 별도 폴더에서만 실행한다.
`server-release.jar`는 Mindustry 공식 v160.7 릴리스에서 받고, 모드를 해당 테스트 폴더의 `config/mods/peaceful-market`에 넣는다.

## 확인한 항목

- `node tests/economy.js`: 446개 경제·카탈로그 검사. 완제품 수, 재료 참조, 단계별 공급망 도달 가능성, 투자·인수 비용, 유예·회복·해임, 시세 경계. 3개 가격 규모에 각각 10,000회 변동을 적용한다.
- `tests/enterprise-headless.js`: 실제 건물에서 66개 생산법의 선택·재료 소모·출력·가공료, 전투 유닛 제한, 수입 잠금, 생산·판매 점령, 저장/로드 등 302개 검사.
- `tests/systems-headless.js`: 컨베이어 판매, 희토류 동시 출력과 정체, 인수 효과, 실제 전력망, 수입 배출, 일시정지, 계좌 이체, 기본 드릴의 신규 광물 채굴 등 12개 통합 검사.
- `tests/sectors-headless.js`: 주요 12개 지역의 단계·광맥 생성과 해임 게임 오버 44개 검사.
- `tests/legacy-create.js`와 `tests/migration-headless.js`: 0.1.3 실제 저장을 생성한 뒤 0.2.0으로 재고·잔액·매출을 이관한다. 7개 호환 검사를 통과했고 회사 상태는 프로세스 재시작 후에도 확인했다.

서버 콘솔에서 첫 명령 후 지형 로드가 끝난 다음 나머지를 순서대로 실행한다. 경로는 자신의 절대 경로로 바꾼다.

```text
js Vars.world.loadSector(SectorPresets.groundZero.sector);
js eval(Core.files.absolute('/absolute/path/tests/enterprise-headless.js').readString());
js eval(Core.files.absolute('/absolute/path/tests/systems-headless.js').readString());
js eval(Core.files.absolute('/absolute/path/tests/sectors-headless.js').readString());
```

마지막 검사는 회사 상태를 의도적으로 해임시키므로 그 데이터로 다른 테스트를 이어가지 않는다.

## 구버전 호환 검사

1. 0.1.3 모드로 격리 서버를 시작하고 전초기지를 로드한다.
2. `legacy-create.js`를 실행한다. `/tmp/enterprise-v013.msav`와 캠페인 지역 정보가 생성된다.
3. 서버를 종료한다. **설정·지역 정보를 함께 유지**한 상태로 모드를 0.2.0으로 교체한다.
4. 생성한 저장을 로드하고 `migration-headless.js`를 실행한다.
5. 종료·재시작 후 기업 계좌 및 주식·인수·주가가 유지되는지 확인한다.

Mindustry는 캠페인 코어 재고 일부를 지역 정보에서 복원하므로, 개별 `.msav`만 새로운 빈 프로필로 옮기는 방식은 전체 데이터 업데이트 호환 검사와 다르다.

## 한계

자동화된 엔진 검증이며 Android 화면·터치 조작이나 캠페인 처음부터 끝까지의 수동 플레이 검증은 아니다.
전체 생산망의 공장 배치, 장기 수익률, 최종 지역 도달 시간은 플레이 피드백에 따라 조정할 수 있다.
데스크톱 그래픽 클라이언트도 실행을 시도했으나 이 실행 환경에서 화면 드라이버를 제공하지 않아 시각 검증하지 못했다.
수량·시간·수익 모델은 게임 규칙이다. 현실 산업의 정확한 원가·화학량론·공정별 수율을 검증한 것이 아니다.
