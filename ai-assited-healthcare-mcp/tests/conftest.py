"""
Pytest configuration and fixtures for Healthcare MCP Server tests
"""

import pytest
import os
import sys
from unittest.mock import Mock, MagicMock
from typing import Dict, Any, List

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing"""
    mock_client = Mock()
    
    # Mock table method
    mock_table = Mock()
    mock_client.table.return_value = mock_table
    
    # Mock query methods
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.range.return_value = mock_table
    mock_table.order.return_value = mock_table
    
    # Mock execute result
    mock_result = Mock()
    mock_result.data = []
    mock_table.execute.return_value = mock_result
    
    return mock_client

@pytest.fixture
def sample_ptsd_data():
    """Sample PTSD assessment data for testing"""
    return [
        {
            "id": 1,
            "group_identifier": "PT001",
            "assessment_date": "2024-01-15",
            "ptsd_q1_intrusive_thoughts": 3,
            "ptsd_q2_nightmares": 2,
            "ptsd_q3_flashbacks": 1,
            "ptsd_q4_emotional_distress": 3,
            "ptsd_q5_physical_reactions": 2,
            "ptsd_q6_avoid_thoughts": 2,
            "ptsd_q7_avoid_reminders": 3,
            "ptsd_q8_memory_problems": 1,
            "ptsd_q9_negative_beliefs": 2,
            "ptsd_q10_blame": 1,
            "ptsd_q11_negative_emotions": 2,
            "ptsd_q12_loss_interest": 3,
            "ptsd_q13_detachment": 2,
            "ptsd_q14_emotional_numbness": 1,
            "ptsd_q15_irritability": 2,
            "ptsd_q16_reckless_behavior": 1,
            "ptsd_q17_hypervigilance": 2,
            "ptsd_q18_startle_response": 3,
            "ptsd_q19_concentration": 2,
            "ptsd_q20_sleep_problems": 3
        }
    ]

@pytest.fixture
def sample_phq_data():
    """Sample PHQ-9 assessment data for testing"""
    return [
        {
            "id": 1,
            "group_identifier": "PT001",
            "assessment_date": "2024-01-15",
            "col_1_little_interest": 2,
            "col_2_feeling_down": 2,
            "col_3_sleep_problems": 3,
            "col_4_energy_fatigue": 2,
            "col_5_appetite": 1,
            "col_6_feeling_bad": 2,
            "col_7_concentration": 2,
            "col_8_slow_fidgety": 1,
            "col_9_death_thoughts": 0,
            "col_10_difficulty": 2
        }
    ]

@pytest.fixture
def sample_substance_data():
    """Sample substance use data for testing"""
    return [
        {
            "id": 1,
            "group_identifier": "PT001",
            "substance_name": "Alcohol",
            "use_flag": 1,
            "pattern_of_use": "Weekly",
            "last_use_date": "2024-01-10",
            "frequency": "2-3 times per week",
            "quantity": "3-4 drinks"
        },
        {
            "id": 2,
            "group_identifier": "PT001", 
            "substance_name": "Cannabis",
            "use_flag": 0,
            "pattern_of_use": "Former use",
            "last_use_date": "2023-06-15",
            "frequency": "Daily",
            "quantity": "1-2 grams"
        }
    ]

@pytest.fixture
def mock_patient_ids():
    """Sample patient IDs for testing"""
    return ["PT001", "PT002", "PT003", "PT004", "PT005"]

@pytest.fixture
def mock_mcp_server():
    """Mock FastMCP server for testing"""
    mock_server = Mock()
    mock_server.tool = Mock()
    
    # Mock tool decorator - return the function unchanged
    def mock_tool_decorator(func):
        return func
    
    mock_server.tool = mock_tool_decorator
    return mock_server

@pytest.fixture 
def mock_logger():
    """Mock logger for testing"""
    mock_log = Mock()
    mock_log.info = Mock()
    mock_log.warning = Mock()
    mock_log.error = Mock()
    mock_log.debug = Mock()
    return mock_log

@pytest.fixture
def valid_patient_request():
    """Valid patient request data for testing"""
    return {
        "patient_id": "PT001",
        "assessment_type": "ptsd",
        "include_metadata": True
    }

@pytest.fixture
def invalid_patient_request():
    """Invalid patient request data for testing validation"""
    return {
        "patient_id": "",  # Invalid: empty
        "assessment_type": "invalid_type",  # Invalid: not in enum
        "include_metadata": "not_boolean"  # Invalid: not boolean
    }

@pytest.fixture
def mock_health_check_response():
    """Mock health check response"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-15T10:30:00Z",
        "version": "1.0.0",
        "uptime_seconds": 3600.0,
        "checks": {
            "server": {"status": "healthy", "message": "Server is running"},
            "database": {"status": "healthy", "response_time_seconds": 0.15},
            "memory": {"status": "healthy", "usage_percent": 45.2}
        }
    }

@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Setup test environment variables"""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "test-key")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
    monkeypatch.setenv("MCP_SERVER_NAME", "test-server")
    monkeypatch.setenv("MCP_SERVER_VERSION", "1.0.0-test")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")

# Performance testing fixtures
@pytest.fixture
def performance_test_data():
    """Generate large dataset for performance testing"""
    patients = []
    for i in range(100):
        patients.append({
            "id": i + 1,
            "group_identifier": f"PT{i+1:03d}",
            "assessment_date": "2024-01-15",
            "score": i % 27  # PTSD scores range 0-80, PHQ 0-27
        })
    return patients

@pytest.fixture
def timeout_settings():
    """Timeout settings for various test scenarios"""
    return {
        "fast": 1.0,
        "normal": 5.0,
        "slow": 30.0
    }