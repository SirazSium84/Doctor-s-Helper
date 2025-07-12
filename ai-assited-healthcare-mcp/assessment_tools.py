"""
Assessment retrieval tools for Healthcare MCP Server
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES


def create_assessment_tools(mcp: FastMCP):
    """Create all assessment-related MCP tools"""

    def safe_float_conversion(value, default=0.0):
        """Safely convert a value to float, handling strings and None"""
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    def calculate_assessment_total(data: dict, assessment_type: str) -> dict:
        """Calculate total score for an assessment based on the actual schema"""
        result = data.copy()

        if assessment_type == "ptsd":
            # PTSD uses ptsd_q{i}_{description} columns
            ptsd_cols = [col for col in data.keys() if col.startswith("ptsd_q")]
            scores = [safe_float_conversion(data.get(col, 0)) for col in ptsd_cols]
            total = sum(scores)

            result["calculated_total"] = total
            result["severity"] = (
                "minimal"
                if total < 20
                else "mild" if total < 40 else "moderate" if total < 60 else "severe"
            )
            result["questions_answered"] = len([s for s in scores if s > 0])

        elif assessment_type == "phq":
            # PHQ uses col_{i}_{description} for questions 1-9, col_10 is difficulty rating
            phq_cols = [
                col
                for col in data.keys()
                if col.startswith("col_")
                and any(col.startswith(f"col_{i}_") for i in range(1, 10))
            ]
            scores = [safe_float_conversion(data.get(col, 0)) for col in phq_cols]
            total = sum(scores)

            result["calculated_total"] = total
            result["severity"] = (
                "minimal"
                if total < 5
                else (
                    "mild"
                    if total < 10
                    else (
                        "moderate"
                        if total < 15
                        else "moderately_severe" if total < 20 else "severe"
                    )
                )
            )
            result["questions_answered"] = len([s for s in scores if s > 0])

        elif assessment_type == "gad":
            # GAD uses col_{i}_{description} for questions 1-7
            gad_cols = [
                col
                for col in data.keys()
                if col.startswith("col_")
                and any(col.startswith(f"col_{i}_") for i in range(1, 8))
            ]
            scores = [safe_float_conversion(data.get(col, 0)) for col in gad_cols]
            total = sum(scores)

            result["calculated_total"] = total
            result["severity"] = (
                "minimal"
                if total < 5
                else "mild" if total < 10 else "moderate" if total < 15 else "severe"
            )
            result["questions_answered"] = len([s for s in scores if s > 0])

        elif assessment_type == "who":
            # WHO uses col_{i}_{description} for questions 1-5
            who_cols = [
                col
                for col in data.keys()
                if col.startswith("col_")
                and any(col.startswith(f"col_{i}_") for i in range(1, 6))
            ]
            scores = [safe_float_conversion(data.get(col, 0)) for col in who_cols]
            total = sum(scores)

            # WHO-5 scoring: multiply by 4 to get 0-100 scale
            scaled_score = total * 4

            result["calculated_total"] = total
            result["scaled_score"] = scaled_score
            result["wellbeing_level"] = (
                "poor_wellbeing"
                if scaled_score <= 52
                else "below_average" if scaled_score <= 68 else "good_wellbeing"
            )
            result["questions_answered"] = len([s for s in scores if s > 0])

        elif assessment_type == "ders":
            # DERS uses ders_q{i}_{description} or ders2_q{i}_{description} columns
            ders_cols = [
                col
                for col in data.keys()
                if col.startswith("ders_q") or col.startswith("ders2_q")
            ]
            scores = [safe_float_conversion(data.get(col, 0)) for col in ders_cols]
            total = sum(scores)

            result["calculated_total"] = total
            result["emotion_regulation_level"] = (
                "low_difficulties"
                if total <= 90
                else "moderate_difficulties" if total <= 120 else "high_difficulties"
            )
            result["questions_answered"] = len([s for s in scores if s > 0])

        return result

    @mcp.tool
    def get_patient_ptsd_scores(
        patient_id: str, limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get PTSD assessment scores for a specific patient with calculated totals

        Args:
            patient_id: Patient group identifier
            limit: Optional limit on number of results

        Returns:
            PTSD assessment records with calculated scores and severity levels
        """
        try:
            query = (
                supabase.table(HEALTHCARE_TABLES["ptsd"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()

            if not result.data:
                return {
                    "message": f"No PTSD assessments found for patient {patient_id}"
                }

            # Calculate totals and add severity information
            enriched_assessments = []
            for assessment in result.data:
                enriched = calculate_assessment_total(assessment, "ptsd")
                enriched_assessments.append(enriched)

            return {
                "patient_id": patient_id,
                "assessment_type": "PTSD (PCL-5)",
                "assessment_count": len(enriched_assessments),
                "assessments": enriched_assessments,
                "latest_score": (
                    enriched_assessments[0]["calculated_total"]
                    if enriched_assessments
                    else None
                ),
                "latest_severity": (
                    enriched_assessments[0]["severity"]
                    if enriched_assessments
                    else None
                ),
            }

        except Exception as e:
            return {"error": f"Failed to retrieve PTSD scores: {str(e)}"}

    @mcp.tool
    def get_patient_phq_scores(
        patient_id: str, limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get PHQ-9 depression assessment scores for a specific patient with calculated totals

        Args:
            patient_id: Patient group identifier
            limit: Optional limit on number of results

        Returns:
            PHQ-9 assessment records with calculated depression scores and severity levels
        """
        try:
            query = (
                supabase.table(HEALTHCARE_TABLES["phq"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()

            if not result.data:
                return {
                    "message": f"No PHQ-9 assessments found for patient {patient_id}"
                }

            # Calculate totals and add severity information
            enriched_assessments = []
            for assessment in result.data:
                enriched = calculate_assessment_total(assessment, "phq")
                enriched_assessments.append(enriched)

            return {
                "patient_id": patient_id,
                "assessment_type": "PHQ-9 (Depression)",
                "assessment_count": len(enriched_assessments),
                "assessments": enriched_assessments,
                "latest_score": (
                    enriched_assessments[0]["calculated_total"]
                    if enriched_assessments
                    else None
                ),
                "latest_severity": (
                    enriched_assessments[0]["severity"]
                    if enriched_assessments
                    else None
                ),
            }

        except Exception as e:
            return {"error": f"Failed to retrieve PHQ-9 scores: {str(e)}"}

    @mcp.tool
    def get_patient_gad_scores(
        patient_id: str, limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get GAD-7 anxiety assessment scores for a specific patient with calculated totals

        Args:
            patient_id: Patient group identifier
            limit: Optional limit on number of results

        Returns:
            GAD-7 assessment records with calculated anxiety scores and severity levels
        """
        try:
            query = (
                supabase.table(HEALTHCARE_TABLES["gad"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()

            if not result.data:
                return {
                    "message": f"No GAD-7 assessments found for patient {patient_id}"
                }

            # Calculate totals and add severity information
            enriched_assessments = []
            for assessment in result.data:
                enriched = calculate_assessment_total(assessment, "gad")
                enriched_assessments.append(enriched)

            return {
                "patient_id": patient_id,
                "assessment_type": "GAD-7 (Anxiety)",
                "assessment_count": len(enriched_assessments),
                "assessments": enriched_assessments,
                "latest_score": (
                    enriched_assessments[0]["calculated_total"]
                    if enriched_assessments
                    else None
                ),
                "latest_severity": (
                    enriched_assessments[0]["severity"]
                    if enriched_assessments
                    else None
                ),
            }

        except Exception as e:
            return {"error": f"Failed to retrieve GAD-7 scores: {str(e)}"}

    @mcp.tool
    def get_patient_who_scores(
        patient_id: str, limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get WHO-5 well-being assessment scores for a specific patient with calculated totals

        Args:
            patient_id: Patient group identifier
            limit: Optional limit on number of results

        Returns:
            WHO-5 assessment records with calculated well-being scores and levels
        """
        try:
            query = (
                supabase.table(HEALTHCARE_TABLES["who"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()

            if not result.data:
                return {
                    "message": f"No WHO-5 assessments found for patient {patient_id}"
                }

            # Calculate totals and add wellbeing information
            enriched_assessments = []
            for assessment in result.data:
                enriched = calculate_assessment_total(assessment, "who")
                enriched_assessments.append(enriched)

            return {
                "patient_id": patient_id,
                "assessment_type": "WHO-5 (Well-being)",
                "assessment_count": len(enriched_assessments),
                "assessments": enriched_assessments,
                "latest_score": (
                    enriched_assessments[0]["calculated_total"]
                    if enriched_assessments
                    else None
                ),
                "latest_scaled_score": (
                    enriched_assessments[0]["scaled_score"]
                    if enriched_assessments
                    else None
                ),
                "latest_wellbeing_level": (
                    enriched_assessments[0]["wellbeing_level"]
                    if enriched_assessments
                    else None
                ),
            }

        except Exception as e:
            return {"error": f"Failed to retrieve WHO-5 scores: {str(e)}"}

    @mcp.tool
    def get_patient_ders_scores(
        patient_id: str, limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get DERS emotion regulation assessment scores for a specific patient with calculated totals

        Args:
            patient_id: Patient group identifier
            limit: Optional limit on number of results

        Returns:
            DERS assessment records with calculated emotion regulation scores
        """
        try:
            # Check both DERS tables
            ders1_query = (
                supabase.table(HEALTHCARE_TABLES["ders"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
            )
            ders2_query = (
                supabase.table(HEALTHCARE_TABLES["ders2"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
            )

            ders1_result = ders1_query.execute()
            ders2_result = ders2_query.execute()

            all_ders = []
            if ders1_result.data:
                for record in ders1_result.data:
                    record["ders_version"] = "DERS-1"
                    enriched = calculate_assessment_total(record, "ders")
                    all_ders.append(enriched)

            if ders2_result.data:
                for record in ders2_result.data:
                    record["ders_version"] = "DERS-2"
                    enriched = calculate_assessment_total(record, "ders")
                    all_ders.append(enriched)

            if not all_ders:
                return {
                    "message": f"No DERS assessments found for patient {patient_id}"
                }

            # Sort by date
            all_ders.sort(key=lambda x: x.get("assessment_date", ""), reverse=True)

            if limit:
                all_ders = all_ders[:limit]

            return {
                "patient_id": patient_id,
                "assessment_type": "DERS (Emotion Regulation)",
                "assessment_count": len(all_ders),
                "assessments": all_ders,
                "latest_score": all_ders[0]["calculated_total"] if all_ders else None,
                "latest_emotion_regulation_level": (
                    all_ders[0]["emotion_regulation_level"] if all_ders else None
                ),
            }

        except Exception as e:
            return {"error": f"Failed to retrieve DERS scores: {str(e)}"}

    @mcp.tool
    def get_all_patient_assessments(
        patient_id: str,
        assessment_types: Optional[List[str]] = None,
        date_range: Optional[Dict[str, str]] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Get comprehensive overview of all assessments for a patient with flexible filtering

        Args:
            patient_id: Patient group identifier
            assessment_types: Optional list of assessment types to fetch ['ptsd', 'phq', 'gad', 'who', 'ders']
            date_range: Optional date range filter {'start': 'YYYY-MM-DD', 'end': 'YYYY-MM-DD'}
            limit: Optional limit on number of assessments per type

        Returns:
            Complete assessment overview across specified instruments with calculated totals
        """
        try:
            # Default to all assessment types if not specified
            if assessment_types is None:
                assessment_types = ["ptsd", "phq", "gad", "who", "ders"]

            # Validate assessment types
            valid_types = ["ptsd", "phq", "gad", "who", "ders"]
            assessment_types = [
                t.lower() for t in assessment_types if t.lower() in valid_types
            ]

            if not assessment_types:
                return {"error": "No valid assessment types specified"}

            assessments = {}

            # Get data from each requested assessment type with calculated totals
            for assessment_type in assessment_types:
                if assessment_type == "ders":
                    # Handle DERS separately (both versions)
                    try:
                        ders1_result = (
                            supabase.table(HEALTHCARE_TABLES["ders"])
                            .select("*")
                            .eq("group_identifier", patient_id)
                            .order("assessment_date", desc=True)
                        )
                        ders2_result = (
                            supabase.table(HEALTHCARE_TABLES["ders2"])
                            .select("*")
                            .eq("group_identifier", patient_id)
                            .order("assessment_date", desc=True)
                        )

                        # Apply date range filter if specified
                        if date_range:
                            if date_range.get("start"):
                                ders1_result = ders1_result.gte(
                                    "assessment_date", date_range["start"]
                                )
                                ders2_result = ders2_result.gte(
                                    "assessment_date", date_range["start"]
                                )
                            if date_range.get("end"):
                                ders1_result = ders1_result.lte(
                                    "assessment_date", date_range["end"]
                                )
                                ders2_result = ders2_result.lte(
                                    "assessment_date", date_range["end"]
                                )

                        # Apply limit if specified
                        if limit:
                            ders1_result = ders1_result.limit(limit)
                            ders2_result = ders2_result.limit(limit)

                        ders1_result = ders1_result.execute()
                        ders2_result = ders2_result.execute()

                        all_ders = []
                        if ders1_result.data:
                            for record in ders1_result.data:
                                record["ders_version"] = "DERS-1"
                                enriched = calculate_assessment_total(record, "ders")
                                all_ders.append(enriched)

                        if ders2_result.data:
                            for record in ders2_result.data:
                                record["ders_version"] = "DERS-2"
                                enriched = calculate_assessment_total(record, "ders")
                                all_ders.append(enriched)

                        if all_ders:
                            all_ders.sort(
                                key=lambda x: x.get("assessment_date", ""), reverse=True
                            )
                            # Apply limit to combined results if specified
                            if limit:
                                all_ders = all_ders[:limit]

                            assessments["ders"] = {
                                "assessment_type": "DERS (Emotion Regulation)",
                                "assessment_count": len(all_ders),
                                "assessments": all_ders,
                                "latest_score": (
                                    all_ders[0]["calculated_total"]
                                    if all_ders
                                    else None
                                ),
                                "latest_emotion_regulation_level": (
                                    all_ders[0]["emotion_regulation_level"]
                                    if all_ders
                                    else None
                                ),
                            }
                        else:
                            assessments["ders"] = {
                                "message": "No DERS assessments found"
                            }

                    except Exception as e:
                        assessments["ders"] = {
                            "error": f"Failed to retrieve DERS data: {str(e)}"
                        }
                else:
                    # Handle standard assessment types
                    table_name = HEALTHCARE_TABLES[assessment_type]
                    try:
                        query = (
                            supabase.table(table_name)
                            .select("*")
                            .eq("group_identifier", patient_id)
                            .order("assessment_date", desc=True)
                        )

                        # Apply date range filter if specified
                        if date_range:
                            if date_range.get("start"):
                                query = query.gte(
                                    "assessment_date", date_range["start"]
                                )
                            if date_range.get("end"):
                                query = query.lte("assessment_date", date_range["end"])

                        # Apply limit if specified
                        if limit:
                            query = query.limit(limit)

                        result = query.execute()

                        if result.data:
                            # Calculate totals for each assessment
                            enriched_assessments = []
                            for assessment in result.data:
                                enriched = calculate_assessment_total(
                                    assessment, assessment_type
                                )
                                enriched_assessments.append(enriched)

                            assessments[assessment_type] = {
                                "assessment_type": f"{assessment_type.upper()}",
                                "assessment_count": len(enriched_assessments),
                                "assessments": enriched_assessments,
                                "latest_score": (
                                    enriched_assessments[0]["calculated_total"]
                                    if enriched_assessments
                                    else None
                                ),
                                "latest_severity": (
                                    enriched_assessments[0].get("severity")
                                    or enriched_assessments[0].get("wellbeing_level")
                                    if enriched_assessments
                                    else None
                                ),
                            }
                        else:
                            assessments[assessment_type] = {
                                "message": f"No {assessment_type} assessments found"
                            }

                    except Exception as e:
                        assessments[assessment_type] = {
                            "error": f"Failed to retrieve {assessment_type} data: {str(e)}"
                        }

            # Calculate summary statistics
            total_assessments = sum(
                data.get("assessment_count", 0) if isinstance(data, dict) else 0
                for data in assessments.values()
            )

            # Extract latest scores for quick reference
            latest_scores = {}
            for assessment_type, data in assessments.items():
                if isinstance(data, dict) and "latest_score" in data:
                    latest_scores[assessment_type] = {
                        "score": data.get("latest_score"),
                        "severity_or_level": data.get("latest_severity")
                        or data.get("latest_wellbeing_level")
                        or data.get("latest_emotion_regulation_level"),
                    }

            # Build summary for requested assessment types only
            summary = {}
            for assessment_type in assessment_types:
                summary[f"{assessment_type}_count"] = assessments.get(
                    assessment_type, {}
                ).get("assessment_count", 0)

            return {
                "patient_id": patient_id,
                "total_assessments": total_assessments,
                "assessment_breakdown": assessments,
                "latest_scores_summary": latest_scores,
                "summary": summary,
                "filters_applied": {
                    "assessment_types": assessment_types,
                    "date_range": date_range,
                    "limit": limit,
                },
            }

        except Exception as e:
            return {"error": f"Failed to retrieve patient assessments: {str(e)}"}

    @mcp.tool
    def list_all_patients() -> Dict[str, Any]:
        """
        Get list of all unique patient identifiers across all assessments

        Returns:
            List of unique patient group identifiers with basic stats
        """
        try:
            all_patients = set()

            # Collect patient IDs from all assessment tables
            for table_name in HEALTHCARE_TABLES.values():
                try:
                    result = (
                        supabase.table(table_name).select("group_identifier").execute()
                    )
                    if result.data:
                        for record in result.data:
                            if record.get("group_identifier"):
                                all_patients.add(record["group_identifier"])
                except:
                    # Skip tables that might not exist or have different schemas
                    continue

            patient_list = sorted(list(all_patients))

            return {
                "total_patients": len(patient_list),
                "patient_ids": patient_list,
                "note": "Use get_all_patient_assessments(patient_id) for detailed assessment data",
            }

        except Exception as e:
            return {"error": f"Failed to retrieve patient list: {str(e)}"}

    @mcp.tool
    def get_assessment_summary_stats() -> Dict[str, Any]:
        """
        Get summary statistics across all assessments and patients

        Returns:
            Overview statistics for the healthcare dashboard with clinical context
        """
        try:
            stats = {}

            for assessment_type, table_name in HEALTHCARE_TABLES.items():
                try:
                    result = (
                        supabase.table(table_name).select("group_identifier").execute()
                    )
                    if result.data:
                        unique_patients = len(
                            set(
                                record["group_identifier"]
                                for record in result.data
                                if record.get("group_identifier")
                            )
                        )
                        total_records = len(result.data)

                        # Add clinical context
                        clinical_info = {
                            "ptsd": "PCL-5: PTSD symptoms (0-80 scale, ≥50 indicates probable PTSD)",
                            "phq": "PHQ-9: Depression severity (0-27 scale, ≥15 indicates severe depression)",
                            "gad": "GAD-7: Anxiety severity (0-21 scale, ≥15 indicates severe anxiety)",
                            "who": "WHO-5: Well-being index (0-100 scale when multiplied by 4, ≤52 indicates poor well-being)",
                            "ders": "DERS: Emotion regulation difficulties (36-180 scale, higher = more difficulties)",
                        }.get(assessment_type, "Assessment data")

                        stats[assessment_type] = {
                            "total_records": total_records,
                            "unique_patients": unique_patients,
                            "avg_assessments_per_patient": (
                                round(total_records / unique_patients, 2)
                                if unique_patients > 0
                                else 0
                            ),
                            "clinical_info": clinical_info,
                        }
                except:
                    stats[assessment_type] = {"error": "Could not access table"}

            return {
                "healthcare_dashboard_stats": stats,
                "generated_at": datetime.now().isoformat(),
                "schema_note": "All calculations use the actual database schema column patterns",
            }

        except Exception as e:
            return {"error": f"Failed to generate summary stats: {str(e)}"}

    return mcp
