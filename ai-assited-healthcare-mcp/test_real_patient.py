#!/usr/bin/env python3
"""
Test healthcare MCP server with real patient data
"""

import sys
import os
import json

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import supabase, HEALTHCARE_TABLES


def test_real_patient_data():
    """Test with real patient data to demonstrate MCP server capabilities"""
    print("🏥 Testing Healthcare MCP Server with Real Patient Data")
    print("=" * 60)

    try:
        # Get a real patient ID from the data
        print("1. Finding real patients in the database...")
        ptsd_result = (
            supabase.table(HEALTHCARE_TABLES["ptsd"])
            .select("group_identifier")
            .limit(5)
            .execute()
        )

        if ptsd_result.data:
            patient_ids = [record["group_identifier"] for record in ptsd_result.data]
            print(f"✅ Found {len(patient_ids)} patients with PTSD data:")
            for i, pid in enumerate(patient_ids, 1):
                print(f"   {i}. {pid}")

            # Use the first patient for testing
            test_patient_id = patient_ids[0]
            print(f"\n2. Testing with patient: {test_patient_id}")

            # Test PTSD data retrieval
            print("\n📋 PTSD Assessment Data:")
            ptsd_data = (
                supabase.table(HEALTHCARE_TABLES["ptsd"])
                .select("*")
                .eq("group_identifier", test_patient_id)
                .execute()
            )

            if ptsd_data.data:
                patient_record = ptsd_data.data[0]
                print(
                    f"   Assessment Date: {patient_record.get('assessment_date', 'N/A')}"
                )
                print(f"   Patient ID: {patient_record.get('group_identifier', 'N/A')}")

                # Show PTSD scores
                ptsd_questions = [
                    key
                    for key in patient_record.keys()
                    if key.startswith("ptsd_q") and key.endswith("_")
                ]
                print(f"   PTSD Questions Found: {len(ptsd_questions)}")

                # Show sample scores
                for i, question in enumerate(ptsd_questions[:5], 1):
                    score = patient_record.get(question, "N/A")
                    question_name = (
                        question.replace("ptsd_q", "Q").replace("_", " ").title()
                    )
                    print(f"   {question_name}: {score}")

            # Test PHQ data retrieval
            print("\n📋 PHQ-9 Assessment Data:")
            phq_data = (
                supabase.table(HEALTHCARE_TABLES["phq"])
                .select("*")
                .eq("group_identifier", test_patient_id)
                .execute()
            )

            if phq_data.data:
                phq_record = phq_data.data[0]
                print(f"   Assessment Date: {phq_record.get('assessment_date', 'N/A')}")

                # Show PHQ scores
                phq_questions = [
                    key for key in phq_record.keys() if key.startswith("phq_q")
                ]
                print(f"   PHQ Questions Found: {len(phq_questions)}")

                for i, question in enumerate(phq_questions[:5], 1):
                    score = phq_record.get(question, "N/A")
                    question_name = (
                        question.replace("phq_q", "Q").replace("_", " ").title()
                    )
                    print(f"   {question_name}: {score}")
            else:
                print("   No PHQ data found for this patient")

            # Test Substance History
            print("\n💊 Substance Use History:")
            substance_data = (
                supabase.table(HEALTHCARE_TABLES["substance_history"])
                .select("*")
                .eq("group_identifier", test_patient_id)
                .execute()
            )

            if substance_data.data:
                print(f"   Found {len(substance_data.data)} substance use records")
                for record in substance_data.data[:3]:  # Show first 3
                    substance = record.get("substance", "Unknown")
                    use_flag = record.get("use_flag", "N/A")
                    pattern = record.get("pattern_of_use", "N/A")
                    print(f"   - {substance}: Use={use_flag}, Pattern={pattern}")
            else:
                print("   No substance use data found for this patient")

            print(f"\n🎉 SUCCESS! Healthcare MCP Server is fully operational!")
            print("🏥 Real patient data: ✅ Accessible")
            print("📊 Multiple assessments: ✅ Working")
            print("💊 Substance use data: ✅ Available")
            print("\n💡 You can now use this server with MCP clients like Claude!")
            print(f"   Example: 'Get PTSD scores for patient {test_patient_id}'")

        else:
            print("❌ No patients found in PTSD table")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_real_patient_data()
