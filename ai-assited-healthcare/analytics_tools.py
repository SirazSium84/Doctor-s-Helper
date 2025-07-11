"""
Analytics tools for healthcare assessment data analysis
"""

import pandas as pd
from typing import Dict, Any, List
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES


def create_analytics_tools(mcp: FastMCP):
    """Create analytics tools for patient assessment analysis"""

    def safe_float_conversion(value, default=0.0):
        """Safely convert a value to float, handling strings and None"""
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    def safe_int_conversion(value, default=0):
        """Safely convert a value to int, handling strings and None"""
        if value is None:
            return default
        try:
            return int(float(value))  # Convert to float first to handle "1.0" strings
        except (ValueError, TypeError):
            return default

    def get_assessment_score_columns(assessment_type: str, df_columns: list) -> list:
        """Get the correct column names for each assessment type based on actual schema"""
        if assessment_type == "ptsd":
            # PTSD uses ptsd_q{i}_{description} pattern for questions 1-20
            return [
                col
                for col in df_columns
                if col.startswith("ptsd_q") and not col == "assessment_date"
            ]
        elif assessment_type == "phq":
            # PHQ uses col_{i}_{description} pattern, col_1 through col_9 (col_10 is difficulty rating)
            return [
                col
                for col in df_columns
                if col.startswith("col_")
                and any(col.startswith(f"col_{i}_") for i in range(1, 10))
            ]
        elif assessment_type == "gad":
            # GAD uses col_{i}_{description} pattern for questions 1-7
            return [
                col
                for col in df_columns
                if col.startswith("col_")
                and any(col.startswith(f"col_{i}_") for i in range(1, 8))
            ]
        elif assessment_type == "who":
            # WHO uses col_{i}_{description} pattern for questions 1-5
            return [
                col
                for col in df_columns
                if col.startswith("col_")
                and any(col.startswith(f"col_{i}_") for i in range(1, 6))
            ]
        else:
            return []

    @mcp.tool
    def analyze_patient_progress(
        patient_id: str, assessment_type: str = "all"
    ) -> Dict[str, Any]:
        """
        Analyze patient progress over time for specific assessment types

        Args:
            patient_id: Patient group identifier
            assessment_type: Type of assessment to analyze (ptsd, phq, gad, who, all)

        Returns:
            Progress analysis with trends and recommendations
        """
        try:
            if assessment_type not in ["ptsd", "phq", "gad", "who", "all"]:
                return {
                    "error": "Invalid assessment type. Choose from: ptsd, phq, gad, who, all"
                }

            progress_analysis = {
                "patient_id": patient_id,
                "assessment_type": assessment_type,
                "assessments": {},
            }

            assessment_types = (
                ["ptsd", "phq", "gad", "who"]
                if assessment_type == "all"
                else [assessment_type]
            )

            for atype in assessment_types:
                table_name = HEALTHCARE_TABLES[atype]

                # Get all assessments for this patient
                result = (
                    supabase.table(table_name)
                    .select("*")
                    .eq("group_identifier", patient_id)
                    .order("assessment_date", desc=False)
                    .execute()
                )

                if not result.data:
                    progress_analysis["assessments"][atype] = {
                        "message": f"No {atype} assessments found"
                    }
                    continue

                df = pd.DataFrame(result.data)
                df["assessment_date"] = pd.to_datetime(
                    df["assessment_date"], errors="coerce"
                )

                # Get the correct score columns for this assessment type
                score_cols = get_assessment_score_columns(atype, df.columns.tolist())

                if score_cols:
                    # Convert scores to numeric, handling string values
                    for col in score_cols:
                        df[col] = df[col].apply(safe_float_conversion)

                    df["total_score"] = df[score_cols].sum(axis=1)

                    # Calculate trends
                    if len(df) >= 2:
                        first_score = df.iloc[0]["total_score"]
                        latest_score = df.iloc[-1]["total_score"]
                        change = latest_score - first_score
                        percent_change = (
                            (change / first_score) * 100 if first_score > 0 else 0
                        )

                        trend = (
                            "improving"
                            if change < 0
                            else "stable" if abs(change) <= 1 else "declining"
                        )
                    else:
                        change = 0
                        percent_change = 0
                        trend = "insufficient_data"

                    trends = {
                        "total_assessments": len(df),
                        "first_score": float(df.iloc[0]["total_score"]),
                        "latest_score": float(df.iloc[-1]["total_score"]),
                        "change": float(change),
                        "percent_change": round(percent_change, 1),
                        "trend": trend,
                    }

                    progress_analysis["assessments"][atype] = {
                        "scores": df[["assessment_date", "total_score"]].to_dict(
                            "records"
                        ),
                        "date_range": {
                            "first_assessment": df.iloc[0][
                                "assessment_date"
                            ].isoformat(),
                            "latest_assessment": df.iloc[-1][
                                "assessment_date"
                            ].isoformat(),
                            "days_between": (
                                df.iloc[-1]["assessment_date"]
                                - df.iloc[0]["assessment_date"]
                            ).days,
                        },
                        "trends": trends,
                    }

            return progress_analysis

        except Exception as e:
            return {"error": f"Failed to analyze patient progress: {str(e)}"}

    @mcp.tool
    def calculate_composite_risk_score(patient_id: str) -> Dict[str, Any]:
        """
        Calculate comprehensive risk score based on all available assessments and substance use

        Args:
            patient_id: Patient group identifier

        Returns:
            Composite risk assessment across all domains
        """
        try:
            risk_assessment = {
                "patient_id": patient_id,
                "risk_domains": {},
                "overall_risk": "unknown",
                "composite_score": 0.0,
                "domains_assessed": 0,
                "recommendations": [],
            }

            total_risk_score = 0
            domain_count = 0

            # PTSD Risk Assessment
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
                # Get PTSD score columns (ptsd_q1_ through ptsd_q20_)
                ptsd_cols = [
                    col for col in ptsd_data.keys() if col.startswith("ptsd_q")
                ]
                ptsd_scores = []
                for col in ptsd_cols:
                    score = safe_int_conversion(ptsd_data.get(col, 0))
                    ptsd_scores.append(score)

                ptsd_total = sum(ptsd_scores)

                ptsd_severity = (
                    "minimal"
                    if ptsd_total < 20
                    else (
                        "mild"
                        if ptsd_total < 40
                        else "moderate" if ptsd_total < 60 else "severe"
                    )
                )
                ptsd_risk = (
                    1
                    if ptsd_total < 20
                    else 2 if ptsd_total < 40 else 3 if ptsd_total < 60 else 4
                )

                risk_assessment["risk_domains"]["ptsd"] = {
                    "total_score": ptsd_total,
                    "severity": ptsd_severity,
                    "risk_level": ptsd_risk,
                    "assessment_date": ptsd_data.get("assessment_date"),
                    "questions_answered": len(ptsd_scores),
                }
                total_risk_score += ptsd_risk
                domain_count += 1

            # PHQ-9 Risk Assessment
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
                # Get PHQ score columns (col_1_ through col_9_, excluding col_10_ which is difficulty rating)
                phq_cols = [
                    col
                    for col in phq_data.keys()
                    if col.startswith("col_")
                    and any(col.startswith(f"col_{i}_") for i in range(1, 10))
                ]
                phq_scores = []
                for col in phq_cols:
                    score = safe_int_conversion(phq_data.get(col, 0))
                    phq_scores.append(score)

                phq_total = sum(phq_scores)

                phq_severity = (
                    "minimal"
                    if phq_total < 5
                    else (
                        "mild"
                        if phq_total < 10
                        else (
                            "moderate"
                            if phq_total < 15
                            else "moderately_severe" if phq_total < 20 else "severe"
                        )
                    )
                )
                phq_risk = (
                    1
                    if phq_total < 5
                    else 2 if phq_total < 10 else 3 if phq_total < 15 else 4
                )

                risk_assessment["risk_domains"]["depression"] = {
                    "total_score": phq_total,
                    "severity": phq_severity,
                    "risk_level": phq_risk,
                    "assessment_date": phq_data.get("assessment_date"),
                    "questions_answered": len(phq_scores),
                }
                total_risk_score += phq_risk
                domain_count += 1

            # GAD-7 Risk Assessment
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
                # Get GAD score columns (col_1_ through col_7_)
                gad_cols = [
                    col
                    for col in gad_data.keys()
                    if col.startswith("col_")
                    and any(col.startswith(f"col_{i}_") for i in range(1, 8))
                ]
                gad_scores = []
                for col in gad_cols:
                    score = safe_int_conversion(gad_data.get(col, 0))
                    gad_scores.append(score)

                gad_total = sum(gad_scores)

                gad_severity = (
                    "minimal"
                    if gad_total < 5
                    else (
                        "mild"
                        if gad_total < 10
                        else "moderate" if gad_total < 15 else "severe"
                    )
                )
                gad_risk = (
                    1
                    if gad_total < 5
                    else 2 if gad_total < 10 else 3 if gad_total < 15 else 4
                )

                risk_assessment["risk_domains"]["anxiety"] = {
                    "total_score": gad_total,
                    "severity": gad_severity,
                    "risk_level": gad_risk,
                    "assessment_date": gad_data.get("assessment_date"),
                    "questions_answered": len(gad_scores),
                }
                total_risk_score += gad_risk
                domain_count += 1

            # WHO-5 Wellbeing Assessment (reverse scoring - lower is worse)
            who_result = (
                supabase.table(HEALTHCARE_TABLES["who"])
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
                .limit(1)
                .execute()
            )
            if who_result.data:
                who_data = who_result.data[0]
                # Get WHO score columns (col_1_ through col_5_)
                who_cols = [
                    col
                    for col in who_data.keys()
                    if col.startswith("col_")
                    and any(col.startswith(f"col_{i}_") for i in range(1, 6))
                ]
                who_scores = []
                for col in who_cols:
                    score = safe_int_conversion(who_data.get(col, 0))
                    who_scores.append(score)

                who_total = sum(who_scores)

                # WHO-5 scoring: multiply by 4 to get 0-100 scale, lower scores indicate poorer wellbeing
                who_scaled = who_total * 4
                who_severity = (
                    "poor_wellbeing"
                    if who_scaled <= 52  # 13*4
                    else (
                        "below_average" if who_scaled <= 68 else "good_wellbeing"
                    )  # 17*4
                )
                # Reverse risk for WHO (lower wellbeing = higher risk)
                who_risk = (
                    4
                    if who_scaled <= 52
                    else 3 if who_scaled <= 68 else 2 if who_scaled <= 84 else 1
                )

                risk_assessment["risk_domains"]["wellbeing"] = {
                    "total_score": who_total,
                    "scaled_score": who_scaled,
                    "severity": who_severity,
                    "risk_level": who_risk,
                    "assessment_date": who_data.get("assessment_date"),
                    "questions_answered": len(who_scores),
                }
                total_risk_score += who_risk
                domain_count += 1

            # Substance Use Risk Assessment
            substance_result = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .eq("group_identifier", patient_id)
                .execute()
            )
            if substance_result.data:
                active_substances = []
                for s in substance_result.data:
                    use_flag = safe_int_conversion(s.get("use_flag", 0))
                    if use_flag == 1:
                        active_substances.append(s)

                high_risk_substances = [
                    "Heroin",
                    "Cocaine (Powder)",
                    "Crack Cocaine",
                    "Crystal Meth",
                    "Oxycontin",
                    "Fentanyl",
                    "Methamphetamine",
                ]

                substance_risk = 1
                if len(active_substances) >= 3:
                    substance_risk += 1
                if any(
                    str(s.get("substance", "")).strip() in high_risk_substances
                    for s in active_substances
                ):
                    substance_risk += 2
                if any(
                    str(s.get("pattern_of_use", "")).lower().strip() == "daily"
                    for s in active_substances
                ):
                    substance_risk += 1

                substance_risk = min(substance_risk, 4)  # Cap at 4

                risk_assessment["risk_domains"]["substance_use"] = {
                    "active_substance_count": len(active_substances),
                    "has_high_risk_substances": any(
                        str(s.get("substance", "")).strip() in high_risk_substances
                        for s in active_substances
                    ),
                    "has_daily_use": any(
                        str(s.get("pattern_of_use", "")).lower().strip() == "daily"
                        for s in active_substances
                    ),
                    "risk_level": substance_risk,
                    "active_substances": [
                        s.get("substance", "Unknown") for s in active_substances
                    ],
                }
                total_risk_score += substance_risk
                domain_count += 1

            # Calculate overall risk
            if domain_count > 0:
                average_risk = total_risk_score / domain_count
                overall_risk = (
                    "low"
                    if average_risk < 2
                    else "moderate" if average_risk < 3 else "high"
                )

                risk_assessment["overall_risk"] = overall_risk
                risk_assessment["composite_score"] = round(average_risk, 2)
                risk_assessment["domains_assessed"] = domain_count
                risk_assessment["total_risk_score"] = total_risk_score
                risk_assessment["recommendations"] = generate_risk_recommendations(
                    risk_assessment
                )
            else:
                risk_assessment["error"] = (
                    "No assessment data found for risk calculation"
                )

            return risk_assessment

        except Exception as e:
            return {"error": f"Failed to calculate composite risk score: {str(e)}"}

    @mcp.tool
    def compare_patient_to_population(
        patient_id: str, assessment_type: str
    ) -> Dict[str, Any]:
        """
        Compare patient's latest scores to population averages

        Args:
            patient_id: Patient group identifier
            assessment_type: Type of assessment to compare (ptsd, phq, gad, who)

        Returns:
            Comparison of patient scores to population statistics
        """
        try:
            if assessment_type not in ["ptsd", "phq", "gad", "who"]:
                return {
                    "error": "Invalid assessment type. Choose from: ptsd, phq, gad, who"
                }

            table_name = HEALTHCARE_TABLES[assessment_type]

            # Get patient's latest assessment
            patient_result = (
                supabase.table(table_name)
                .select("*")
                .eq("group_identifier", patient_id)
                .order("assessment_date", desc=True)
                .limit(1)
                .execute()
            )

            if not patient_result.data:
                return {
                    "message": f"No {assessment_type} assessments found for patient {patient_id}"
                }

            # Get all population data
            population_result = supabase.table(table_name).select("*").execute()

            if not population_result.data:
                return {"error": f"No population data available for {assessment_type}"}

            patient_data = patient_result.data[0]
            population_df = pd.DataFrame(population_result.data)

            # Get the correct score columns for this assessment type
            score_cols = get_assessment_score_columns(
                assessment_type, list(patient_data.keys())
            )

            comparison = {
                "patient_id": patient_id,
                "assessment_type": assessment_type,
                "assessment_date": patient_data.get("assessment_date"),
                "population_size": len(population_df),
                "comparisons": {},
            }

            # Calculate patient total score
            patient_scores = [
                safe_float_conversion(patient_data.get(col, 0)) for col in score_cols
            ]
            patient_total = sum(patient_scores)

            # Calculate population total scores
            population_totals = []
            for _, row in population_df.iterrows():
                row_scores = [
                    safe_float_conversion(row.get(col, 0)) for col in score_cols
                ]
                population_totals.append(sum(row_scores))

            if population_totals:
                population_mean = sum(population_totals) / len(population_totals)
                population_std = (
                    sum((x - population_mean) ** 2 for x in population_totals)
                    / len(population_totals)
                ) ** 0.5
                population_median = sorted(population_totals)[
                    len(population_totals) // 2
                ]

                # Calculate percentile
                percentile = (
                    sum(1 for score in population_totals if score <= patient_total)
                    / len(population_totals)
                    * 100
                )

                # Z-score calculation
                z_score = (
                    (patient_total - population_mean) / population_std
                    if population_std > 0
                    else 0
                )

                comparison["comparisons"]["total_score"] = {
                    "patient_score": float(patient_total),
                    "population_mean": round(float(population_mean), 2),
                    "population_median": round(float(population_median), 2),
                    "population_std": round(float(population_std), 2),
                    "percentile": round(percentile, 1),
                    "z_score": round(z_score, 2),
                    "interpretation": interpret_z_score(z_score),
                }

            return comparison

        except Exception as e:
            return {"error": f"Failed to compare patient to population: {str(e)}"}

    @mcp.tool
    def identify_patients_needing_attention() -> Dict[str, Any]:
        """
        Identify patients who may need immediate clinical attention based on assessment scores

        Returns:
            Dictionary containing list of patients flagged for clinical review
        """
        try:
            flagged_patients = []

            # Check each assessment type for concerning scores
            for assessment_type in ["ptsd", "phq", "gad"]:
                table_name = HEALTHCARE_TABLES[assessment_type]

                # Get latest assessments for all patients
                result = supabase.table(table_name).select("*").execute()

                if not result.data:
                    continue

                df = pd.DataFrame(result.data)

                # Get latest assessment per patient
                df["assessment_date"] = pd.to_datetime(
                    df["assessment_date"], errors="coerce"
                )
                latest_assessments = (
                    df.sort_values("assessment_date", ascending=False)
                    .groupby("group_identifier")
                    .first()
                )

                # Get the correct score columns for this assessment type
                score_cols = get_assessment_score_columns(
                    assessment_type, latest_assessments.columns.tolist()
                )

                # Define concerning thresholds and calculate scores
                concerning_patients = pd.DataFrame()  # Initialize empty dataframe

                if score_cols:
                    # Convert to numeric first
                    for col in score_cols:
                        latest_assessments[col] = latest_assessments[col].apply(
                            safe_float_conversion
                        )

                    latest_assessments["total_score"] = latest_assessments[
                        score_cols
                    ].sum(axis=1)

                    # Apply thresholds based on assessment type
                    if assessment_type == "ptsd":
                        # High PTSD scores (PCL-5 >= 50)
                        concerning_patients = latest_assessments[
                            latest_assessments["total_score"] >= 50
                        ]
                    elif assessment_type == "phq":
                        # Severe depression (PHQ-9 >= 15)
                        concerning_patients = latest_assessments[
                            latest_assessments["total_score"] >= 15
                        ]
                    elif assessment_type == "gad":
                        # Severe anxiety (GAD-7 >= 15)
                        concerning_patients = latest_assessments[
                            latest_assessments["total_score"] >= 15
                        ]

                # Add to flagged patients
                for patient_id, row in concerning_patients.iterrows():
                    existing_patient = next(
                        (p for p in flagged_patients if p["patient_id"] == patient_id),
                        None,
                    )

                    assessment_info = {
                        "assessment_type": assessment_type,
                        "total_score": float(row["total_score"]),
                        "assessment_date": (
                            row["assessment_date"].isoformat()
                            if pd.notna(row["assessment_date"])
                            else None
                        ),
                    }

                    if existing_patient:
                        existing_patient["concerning_assessments"].append(
                            assessment_info
                        )
                        existing_patient["risk_level"] = (
                            int(existing_patient["risk_level"]) + 1
                        )
                    else:
                        flagged_patients.append(
                            {
                                "patient_id": str(patient_id),
                                "concerning_assessments": [assessment_info],
                                "risk_level": 1,
                            }
                        )

            # Sort by risk level (number of concerning assessments)
            flagged_patients.sort(key=lambda x: x["risk_level"], reverse=True)

            return {
                "flagged_patient_count": len(flagged_patients),
                "patients": flagged_patients,
                "criteria": {
                    "ptsd": "Total score >= 50 (PCL-5 threshold)",
                    "phq": "Total score >= 15 (severe depression)",
                    "gad": "Total score >= 15 (severe anxiety)",
                },
                "timestamp": pd.Timestamp.now().isoformat(),
            }

        except Exception as e:
            return {"error": f"Failed to identify patients needing attention: {str(e)}"}

    return mcp


def generate_risk_recommendations(risk_assessment: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on risk assessment"""
    recommendations = []

    overall_risk = risk_assessment.get("overall_risk", "unknown")

    if overall_risk == "high":
        recommendations.append("Immediate clinical review recommended")
        recommendations.append("Consider intensified treatment plan")
    elif overall_risk == "moderate":
        recommendations.append("Increased monitoring recommended")
        recommendations.append("Consider treatment plan adjustments")

    risk_domains = risk_assessment.get("risk_domains", {})

    if "ptsd" in risk_domains and risk_domains["ptsd"]["risk_level"] >= 3:
        recommendations.append(
            "PTSD-focused therapy recommended (PCL-5 score indicates significant symptoms)"
        )

    if "depression" in risk_domains and risk_domains["depression"]["risk_level"] >= 3:
        recommendations.append(
            "Depression treatment evaluation needed (PHQ-9 indicates moderate-severe depression)"
        )

    if "anxiety" in risk_domains and risk_domains["anxiety"]["risk_level"] >= 3:
        recommendations.append(
            "Anxiety management intervention suggested (GAD-7 indicates moderate-severe anxiety)"
        )

    if "wellbeing" in risk_domains and risk_domains["wellbeing"]["risk_level"] >= 3:
        recommendations.append(
            "Wellbeing support needed (WHO-5 indicates poor wellbeing)"
        )

    if (
        "substance_use" in risk_domains
        and risk_domains["substance_use"]["risk_level"] >= 3
    ):
        recommendations.append("Substance abuse treatment program recommended")

    if not recommendations:
        recommendations.append(
            "Continue current treatment plan with regular monitoring"
        )

    return recommendations


def interpret_z_score(z_score: float) -> str:
    """Interpret z-score in clinical context"""
    if abs(z_score) < 1:
        return "Within normal range"
    elif abs(z_score) < 2:
        return "Moderately elevated" if z_score > 0 else "Moderately below average"
    else:
        return (
            "Significantly elevated" if z_score > 0 else "Significantly below average"
        )
