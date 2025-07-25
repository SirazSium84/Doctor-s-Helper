"""
Main Healthcare MCP Server
A comprehensive FastMCP server for healthcare dashboard analytics with Supabase integration
"""

from fastmcp import FastMCP
from config import mcp_config
from assessment_tools import create_assessment_tools
from enhanced_assessment_tools import create_enhanced_assessment_tools
from substance_tools import create_substance_tools
from analytics_tools import create_analytics_tools
from resources import create_patient_resources
from motivation_tools import create_motivation_tools
from health_check import create_health_check_tools
from logging_config import get_logger


def create_heatlhcare_mcp():
    mcp = FastMCP(
        name=mcp_config.name,
        instructions="""
                        Healthcare Dashboard MCP Server
                        Provides comprehensive tools and resources for analyzing healthcare assessment data
                        including PTSD, PHQ-9, GAD-7, WHO-5, DERS assessments and substance use history.
                        
                        Features:
                        - Assessment data retrieval and analysis
                        - Substance use pattern analysis
                        - Patient risk assessment and trend analysis
                        - Population-level statistics
                        - Dynamic patient resources
                        """,
        version=mcp_config.version,
        stateless_http=True,
    )
    mcp = create_assessment_tools(mcp)
    mcp = create_enhanced_assessment_tools(mcp)
    mcp = create_substance_tools(mcp)
    mcp = create_analytics_tools(mcp)
    mcp = create_patient_resources(mcp)
    mcp = create_motivation_tools(mcp)
    mcp = create_health_check_tools(mcp)

    return mcp


def main():
    """Main entry point for the healthcare MCP server"""
    import os
    
    logger = get_logger("main")
    logger.info("Starting Healthcare Dashboard MCP Server")

    try:
        # Create server instance
        server = create_heatlhcare_mcp()

        logger.info(
            "Server initialized successfully",
            server_name=mcp_config.name,
            version=mcp_config.version
        )

        # List available tools
        tool_names = [
            # Assessment tools
            "get_patient_ptsd_scores",
            "get_patient_phq_scores", 
            "get_patient_gad_scores",
            "get_patient_who_scores",
            "get_patient_ders_scores",
            "get_all_patient_assessments",
            "list_all_patients",
            "get_assessment_summary_stats",
            # Enhanced assessment tools with pagination/caching
            "list_patients_paginated",
            "get_assessment_summary_stats_cached",
            "search_patients_by_score_range",
            "get_cache_status",
            # Substance use tools
            "get_patient_substance_history",
            "analyze_substance_patterns_across_patients",
            "get_high_risk_substance_users",
            "compare_substance_use_by_assessment_scores",
            "get_substance_use_timeline",
            # Analytics tools
            "analyze_patient_progress",
            "calculate_composite_risk_score",
            "compare_patient_to_population", 
            "identify_patients_needing_attention",
            # Motivation tools
            "get_motivation_themes",
            # Health check tools
            "health_check",
            "health_check_simple",
            "get_server_info",
        ]

        logger.info("Available tools registered", tool_count=len(tool_names), tools=tool_names)

        resource_patterns = [
            "patient://{patient_id}/complete-profile",
            "assessment://{assessment_type}/latest-scores",
            "trends://{patient_id}/{timeframe}",
            "population://{assessment_type}/statistics", 
            "high-risk://patients/current",
        ]

        logger.info("Available resources configured", resource_count=len(resource_patterns))

        # Get port from environment variable or use default
        port = int(os.getenv("MCP_PORT", 8000))
        host = os.getenv("MCP_HOST", "0.0.0.0")

        logger.info(
            "Starting HTTP server",
            host=host,
            port=port,
            server_url=f"http://{host}:{port}"
        )

        # Start the HTTP server
        server.run(transport="http", host=host, port=port)

    except Exception as e:
        logger.error(
            "Failed to start server",
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True
        )
        return None


if __name__ == "__main__":
    main()
