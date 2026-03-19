from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
NEWSDATA_API_KEY = os.environ.get('NEWSDATA_API_KEY')


class AnalyzeRequest(BaseModel):
    business: str = Field(..., min_length=1, description="Business name cannot be empty")
    event: str = Field(..., min_length=1, description="Event name cannot be empty")


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    business: str
    event: str
    currency_rates: Dict[str, float]
    recent_context: str
    risk_factors: List[Dict[str, Any]]
    headwinds: List[str]
    opportunities: List[str]
    actions: List[str]
    resilience_score: int
    sector_overview: List[Dict[str, Any]]


EVENT_KEYWORDS = {
    "France Economic Transition 2025": "France economy budget debt",
    "Eastern Europe Conflict": "Russia Ukraine conflict 2026",
    "Middle East Tensions 2026": "Iran Israel tensions oil",
    "US-China Trade Relations": "US China tariffs trade",
    "Middle East Energy Shifts": "Middle East oil OPEC energy"
}


async def fetch_currency_rates() -> Dict[str, float]:
    """Fetch live currency rates from Frankfurter API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("https://api.frankfurter.app/latest?from=USD&to=INR,EUR")
            response.raise_for_status()
            data = response.json()
            
            eur_response = await client.get("https://api.frankfurter.app/latest?from=EUR&to=INR")
            eur_response.raise_for_status()
            eur_data = eur_response.json()
            
            return {
                "USD_INR": data["rates"]["INR"],
                "EUR_INR": eur_data["rates"]["INR"]
            }
        except Exception as e:
            logging.error(f"Error fetching currency rates: {e}")
            return {"USD_INR": 84.50, "EUR_INR": 92.30}


async def fetch_news_headlines(event: str) -> List[str]:
    """Fetch recent news headlines from NewsData.io"""
    keywords = EVENT_KEYWORDS.get(event, "global economy trade")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&q={keywords}&language=en&category=business"
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success" and data.get("results"):
                headlines = [article["title"] for article in data["results"][:5]]
                return headlines
            else:
                return [f"Recent developments in {event}"]
        except Exception as e:
            logging.error(f"Error fetching news: {e}")
            return [f"Recent developments in {event}"]


async def analyze_business_impact(business: str, event: str, headlines: List[str]) -> Dict[str, Any]:
    """Use Claude to analyze business impact"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a composed business analyst. Use measured language with hedged statements (may, could, potential). Avoid catastrophic terms. Provide professional assessment."
    ).with_model("anthropic", "claude-haiku-4-5-20251001")
    
    headlines_text = "\n".join([f"- {h}" for h in headlines])
    prompt = f"""Analyze how '{event}' impacts '{business}' (an Indian business).

Recent headlines:
{headlines_text}

Provide analysis in this exact JSON format (no markdown, just raw JSON):
{{
  "recent_context": "Brief 2-sentence insight about recent developments",
  "risk_factors": [
    {{"title": "Risk factor name", "timeframe": "short"}},
    {{"title": "Risk factor name", "timeframe": "medium"}},
    {{"title": "Risk factor name", "timeframe": "long"}}
  ],
  "headwinds": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "actions": ["Action 1", "Action 2", "Action 3"],
  "resilience_score": 7
}}

Keep all text concise (under 100 characters per item)."""
    
    try:
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        import json
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        return json.loads(response_text)
    except Exception as e:
        logging.error(f"Error analyzing business impact: {e}")
        return {
            "recent_context": f"Global event '{event}' may impact {business}.",
            "risk_factors": [
                {"title": "Supply chain uncertainty", "timeframe": "short"},
                {"title": "Market volatility", "timeframe": "medium"},
                {"title": "Strategic adaptation needs", "timeframe": "long"}
            ],
            "headwinds": ["Cost pressures", "Demand uncertainty", "Regulatory shifts"],
            "opportunities": ["Market diversification", "Innovation focus", "Strategic partnerships"],
            "actions": ["Monitor developments", "Review supply chains", "Assess risk exposure"],
            "resilience_score": 6
        }


async def analyze_sector_overview(event: str) -> List[Dict[str, Any]]:
    """Use Claude to analyze sector-level impacts"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a sector analyst. Provide measured assessments."
    ).with_model("anthropic", "claude-haiku-4-5-20251001")
    
    prompt = f"""Analyze how '{event}' impacts these 10 sectors in India:
Technology, Manufacturing, Energy, Finance, Healthcare, Retail, Agriculture, Transport, Real Estate, Services

For each sector, provide status (RISK/OPP/NEU) and intensity (1-10).

Return exact JSON format (no markdown):
{{
  "sectors": [
    {{"name": "Technology", "status": "OPP", "intensity": 7}},
    {{"name": "Manufacturing", "status": "RISK", "intensity": 6}}
  ]
}}

All 10 sectors required."""
    
    try:
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        import json
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        data = json.loads(response_text)
        return data.get("sectors", [])
    except Exception as e:
        logging.error(f"Error analyzing sectors: {e}")
        return [
            {"name": "Technology", "status": "OPP", "intensity": 6},
            {"name": "Manufacturing", "status": "RISK", "intensity": 7},
            {"name": "Energy", "status": "RISK", "intensity": 8},
            {"name": "Finance", "status": "NEU", "intensity": 5},
            {"name": "Healthcare", "status": "NEU", "intensity": 4},
            {"name": "Retail", "status": "RISK", "intensity": 6},
            {"name": "Agriculture", "status": "RISK", "intensity": 7},
            {"name": "Transport", "status": "RISK", "intensity": 8},
            {"name": "Real Estate", "status": "NEU", "intensity": 5},
            {"name": "Services", "status": "OPP", "intensity": 6}
        ]


@api_router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """Main analysis endpoint"""
    try:
        rates_task = fetch_currency_rates()
        headlines_task = fetch_news_headlines(request.event)
        
        currency_rates, headlines = await asyncio.gather(rates_task, headlines_task)
        
        business_task = analyze_business_impact(request.business, request.event, headlines)
        sector_task = analyze_sector_overview(request.event)
        
        business_analysis, sector_overview = await asyncio.gather(business_task, sector_task)
        
        return AnalyzeResponse(
            business=request.business,
            event=request.event,
            currency_rates=currency_rates,
            recent_context=business_analysis["recent_context"],
            risk_factors=business_analysis["risk_factors"],
            headwinds=business_analysis["headwinds"],
            opportunities=business_analysis["opportunities"],
            actions=business_analysis["actions"],
            resilience_score=business_analysis["resilience_score"],
            sector_overview=sector_overview
        )
    except Exception as e:
        logging.error(f"Error in analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/")
async def root():
    return {"message": "Global Event Impact Analyser API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

