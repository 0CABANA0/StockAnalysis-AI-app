-- ============================================================
-- 011: 뉴스 카테고리 확장 (9개 카테고리, 91개 키워드)
-- 기존 감성분석이 거시경제+지정학만 커버했던 것을 9개 영역으로 확장
-- ============================================================

-- 1. sentiment_results 테이블에 news_category 컬럼 추가
ALTER TABLE sentiment_results
  ADD COLUMN IF NOT EXISTS news_category TEXT;

COMMENT ON COLUMN sentiment_results.news_category IS '뉴스 카테고리: MACRO_FINANCE, GEOPOLITICS, TECH_INDUSTRY, ENERGY, DOMESTIC_POLITICS, INTL_POLITICS, BREAKING_DISASTER, ECONOMIC_POLICY, LIFESTYLE_ASSET';

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_sentiment_results_news_category
  ON sentiment_results(news_category);

-- 3. 뉴스 카테고리 설정 테이블
CREATE TABLE IF NOT EXISTS news_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key    TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  description     TEXT,
  keywords        TEXT[] NOT NULL DEFAULT '{}',
  rss_feeds       JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_categories_select_authenticated"
  ON news_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "news_categories_insert_admin"
  ON news_categories FOR INSERT
  WITH CHECK (is_admin_or_above());

CREATE POLICY "news_categories_update_admin"
  ON news_categories FOR UPDATE
  USING (is_admin_or_above());

-- 4. 9개 카테고리 시드 데이터 (91개 키워드)
INSERT INTO news_categories (category_key, display_name, description, keywords, rss_feeds, sort_order) VALUES
(
  'MACRO_FINANCE',
  '거시경제 & 금융',
  '금리, 환율, 주식시장, 채권, ETF 등 금융시장 핵심 지표',
  ARRAY['AI', '주식', '기준금리', '금리인상', '금리인하', '환율', '인플레이션', '코스피', '나스닥', 'S&P500', '국채', 'ETF', '배당', '공매도'],
  '{"Reuters Business": "https://feeds.reuters.com/reuters/businessNews", "BBC Business": "https://feeds.bbci.co.uk/news/business/rss.xml", "한국경제": "https://www.hankyung.com/feed/all-news", "매일경제": "https://www.mk.co.kr/rss/30000001/"}'::jsonb,
  1
),
(
  'GEOPOLITICS',
  '지정학 & 국제정세',
  '무역분쟁, 군사긴장, 제재, 지역갈등 등 지정학 리스크',
  ARRAY['미중무역', '수출규제', '우크라이나', '중동', '북한미사일', '대만해협', '관세', '제재', 'BRICS'],
  '{"Reuters World": "https://feeds.reuters.com/reuters/worldNews", "BBC World": "https://feeds.bbci.co.uk/news/world/rss.xml", "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml"}'::jsonb,
  2
),
(
  'TECH_INDUSTRY',
  '기술 & 산업',
  '반도체, AI, 전기차, 바이오 등 기술 산업 동향',
  ARRAY['반도체', '엔비디아', '삼성전자', 'SK하이닉스', '테슬라', '챗GPT', '자율주행', '로봇', '2차전지', '바이오', 'NVIDIA'],
  '{"Reuters Tech": "https://feeds.reuters.com/reuters/technologyNews", "전자신문": "https://rss.etnews.com/Section901.xml", "ZDNet Korea": "https://www.zdnet.co.kr/rss/all_news.xml"}'::jsonb,
  3
),
(
  'ENERGY',
  '전력/에너지',
  '전력설비, 원전, 신재생에너지, 전력수급 등',
  ARRAY['전력설비', '송전', '변압기', '원전', '신재생에너지', '전력난', '한전'],
  '{"에너지경제": "https://www.ekn.kr/rss/S002.xml", "전기신문": "https://www.electimes.com/rss/S001.xml", "Reuters Energy": "https://feeds.reuters.com/reuters/USenergyNews"}'::jsonb,
  4
),
(
  'DOMESTIC_POLITICS',
  '국내 정치',
  '대선, 총선, 국회, 탄핵, 정당 등 국내 정치 이슈',
  ARRAY['대통령', '국회', '대선', '총선', '탄핵', '국무회의', '국정감사', '특검', '여야합의', '정당', '개각', '검찰', '헌법재판소'],
  '{"연합뉴스 정치": "https://www.yna.co.kr/rss/politics.xml", "한겨레": "https://www.hani.co.kr/rss/politics/", "조선일보 정치": "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/"}'::jsonb,
  5
),
(
  'INTL_POLITICS',
  '국제 정치 & 외교',
  '정상회담, 국제기구, 외교 관계, 글로벌 정치 동향',
  ARRAY['한미정상', '한중관계', '한일관계', 'G7', 'G20', 'UN', 'NATO', '미국대선', '트럼프', '시진핑', '푸틴', 'BRICS'],
  '{"Reuters World": "https://feeds.reuters.com/reuters/worldNews", "BBC World": "https://feeds.bbci.co.uk/news/world/rss.xml", "연합뉴스 국제": "https://www.yna.co.kr/rss/international.xml"}'::jsonb,
  6
),
(
  'BREAKING_DISASTER',
  '속보 & 재난',
  '긴급속보, 자연재해, 사이버공격, 전쟁 등 돌발 이벤트',
  ARRAY['긴급속보', '비상', '속보', '계엄', '지진', '태풍', '산불', '폭우', '홍수', '정전', '테러', '전쟁', '사이버공격', '폭발'],
  '{"연합뉴스 속보": "https://www.yna.co.kr/rss/news.xml", "BBC Breaking": "https://feeds.bbci.co.uk/news/rss.xml", "Reuters Top": "https://feeds.reuters.com/reuters/topNews"}'::jsonb,
  7
),
(
  'ECONOMIC_POLICY',
  '경제 정책 & 규제',
  '세제 개편, 규제 완화/강화, 최저임금, 예산 등 정책 이슈',
  ARRAY['금투세', '양도세', '종부세', '상속세', '규제완화', '공정거래', '최저임금', '예산안'],
  '{"기획재정부": "https://www.moef.go.kr/rss/policy.xml", "한국경제": "https://www.hankyung.com/feed/all-news", "매일경제": "https://www.mk.co.kr/rss/30000001/"}'::jsonb,
  8
),
(
  'LIFESTYLE_ASSET',
  '생활 & 자산',
  '부동산, 연금, 물가, 세금, 건강보험 등 생활 자산 관련',
  ARRAY['부동산대책', '아파트', '연금', '세금', '금값', '물가', '건강보험'],
  '{"연합뉴스 경제": "https://www.yna.co.kr/rss/economy.xml", "한국경제 부동산": "https://www.hankyung.com/feed/all-news", "매일경제": "https://www.mk.co.kr/rss/30000001/"}'::jsonb,
  9
)
ON CONFLICT (category_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  keywords = EXCLUDED.keywords,
  rss_feeds = EXCLUDED.rss_feeds;
