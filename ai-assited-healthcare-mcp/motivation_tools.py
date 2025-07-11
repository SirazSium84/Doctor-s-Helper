"""
Motivation themes extraction tools for Healthcare MCP Server
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import json
import re
from collections import defaultdict, Counter
from fastmcp import FastMCP
from config import supabase, HEALTHCARE_TABLES


def create_motivation_tools(mcp: FastMCP):
    """Create motivation-related MCP tools"""

    # Theme categories and their associated keywords
    THEME_KEYWORDS = {
        "Recovery": [
            "recovery",
            "sobriety",
            "sober",
            "clean",
            "quit",
            "stop using",
            "abstinence",
            "detox",
            "rehab",
            "treatment",
        ],
        "Family": [
            "family",
            "kids",
            "children",
            "son",
            "daughter",
            "spouse",
            "wife",
            "husband",
            "mother",
            "father",
            "parent",
            "relationship",
        ],
        "Health": [
            "health",
            "medical",
            "doctor",
            "hospital",
            "medication",
            "therapy",
            "wellness",
            "physical",
            "mental health",
        ],
        "Employment": [
            "work",
            "job",
            "employment",
            "career",
            "income",
            "money",
            "financial",
            "support",
            "boss",
            "workplace",
        ],
        "Education": [
            "school",
            "education",
            "learn",
            "study",
            "training",
            "degree",
            "college",
            "university",
            "class",
        ],
        "Financial": [
            "money",
            "financial",
            "budget",
            "debt",
            "bills",
            "housing",
            "rent",
            "support",
            "income",
            "stability",
        ],
        "Social": [
            "friends",
            "support",
            "community",
            "social",
            "people",
            "connection",
            "lonely",
            "isolation",
            "peer",
        ],
        "Mental Health": [
            "depression",
            "anxiety",
            "stress",
            "mood",
            "emotion",
            "feelings",
            "therapy",
            "counseling",
            "mental",
        ],
        "Independence": [
            "independent",
            "freedom",
            "control",
            "own",
            "self",
            "autonomy",
            "responsibility",
            "myself",
        ],
        "Spiritual": [
            "faith",
            "god",
            "spiritual",
            "religion",
            "prayer",
            "higher power",
            "values",
            "belief",
            "meaning",
        ],
        "Future": [
            "future",
            "goals",
            "dreams",
            "hope",
            "plan",
            "tomorrow",
            "better",
            "improve",
            "change",
        ],
        "Support": [
            "help",
            "support",
            "assistance",
            "guidance",
            "counselor",
            "therapist",
            "group",
            "meeting",
        ],
    }

    # Color palette for themes
    THEME_COLORS = {
        "Recovery": "#3B82F6",  # Blue
        "Family": "#10B981",  # Green
        "Health": "#EF4444",  # Red
        "Employment": "#F59E0B",  # Orange
        "Education": "#8B5CF6",  # Purple
        "Financial": "#06B6D4",  # Cyan
        "Social": "#84CC16",  # Lime
        "Mental Health": "#EC4899",  # Pink
        "Independence": "#F97316",  # Orange-red
        "Spiritual": "#6366F1",  # Indigo
        "Future": "#14B8A6",  # Teal
        "Support": "#A855F7",  # Violet
    }

    def extract_themes_from_text(
        text: str, patient_context: Optional[dict] = None
    ) -> Dict[str, List[str]]:
        """Extract motivation themes from text content"""
        if not text or not isinstance(text, str):
            return {}

        text_lower = text.lower()
        themes_found = defaultdict(list)

        for theme, keywords in THEME_KEYWORDS.items():
            for keyword in keywords:
                # Use word boundaries to avoid partial matches
                pattern = r"\b" + re.escape(keyword) + r"\b"
                matches = re.finditer(pattern, text_lower)
                for match in matches:
                    # Extract sample quote (5 words before and after)
                    start = max(0, match.start() - 30)
                    end = min(len(text), match.end() + 30)
                    quote = text[start:end].strip()
                    if len(quote.split()) >= 3:  # Minimum 3 words
                        themes_found[theme].append(quote)

        return dict(themes_found)

    def extract_themes_from_json(json_data: Any) -> Dict[str, List[str]]:
        """Extract themes from JSON structure"""
        if not json_data:
            return {}

        themes_found = defaultdict(list)

        try:
            if isinstance(json_data, str):
                data = json.loads(json_data)
            else:
                data = json_data

            # Recursively search through JSON structure
            def search_json(obj, path=""):
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        new_path = f"{path}.{key}" if path else key
                        if isinstance(value, str):
                            extracted = extract_themes_from_text(value)
                            for theme, quotes in extracted.items():
                                themes_found[theme].extend(
                                    [f"({key}): {q}" for q in quotes]
                                )
                        else:
                            search_json(value, new_path)
                elif isinstance(obj, list):
                    for i, item in enumerate(obj):
                        search_json(item, f"{path}[{i}]")
                elif isinstance(obj, str):
                    extracted = extract_themes_from_text(obj)
                    for theme, quotes in extracted.items():
                        themes_found[theme].extend(quotes)

            search_json(data)
        except (json.JSONDecodeError, TypeError):
            # If it's not valid JSON, treat as text
            extracted = extract_themes_from_text(str(json_data))
            for theme, quotes in extracted.items():
                themes_found[theme].extend(quotes)

        return dict(themes_found)

    def analyze_assessment_scores_for_themes(patient_data: dict) -> Dict[str, int]:
        """Analyze assessment scores to infer motivation themes"""
        themes_from_scores = defaultdict(int)

        # BPS scores analysis
        if "bps_family" in patient_data and patient_data["bps_family"]:
            try:
                family_score = float(patient_data["bps_family"])
                if family_score >= 3:  # High family motivation
                    themes_from_scores["Family"] += 2
            except (ValueError, TypeError):
                pass

        if "bps_employment" in patient_data and patient_data["bps_employment"]:
            try:
                employment_score = float(patient_data["bps_employment"])
                if employment_score >= 3:  # High employment motivation
                    themes_from_scores["Employment"] += 2
            except (ValueError, TypeError):
                pass

        if "bps_peer_support" in patient_data and patient_data["bps_peer_support"]:
            try:
                peer_score = float(patient_data["bps_peer_support"])
                if peer_score >= 3:  # High peer support
                    themes_from_scores["Social"] += 2
            except (ValueError, TypeError):
                pass

        if "bps_mh" in patient_data and patient_data["bps_mh"]:
            try:
                mh_score = float(patient_data["bps_mh"])
                if mh_score >= 3:  # High mental health focus
                    themes_from_scores["Mental Health"] += 2
            except (ValueError, TypeError):
                pass

        return dict(themes_from_scores)

    def analyze_ahcm_for_themes(ahcm_data: dict) -> Dict[str, List[str]]:
        """Analyze AHCM data for motivation themes"""
        themes_found = defaultdict(list)

        # Employment goals
        if ahcm_data.get("want_work_help") and str(
            ahcm_data["want_work_help"]
        ).lower() in ["yes", "true", "1"]:
            themes_found["Employment"].append("Wants help with work/employment")

        # Educational aspirations
        if ahcm_data.get("want_school_help") and str(
            ahcm_data["want_school_help"]
        ).lower() in ["yes", "true", "1"]:
            themes_found["Education"].append("Wants help with school/education")

        # Social connection needs
        if ahcm_data.get("feel_lonely") and str(ahcm_data["feel_lonely"]).lower() in [
            "yes",
            "true",
            "1",
        ]:
            themes_found["Social"].append("Feels lonely, needs social connection")

        # Financial motivation
        if ahcm_data.get("financial_strain") and str(
            ahcm_data["financial_strain"]
        ).lower() in ["yes", "true", "1"]:
            themes_found["Financial"].append("Experiencing financial strain")

        return dict(themes_found)

    def calculate_word_cloud_size(
        count: int, max_count: int, min_size: int = 12, max_size: int = 32
    ) -> int:
        """Calculate word cloud size based on frequency"""
        if max_count == 0:
            return min_size

        ratio = count / max_count
        size = min_size + (max_size - min_size) * ratio
        return max(min_size, min(max_size, int(size)))

    @mcp.tool
    def get_motivation_themes(patient_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract motivation themes from patient data for word cloud visualization

        Args:
            patient_id: Optional patient group identifier. If provided, returns themes for specific patient.
                       If None, returns aggregated themes across all patients.

        Returns:
            Motivation themes with counts, percentages, colors, and sample quotes for word cloud display
        """
        try:
            all_themes = defaultdict(list)
            total_patients = 0
            patients_with_data = 0
            data_sources_used = []

            if patient_id:
                # Single patient analysis
                patient_filter = {"group_identifier": patient_id}
                total_patients = 1
            else:
                # All patients analysis
                patient_filter = {}

            # Analyze BPS data
            try:
                bps_query = supabase.table(HEALTHCARE_TABLES["bps"]).select("*")
                if patient_id:
                    bps_query = bps_query.eq("group_identifier", patient_id)

                bps_result = bps_query.execute()

                if bps_result.data:
                    data_sources_used.append("BPS")

                    for record in bps_result.data:
                        patient_has_data = False

                        # Analyze external motivation text
                        if record.get("ext_motivation"):
                            themes = extract_themes_from_text(record["ext_motivation"])
                            for theme, quotes in themes.items():
                                all_themes[theme].extend(quotes)
                                patient_has_data = True

                        # Analyze internal motivation JSON
                        if record.get("int_motivation"):
                            themes = extract_themes_from_json(record["int_motivation"])
                            for theme, quotes in themes.items():
                                all_themes[theme].extend(quotes)
                                patient_has_data = True

                        # Analyze assessment scores
                        score_themes = analyze_assessment_scores_for_themes(record)
                        for theme, weight in score_themes.items():
                            # Add implicit themes based on scores
                            all_themes[theme].extend(
                                [f"High {theme.lower()} motivation score"] * weight
                            )
                            patient_has_data = True

                        if patient_has_data:
                            patients_with_data += 1

                    if not patient_id:
                        total_patients = len(
                            set(
                                record.get("group_identifier")
                                for record in bps_result.data
                                if record.get("group_identifier")
                            )
                        )

            except Exception as e:
                print(f"Error analyzing BPS data: {str(e)}")

            # Analyze PHP data
            try:
                php_query = supabase.table(
                    HEALTHCARE_TABLES["extracted_assessments"]
                ).select("*")
                if patient_id:
                    php_query = php_query.eq("group_identifier", patient_id)

                php_result = php_query.execute()

                if php_result.data:
                    data_sources_used.append("PHP")

                    for record in php_result.data:
                        patient_has_data = False

                        # Analyze emotion words
                        if record.get("matched_emotion_words"):
                            themes = extract_themes_from_text(
                                record["matched_emotion_words"]
                            )
                            for theme, quotes in themes.items():
                                all_themes[theme].extend(quotes)
                                patient_has_data = True

                        # Analyze skill words
                        if record.get("match_skill_words"):
                            themes = extract_themes_from_text(
                                record["match_skill_words"]
                            )
                            for theme, quotes in themes.items():
                                all_themes[theme].extend(quotes)
                                patient_has_data = True

                        # Analyze support words
                        if record.get("match_support_words"):
                            themes = extract_themes_from_text(
                                record["match_support_words"]
                            )
                            for theme, quotes in themes.items():
                                all_themes[theme].extend(quotes)
                                patient_has_data = True

                        # Values-based motivation
                        if record.get("values") and record["values"]:
                            all_themes["Spiritual"].append(
                                "Values-based motivation indicated"
                            )
                            patient_has_data = True

                        if patient_has_data:
                            patients_with_data += 1

            except Exception as e:
                print(f"Error analyzing PHP data: {str(e)}")

            # Analyze AHCM data
            try:
                ahcm_query = supabase.table(HEALTHCARE_TABLES["ahcm"]).select("*")
                if patient_id:
                    ahcm_query = ahcm_query.eq("group_identifier", patient_id)

                ahcm_result = ahcm_query.execute()

                if ahcm_result.data:
                    data_sources_used.append("AHCM")

                    for record in ahcm_result.data:
                        themes = analyze_ahcm_for_themes(record)
                        patient_has_data = False

                        for theme, quotes in themes.items():
                            all_themes[theme].extend(quotes)
                            patient_has_data = True

                        if patient_has_data:
                            patients_with_data += 1

            except Exception as e:
                print(f"Error analyzing AHCM data: {str(e)}")

            # Process themes for output
            theme_counts = {}
            for theme, quotes in all_themes.items():
                # Remove duplicates while preserving order
                unique_quotes = []
                seen = set()
                for quote in quotes:
                    if quote.lower() not in seen:
                        unique_quotes.append(quote)
                        seen.add(quote.lower())

                theme_counts[theme] = {
                    "count": len(quotes),
                    "unique_quotes": unique_quotes[:3],  # Limit to 3 sample quotes
                }

            # Calculate total mentions
            total_mentions = sum(data["count"] for data in theme_counts.values())

            if total_mentions == 0:
                return {
                    "themes": [],
                    "metadata": {
                        "total_patients": total_patients,
                        "patients_with_motivation_data": patients_with_data,
                        "coverage_percentage": 0.0,
                        "data_sources": data_sources_used,
                        "analysis_date": datetime.now().isoformat(),
                        "message": "No motivation themes found in available data",
                    },
                }

            # Find max count for sizing
            max_count = (
                max(data["count"] for data in theme_counts.values())
                if theme_counts
                else 1
            )

            # Format themes for output
            formatted_themes = []
            for theme, data in sorted(
                theme_counts.items(), key=lambda x: x[1]["count"], reverse=True
            ):
                percentage = (
                    (data["count"] / total_mentions) * 100 if total_mentions > 0 else 0
                )
                size = calculate_word_cloud_size(data["count"], max_count)

                formatted_themes.append(
                    {
                        "name": theme,
                        "count": data["count"],
                        "percentage": round(percentage, 1),
                        "color": THEME_COLORS.get(theme, "#6B7280"),  # Default gray
                        "size": size,
                        "sample_quotes": data["unique_quotes"],
                    }
                )

            # Calculate coverage percentage
            coverage_percentage = (
                (patients_with_data / total_patients * 100) if total_patients > 0 else 0
            )

            return {
                "themes": formatted_themes,
                "metadata": {
                    "total_patients": total_patients,
                    "patients_with_motivation_data": patients_with_data,
                    "coverage_percentage": round(coverage_percentage, 1),
                    "data_sources": data_sources_used,
                    "analysis_date": datetime.now().isoformat(),
                    "total_theme_mentions": total_mentions,
                },
            }

        except Exception as e:
            return {
                "error": f"Failed to extract motivation themes: {str(e)}",
                "themes": [],
                "metadata": {
                    "total_patients": 0,
                    "patients_with_motivation_data": 0,
                    "coverage_percentage": 0.0,
                    "data_sources": [],
                    "analysis_date": datetime.now().isoformat(),
                },
            }

    return mcp
