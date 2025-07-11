"""
Substance use analysis tools for Healthcare MCP Server
"""

from typing import List, Dict, Any, Optional
import pandas as pd
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES


def create_substance_tools(mcp: FastMCP):
    """Create all substance use analysis MCP tools"""

    @mcp.tool
    def get_patient_substance_history(patient_id: str) -> Dict[str, Any]:
        """
        Get complete substance use history for a specific patient

        Args:
            patient_id: Patient group identifier

        Returns:
            Complete substance use profile for the patient
        """
        try:
            result = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .eq("group_identifier", patient_id)
                .execute()
            )

            if not result.data:
                return {
                    "message": f"No substance use history found for patient {patient_id}"
                }

            # Separate active and inactive substances
            active_substances = [
                record for record in result.data if record.get("use_flag") == 1
            ]
            inactive_substances = [
                record for record in result.data if record.get("use_flag") == 0
            ]

            # Group by usage patterns
            pattern_analysis = {}
            for record in active_substances:
                pattern = record.get("pattern_of_use", "Unknown")
                if pattern not in pattern_analysis:
                    pattern_analysis[pattern] = []
                pattern_analysis[pattern].append(record["substance"])

            return {
                "patient_id": patient_id,
                "total_substances_tracked": len(result.data),
                "active_substance_count": len(active_substances),
                "inactive_substance_count": len(inactive_substances),
                "active_substances": active_substances,
                "inactive_substances": inactive_substances,
                "usage_patterns": pattern_analysis,
                "risk_assessment": {
                    "high_risk_substances": [
                        s
                        for s in active_substances
                        if s["substance"]
                        in [
                            "Heroin",
                            "Cocaine (Powder)",
                            "Crack Cocaine",
                            "Crystal Meth",
                        ]
                    ],
                    "daily_use_substances": [
                        s
                        for s in active_substances
                        if s.get("pattern_of_use", "").lower() == "daily"
                    ],
                    "multiple_active_substances": len(active_substances) > 3,
                },
            }

        except Exception as e:
            return {"error": f"Failed to retrieve substance history: {str(e)}"}

    @mcp.tool
    def analyze_substance_patterns_across_patients() -> Dict[str, Any]:
        """
        Analyze substance use patterns across all patients

        Returns:
            Population-level substance use analysis
        """
        try:
            result = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .execute()
            )

            if not result.data:
                return {"message": "No substance use data found"}

            df = pd.DataFrame(result.data)

            # Most commonly used substances
            active_substances = df[df["use_flag"] == 1]
            substance_counts = active_substances["substance"].value_counts()

            # Usage patterns analysis
            pattern_counts = active_substances["pattern_of_use"].value_counts()

            # Patient risk levels
            patient_risk = (
                active_substances.groupby("group_identifier")
                .agg(
                    {
                        "substance": "count",
                        "pattern_of_use": lambda x: (x == "daily").sum(),
                    }
                )
                .rename(
                    columns={
                        "substance": "active_substance_count",
                        "pattern_of_use": "daily_use_count",
                    }
                )
            )

            high_risk_patients = patient_risk[
                (patient_risk["active_substance_count"] >= 3)
                | (patient_risk["daily_use_count"] >= 1)
            ]

            return {
                "population_analysis": {
                    "total_patients": df["group_identifier"].nunique(),
                    "total_substance_records": len(df),
                    "patients_with_active_use": active_substances[
                        "group_identifier"
                    ].nunique(),
                    "high_risk_patients": len(high_risk_patients),
                },
                "most_common_substances": substance_counts.head(10).to_dict(),
                "usage_patterns": pattern_counts.to_dict(),
                "risk_indicators": {
                    "patients_with_multiple_substances": len(
                        patient_risk[patient_risk["active_substance_count"] >= 3]
                    ),
                    "patients_with_daily_use": len(
                        patient_risk[patient_risk["daily_use_count"] >= 1]
                    ),
                    "average_substances_per_patient": round(
                        patient_risk["active_substance_count"].mean(), 2
                    ),
                },
            }

        except Exception as e:
            return {"error": f"Failed to analyze substance patterns: {str(e)}"}

    @mcp.tool
    def get_high_risk_substance_users() -> List[Dict[str, Any]]:
        """
        Identify patients with high-risk substance use patterns

        Returns:
            List of patients flagged as high-risk based on substance use
        """
        try:
            result = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .execute()
            )

            if not result.data:
                return {"message": "No substance use data found"}  # type: ignore

            df = pd.DataFrame(result.data)
            active_df = df[df["use_flag"] == 1]

            # Define high-risk substances
            high_risk_substances = [
                "Heroin",
                "Cocaine (Powder)",
                "Crack Cocaine",
                "Crystal Meth",
                "Methadone",
                "Oxycontin",
                "Other Opiates",
            ]

            # Define high-risk patterns
            high_risk_patterns = ["daily", "continued", "continual"]

            high_risk_patients = []

            for patient_id in active_df["group_identifier"].unique():
                patient_data = active_df[active_df["group_identifier"] == patient_id]

                # Risk factors
                uses_high_risk_substances = (
                    patient_data["substance"].isin(high_risk_substances).any()
                )
                has_daily_use = (
                    patient_data["pattern_of_use"]
                    .str.lower()
                    .isin(high_risk_patterns)
                    .any()
                )
                multiple_substances = len(patient_data) >= 3

                risk_score = 0
                risk_factors = []

                if uses_high_risk_substances:
                    risk_score += 3
                    risk_factors.append("Uses high-risk substances")

                if has_daily_use:
                    risk_score += 2
                    risk_factors.append("Daily/continued use pattern")

                if multiple_substances:
                    risk_score += 1
                    risk_factors.append("Multiple active substances")

                if risk_score >= 2:  # Threshold for high risk
                    high_risk_patients.append(
                        {
                            "patient_id": patient_id,
                            "risk_score": risk_score,
                            "risk_factors": risk_factors,
                            "active_substances": patient_data["substance"].tolist(),
                            "substance_count": len(patient_data),
                        }
                    )

            # Sort by risk score
            high_risk_patients.sort(key=lambda x: x["risk_score"], reverse=True)

            return {
                "high_risk_patient_count": len(high_risk_patients),
                "patients": high_risk_patients,
                "risk_criteria": {
                    "high_risk_substances": high_risk_substances,
                    "high_risk_patterns": high_risk_patterns,
                    "scoring": "High-risk substances: +3, Daily use: +2, Multiple substances: +1",
                },
            }  # type: ignore

        except Exception as e:
            return {"error": f"Failed to identify high-risk patients: {str(e)}"}  # type: ignore

    @mcp.tool
    def compare_substance_use_by_assessment_scores(
        assessment_type: str = "ptsd",
    ) -> Dict[str, Any]:
        """
        Compare substance use patterns with mental health assessment scores

        Args:
            assessment_type: Type of assessment to compare (ptsd, phq, gad, who)

        Returns:
            Correlation analysis between substance use and assessment scores
        """
        try:
            if assessment_type not in ["ptsd", "phq", "gad", "who"]:
                return {
                    "error": "Invalid assessment type. Choose from: ptsd, phq, gad, who"
                }

            # Get substance use data
            substance_result = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .execute()
            )

            # Get assessment data
            assessment_result = (
                supabase.table(HEALTHCARE_TABLES[assessment_type]).select("*").execute()
            )

            if not substance_result.data or not assessment_result.data:
                return {
                    "message": f"Insufficient data for {assessment_type} and substance use comparison"
                }

            substance_df = pd.DataFrame(substance_result.data)
            assessment_df = pd.DataFrame(assessment_result.data)

            # Calculate substance use metrics per patient
            substance_metrics = (
                substance_df[substance_df["use_flag"] == 1]
                .groupby("group_identifier")
                .agg(
                    {
                        "substance": "count",
                        "pattern_of_use": lambda x: (x.str.lower() == "daily").sum(),
                    }
                )
                .rename(
                    columns={
                        "substance": "active_substance_count",
                        "pattern_of_use": "daily_use_count",
                    }
                )
            )

            # Get latest assessment scores per patient
            latest_assessments = (
                assessment_df.sort_values("assessment_date", ascending=False)
                .groupby("group_identifier")
                .first()
            )

            # Merge datasets
            merged_data = substance_metrics.join(latest_assessments, how="inner")

            if len(merged_data) == 0:
                return {
                    "message": "No patients found with both substance use and assessment data"
                }

            # Calculate correlations and comparisons
            analysis = {
                "patient_count": len(merged_data),
                "substance_use_vs_scores": {},
                "high_vs_low_substance_use": {},
            }

            # Identify score columns (numeric columns excluding identifiers)
            score_columns = [
                col
                for col in merged_data.columns
                if col not in ["group_identifier", "assessment_date", "unique_id"]
            ]
            numeric_columns = (
                merged_data[score_columns].select_dtypes(include=["number"]).columns
            )

            if len(numeric_columns) > 0:
                # Compare high vs low substance use groups
                high_substance_use = merged_data[
                    merged_data["active_substance_count"] >= 3
                ]
                low_substance_use = merged_data[
                    merged_data["active_substance_count"] <= 1
                ]

                for col in numeric_columns:
                    if (
                        high_substance_use[col].notna().any()
                        and low_substance_use[col].notna().any()
                    ):
                        analysis["high_vs_low_substance_use"][col] = {
                            "high_substance_use_avg": float(
                                high_substance_use[col].mean()
                            ),
                            "low_substance_use_avg": float(
                                low_substance_use[col].mean()
                            ),
                            "difference": float(
                                high_substance_use[col].mean()
                                - low_substance_use[col].mean()
                            ),
                        }

            return analysis

        except Exception as e:
            return {
                "error": f"Failed to compare substance use with {assessment_type} scores: {str(e)}"
            }  # type: ignore

    @mcp.tool
    def get_substance_use_timeline(patient_id: str) -> Dict[str, Any]:
        """
        Get substance use history timeline for a patient (note: limited by available data structure)

        Args:
            patient_id: Patient group identifier

        Returns:
            Current substance use profile (historical timeline not available in current data structure)
        """
        try:
            # Note: Current data structure doesn't include timestamps for substance use changes
            # This tool provides current status and suggests data collection improvements

            substance_data = get_patient_substance_history(patient_id)  # type: ignore

            if "error" in substance_data:
                return substance_data

            return {
                "patient_id": patient_id,
                "note": "Current data structure provides snapshot of substance use status, not historical timeline",
                "current_status": substance_data,
                "recommendations": [
                    "Consider adding timestamp fields to substance use records",
                    "Implement longitudinal tracking for substance use changes",
                    "Link substance use records to assessment dates for temporal analysis",
                ],
            }

        except Exception as e:
            return {"error": f"Failed to generate substance use timeline: {str(e)}"}  # type: ignore

    return mcp
