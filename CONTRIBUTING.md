# 기여 가이드

StockAnalysis AI 프로젝트에 기여해 주셔서 감사합니다.

## 개발 환경 설정

1. 저장소를 포크합니다
2. 로컬에 클론합니다
3. `npm install`로 의존성을 설치합니다
4. `.env.example`을 `.env.local`로 복사하고 값을 채웁니다

## 브랜치 전략

- `main`: 프로덕션 브랜치
- `feature/*`: 새 기능 개발
- `fix/*`: 버그 수정
- `docs/*`: 문서 수정

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다:

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
```

## PR 프로세스

1. feature 브랜치를 생성합니다
2. 변경사항을 커밋합니다
3. `npm run lint && npm run type-check && npm run build`로 검증합니다
4. PR을 생성합니다
5. 코드 리뷰 후 머지됩니다

## 코드 스타일

- ESLint + Prettier 설정을 따릅니다
- `npm run format`으로 자동 포맷팅할 수 있습니다
- TypeScript strict 모드를 사용합니다
