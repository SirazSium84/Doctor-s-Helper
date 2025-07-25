"""
Unit tests for Pydantic models
"""

import pytest
from datetime import date
from pydantic import ValidationError
from models import (
    PatientIdRequest,
    AssessmentRequest, 
    PaginationRequest,
    PatientListRequest,
    DateRangeFilter,
    AnalyticsRequest,
    RiskAssessmentRequest,
    SubstanceAnalysisRequest,
    PopulationStatsRequest,
    HealthCheckRequest,
    AssessmentType
)

class TestPatientIdRequest:
    """Test PatientIdRequest model validation"""
    
    def test_valid_patient_id(self):
        """Test valid patient ID"""
        request = PatientIdRequest(patient_id="PT001")
        assert request.patient_id == "PT001"
    
    def test_patient_id_converted_to_uppercase(self):
        """Test patient ID is converted to uppercase"""
        request = PatientIdRequest(patient_id="pt001")
        assert request.patient_id == "PT001"
    
    def test_patient_id_stripped(self):
        """Test patient ID whitespace is stripped"""
        request = PatientIdRequest(patient_id="  PT001  ")
        assert request.patient_id == "PT001"
    
    def test_empty_patient_id_fails(self):
        """Test empty patient ID fails validation"""
        with pytest.raises(ValidationError) as exc_info:
            PatientIdRequest(patient_id="")
        
        assert "Patient ID cannot be empty" in str(exc_info.value)
    
    def test_whitespace_only_patient_id_fails(self):
        """Test whitespace-only patient ID fails validation"""
        with pytest.raises(ValidationError) as exc_info:
            PatientIdRequest(patient_id="   ")
        
        assert "Patient ID cannot be empty" in str(exc_info.value)
    
    def test_patient_id_too_short_fails(self):
        """Test patient ID less than 2 characters fails"""
        with pytest.raises(ValidationError):
            PatientIdRequest(patient_id="A")
    
    def test_patient_id_too_long_fails(self):
        """Test patient ID more than 50 characters fails"""
        long_id = "A" * 51
        with pytest.raises(ValidationError):
            PatientIdRequest(patient_id=long_id)

class TestAssessmentRequest:
    """Test AssessmentRequest model validation"""
    
    def test_valid_assessment_request(self):
        """Test valid assessment request"""
        request = AssessmentRequest(
            patient_id="PT001",
            assessment_type=AssessmentType.PTSD,
            include_metadata=True
        )
        assert request.patient_id == "PT001"
        assert request.assessment_type == AssessmentType.PTSD
        assert request.include_metadata is True
    
    def test_assessment_type_enum_validation(self):
        """Test assessment type must be valid enum value"""
        with pytest.raises(ValidationError):
            AssessmentRequest(
                patient_id="PT001",
                assessment_type="invalid_type"
            )
    
    def test_default_include_metadata(self):
        """Test default value for include_metadata"""
        request = AssessmentRequest(
            patient_id="PT001",
            assessment_type=AssessmentType.PHQ
        )
        assert request.include_metadata is True

class TestPaginationRequest:
    """Test PaginationRequest model validation"""
    
    def test_valid_pagination(self):
        """Test valid pagination parameters"""
        request = PaginationRequest(page=2, page_size=25)
        assert request.page == 2
        assert request.page_size == 25
        assert request.offset == 25  # (2-1) * 25
    
    def test_default_pagination(self):
        """Test default pagination values"""
        request = PaginationRequest()
        assert request.page == 1
        assert request.page_size == 50
        assert request.offset == 0
    
    def test_page_minimum_validation(self):
        """Test page must be at least 1"""
        with pytest.raises(ValidationError):
            PaginationRequest(page=0)
    
    def test_page_size_minimum_validation(self):
        """Test page_size must be at least 1"""
        with pytest.raises(ValidationError):
            PaginationRequest(page_size=0)
    
    def test_page_size_maximum_validation(self):
        """Test page_size cannot exceed 500"""
        with pytest.raises(ValidationError):
            PaginationRequest(page_size=501)
    
    def test_offset_calculation(self):
        """Test offset calculation for different pages"""
        request1 = PaginationRequest(page=1, page_size=10)
        request2 = PaginationRequest(page=3, page_size=20)
        request3 = PaginationRequest(page=5, page_size=100)
        
        assert request1.offset == 0
        assert request2.offset == 40  # (3-1) * 20
        assert request3.offset == 400  # (5-1) * 100

class TestDateRangeFilter:
    """Test DateRangeFilter model validation"""
    
    def test_valid_date_range(self):
        """Test valid date range"""
        start = date(2024, 1, 1)
        end = date(2024, 1, 31)
        
        filter_obj = DateRangeFilter(start_date=start, end_date=end)
        assert filter_obj.start_date == start
        assert filter_obj.end_date == end
    
    def test_end_date_before_start_date_fails(self):
        """Test end date before start date fails validation"""
        start = date(2024, 1, 31)
        end = date(2024, 1, 1)
        
        with pytest.raises(ValidationError) as exc_info:
            DateRangeFilter(start_date=start, end_date=end)
        
        assert "End date must be after start date" in str(exc_info.value)
    
    def test_same_start_and_end_date_allowed(self):
        """Test same start and end date is allowed"""
        same_date = date(2024, 1, 15)
        filter_obj = DateRangeFilter(start_date=same_date, end_date=same_date)
        assert filter_obj.start_date == same_date
        assert filter_obj.end_date == same_date
    
    def test_optional_dates(self):
        """Test optional date parameters"""
        filter_obj = DateRangeFilter()
        assert filter_obj.start_date is None
        assert filter_obj.end_date is None

class TestAnalyticsRequest:
    """Test AnalyticsRequest model validation"""
    
    def test_valid_analytics_request(self):
        """Test valid analytics request"""
        request = AnalyticsRequest(
            patient_id="PT001",
            timeframe_days=180,
            include_trends=False,
            comparison_type="baseline"
        )
        assert request.patient_id == "PT001"
        assert request.timeframe_days == 180
        assert request.include_trends is False
        assert request.comparison_type == "baseline"
    
    def test_default_values(self):
        """Test default values for analytics request"""
        request = AnalyticsRequest(patient_id="PT001")
        assert request.timeframe_days == 365
        assert request.include_trends is True
        assert request.comparison_type == "population"
    
    def test_timeframe_minimum_validation(self):
        """Test timeframe minimum validation"""
        with pytest.raises(ValidationError):
            AnalyticsRequest(patient_id="PT001", timeframe_days=29)
    
    def test_timeframe_maximum_validation(self):
        """Test timeframe maximum validation"""
        with pytest.raises(ValidationError):
            AnalyticsRequest(patient_id="PT001", timeframe_days=1826)
    
    def test_comparison_type_validation(self):
        """Test comparison type validation"""
        with pytest.raises(ValidationError):
            AnalyticsRequest(patient_id="PT001", comparison_type="invalid")

class TestSubstanceAnalysisRequest:
    """Test SubstanceAnalysisRequest model validation"""
    
    def test_valid_substance_analysis(self):
        """Test valid substance analysis request"""
        request = SubstanceAnalysisRequest(
            patient_id="PT001",
            substance_types=["alcohol", "cannabis"],
            active_only=False,
            include_patterns=True
        )
        assert request.patient_id == "PT001"
        assert request.substance_types == ["alcohol", "cannabis"]
        assert request.active_only is False
        assert request.include_patterns is True
    
    def test_optional_patient_id(self):
        """Test optional patient ID for population analysis"""
        request = SubstanceAnalysisRequest()
        assert request.patient_id is None
        assert request.active_only is True
        assert request.include_patterns is True
    
    def test_patient_id_uppercase_conversion(self):
        """Test patient ID is converted to uppercase"""
        request = SubstanceAnalysisRequest(patient_id="pt001")
        assert request.patient_id == "PT001"

class TestHealthCheckRequest:
    """Test HealthCheckRequest model validation"""
    
    def test_valid_health_check_request(self):
        """Test valid health check request"""
        request = HealthCheckRequest(
            include_dependencies=False,
            include_performance_metrics=True,
            timeout_seconds=60
        )
        assert request.include_dependencies is False
        assert request.include_performance_metrics is True
        assert request.timeout_seconds == 60
    
    def test_default_values(self):
        """Test default values for health check"""
        request = HealthCheckRequest()
        assert request.include_dependencies is True
        assert request.include_performance_metrics is False
        assert request.timeout_seconds == 30
    
    def test_timeout_validation(self):
        """Test timeout bounds validation"""
        # Too short
        with pytest.raises(ValidationError):
            HealthCheckRequest(timeout_seconds=4)
        
        # Too long
        with pytest.raises(ValidationError):
            HealthCheckRequest(timeout_seconds=121)
        
        # Valid bounds
        HealthCheckRequest(timeout_seconds=5)  # Should not raise
        HealthCheckRequest(timeout_seconds=120)  # Should not raise