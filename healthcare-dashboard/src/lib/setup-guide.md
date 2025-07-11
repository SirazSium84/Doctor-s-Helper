# Healthcare Dashboard Supabase Integration Setup

This guide explains how to connect your healthcare dashboard to real data using the MCP server and Supabase.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with healthcare data
2. **MCP Server**: The healthcare MCP server in `../ai-assited-healthcare`
3. **Environment Variables**: Proper configuration for both projects

## Setup Steps

### 1. Configure Environment Variables

Create a `.env.local` file in the healthcare-dashboard root with:

```env
# MCP Server Configuration  
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_ENABLED=true

# Supabase Configuration
SUPABASE_URL=your_actual_supabase_url
SUPABASE_KEY=your_actual_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Configure MCP Server

Navigate to the MCP server directory and create/update the `.env` file:

```bash
cd ../ai-assited-healthcare
```

Create `.env` file with your Supabase credentials:

```env
SUPABASE_URL=your_actual_supabase_url
SUPABASE_KEY=your_actual_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
MCP_SERVER_NAME=healthcare-dashboard
MCP_SERVER_VERSION=1.0.0
```

### 3. Start the MCP Server

```bash
# From the ai-assited-healthcare directory
bash ../healthcare-dashboard/scripts/start-mcp-server.sh
```

### 4. Test the Connection

Once both servers are running:

- Dashboard: http://localhost:3000
- MCP Server: http://localhost:3001

## Data Flow

1. **Dashboard** → **API Routes** → **MCP Client** → **MCP Server** → **Supabase**
2. **Real patient data** is fetched from Supabase tables: PTSD, PHQ, GAD, WHO, DERS
3. **Data transformation** converts MCP format to dashboard format
4. **Fallback mode** uses mock data if MCP server is unavailable

## Available MCP Tools

The MCP server provides these tools for fetching real healthcare data:

- `list_all_patients()` - Get all patient group identifiers
- `get_all_patient_assessments(patient_id)` - Get complete assessment data
- `get_patient_ptsd_scores(patient_id)` - PTSD assessment scores
- `get_patient_phq_scores(patient_id)` - PHQ-9 depression scores  
- `get_patient_gad_scores(patient_id)` - GAD-7 anxiety scores
- `get_patient_who_scores(patient_id)` - WHO-5 wellbeing scores
- `get_patient_ders_scores(patient_id)` - DERS emotion regulation scores

## Troubleshooting

### MCP Server Not Starting

1. Check Python environment: `python --version` (should be 3.8+)
2. Install dependencies: `pip install -r requirements.txt`  
3. Verify Supabase credentials in `.env`
4. Check port 3001 is available

### No Data Loading

1. Verify Supabase connection in MCP server logs
2. Check patient data exists in Supabase tables
3. Enable console logging to see API calls
4. Test individual MCP tools

### Authentication Issues

1. Verify SUPABASE_SERVICE_ROLE_KEY is correct
2. Check table permissions in Supabase
3. Ensure RLS policies allow access

## Current Status

✅ API Routes Created
✅ MCP Client Integration
✅ Data Transformation Layer
✅ Fallback to Mock Data
🔄 Environment Configuration (manual setup required)
🔄 MCP Server Connection (requires Supabase credentials)

## Next Steps

1. **Update Environment Variables**: Add your real Supabase credentials
2. **Start MCP Server**: Use the setup script to launch the MCP server
3. **Test Real Data**: Verify the dashboard loads real patient data
4. **Production Deploy**: Configure for production environment 