"""
Unit tests for health check functionality
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import psutil

from health_check import create_health_check_tools

class TestHealthCheckTools:
    """Test health check tool creation and functionality"""
    
    @pytest.fixture
    def mock_mcp(self):
        """Create mock MCP server"""
        mock_server = Mock()
        tools = []
        
        def mock_tool_decorator(func):
            tools.append(func)
            return func
        
        mock_server.tool = mock_tool_decorator
        mock_server.tools = tools
        return mock_server
    
    def test_create_health_check_tools(self, mock_mcp):
        """Test health check tools are created successfully"""
        result = create_health_check_tools(mock_mcp)
        
        assert result == mock_mcp
        assert len(mock_mcp.tools) == 3  # health_check, health_check_simple, get_server_info
    
    @patch('health_check.supabase')
    @patch('health_check.psutil.virtual_memory')
    def test_health_check_healthy_status(self, mock_memory, mock_supabase, mock_mcp):
        """Test health check returns healthy status when all checks pass"""
        # Setup mocks
        mock_memory.return_value.percent = 50.0
        mock_memory.return_value.available = 8 * (1024**3)  # 8GB
        
        mock_result = Mock()
        mock_result.data = [{"count": 100}]
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result
        
        # Create health check tools
        create_health_check_tools(mock_mcp)
        health_check_func = mock_mcp.tools[0]  # First tool should be health_check
        
        # Execute health check
        result = health_check_func()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert "version" in result
        assert "uptime_seconds" in result
        assert "checks" in result
        assert result["checks"]["server"]["status"] == "healthy"
        assert result["checks"]["memory"]["status"] == "healthy"
    
    @patch('health_check.supabase')
    @patch('health_check.psutil.virtual_memory')
    def test_health_check_degraded_status_high_memory(self, mock_memory, mock_supabase, mock_mcp):
        """Test health check returns degraded status with high memory usage"""
        # Setup high memory usage
        mock_memory.return_value.percent = 85.0  # Above 75% threshold
        mock_memory.return_value.available = 2 * (1024**3)  # 2GB
        
        mock_result = Mock()
        mock_result.data = [{"count": 100}]
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result
        
        create_health_check_tools(mock_mcp)
        health_check_func = mock_mcp.tools[0]
        
        result = health_check_func()
        
        assert result["status"] == "degraded"
        assert result["checks"]["memory"]["status"] == "warning"
        assert result["checks"]["memory"]["usage_percent"] == 85.0
    
    @patch('health_check.supabase')
    @patch('health_check.psutil.virtual_memory')
    def test_health_check_database_failure(self, mock_memory, mock_supabase, mock_mcp):
        """Test health check handles database connection failure"""
        # Setup memory mock
        mock_memory.return_value.percent = 50.0
        mock_memory.return_value.available = 8 * (1024**3)
        
        # Setup database failure
        mock_supabase.table.side_effect = Exception("Database connection failed")
        
        create_health_check_tools(mock_mcp)
        health_check_func = mock_mcp.tools[0]
        
        result = health_check_func(include_dependencies=True)
        
        assert result["status"] == "unhealthy"
        assert result["checks"]["database"]["status"] == "error"
        assert "Database connectivity failed" in result["checks"]["database"]["message"]
    
    @patch('health_check.supabase')
    @patch('health_check.psutil.virtual_memory')
    @patch('health_check.time.time')
    def test_health_check_slow_database_response(self, mock_time, mock_memory, mock_supabase, mock_mcp):
        """Test health check detects slow database response"""
        # Setup time mocks to simulate slow response
        mock_time.side_effect = [0, 6.0]  # 6 second response time
        
        # Setup memory mock
        mock_memory.return_value.percent = 50.0
        mock_memory.return_value.available = 8 * (1024**3)
        
        # Setup database mock
        mock_result = Mock()
        mock_result.data = [{"count": 100}]
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result
        
        create_health_check_tools(mock_mcp)
        health_check_func = mock_mcp.tools[0]
        
        result = health_check_func(include_dependencies=True)
        
        assert result["status"] == "degraded"
        assert result["checks"]["database"]["status"] == "warning"
        assert result["checks"]["database"]["response_time_seconds"] == 6.0
        assert "responding slowly" in result["checks"]["database"]["message"]
    
    @patch('health_check.HEALTHCARE_TABLES', {'ptsd': 'PTSD', 'phq': 'PHQ'})
    @patch('health_check.supabase')
    def test_health_check_table_accessibility(self, mock_supabase, mock_mcp):
        """Test health check verifies table accessibility"""
        # Setup main database check
        mock_result = Mock()
        mock_result.data = [{"count": 100}]
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result
        
        # Setup table accessibility checks
        def table_side_effect(table_name):
            mock_table = Mock()
            mock_table.select.return_value = mock_table
            mock_table.limit.return_value = mock_table
            
            if table_name == 'PTSD':
                mock_table.execute.return_value.data = [{"id": 1}]
            else:  # PHQ table
                mock_table.execute.side_effect = Exception("Table not accessible")
            
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        create_health_check_tools(mock_mcp)
        health_check_func = mock_mcp.tools[0]
        
        result = health_check_func(include_dependencies=True)
        
        assert result["status"] == "degraded"  # One table failed
        assert "tables" in result["checks"]
        assert result["checks"]["tables"]["ptsd"]["status"] == "accessible"
        assert result["checks"]["tables"]["phq"]["status"] == "error"
    
    def test_health_check_simple(self, mock_mcp):
        """Test simple health check returns basic status"""
        create_health_check_tools(mock_mcp)
        health_check_simple_func = mock_mcp.tools[1]  # Second tool
        
        result = health_check_simple_func()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert "version" in result
        assert "uptime_seconds" in result
        
        # Should not have detailed checks
        assert "checks" not in result
    
    @patch('health_check.psutil.Process')
    def test_get_server_info(self, mock_process, mock_mcp):
        """Test get server info returns detailed server information"""
        # Setup process mocks
        mock_proc = Mock()
        mock_proc.exe.return_value = "/usr/bin/python3.11"
        mock_proc.pid = 12345
        mock_proc.memory_info.return_value.rss = 100 * 1024 * 1024  # 100MB
        mock_process.return_value = mock_proc
        
        create_health_check_tools(mock_mcp)
        get_server_info_func = mock_mcp.tools[2]  # Third tool
        
        result = get_server_info_func()
        
        assert "name" in result
        assert "version" in result
        assert "start_time" in result
        assert "uptime_seconds" in result
        assert "process_id" in result
        assert result["process_id"] == 12345
        assert "memory_usage_mb" in result
        assert result["memory_usage_mb"] == 100.0
        assert "available_tables" in result
        assert "table_count" in result
    
    @patch('health_check.psutil.Process')
    def test_get_server_info_error_handling(self, mock_process, mock_mcp):
        """Test get server info handles errors gracefully"""
        # Setup process to raise exception
        mock_process.side_effect = Exception("Process info not available")
        
        create_health_check_tools(mock_mcp)
        get_server_info_func = mock_mcp.tools[2]
        
        result = get_server_info_func()
        
        assert "error" in result
        assert "Failed to retrieve server info" in result["error"]
        assert "timestamp" in result
    
    @patch('health_check.supabase')
    @patch('health_check.psutil.virtual_memory')
    @patch('health_check.psutil.cpu_percent')
    @patch('health_check.psutil.disk_usage')
    @patch('health_check.psutil.pids')
    def test_health_check_with_performance_metrics(
        self, mock_pids, mock_disk, mock_cpu, mock_memory, mock_supabase, mock_mcp
    ):
        """Test health check includes performance metrics when requested"""
        # Setup mocks
        mock_memory.return_value.percent = 50.0
        mock_memory.return_value.available = 8 * (1024**3)
        mock_cpu.return_value = 25.5
        
        mock_disk_usage = Mock()
        mock_disk_usage.used = 50 * (1024**3)  # 50GB used
        mock_disk_usage.total = 100 * (1024**3)  # 100GB total
        mock_disk_usage.free = 50 * (1024**3)  # 50GB free
        mock_disk.return_value = mock_disk_usage
        
        mock_pids.return_value = list(range(150))  # 150 processes
        
        mock_result = Mock()
        mock_result.data = [{"count": 100}]
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result
        
        create_health_check_tools(mock_mcp)
        health_check_func = mock_mcp.tools[0]
        
        result = health_check_func(
            include_dependencies=True,
            include_performance_metrics=True
        )
        
        assert result["status"] == "healthy"
        assert "performance_metrics" in result
        
        metrics = result["performance_metrics"]
        assert metrics["cpu_usage_percent"] == 25.5
        assert metrics["disk_usage_percent"] == 50.0
        assert metrics["disk_free_gb"] == 50.0
        assert metrics["process_count"] == 150