"""
Structured logging configuration for Healthcare MCP Server
"""

import sys
import logging
import structlog
from typing import Any, Dict
import os
from datetime import datetime


def configure_logging(log_level: str = "INFO", json_logs: bool = True) -> None:
    """
    Configure structured logging for the application
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to output logs in JSON format
    """
    
    # Set log level from environment or parameter
    level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )
    
    # Configure structlog processors
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,  
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    
    if json_logs:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.extend([
            structlog.dev.ConsoleRenderer(colors=True),
        ])
        
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    """
    Get a configured logger instance
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return structlog.get_logger(name or "healthcare_mcp")


class RequestLogger:
    """Context manager for request-specific logging"""
    
    def __init__(self, tool_name: str, parameters: Dict[str, Any] = None):
        self.tool_name = tool_name
        self.parameters = parameters or {}
        self.logger = get_logger("mcp_request")
        self.start_time = None
        
    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.info(
            "MCP tool request started",
            tool_name=self.tool_name,
            parameters=self._sanitize_parameters(self.parameters),
            request_id=id(self)
        )
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.utcnow() - self.start_time).total_seconds()
        
        if exc_type is None:
            self.logger.info(
                "MCP tool request completed",
                tool_name=self.tool_name,
                duration_seconds=duration,
                request_id=id(self)
            )
        else:
            self.logger.error(
                "MCP tool request failed",
                tool_name=self.tool_name,
                duration_seconds=duration,
                error_type=exc_type.__name__,
                error_message=str(exc_val),
                request_id=id(self)
            )
    
    def log_info(self, message: str, **kwargs):
        """Log info message with request context"""
        self.logger.info(
            message,
            tool_name=self.tool_name,
            request_id=id(self),
            **kwargs
        )
    
    def log_warning(self, message: str, **kwargs):
        """Log warning message with request context"""
        self.logger.warning(
            message,
            tool_name=self.tool_name,
            request_id=id(self),
            **kwargs
        )
    
    def log_error(self, message: str, **kwargs):
        """Log error message with request context"""
        self.logger.error(
            message,
            tool_name=self.tool_name,
            request_id=id(self),
            **kwargs
        )
    
    def _sanitize_parameters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from logged parameters"""
        sanitized = params.copy()
        
        # List of sensitive parameter names to redact
        sensitive_keys = ['password', 'token', 'key', 'secret', 'auth']
        
        for key in list(sanitized.keys()):
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                sanitized[key] = "[REDACTED]"
                
        return sanitized


# Performance monitoring decorator
def log_performance(func):
    """Decorator to log function performance metrics"""
    def wrapper(*args, **kwargs):
        logger = get_logger("performance")
        start_time = datetime.utcnow()
        
        try:
            result = func(*args, **kwargs)
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                "Function executed successfully",
                function_name=func.__name__,
                duration_seconds=duration,
                args_count=len(args),
                kwargs_count=len(kwargs)
            )
            
            return result
            
        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            logger.error(
                "Function execution failed",
                function_name=func.__name__,
                duration_seconds=duration,
                error_type=type(e).__name__,
                error_message=str(e)
            )
            
            raise
            
    return wrapper


# Initialize logging when module is imported
log_level = os.getenv("LOG_LEVEL", "INFO")
json_logs = os.getenv("JSON_LOGS", "true").lower() == "true"
configure_logging(log_level, json_logs)