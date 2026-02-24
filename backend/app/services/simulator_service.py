"""시나리오 시뮬레이션 서비스 — What-if AI 분석."""

import json
from datetime import datetime, timezone
from typing import Any

import httpx
from supabase import Client

from app.config import settings
from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-2.0-flash-001"

# 4가지 시나리오 프롬프트 템플릿
SCENARIO_TEMPLATES: dict[str, str] = {
    "RATE_HIKE": """금리 인상 시나리오를 분석하세요.
- 현재 상황: 기준금리가 {rate_change}bp 인상될 경우
- 분석 요청: 한국 주식시장, 원/달러 환율, 채권시장, 주요 섹터별 영향""",

    "FX_SHOCK": """환율 급변 시나리오를 분석하세요.
- 현재 상황: 원/달러 환율이 {fx_level}원으로 {fx_direction}할 경우
- 분석 요청: 수출주, 내수주, 외국인 투자 흐름, 한국은행 대응 예상""",

    "GEO_CONFLICT": """지정학 갈등 시나리오를 분석하세요.
- 현재 상황: {conflict_description}
- 분석 요청: 글로벌 시장 충격, 안전자산 이동, 에너지 가격, 한국 시장 영향""",

    "TARIFF_WAR": """관세 전쟁 시나리오를 분석하세요.
- 현재 상황: {tariff_description}
- 분석 요청: 영향 받는 산업, 공급망 변화, 대체 수혜 종목, 장기 전략""",
}


def _get_model_from_db(client: Client) -> str:
    """model_configs에서 시뮬레이션용 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("model_id")
            .eq("feature", "simulator")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["model_id"]
    except Exception as e:
        logger.warning("model_configs query failed: %s — using default", e)
    return DEFAULT_MODEL


def _build_scenario_prompt(scenario_type: str, params: dict[str, Any]) -> str:
    """시나리오 타입에 맞는 프롬프트를 생성한다."""
    template = SCENARIO_TEMPLATES.get(scenario_type)
    if template:
        try:
            return template.format(**params)
        except KeyError:
            pass

    # 커스텀 시나리오 또는 파라미터 불일치
    return f"시나리오 타입: {scenario_type}\n파라미터: {json.dumps(params, ensure_ascii=False)}"


def _gather_macro_context(client: Client) -> str:
    """현재 거시경제 상황을 텍스트로 요약한다."""
    snapshot = get_latest(client)
    if not snapshot:
        return "거시경제 데이터 없음"

    parts = []
    if snapshot.vix is not None:
        parts.append(f"VIX: {snapshot.vix:.1f}")
    if snapshot.us_10y_yield is not None:
        parts.append(f"미 10년 국채: {snapshot.us_10y_yield:.2f}%")
    if snapshot.usd_krw is not None:
        parts.append(f"원/달러: {snapshot.usd_krw:,.0f}원")
    if snapshot.wti is not None:
        parts.append(f"WTI: ${snapshot.wti:.1f}")
    if snapshot.gold is not None:
        parts.append(f"금: ${snapshot.gold:.1f}")

    return ", ".join(parts) if parts else "거시경제 데이터 없음"


def run_simulation(
    client: Client,
    user_id: str,
    scenario_type: str,
    params: dict[str, Any],
) -> dict[str, Any]:
    """What-if 시나리오 AI 분석을 수행하고 DB에 저장한다."""
    scenario_prompt = _build_scenario_prompt(scenario_type, params)
    macro_context = _gather_macro_context(client)

    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — returning fallback simulation")
        result = _make_fallback_result(scenario_type)
        _save_simulation(client, user_id, scenario_type, params, result)
        return result

    model = _get_model_from_db(client)

    prompt = f"""당신은 글로벌 투자 전략가입니다. 아래 시나리오에 대해 What-if 분석을 수행하세요.

## 현재 거시경제 상황
{macro_context}

## 시나리오
{scenario_prompt}

## 응답 형식 (JSON만 반환)
{{
  "summary": "시나리오 분석 요약 (3-5문장, 한국어)",
  "impact": {{
    "stock_market": {{
      "direction": "POSITIVE, NEGATIVE, NEUTRAL 중 하나",
      "magnitude": "LOW, MEDIUM, HIGH 중 하나",
      "description": "주식시장 영향 2-3문장 (한국어)"
    }},
    "bond_market": {{
      "direction": "POSITIVE, NEGATIVE, NEUTRAL 중 하나",
      "magnitude": "LOW, MEDIUM, HIGH 중 하나",
      "description": "채권시장 영향 1-2문장"
    }},
    "fx_market": {{
      "direction": "POSITIVE, NEGATIVE, NEUTRAL 중 하나",
      "magnitude": "LOW, MEDIUM, HIGH 중 하나",
      "description": "환율 영향 1-2문장"
    }},
    "commodities": {{
      "direction": "POSITIVE, NEGATIVE, NEUTRAL 중 하나",
      "magnitude": "LOW, MEDIUM, HIGH 중 하나",
      "description": "원자재 영향 1-2문장"
    }}
  }},
  "affected_sectors": [
    {{"sector": "섹터명", "impact": "수혜 또는 피해", "reason": "이유"}}
  ],
  "recommended_actions": [
    "투자 행동 제안 1",
    "투자 행동 제안 2",
    "투자 행동 제안 3"
  ],
  "probability": "이 시나리오 발생 확률 추정 (예: '30~40%')",
  "time_horizon": "영향 지속 기간 (예: '1~3개월')"
}}

JSON만 응답하세요."""

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.4,
            },
            timeout=90.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]

        # JSON 파싱
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content
            if content.endswith("```"):
                content = content[: -len("```")]
            content = content.strip()

        result = json.loads(content)

    except Exception as e:
        logger.error("Simulation failed for %s: %s", scenario_type, e)
        result = _make_fallback_result(scenario_type)

    _save_simulation(client, user_id, scenario_type, params, result)
    return result


def _make_fallback_result(scenario_type: str) -> dict:
    """AI 실패 시 기본 결과."""
    return {
        "summary": f"{scenario_type} 시나리오에 대한 AI 분석을 수행할 수 없습니다. "
                   "데이터 수집 완료 후 재시도해 주세요.",
        "impact": {},
        "affected_sectors": [],
        "recommended_actions": ["현재 포지션 유지", "추가 데이터 확인 후 판단"],
        "probability": "N/A",
        "time_horizon": "N/A",
    }


def _save_simulation(
    client: Client,
    user_id: str,
    scenario_type: str,
    params: dict[str, Any],
    result: dict[str, Any],
) -> None:
    """시뮬레이션 결과를 DB에 저장한다."""
    try:
        client.table("scenario_simulations").insert(
            {
                "user_id": user_id,
                "scenario_type": scenario_type,
                "scenario_params": params,
                "result": result,
            }
        ).execute()
        logger.info("Simulation saved for user %s, type %s", user_id, scenario_type)
    except Exception as e:
        logger.error("Failed to save simulation: %s", e)
