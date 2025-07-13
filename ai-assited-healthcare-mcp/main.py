"""
Main Healthcare MCP Server
A comprehensive FastMCP server for healthcare dashboard analytics with Supabase integration
"""

from fastmcp import FastMCP
from config import mcp_config
from assessment_tools import create_assessment_tools
from substance_tools import create_substance_tools
from analytics_tools import create_analytics_tools
from resources import create_patient_resources
from motivation_tools import create_motivation_tools


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
    
    # Add health check endpoint
    @mcp.app.get("/health")
    def health_check():
        return {"status": "healthy", "server": mcp_config.name, "version": mcp_config.version}
    
    mcp = create_assessment_tools(mcp)
    mcp = create_substance_tools(mcp)
    mcp = create_analytics_tools(mcp)
    mcp = create_patient_resources(mcp)
    mcp = create_motivation_tools(mcp)

    return mcp


def main():
    """Main entry point for the healthcare MCP server"""
    import os

    print("Starting Healthcare Dashboard MCP Server...")

    try:
        # Create server instance
        server = create_heatlhcare_mcp()

        print(
            f"Server '{mcp_config.name}' v{mcp_config.version} initialized successfully!"
        )
        print("\nAvailable tools:")

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
        ]

        for i, tool_name in enumerate(tool_names, 1):
            print(f"  {i:2d}. {tool_name}")

        print("\nAvailable resources:")
        resource_patterns = [
            "patient://{patient_id}/complete-profile",
            "assessment://{assessment_type}/latest-scores",
            "trends://{patient_id}/{timeframe}",
            "population://{assessment_type}/statistics",
            "high-risk://patients/current",
        ]

        for i, resource in enumerate(resource_patterns, 1):
            print(f"  {i}. {resource}")

        # Get port from environment variable or use default
        port = int(os.getenv("MCP_PORT", 8000))
        host = os.getenv("MCP_HOST", "0.0.0.0")

        print(f"\nStarting HTTP server on {host}:{port}")
        print("To use this server with your Next.js app:")
        print(f"1. Configure your .env file with Supabase credentials")
        print(f"2. Install dependencies: uv sync")
        print(f"3. Run the server: python main.py")
        print(f"4. Connect from Next.js using: http://{host}:{port}")

        # Start the HTTP server
        server.run(transport="http", host=host, port=port)

    except Exception as e:
        print(f"Failed to start server: {str(e)}")
        return None


if __name__ == "__main__":
    main()
