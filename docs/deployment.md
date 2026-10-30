# GitHub Pages 운영 안내

## 검색 수집 운영

- 대표 주소: https://rockcandy444.github.io/coffeemarble/
- 사이트맵: https://rockcandy444.github.io/coffeemarble/sitemap.xml
- Google Search Console에서는 게임 주소 전체를 URL 접두어 속성으로 추가하고 HTML 태그 방식으로 소유권을 확인합니다. 확인 태그는 확인 뒤에도 유지합니다. 사이트맵 제출과 첫 화면 URL 검사의 색인 생성 요청을 사용합니다.
- 네이버 서치어드바이저에서는 로그인 후 지원하는 등록 범위를 확인하고 소유확인·사이트맵 제출·웹페이지 수집 요청을 진행합니다.
- GitHub 프로젝트 사이트에서 robots.txt의 유효 위치는 프로젝트 폴더가 아닌 호스트 루트입니다. 프로젝트 아래에 robots.txt를 추가해 전체 호스트에 적용되는 것처럼 운영하지 않습니다. 검색 로봇에 필요한 CSS·JavaScript는 차단하지 않습니다.
- 사이트맵은 한국어 대표 주소와 `/en/`, `/ja/` 게임 페이지만 포함합니다. 각 페이지의 canonical은 해당 언어 주소를 가리키고 hreflang으로 서로 연결합니다. 문서, 테스트, dist 사본은 검색 대상 목록에 넣지 않습니다. dist의 HTML도 운영 사이트의 해당 언어 주소를 canonical로 가리킵니다.
- IndexNow 소유확인용 텍스트 파일은 프로젝트 루트에 유지합니다. URL 변경 알림을 보낼 때 해당 파일의 전체 주소를 keyLocation으로 지정해 이 프로젝트 범위만 알립니다. 지원 검색엔진의 수신은 실제 색인·노출 완료와 구분합니다. 의미 있는 콘텐츠 변경 시에만 알리고 같은 주소를 반복 제출하지 않습니다.
- 검색 결과의 노출 여부·순서·설명은 검색엔진이 결정합니다. 수집 요청이 즉시 노출을 보장하지는 않습니다.

공식 안내: [Google 재수집](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [네이버 사이트맵](https://searchadvisor.naver.com/guide/request-feed).

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
2. `node scripts/build-locales.cjs`로 언어별 HTML, 사이트맵과 `dist/` 런타임 사본을 갱신합니다.
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
