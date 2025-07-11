"""
Dynamic resources for Healthcare MCP Server
"""

from typing import List, Dict, Any, Optional
import json
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES


def create_patient_resources(mcp: FastMCP):
    """Create all patient data resources"""

    @mcp.resource("patient://{patient_id}/complete-profile")
    def patient_complete_profile(patient_id: str) -> str:
        """
        Complete patient profile across all assessments and substance use

        Args:
            patient_id: Patient group identifier

        Returns:
            JSON string of complete patient profile
        """
        try:
            profile = {
                "patient_id": patient_id,
                "assessments": {},
                "substance_use": {},
                "summary": {},
            }

            # Get all assessment types
            for assessment_type in ["ptsd", "phq", "gad", "who"]:
                table_name = HEALTHCARE_TABLES[assessment_type]
                result = (
                    supabase.table(table_name)
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .order("assessment_date", desc=True)
                    .execute()
                )

                profile["assessments"][assessment_type] = {
                    "count": len(result.data),
                    "latest": result.data[0] if result.data else None,
                    "all": result.data,
                }

            # Get DERS assessments
            ders1_result = (
                supabase.table(HEALTHCARE_TABLES["ders"])
                .select("*")
                .eq("group_identifier", patient_id)
                .execute()
            )
            ders2_result = (
                supabase.table(HEALTHCARE_TABLES["ders2"])
                .select("*")
                .eq("group_identifier", patient_id)
                .execute()
            )

            profile["assessments"]["ders"] = {
                "ders1_count": len(ders1_result.data),
                "ders2_count": len(ders2_result.data),
                "ders1_data": ders1_result.data,
                "ders2_data": ders2_result.data,
            }

            # Get substance use data
            substance_result = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .eq("group_identifier", patient_id)
                .execute()
            )

            if substance_result.data:
                active_substances = [
                    s for s in substance_result.data if s.get("use_flag") == 1
                ]
                profile["substance_use"] = {
                    "total_tracked": len(substance_result.data),
                    "active_count": len(active_substances),
                    "active_substances": active_substances,
                    "all_substances": substance_result.data,
                }

            # Generate summary
            total_assessments = sum(
                profile["assessments"][key]["count"]
                for key in ["ptsd", "phq", "gad", "who"]
            )
            total_assessments += (
                profile["assessments"]["ders"]["ders1_count"]
                + profile["assessments"]["ders"]["ders2_count"]
            )

            profile["summary"] = {
                "total_assessments": total_assessments,
                "has_substance_data": len(substance_result.data) > 0,
                "active_substance_count": len(active_substances) if substance_result.data else 0,  # type: ignore
            }

            return json.dumps(profile, indent=2, default=str)

        except Exception as e:
            return json.dumps(
                {"error": f"Failed to retrieve patient profile: {str(e)}"}
            )

    @mcp.resource("assessment://{assessment_type}/latest-scores")
    def latest_assessment_scores(assessment_type: str) -> str:
        """
        Latest assessment scores across all patients for a specific assessment type

        Args:
            assessment_type: Type of assessment (ptsd, phq, gad, who, ders)

        Returns:
            JSON string of latest scores for all patients
        """
        try:
            if assessment_type not in ["ptsd", "phq", "gad", "who", "ders"]:
                return json.dumps({"error": "Invalid assessment type"})

            if assessment_type == "ders":
                # Handle DERS separately
                ders1_result = (
                    supabase.table(HEALTHCARE_TABLES["ders"]).select("*").execute()
                )
                ders2_result = (
                    supabase.table(HEALTHCARE_TABLES["ders2"]).select("*").execute()
                )

                return json.dumps(
                    {
                        "assessment_type": "ders",
                        "ders1_data": ders1_result.data,
                        "ders2_data": ders2_result.data,
                    },
                    indent=2,
                    default=str,
                )

            table_name = HEALTHCARE_TABLES[assessment_type]
            result = (
                supabase.table(table_name)
                .select("*")
                .order("assessment_date", desc=True)
                .execute()
            )

            # Group by patient and get latest for each
            patients_latest = {}
            for record in result.data:
                patient_id = record.get("group_identifier")
                if patient_id and patient_id not in patients_latest:
                    patients_latest[patient_id] = record

            return json.dumps(
                {
                    "assessment_type": assessment_type,
                    "total_patients": len(patients_latest),
                    "latest_scores": list(patients_latest.values()),
                },
                indent=2,
                default=str,
            )

        except Exception as e:
            return json.dumps(
                {
                    "error": f"Failed to retrieve latest {assessment_type} scores: {str(e)}"
                }
            )

    @mcp.resource("trends://{patient_id}/{timeframe}")
    def patient_trends(patient_id: str, timeframe: str) -> str:
        """
        Patient assessment trends over specified timeframe

        Args:
            patient_id: Patient group identifier
            timeframe: Time period (30d, 90d, 180d, 1y, all)

        Returns:
            JSON string of temporal trend analysis
        """
        try:
            import pandas as pd
            from datetime import datetime, timedelta

            # Calculate date cutoff
            now = datetime.now()
            if timeframe == "30d":
                cutoff_date = now - timedelta(days=30)
            elif timeframe == "90d":
                cutoff_date = now - timedelta(days=90)
            elif timeframe == "180d":
                cutoff_date = now - timedelta(days=180)
            elif timeframe == "1y":
                cutoff_date = now - timedelta(days=365)
            elif timeframe == "all":
                cutoff_date = datetime(1900, 1, 1)  # Very old date to include all
            else:
                return json.dumps(
                    {"error": "Invalid timeframe. Use: 30d, 90d, 180d, 1y, all"}
                )

            trends = {
                "patient_id": patient_id,
                "timeframe": timeframe,
                "cutoff_date": cutoff_date.isoformat(),
                "assessment_trends": {},
            }

            for assessment_type in ["ptsd", "phq", "gad", "who"]:
                table_name = HEALTHCARE_TABLES[assessment_type]
                result = (
                    supabase.table(table_name)
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .execute()
                )

                if not result.data:
                    continue

                df = pd.DataFrame(result.data)
                df["assessment_date"] = pd.to_datetime(
                    df["assessment_date"], errors="coerce"
                )

                # Filter by timeframe
                df_filtered = df[df["assessment_date"] >= cutoff_date]

                if len(df_filtered) == 0:
                    continue

                # Sort by date
                df_filtered = df_filtered.sort_values("assessment_date")

                # Calculate trends for numeric columns
                numeric_cols = df_filtered.select_dtypes(include=["number"]).columns
                numeric_cols = [col for col in numeric_cols if col not in ["unique_id"]]

                assessment_trend = {
                    "assessment_count": len(df_filtered),
                    "date_range": {
                        "start": df_filtered.iloc[0]["assessment_date"].isoformat(),
                        "end": df_filtered.iloc[-1]["assessment_date"].isoformat(),
                    },
                    "trends": {},
                }

                # Calculate score trends
                for col in numeric_cols:
                    if not df_filtered[col].isna().all():
                        values = df_filtered[col].dropna()
                        if len(values) >= 2:
                            assessment_trend["trends"][col] = {
                                "first_value": float(values.iloc[0]),
                                "last_value": float(values.iloc[-1]),
                                "mean": round(float(values.mean()), 2),
                                "std": round(float(values.std()), 2),
                                "min": float(values.min()),
                                "max": float(values.max()),
                                "trend_direction": (
                                    "improving"
                                    if values.iloc[-1] < values.iloc[0]
                                    else (
                                        "worsening"
                                        if values.iloc[-1] > values.iloc[0]
                                        else "stable"
                                    )
                                ),
                            }

                trends["assessment_trends"][assessment_type] = assessment_trend

            return json.dumps(trends, indent=2, default=str)

        except Exception as e:
            return json.dumps({"error": f"Failed to retrieve trends: {str(e)}"})

    @mcp.resource("population://{assessment_type}/statistics")
    def population_statistics(assessment_type: str) -> str:
        """
        Population-level statistics for a specific assessment type

        Args:
            assessment_type: Type of assessment (ptsd, phq, gad, who)

        Returns:
            JSON string of population statistics
        """
        try:
            import pandas as pd

            if assessment_type not in ["ptsd", "phq", "gad", "who"]:
                return json.dumps({"error": "Invalid assessment type"})

            table_name = HEALTHCARE_TABLES[assessment_type]
            result = supabase.table(table_name).select("*").execute()

            if not result.data:
                return json.dumps({"error": f"No data found for {assessment_type}"})

            df = pd.DataFrame(result.data)

            stats = {
                "assessment_type": assessment_type,
                "total_records": len(df),
                "unique_patients": df["group_identifier"].nunique(),
                "statistics": {},
            }

            # Calculate statistics for numeric columns
            numeric_cols = df.select_dtypes(include=["number"]).columns
            numeric_cols = [col for col in numeric_cols if col not in ["unique_id"]]

            for col in numeric_cols:
                if not df[col].isna().all():
                    col_data = df[col].dropna()
                    stats["statistics"][col] = {
                        "count": len(col_data),
                        "mean": round(float(col_data.mean()), 2),
                        "median": round(float(col_data.median()), 2),
                        "std": round(float(col_data.std()), 2),
                        "min": float(col_data.min()),
                        "max": float(col_data.max()),
                        "percentiles": {
                            "25th": round(float(col_data.quantile(0.25)), 2),
                            "75th": round(float(col_data.quantile(0.75)), 2),
                            "90th": round(float(col_data.quantile(0.90)), 2),
                            "95th": round(float(col_data.quantile(0.95)), 2),
                        },
                    }

            return json.dumps(stats, indent=2, default=str)

        except Exception as e:
            return json.dumps(
                {"error": f"Failed to retrieve population statistics: {str(e)}"}
            )

    @mcp.resource("high-risk://patients/current")
    def high_risk_patients() -> str:
        """
        Current list of high-risk patients based on latest assessments

        Returns:
            JSON string of high-risk patient analysis
        """
        try:
            import pandas as pd

            high_risk_analysis = {
                "analysis_date": datetime.now().isoformat(),  # type: ignore
                "high_risk_patients": [],
                "criteria": {
                    "severe_ptsd": "PTSD total score >= 50",
                    "severe_depression": "PHQ-9 total score >= 15",
                    "severe_anxiety": "GAD-7 total score >= 15",
                    "high_risk_substance_use": "Multiple substances or high-risk substances with daily use",
                },
            }

            # Get all unique patients
            all_patients = set()
            for table in ["ptsd", "phq", "gad"]:
                result = (
                    supabase.table(HEALTHCARE_TABLES[table])
                    .select("group_identifier")
                    .execute()
                )
                if result.data:
                    all_patients.update(
                        record["group_identifier"]
                        for record in result.data
                        if record.get("group_identifier")
                    )

            # Analyze each patient
            for patient_id in all_patients:
                risk_factors = []
                risk_score = 0

                # Check PTSD scores
                ptsd_result = (
                    supabase.table(HEALTHCARE_TABLES["ptsd"])
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .order("assessment_date", desc=True)
                    .limit(1)
                    .execute()
                )
                if ptsd_result.data:
                    ptsd_data = ptsd_result.data[0]
                    ptsd_scores = [
                        ptsd_data.get(f"ptsd_q{i}_", 0) for i in range(1, 21)
                    ]
                    ptsd_total = sum(
                        score
                        for score in ptsd_scores
                        if isinstance(score, (int, float))
                    )
                    if ptsd_total >= 50:
                        risk_factors.append(f"Severe PTSD (score: {ptsd_total})")
                        risk_score += 3

                # Check PHQ-9 scores
                phq_result = (
                    supabase.table(HEALTHCARE_TABLES["phq"])
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .order("assessment_date", desc=True)
                    .limit(1)
                    .execute()
                )
                if phq_result.data:
                    phq_data = phq_result.data[0]
                    phq_scores = [phq_data.get(f"phq_q{i}_", 0) for i in range(1, 10)]
                    phq_total = sum(
                        score for score in phq_scores if isinstance(score, (int, float))
                    )
                    if phq_total >= 15:
                        risk_factors.append(f"Severe depression (score: {phq_total})")
                        risk_score += 3

                # Check GAD-7 scores
                gad_result = (
                    supabase.table(HEALTHCARE_TABLES["gad"])
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .order("assessment_date", desc=True)
                    .limit(1)
                    .execute()
                )
                if gad_result.data:
                    gad_data = gad_result.data[0]
                    gad_scores = [gad_data.get(f"gad_q{i}_", 0) for i in range(1, 8)]
                    gad_total = sum(
                        score for score in gad_scores if isinstance(score, (int, float))
                    )
                    if gad_total >= 15:
                        risk_factors.append(f"Severe anxiety (score: {gad_total})")
                        risk_score += 3

                # Check substance use
                substance_result = (
                    supabase.table(HEALTHCARE_TABLES["substance_history"])
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .execute()
                )
                if substance_result.data:
                    active_substances = [
                        s for s in substance_result.data if s.get("use_flag") == 1
                    ]
                    high_risk_substances = [
                        "Heroin",
                        "Cocaine (Powder)",
                        "Crack Cocaine",
                        "Crystal Meth",
                    ]

                    if len(active_substances) >= 3:
                        risk_factors.append(
                            f"Multiple substance use ({len(active_substances)} substances)"
                        )
                        risk_score += 2

                    if any(
                        s["substance"] in high_risk_substances
                        for s in active_substances
                    ):
                        risk_factors.append("High-risk substance use")
                        risk_score += 2

                # Add to high-risk list if risk score >= 3
                if risk_score >= 3:
                    high_risk_analysis["high_risk_patients"].append(
                        {
                            "patient_id": patient_id,
                            "risk_score": risk_score,
                            "risk_factors": risk_factors,
                            "priority": (
                                "urgent"
                                if risk_score >= 6
                                else "high" if risk_score >= 4 else "moderate"
                            ),
                        }
                    )

            # Sort by risk score
            high_risk_analysis["high_risk_patients"].sort(
                key=lambda x: x["risk_score"], reverse=True
            )
            high_risk_analysis["total_high_risk_patients"] = len(
                high_risk_analysis["high_risk_patients"]
            )

            return json.dumps(high_risk_analysis, indent=2, default=str)  # type: ignore

        except Exception as e:
            return json.dumps({"error": f"Failed to identify high-risk patients: {str(e)}"})  # type: ignore

    return mcp
