from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class RiskAssessmentRequest(BaseModel):
    entity_id: Optional[str] = Field(default=None, description="ID của đối tượng đánh giá")
    entity_type: Optional[str] = Field(default=None, description="Loại đối tượng (cá nhân/doanh nghiệp)")
    financials: Optional[Dict] = Field(default=None, description="Thông tin tài chính")
    market_data: Optional[Dict] = Field(default=None, description="Dữ liệu thị trường")
    custom_factors: Optional[Dict] = Field(default=None, description="Yếu tố tùy chỉnh")
    # Credit assessment fields (mở rộng)
    applicant_name: Optional[str] = Field(default=None, description="Tên người/công ty vay")
    business_type: Optional[str] = Field(default=None, description="Loại hình kinh doanh")
    requested_amount: Optional[float] = Field(default=None, description="Số tiền vay")
    currency: Optional[str] = Field(default=None, description="Đơn vị tiền tệ")
    loan_term: Optional[int] = Field(default=None, description="Thời hạn vay (tháng)")
    loan_purpose: Optional[str] = Field(default=None, description="Mục đích vay")
    collateral_type: Optional[str] = Field(default=None, description="Loại tài sản đảm bảo")
    assessment_type: Optional[str] = Field(default=None, description="Loại đánh giá")
    financial_documents: Optional[str] = Field(default=None, description="Nội dung tài liệu tài chính")
    # ... có thể bổ sung trường khác nếu cần

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
    # Credit assessment fields (mở rộng)
    credit_score: Optional[int] = None
    risk_rating: Optional[str] = None
    recommendation: Optional[str] = None
    confidence: Optional[float] = None
    max_loan_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    risk_factors: Optional[List[Dict]] = None
    financial_metrics: Optional[Dict] = None
    compliance_checks: Optional[Dict] = None

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

class CreditAssessmentResponseShort(BaseModel):
    creditScore: int
    riskRating: str
    maxLoanAmount: float
    interestRate: float
    financialMetrics: Dict
    complianceChecks: Dict
    recommendation: str
    confidence: float 