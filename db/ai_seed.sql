-- Optional one-time seed for the AI sector.
-- Run this in Supabase SQL Editor AFTER ai_schema.sql.
-- Real n8n-ingested posts will coexist; mock IDs won't collide with RSS guids.
-- To re-run, the upsert (on conflict) updates instead of erroring.

insert into ai_posts (id, company, title, summary, url, published_at, source, tags) values
  ('openai-gpt55-turbo',          'openai',          'GPT-5.5 Turbo 출시 — 추론 지연 30% 감소',
   '동일 가격에 응답 속도가 평균 30% 빨라진 GPT-5.5 Turbo가 API에 추가됐다. 컨텍스트 윈도우는 1M 토큰 유지, 함수 호출 지연도 대폭 개선.',
   'https://openai.com/blog/gpt-5-5-turbo',          '2026-05-16T15:00:00Z', 'blog', '{model-release,api}'),
  ('openai-saudi-pif',            'openai',          '사우디 PIF와 50억 달러 데이터센터 파트너십',
   '중동 권역 추론 인프라 구축을 위해 사우디 국부펀드와 5년 50억 달러 규모 합의. 2027년 1단계 가동 목표.',
   'https://openai.com/blog/saudi-partnership',      '2026-05-16T09:00:00Z', 'blog', '{infrastructure,partnership}'),
  ('openai-sora-2',               'openai',          'Sora 2 — 60초 영상, 오디오 동기화 지원',
   '최대 60초 분량의 1080p 영상 생성과 자동 BGM/효과음 합성을 지원하는 Sora 2가 공개됐다. ChatGPT Pro 구독자에 우선 제공.',
   'https://openai.com/blog/sora-2',                 '2026-05-13T17:30:00Z', 'blog', '{video,model-release}'),
  ('openai-voice-v3',             'openai',          'Voice Mode v3 — 감정 톤 조절 가능',
   '프롬프트로 응답의 감정·억양·속도를 세밀하게 지정할 수 있는 Voice Mode v3가 모바일 앱에 배포됐다.',
   'https://openai.com/blog/voice-v3',               '2026-05-11T20:00:00Z', 'blog', '{voice}'),
  ('anthropic-opus-47',           'anthropic',       'Claude Opus 4.7 — 에이전트 능력 강화',
   '긴 호흡의 작업(평균 7시간 자율 실행)에서 안정성이 크게 개선됐다. 도구 사용 정확도 +18%, 컴퓨터 사용 작업 성공률 +24%.',
   'https://anthropic.com/news/claude-opus-4-7',     '2026-05-15T14:00:00Z', 'blog', '{model-release,agents}'),
  ('anthropic-computer-use-ga',   'anthropic',       'Computer Use 정식 출시',
   '베타였던 Computer Use API가 GA. 화면 캡처 처리 속도 2배, 클릭 정확도 +12%, 가격은 베타 대비 40% 인하.',
   'https://anthropic.com/news/computer-use-ga',     '2026-05-12T13:00:00Z', 'blog', '{agents,api}'),
  ('anthropic-cai-v3',            'anthropic',       'Constitutional AI v3 논문 공개',
   '다중 헌법(multi-constitution) 학습으로 도메인별 행동 정책을 동시에 만족시키는 방법론. 안전성과 유용성 양쪽에서 v2 대비 의미 있는 개선.',
   'https://anthropic.com/research/cai-v3',          '2026-05-10T16:00:00Z', 'paper', '{safety,research}'),
  ('deepmind-gemini-3-ultra',     'google-deepmind', 'Gemini 3 Ultra 벤치마크 공개',
   'MMLU-Pro 91.2%, SWE-bench Verified 72.8%로 현 시점 최고 성능. 4M 토큰 컨텍스트와 네이티브 영상 이해 지원.',
   'https://deepmind.google/blog/gemini-3-ultra',    '2026-05-14T18:00:00Z', 'blog', '{model-release,benchmark}'),
  ('deepmind-gemini-robotics-2',  'google-deepmind', 'Gemini Robotics 2 — 신규 작업 즉시 학습 데모',
   '사전 학습되지 않은 가정 환경 작업 12종을 시연 2회 만에 성공시키는 영상 공개. VLA 모델 사이즈는 절반으로 축소.',
   'https://deepmind.google/blog/gemini-robotics-2', '2026-05-15T11:30:00Z', 'blog', '{robotics}'),
  ('deepmind-alphafold-4',        'google-deepmind', 'AlphaFold 4 — 단백질 설계 정확도 SOTA',
   'Nature 게재. 기존 구조 예측에 더해 de novo 단백질 설계까지 단일 모델로 처리. 신약·효소 설계 분야 파급력 클 것.',
   'https://nature.com/alphafold-4',                 '2026-05-12T10:00:00Z', 'paper', '{biology,research}'),
  ('xai-grok-4-multimodal',       'xai',             'Grok 4 멀티모달 프리뷰',
   '텍스트·이미지·영상·오디오 네이티브 멀티모달. X 프리미엄 구독자에게 점진 배포 시작, API 공개는 7월 예정.',
   'https://x.ai/blog/grok-4',                       '2026-05-14T22:00:00Z', 'blog', '{model-release}'),
  ('xai-memphis-200k',            'xai',             'Memphis 슈퍼클러스터 H200 20만 장으로 확장',
   '기존 10만 장 규모의 Memphis 클러스터를 두 배 증설. 차세대 Grok 5 학습이 본격화될 전망.',
   'https://x.ai/blog/memphis-expansion',            '2026-05-11T08:00:00Z', 'blog', '{infrastructure}'),
  ('xai-grok-pricing-cut',        'xai',             'Grok API 가격 50% 인하',
   'Grok 3 입출력 단가를 절반으로 인하. OpenAI·Anthropic 대비 동급 모델 기준 30~40% 저렴한 수준.',
   'https://x.ai/blog/pricing-may-2026',             '2026-05-13T12:00:00Z', 'blog', '{pricing}'),
  ('meta-llama-4-405b',           'meta-ai',         'Llama 4 405B 오픈 웨이트 공개',
   '벤치마크상 GPT-5 미니와 동급. 상업 사용 가능 라이선스로 공개돼 오픈소스/폐쇄 모델 간 격차를 다시 좁혔다.',
   'https://ai.meta.com/blog/llama-4-405b',          '2026-05-13T15:00:00Z', 'blog', '{model-release,open-weights}'),
  ('meta-imagebind-2',            'meta-ai',         'ImageBind 2 — 7개 모달리티 통합 임베딩',
   '텍스트·이미지·영상·오디오·심도·열화상·IMU를 단일 임베딩 공간으로 묶는 차세대 멀티모달 임베딩.',
   'https://ai.meta.com/blog/imagebind-2',           '2026-05-10T14:00:00Z', 'paper', '{multimodal,research}')
on conflict (id) do update set
  title        = excluded.title,
  summary      = excluded.summary,
  url          = excluded.url,
  published_at = excluded.published_at,
  source       = excluded.source,
  tags         = excluded.tags;

insert into daily_digest (date, summary, highlights) values
  ('2026-05-17',
   '이번 주는 프론티어 모델 일제 업데이트 주간. OpenAI(GPT-5.5 Turbo)·Anthropic(Opus 4.7)·DeepMind(Gemini 3 Ultra)가 같은 주에 신모델/벤치마크를 공개하며 경쟁이 격화됐다. Meta는 Llama 4 405B를 오픈 웨이트로 풀어 폐쇄 모델과의 격차를 좁혔고, xAI는 가격을 절반으로 내리며 추론 비용 인하 경쟁에 본격 가세. 인프라 측면에서는 OpenAI의 사우디 파트너십과 xAI Memphis 클러스터 20만 GPU 확장이 눈에 띈다.',
   '[
     {"title":"Claude Opus 4.7 — 에이전트 능력 강화","company":"anthropic","url":"https://anthropic.com/news/claude-opus-4-7"},
     {"title":"Gemini 3 Ultra 벤치마크 공개","company":"google-deepmind","url":"https://deepmind.google/blog/gemini-3-ultra"},
     {"title":"Llama 4 405B 오픈 웨이트 공개","company":"meta-ai","url":"https://ai.meta.com/blog/llama-4-405b"}
   ]'::jsonb)
on conflict (date) do update set
  summary    = excluded.summary,
  highlights = excluded.highlights;
