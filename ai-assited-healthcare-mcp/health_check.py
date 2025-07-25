"""
Health check tools for Healthcare MCP Server
"""

import time
import psutil
from datetime import datetime, timedelta
from typing import Dict, Any
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES, mcp_config
from models import HealthCheckRequest, HealthCheckResponse
from logging_config import get_logger, RequestLogger

# Store server startup time
SERVER_START_TIME = datetime.utcnow()

def create_health_check_tools(mcp: FastMCP):
    """Create health check tools for monitoring"""
    
    logger = get_logger("health_check")
    
    @mcp.tool
    def health_check(
        include_dependencies: bool = True,
        include_performance_metrics: bool = False, 
        timeout_seconds: int = 30
    ) -> Dict[str, Any]:
        """
        Comprehensive health check for the MCP server
        
        Args:
            include_dependencies: Check external dependencies (Supabase)
            include_performance_metrics: Include system performance metrics
            timeout_seconds: Timeout for dependency checks
            
        Returns:
            Health check results with status and detailed checks
        """
        with RequestLogger("health_check", {
            "include_dependencies": include_dependencies,
            "include_performance_metrics": include_performance_metrics,
            "timeout_seconds": timeout_seconds
        }) as req_logger:
            
            health_status = {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "version": mcp_config.version,
                "uptime_seconds": (datetime.utcnow() - SERVER_START_TIME).total_seconds(),
                "checks": {}
            }
            
            # Basic server health
            health_status["checks"]["server"] = {
                "status": "healthy",
                "message": "Server is running"
            }
            
            # Memory usage check
            try:
                memory_info = psutil.virtual_memory()
                memory_usage_percent = memory_info.percent
                
                if memory_usage_percent > 90:
                    status = "critical"
                elif memory_usage_percent > 75:
                    status = "warning"
                else:
                    status = "healthy"
                    
                health_status["checks"]["memory"] = {
                    "status": status,
                    "usage_percent": memory_usage_percent,
                    "available_gb": round(memory_info.available / (1024**3), 2)
                }
                
                if status != "healthy":
                    health_status["status"] = "degraded"
                    
            except Exception as e:
                health_status["checks"]["memory"] = {
                    "status": "error",
                    "message": f"Failed to check memory: {str(e)}"
                }
                health_status["status"] = "degraded"
            
            # Database connectivity check
            if include_dependencies:
                req_logger.log_info("Checking database connectivity")
                
                try:
                    start_time = time.time()
                    
                    # Test basic connectivity
                    result = supabase.table(HEALTHCARE_TABLES["ptsd"]).select("count").limit(1).execute()
                    
                    db_response_time = time.time() - start_time
                    
                    if db_response_time > 5.0:
                        db_status = "warning"
                        message = f"Database responding slowly ({db_response_time:.2f}s)"
                    else:
                        db_status = "healthy" 
                        message = f"Database responsive ({db_response_time:.2f}s)"
                    
                    health_status["checks"]["database"] = {
                        "status": db_status,
                        "response_time_seconds": round(db_response_time, 3),
                        "message": message
                    }
                    
                    if db_status == "warning":
                        health_status["status"] = "degraded"
                        
                    req_logger.log_info("Database connectivity check completed", 
                                      response_time=db_response_time, status=db_status)
                    
                except Exception as e:
                    health_status["checks"]["database"] = {
                        "status": "error",
                        "message": f"Database connectivity failed: {str(e)}"
                    }
                    health_status["status"] = "unhealthy"
                    req_logger.log_error("Database connectivity check failed", error=str(e))
                
                # Test table accessibility
                try:
                    table_checks = {}
                    for table_key, table_name in HEALTHCARE_TABLES.items():
                        try:
                            start_time = time.time()
                            result = supabase.table(table_name).select("*").limit(1).execute()
                            response_time = time.time() - start_time
                            
                            table_checks[table_key] = {
                                "status": "accessible",
                                "response_time_seconds": round(response_time, 3),
                                "record_count": len(result.data) if result.data else 0
                            }
                        except Exception as e:
                            table_checks[table_key] = {
                                "status": "error", 
                                "message": str(e)
                            }
                            health_status["status"] = "degraded"
                    
                    health_status["checks"]["tables"] = table_checks
                    
                except Exception as e:
                    health_status["checks"]["tables"] = {
                        "status": "error",
                        "message": f"Table accessibility check failed: {str(e)}"
                    }
                    health_status["status"] = "degraded"
            
            # Performance metrics
            if include_performance_metrics:
                try:
                    cpu_percent = psutil.cpu_percent(interval=1)
                    disk_usage = psutil.disk_usage('/')
                    
                    health_status["performance_metrics"] = {
                        "cpu_usage_percent": cpu_percent,
                        "disk_usage_percent": (disk_usage.used / disk_usage.total) * 100,
                        "disk_free_gb": round(disk_usage.free / (1024**3), 2),
                        "process_count": len(psutil.pids())
                    }
                    
                except Exception as e:
                    health_status["performance_metrics"] = {
                        "error": f"Failed to collect metrics: {str(e)}"
                    }
            
            # Log final health status
            req_logger.log_info("Health check completed", 
                              final_status=health_status["status"],
                              checks_performed=len(health_status["checks"]))
            
            return health_status
    
    @mcp.tool
    def health_check_simple() -> Dict[str, Any]:
        """
        Simple health check that returns basic server status
        
        Returns:
            Basic health status
        """
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": mcp_config.version,
            "uptime_seconds": (datetime.utcnow() - SERVER_START_TIME).total_seconds()
        }
    
    @mcp.tool
    def get_server_info() -> Dict[str, Any]:
        """
        Get detailed server information
        
        Returns:
            Server configuration and runtime information
        """
        with RequestLogger("get_server_info") as req_logger:
            
            try:
                server_info = {
                    "name": mcp_config.name,
                    "version": mcp_config.version,
                    "start_time": SERVER_START_TIME.isoformat(),
                    "uptime_seconds": (datetime.utcnow() - SERVER_START_TIME).total_seconds(),
                    "python_version": psutil.Process().exe(),
                    "process_id": psutil.Process().pid,
                    "memory_usage_mb": round(psutil.Process().memory_info().rss / (1024*1024), 2),
                    "available_tables": list(HEALTHCARE_TABLES.keys()),
                    "table_count": len(HEALTHCARE_TABLES)
                }
                
                req_logger.log_info("Server info retrieved successfully")
                return server_info
                
            except Exception as e:
                req_logger.log_error("Failed to retrieve server info", error=str(e))
                return {
                    "error": f"Failed to retrieve server info: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return mcp