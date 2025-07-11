"""
Configuration module for Healthcare MCP Server
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional

load_dotenv()


class SupabaseConfig:
    """Supabase database configuration"""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url or not self.key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
            )

    def create_client(self, use_service_role: bool = False) -> Client:
        """Create authenticated Supabase client"""
        key = (
            self.service_role_key
            if use_service_role and self.service_role_key
            else self.key
        )
        return create_client(self.url, key)  # type: ignore


class MCPConfig:
    """MCP Server configuration"""

    def __init__(self):
        self.name = os.getenv("MCP_SERVER_NAME", "healthcare-dashboard")
        self.version = os.getenv("MCP_SERVER_VERSION", "1.0.0")


# Global configuration instances
supabase_config = SupabaseConfig()
mcp_config = MCPConfig()

# Create default Supabase client
supabase: Client = supabase_config.create_client()

# Healthcare table names in your Supabase database (updated to match actual table names)
HEALTHCARE_TABLES = {
    "ptsd": "PTSD",
    "phq": "PHQ",
    "gad": "GAD",
    "who": "WHO",
    "ders": "DERS",
    "ders2": "DERS_2",
    "substance_history": "Patient Substance History",
    "extracted_assessments": "PHP",
    "patient_intake": "Patient Intake History",
    "bps": "BPS",
    "ahcm": "AHCM",
    "stat_tests": "STATS TEST",
}
