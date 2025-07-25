"""
Pydantic models for input validation in Healthcare MCP Server
"""

from typing import Optional, List, Literal
from datetime import datetime, date
from pydantic import BaseModel, validator, Field
from enum import Enum


class AssessmentType(str, Enum):
    """Valid assessment types"""
    PTSD = "ptsd"
    PHQ = "phq" 
    GAD = "gad"
    WHO = "who"
    DERS = "ders"
    DERS2 = "ders2"


class PatientIdRequest(BaseModel):
    """Basic patient ID validation"""
    patient_id: str = Field(..., min_length=2, max_length=50, description="Patient identifier")
    
    @validator('patient_id')
    def validate_patient_id(cls, v):
        if not v or not v.strip():
            raise ValueError('Patient ID cannot be empty')
        # Convert to uppercase for consistency
        return v.strip().upper()


class AssessmentRequest(PatientIdRequest):
    """Request for assessment data"""
    assessment_type: AssessmentType = Field(..., description="Type of assessment to retrieve")
    include_metadata: bool = Field(default=True, description="Include calculated totals and severity")


class PaginationRequest(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number (starts from 1)")
    page_size: int = Field(default=50, ge=1, le=500, description="Number of records per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries"""
        return (self.page - 1) * self.page_size


class PatientListRequest(PaginationRequest):
    """Request for listing patients"""
    assessment_filter: Optional[AssessmentType] = Field(None, description="Filter by assessment type")
    active_only: bool = Field(default=True, description="Only include patients with recent data")


class DateRangeFilter(BaseModel):
    """Date range filtering"""
    start_date: Optional[date] = Field(None, description="Start date for filtering")
    end_date: Optional[date] = Field(None, description="End date for filtering")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if v and 'start_date' in values and values['start_date']:
            if v < values['start_date']:
                raise ValueError('End date must be after start date')
        return v


class AnalyticsRequest(PatientIdRequest):
    """Request for patient analytics"""
    timeframe_days: int = Field(default=365, ge=30, le=1825, description="Timeframe in days (30-1825)")
    include_trends: bool = Field(default=True, description="Include trend analysis")
    comparison_type: Literal["population", "baseline", "previous"] = Field(
        default="population", 
        description="Type of comparison to perform"
    )


class RiskAssessmentRequest(PatientIdRequest):
    """Request for risk assessment calculation"""
    include_substance_data: bool = Field(default=True, description="Include substance use in risk calculation")
    risk_factors: List[str] = Field(
        default_factory=lambda: ["clinical_scores", "substance_use", "progress_trends"],
        description="Risk factors to include in calculation"
    )


class SubstanceAnalysisRequest(BaseModel):
    """Request for substance use analysis"""
    patient_id: Optional[str] = Field(None, description="Specific patient ID (optional for population analysis)")
    substance_types: Optional[List[str]] = Field(None, description="Filter by substance types")
    active_only: bool = Field(default=True, description="Only include active substance use")
    include_patterns: bool = Field(default=True, description="Include usage pattern analysis")
    
    @validator('patient_id')
    def validate_patient_id(cls, v):
        if v:
            return v.strip().upper()
        return v


class PopulationStatsRequest(BaseModel):
    """Request for population statistics"""
    assessment_type: AssessmentType = Field(..., description="Assessment type for statistics")
    include_demographics: bool = Field(default=False, description="Include demographic breakdowns")
    date_range: Optional[DateRangeFilter] = Field(None, description="Date range filter")
    minimum_sample_size: int = Field(default=10, ge=1, description="Minimum sample size for statistics")


class HealthCheckRequest(BaseModel):
    """Request for health check"""
    include_dependencies: bool = Field(default=True, description="Check external dependencies")
    include_performance_metrics: bool = Field(default=False, description="Include performance metrics")
    timeout_seconds: int = Field(default=30, ge=5, le=120, description="Timeout for dependency checks")


class MotivationAnalysisRequest(PatientIdRequest):
    """Request for motivation theme analysis"""
    include_bps_data: bool = Field(default=True, description="Include BPS assessment data")
    include_php_data: bool = Field(default=True, description="Include PHP assessment data") 
    include_ahcm_data: bool = Field(default=True, description="Include AHCM assessment data")
    theme_categories: Optional[List[str]] = Field(None, description="Specific theme categories to analyze")


# Response models for better API documentation
class ValidationErrorResponse(BaseModel):
    """Standard validation error response"""
    error: str
    field: Optional[str] = None
    invalid_value: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Standard paginated response wrapper"""
    data: List[dict]
    page: int
    page_size: int
    total_count: Optional[int] = None
    has_more: bool
    
    
class HealthCheckResponse(BaseModel):
    """Health check response model"""
    status: Literal["healthy", "unhealthy", "degraded"]
    timestamp: datetime
    checks: dict
    uptime_seconds: Optional[float] = None
    version: str