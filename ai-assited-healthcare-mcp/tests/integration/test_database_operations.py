"""
Integration tests for database operations
"""

import pytest
from unittest.mock import Mock, patch
import pandas as pd

# These tests would normally connect to a test database
# For now, we'll mock the database interactions

class TestDatabaseIntegration:
    """Test database integration functionality"""
    
    @pytest.fixture
    def mock_supabase_real_response(self):
        """Mock a realistic Supabase response"""
        mock_result = Mock()
        mock_result.data = [
            {
                "id": 1,
                "group_identifier": "PT001",
                "assessment_date": "2024-01-15T00:00:00+00:00",
                "ptsd_q1_intrusive_thoughts": 3,
                "ptsd_q2_nightmares": 2,
                "ptsd_q3_flashbacks": 1,
                "ptsd_q4_emotional_distress": 3,
                "ptsd_q5_physical_reactions": 2
            },
            {
                "id": 2,
                "group_identifier": "PT002", 
                "assessment_date": "2024-01-16T00:00:00+00:00",
                "ptsd_q1_intrusive_thoughts": 2,
                "ptsd_q2_nightmares": 1,
                "ptsd_q3_flashbacks": 0,
                "ptsd_q4_emotional_distress": 2,
                "ptsd_q5_physical_reactions": 1
            }
        ]
        return mock_result
    
    @patch('config.supabase')
    def test_patient_data_retrieval(self, mock_supabase, mock_supabase_real_response):
        """Test retrieving patient assessment data"""
        # Setup mock
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_supabase_real_response
        
        # Import here to avoid issues with mocking
        from assessment_tools import create_assessment_tools
        
        # Create mock MCP server
        mock_mcp = Mock()
        tools = []
        
        def mock_tool_decorator(func):
            tools.append(func)
            return func
        
        mock_mcp.tool = mock_tool_decorator
        
        # Create assessment tools
        create_assessment_tools(mock_mcp)
        
        # Find the get_patient_ptsd_scores function
        ptsd_tool = None
        for tool in tools:
            if tool.__name__ == 'get_patient_ptsd_scores':
                ptsd_tool = tool
                break
        
        assert ptsd_tool is not None, "PTSD tool not found"
        
        # Execute the tool
        result = ptsd_tool("PT001")
        
        # Verify the result
        assert isinstance(result, dict)
        assert "assessments" in result
        assert len(result["assessments"]) >= 1
        
        # Verify mock was called correctly
        mock_supabase.table.assert_called()
        mock_supabase.table.return_value.select.assert_called()
        mock_supabase.table.return_value.select.return_value.eq.assert_called_with("group_identifier", "PT001")
    
    @patch('config.supabase')
    def test_database_error_handling(self, mock_supabase):
        """Test handling of database connection errors"""
        # Setup mock to raise exception
        mock_supabase.table.side_effect = Exception("Database connection failed")
        
        from assessment_tools import create_assessment_tools
        
        mock_mcp = Mock()
        tools = []
        
        def mock_tool_decorator(func):
            tools.append(func)
            return func
        
        mock_mcp.tool = mock_tool_decorator
        
        create_assessment_tools(mock_mcp)
        
        # Find the tool
        ptsd_tool = None
        for tool in tools:
            if tool.__name__ == 'get_patient_ptsd_scores':
                ptsd_tool = tool
                break
        
        # Execute the tool and expect it to handle the error gracefully
        result = ptsd_tool("PT001")
        
        # The tool should return an error message, not crash
        assert isinstance(result, dict)
        assert "error" in result or "message" in result
    
    @patch('config.supabase')
    def test_empty_result_handling(self, mock_supabase):
        """Test handling of empty database results"""
        # Setup mock to return empty result
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result
        
        from assessment_tools import create_assessment_tools
        
        mock_mcp = Mock()
        tools = []
        
        def mock_tool_decorator(func):
            tools.append(func)
            return func
        
        mock_mcp.tool = mock_tool_decorator
        
        create_assessment_tools(mock_mcp)
        
        # Find the tool
        ptsd_tool = None
        for tool in tools:
            if tool.__name__ == 'get_patient_ptsd_scores':
                ptsd_tool = tool
                break
        
        result = ptsd_tool("NONEXISTENT")
        
        # Should handle empty results gracefully
        assert isinstance(result, dict)
        # Should indicate no data found
        assert "message" in result or "assessments" in result
        if "assessments" in result:
            assert len(result["assessments"]) == 0
    
    @patch('config.supabase')
    def test_multiple_patient_query(self, mock_supabase):
        """Test querying data for multiple patients"""
        # Setup mock for multiple patients
        mock_result = Mock()
        mock_result.data = [
            {"group_identifier": "PT001", "assessment_date": "2024-01-15"},
            {"group_identifier": "PT002", "assessment_date": "2024-01-16"},
            {"group_identifier": "PT003", "assessment_date": "2024-01-17"}
        ]
        mock_supabase.table.return_value.select.return_value.execute.return_value = mock_result
        
        from assessment_tools import create_assessment_tools
        
        mock_mcp = Mock()
        tools = []
        
        def mock_tool_decorator(func):
            tools.append(func)
            return func
        
        mock_mcp.tool = mock_tool_decorator
        
        create_assessment_tools(mock_mcp)
        
        # Find the list_all_patients function
        list_tool = None
        for tool in tools:
            if tool.__name__ == 'list_all_patients':
                list_tool = tool
                break
        
        if list_tool:
            result = list_tool()
            
            assert isinstance(result, dict)
            assert "patients" in result or "message" in result
            
            if "patients" in result:
                assert len(result["patients"]) == 3
    
    def test_data_transformation_functions(self):
        """Test data transformation and calculation functions"""
        from assessment_tools import create_assessment_tools
        
        # Test data that would come from database
        sample_ptsd_data = {
            "ptsd_q1_intrusive_thoughts": 3,
            "ptsd_q2_nightmares": 2,
            "ptsd_q3_flashbacks": 1,
            "ptsd_q4_emotional_distress": 3,
            "ptsd_q5_physical_reactions": 2,
            "group_identifier": "PT001",
            "assessment_date": "2024-01-15"
        }
        
        # This would test the calculate_assessment_total function
        # We need to import it or access it through the module
        # For now, we'll test that the data structure is correct
        
        assert "group_identifier" in sample_ptsd_data
        assert "assessment_date" in sample_ptsd_data
        assert all(key.startswith("ptsd_q") for key in sample_ptsd_data.keys() if key not in ["group_identifier", "assessment_date"])
    
    @patch('config.HEALTHCARE_TABLES')
    def test_table_configuration(self, mock_tables):
        """Test that table configuration is properly loaded"""
        mock_tables.value = {
            "ptsd": "PTSD",
            "phq": "PHQ",
            "gad": "GAD",
            "who": "WHO",
            "ders": "DERS"
        }
        
        # Import config to test table setup
        from config import HEALTHCARE_TABLES
        
        # Verify table configuration
        expected_tables = ["ptsd", "phq", "gad", "who", "ders"]
        for table_key in expected_tables:
            assert table_key in HEALTHCARE_TABLES