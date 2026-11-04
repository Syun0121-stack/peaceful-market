# 고요한 시장 · Peaceful Market

Mindustry **160.7**용 세르플로 싱글플레이 경제 모드. 현재 버전 **0.1.2**.

게임의 **GitHub에서 가져오기**에 `Syun0121-stack/peaceful-market`을 입력하고 재시작하십시오.

- 판매소: 자원을 반입하면 코어에 크레딧 적립
- 지역 진행: 웨이브 대신 누적 크레딧 획득 목표
- 첫 지역: 자원 확보 → 판매소 건설 → 첫 판매 → 목표 달성 튜토리얼
- 시세: 플레이 시간 3분마다 변동, 알림은 “시세 변경됨”

0.1.2는 판매소의 건물 생성 누락으로 반입이 불가능했던 문제를 수정합니다.
업데이트 후 기존 저장을 불러올 수 있으며, 캠페인 초기화는 필요하지 않습니다.
단, 0.1.1에서 설치한 판매소는 저장되지 않았으므로 다시 건설해야 합니다.
자세한 사용법, 기존 저장 관련 사항, 검증 범위는 [한국어 설명서](README-KO.txt)를 참고하십시오.

## 개발 검증

Mindustry v160.7 `server-release.jar`를 별도 테스트 디렉터리에 실행하고, 이 저장소를 그 디렉터리의 `config/mods/peaceful-market`에 넣으십시오.
실제 플레이 저장을 사용하는 서버에서 검증 스크립트를 실행하지 마십시오.

서버 콘솔에서 첫 명령 실행 후 로딩이 끝나면 두 번째 명령을 실행하십시오.

```text
js Vars.world.loadSector(SectorPresets.groundZero.sector);
js eval(Core.files.absolute('/absolute/path/to/tests/headless.js').readString());
```

성공 시 `ALL 29 CHECKS PASSED`가 출력됩니다. 실제 타일/컨베이어/유닛 및 저장 파일을 사용하는 검증이며, Android UI 배치는 별도 확인이 필요합니다.
