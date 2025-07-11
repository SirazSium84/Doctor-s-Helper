# PHP Emotional Analytics - Supabase Setup Guide

## 🎯 Overview

The PHP Emotional Analytics page can connect to your real Supabase database to display live patient data. Currently, it's showing demo data with realistic patterns to demonstrate the functionality.

## 🔧 Quick Setup

### 1. Create Environment File

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service role key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy the **Project URL** and **anon/public key**

### 3. Verify PHP Table Schema

Your Supabase database should have a `PHP` table with this structure:

```sql
CREATE TABLE public.PHP (
  unique_id text PRIMARY KEY,
  group_identifier text,
  assessment_date text,
  matched_emotion_words text,
  match_skill_words text,
  match_support_words text,
  craving text,
  
  -- Emotional states (boolean)
  pain boolean,
  sad boolean,
  content boolean,
  anger boolean,
  shame boolean,
  fear boolean,
  joy boolean,
  anxiety boolean,
  depressed boolean,
  alone boolean,
  
  -- Coping skills (boolean)
  mindfulnessmeditation boolean,
  distress_tolerance boolean,
  opposite_action boolean,
  take_my_meds boolean,
  ask_for_help boolean,
  improve_moment boolean,
  parts_work boolean,
  play_the_tape_thru boolean,
  values boolean,
  
  -- Self-care activities (boolean)
  sleep boolean,
  nutrition boolean,
  exercise boolean,
  fun boolean,
  connection boolean,
  warmth boolean,
  water boolean,
  love boolean,
  therapy boolean
);
```

## 📊 Data Requirements

### Required Fields
- `unique_id`: Unique identifier for each assessment
- `group_identifier`: Patient identifier
- `assessment_date`: Date of assessment (YYYY-MM-DD format)

### Optional Fields
- **Emotional states**: Boolean values for 10 emotional states
- **Coping skills**: Boolean values for 9 therapeutic techniques
- **Self-care activities**: Boolean values for 9 wellness activities
- **Text fields**: Free-text emotion, skill, and support descriptors

## 🔍 Testing the Connection

1. **Start your application**: `npm run dev`
2. **Navigate to PHP Emotional Analytics tab**
3. **Check browser console** for connection status:
   - ✅ `Successfully fetched X PHP assessments from Supabase` = Live data
   - ⚠️ `Supabase environment variables not configured` = Missing .env.local
   - ❌ `Supabase PHP table error` = Table doesn't exist or access denied

## 📈 What You'll See

### With Live Data
- Green indicator: "Live Data"
- Real patient assessments from your Supabase
- Actual emotional progression and therapeutic outcomes

### With Demo Data
- Amber indicator: "Demo Data"  
- Realistic simulated assessments showing:
  - 13 patients (AHCM, BPS, IOP programs)
  - 8-15 assessments per patient
  - Progressive improvement over time
  - Varied emotional baselines and recovery trajectories

## 🛠 Troubleshooting

### Environment Variables Not Loading
```bash
# Restart your development server after creating .env.local
npm run dev
```

### Supabase Connection Issues
1. Verify your project URL and API key
2. Check that the PHP table exists
3. Ensure Row Level Security (RLS) policies allow reads
4. Test connection with a simple query in Supabase SQL editor

### No Data in PHP Table
The demo data generator creates realistic patterns:
- Weekly assessments over 3 months
- Gradual emotional improvement
- Increasing coping skills usage
- Progressive self-care adoption

## 🎯 Analytics Features

Once connected, you'll see:

### Emotional State Analytics
- Risk scoring based on positive/negative emotion ratios
- Trend analysis showing progress over time
- Current emotional profile radar chart

### Coping Skills Monitoring
- Utilization rates for therapeutic techniques
- Most/least used skills identification
- Skills adoption progression

### Self-Care Tracking
- Completion rates for wellness activities
- Activity breakdown visualization
- Self-care consistency patterns

### Clinical Insights
- Automated risk assessment
- Progress indicators
- Intervention recommendations

## 🚀 Ready to Go!

After setup, your PHP Emotional Analytics will automatically:
1. Connect to live Supabase data
2. Fall back to demo data if connection fails
3. Show clear indicators of data source
4. Provide comprehensive emotional health analytics

Need help? Check the browser console for detailed connection status and troubleshooting guidance. 