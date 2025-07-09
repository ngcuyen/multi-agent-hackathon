from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class RiskAssessmentRequest(BaseModel):
    entity_id: str = Field(..., description="ID của đối tượng đánh giá")
    entity_type: str = Field(..., description="Loại đối tượng (cá nhân/doanh nghiệp)")
    financials: Dict = Field(..., description="Thông tin tài chính")
    market_data: Dict = Field(..., description="Dữ liệu thị trường")
    custom_factors: Optional[Dict] = Field(default=None, description="Yếu tố tùy chỉnh")

class Threat(BaseModel):
    type: str
    score: int
    description: str

class RiskAssessmentResponse(BaseModel):
    status: str
    risk_score: int
    risk_level: str
    impact_assessment: Dict[str, str]
    threats: List[Threat]
    recommendations: List[str]
    ai_report: Optional[str] = None

class RiskMonitorResponse(BaseModel):
    status: str
    last_score: int
    alerts: List[Dict]

class RiskAlertRequest(BaseModel):
    alert_type: str
    entity_id: str
    message: str

class RiskScoreHistoryResponse(BaseModel):
    entity_id: str
    history: List[Dict]

class MarketDataResponse(BaseModel):
    data: Dict
    timestamp: str 