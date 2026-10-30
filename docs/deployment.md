# GitHub Pages 운영 안내

- 게임 주소: https://rockcandy444.github.io/coffeemarble/
- 저장소: https://github.com/RockCandy444/coffeemarble
- 저장소 ID:1425209436. 기존 저장소의 이름을 변경했으며 커밋 이력은 유지합니다.
- 기존 저장소 주소는 GitHub에서 새 주소로 연결합니다. 이전 저장소 이름은 다른 저장소에 재사용하지 않습니다.

## 배포 설정

Settings → Pages → Build and deployment:

| 항목 | 값 |
| --- | --- |
| Source | Deploy from a branch |
| Branch | main |
| Folder | /(root) |

루트 `index.html`이 진입점입니다. `.nojekyll`을 유지해 HTML/CSS/JavaScript 파일을 정적 파일로 게시합니다. 도메인을 구매하거나 별도 서버를 설치할 필요가 없습니다.

## 업데이트

1. 게임 파일을 수정하고 기존 테스트 및 로컬 화면을 확인합니다.
2. 변경한 런타임 파일은 `dist/`에도 복사해 두 배포용 사본을 일치시킵니다.
3. `main`에 커밋하고 푸시합니다.
4. Actions의 Pages 배포 완료를 확인한 뒤 공개 주소를 새로고침해 확인합니다.

현재 GitHub 작업 폴더는 `coffee-marble-source`이며 로컬 폴더 이름은 저장소 이름과 달라도 됩니다. 이전 체크아웃을 계속 사용할 때는 원격 주소를 다음처럼 갱신합니다.

```sh
git remote set-url origin https://github.com/RockCandy444/coffeemarble.git
```

이미 연결한 클라우드 환경에서는 저장소 이름의 표시와 새 작업 실행 여부를 확인합니다. GitHub는 이전 Git clone/fetch/push 주소를 새 저장소로 연결하지만 연결 서비스별 표시 갱신은 다를 수 있습니다.

## 공개 범위

GitHub Free의 Pages를 사용하려면 저장소를 공개로 유지합니다. 비공개 저장소에서 Pages를 사용하려면 지원하는 유료 플랜이 필요하며, 저장소가 비공개여도 일반 Pages 사이트 자체가 비공개가 되는 것은 아닙니다.

기존 Sites 주소는 계속 유지합니다. GitHub의 소스 업데이트가 Sites 배포까지 자동으로 반영하지는 않습니다.

공식 안내:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository
