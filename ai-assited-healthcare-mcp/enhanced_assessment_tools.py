"""
Enhanced Assessment tools with pagination and caching for Healthcare MCP Server
"""

from typing import Dict, Any, Optional
from datetime import datetime
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES
from models import PatientIdRequest, PaginationRequest, AssessmentRequest, PatientListRequest
from pagination_caching import paginate_supabase_query, cached, get_total_count, paginate_list
from logging_config import get_logger, RequestLogger
from pydantic import ValidationError

logger = get_logger("enhanced_assessment_tools")

def create_enhanced_assessment_tools(mcp: FastMCP):
    """Create enhanced assessment tools with pagination and caching"""
    
    @mcp.tool
    def list_patients_paginated(
        page: int = 1,
        page_size: int = 50,
        assessment_filter: Optional[str] = None,
        active_only: bool = True
    ) -> Dict[str, Any]:
        """
        List patients with pagination support
        
        Args:
            page: Page number (starts from 1)
            page_size: Number of patients per page (1-500)
            assessment_filter: Filter by assessment type (ptsd, phq, gad, who, ders)
            active_only: Only include patients with recent data
            
        Returns:
            Paginated list of patients with metadata
        """
        with RequestLogger("list_patients_paginated", {
            "page": page,
            "page_size": page_size,
            "assessment_filter": assessment_filter,
            "active_only": active_only
        }) as req_logger:
            
            try:
                # Validate pagination parameters
                pagination = PaginationRequest(page=page, page_size=page_size)
                
                # Determine which table to query
                table_name = HEALTHCARE_TABLES.get("ptsd", "PTSD")  # Default to PTSD
                if assessment_filter and assessment_filter.lower() in HEALTHCARE_TABLES:
                    table_name = HEALTHCARE_TABLES[assessment_filter.lower()]
                
                # Build filters
                filters = {}
                if active_only:
                    # Only include patients with assessments from last year
                    from datetime import datetime, timedelta
                    cutoff_date = (datetime.utcnow() - timedelta(days=365)).isoformat()
                    filters["assessment_date"] = {"gte": cutoff_date}
                
                req_logger.log_info(
                    "Querying patients",
                    table=table_name,
                    filters=filters
                )
                
                # Execute paginated query
                result = paginate_supabase_query(
                    table_name=table_name,
                    select_columns="group_identifier, assessment_date",
                    filters=filters,
                    order_by="assessment_date.desc",
                    pagination=pagination
                )
                
                # Deduplicate patients (same patient may have multiple assessments)
                unique_patients = {}
                for record in result["data"]:
                    patient_id = record["group_identifier"]
                    if patient_id not in unique_patients:
                        unique_patients[patient_id] = {
                            "patient_id": patient_id,
                            "latest_assessment": record["assessment_date"]
                        }
                    else:
                        # Keep the latest assessment date
                        if record["assessment_date"] > unique_patients[patient_id]["latest_assessment"]:
                            unique_patients[patient_id]["latest_assessment"] = record["assessment_date"]
                
                # Convert to list and apply pagination to unique patients
                unique_patient_list = list(unique_patients.values())
                paginated_result = paginate_list(unique_patient_list, pagination)
                
                req_logger.log_info(
                    "Patients retrieved successfully",
                    total_records=len(result["data"]),
                    unique_patients=len(unique_patient_list),
                    returned_patients=len(paginated_result["data"])
                )
                
                return {
                    "patients": paginated_result["data"],
                    "pagination": paginated_result["pagination"],
                    "metadata": {
                        "assessment_filter": assessment_filter,
                        "active_only": active_only,
                        "table_queried": table_name
                    }
                }
                
            except ValidationError as e:
                req_logger.log_error("Validation error", error=str(e))
                return {
                    "error": "Invalid parameters",
                    "details": str(e)
                }
            except Exception as e:
                req_logger.log_error("Failed to list patients", error=str(e))
                return {
                    "error": f"Failed to retrieve patients: {str(e)}"
                }
    
    @mcp.tool
    def get_assessment_summary_stats_cached(
        assessment_type: str,
        include_demographics: bool = False,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Get cached assessment summary statistics
        
        Args:
            assessment_type: Type of assessment (ptsd, phq, gad, who, ders)
            include_demographics: Include demographic breakdowns
            force_refresh: Force cache refresh
            
        Returns:
            Cached assessment statistics
        """
        with RequestLogger("get_assessment_summary_stats_cached", {
            "assessment_type": assessment_type,
            "include_demographics": include_demographics,
            "force_refresh": force_refresh
        }) as req_logger:
            
            try:
                # Validate assessment type
                if assessment_type.lower() not in HEALTHCARE_TABLES:
                    return {
                        "error": f"Invalid assessment type: {assessment_type}",
                        "valid_types": list(HEALTHCARE_TABLES.keys())
                    }
                
                table_name = HEALTHCARE_TABLES[assessment_type.lower()]
                
                # Clear cache if force refresh requested
                if force_refresh:
                    from pagination_caching import cache
                    cache.clear()
                    req_logger.log_info("Cache cleared due to force refresh")
                
                # Use cached function for expensive statistics
                @cached(ttl=1800)  # Cache for 30 minutes
                def _get_stats(assessment: str, demographics: bool) -> Dict[str, Any]:
                    req_logger.log_info("Computing statistics (not cached)", assessment=assessment)
                    
                    # Get all assessment data
                    result = supabase.table(table_name).select("*").execute()
                    
                    if not result.data:
                        return {
                            "message": f"No {assessment} data found",
                            "total_assessments": 0
                        }
                    
                    # Calculate basic statistics
                    import pandas as pd
                    df = pd.DataFrame(result.data)
                    
                    stats = {
                        "assessment_type": assessment,
                        "total_assessments": len(df),
                        "unique_patients": df["group_identifier"].nunique(),
                        "date_range": {
                            "earliest": df["assessment_date"].min() if "assessment_date" in df else None,
                            "latest": df["assessment_date"].max() if "assessment_date" in df else None
                        }
                    }
                    
                    # Calculate score statistics if score columns exist
                    score_columns = [col for col in df.columns if col.startswith(f"{assessment}_q") or col.startswith("col_")]
                    if score_columns:
                        score_data = df[score_columns].apply(pd.to_numeric, errors="coerce")
                        
                        # Calculate total scores for each assessment
                        df["total_score"] = score_data.sum(axis=1)
                        
                        stats["score_statistics"] = {
                            "mean_total_score": float(df["total_score"].mean()),
                            "median_total_score": float(df["total_score"].median()),
                            "std_total_score": float(df["total_score"].std()),
                            "min_total_score": float(df["total_score"].min()),
                            "max_total_score": float(df["total_score"].max()),
                            "score_distribution": df["total_score"].value_counts().head(10).to_dict()
                        }
                    
                    return stats
                
                # Get cached statistics
                result = _get_stats(assessment_type, include_demographics)
                
                req_logger.log_info(
                    "Statistics retrieved",
                    assessment_type=assessment_type,
                    total_assessments=result.get("total_assessments", 0)
                )
                
                return result
                
            except Exception as e:
                req_logger.log_error("Failed to get assessment statistics", error=str(e))
                return {
                    "error": f"Failed to retrieve statistics: {str(e)}"
                }
    
    @mcp.tool
    def search_patients_by_score_range(
        assessment_type: str,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Search patients by assessment score range with pagination
        
        Args:
            assessment_type: Type of assessment to search
            min_score: Minimum total score (inclusive)
            max_score: Maximum total score (inclusive)
            page: Page number
            page_size: Number of results per page
            
        Returns:
            Paginated list of patients matching score criteria
        """
        with RequestLogger("search_patients_by_score_range", {
            "assessment_type": assessment_type,
            "min_score": min_score,
            "max_score": max_score,
            "page": page,
            "page_size": page_size
        }) as req_logger:
            
            try:
                # Validate parameters
                pagination = PaginationRequest(page=page, page_size=page_size)
                
                if assessment_type.lower() not in HEALTHCARE_TABLES:
                    return {
                        "error": f"Invalid assessment type: {assessment_type}",
                        "valid_types": list(HEALTHCARE_TABLES.keys())
                    }
                
                table_name = HEALTHCARE_TABLES[assessment_type.lower()]
                
                # Get all data and calculate scores (this could be optimized with database views)
                result = supabase.table(table_name).select("*").execute()
                
                if not result.data:
                    return {
                        "message": f"No {assessment_type} data found",
                        "patients": [],
                        "pagination": {
                            "page": page,
                            "page_size": page_size,
                            "total_count": 0,
                            "has_more": False,
                            "returned_count": 0
                        }
                    }
                
                # Calculate total scores for filtering
                import pandas as pd
                df = pd.DataFrame(result.data)
                
                # Get score columns based on assessment type
                if assessment_type.lower() == "ptsd":
                    score_columns = [col for col in df.columns if col.startswith("ptsd_q")]
                else:
                    score_columns = [col for col in df.columns if col.startswith("col_")]
                
                if score_columns:
                    score_data = df[score_columns].apply(pd.to_numeric, errors="coerce").fillna(0)
                    df["total_score"] = score_data.sum(axis=1)
                    
                    # Apply score filtering
                    filtered_df = df
                    if min_score is not None:
                        filtered_df = filtered_df[filtered_df["total_score"] >= min_score]
                    if max_score is not None:
                        filtered_df = filtered_df[filtered_df["total_score"] <= max_score]
                    
                    # Convert to list of patient records
                    patient_records = []
                    for _, row in filtered_df.iterrows():
                        patient_records.append({
                            "patient_id": row["group_identifier"],
                            "assessment_date": row.get("assessment_date"),
                            "total_score": float(row["total_score"]),
                            "assessment_type": assessment_type
                        })
                    
                    # Sort by score descending
                    patient_records.sort(key=lambda x: x["total_score"], reverse=True)
                    
                    # Apply pagination
                    paginated_result = paginate_list(patient_records, pagination)
                    
                    req_logger.log_info(
                        "Score-based search completed",
                        total_matching=len(patient_records),
                        returned_count=len(paginated_result["data"])
                    )
                    
                    return {
                        "patients": paginated_result["data"],
                        "pagination": paginated_result["pagination"],
                        "search_criteria": {
                            "assessment_type": assessment_type,
                            "min_score": min_score,
                            "max_score": max_score
                        }
                    }
                else:
                    return {
                        "error": f"No score columns found for {assessment_type}",
                        "available_columns": list(df.columns)
                    }
                
            except ValidationError as e:
                req_logger.log_error("Validation error", error=str(e))
                return {
                    "error": "Invalid parameters",
                    "details": str(e)
                }
            except Exception as e:
                req_logger.log_error("Score-based search failed", error=str(e))
                return {
                    "error": f"Search failed: {str(e)}"
                }
    
    @mcp.tool
    def get_cache_status() -> Dict[str, Any]:
        """
        Get current cache status and statistics
        
        Returns:
            Cache performance metrics
        """
        from pagination_caching import get_cache_stats
        
        try:
            stats = get_cache_stats()
            stats["status"] = "operational"
            stats["timestamp"] = datetime.utcnow().isoformat()
            return stats
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    return mcp