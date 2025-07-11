# Healthcare Dashboard with AI Assistant

A Next.js healthcare analytics dashboard with an integrated AI chat assistant powered by your FastMCP healthcare server.

## Features

- **AI Chat Assistant**: Powered by OpenAI GPT-4 with access to healthcare assessment tools
- **MCP Server Integration**: Connects to your FastMCP healthcare server for real-time data
- **Assessment Analytics**: Support for PTSD, PHQ-9, GAD-7, WHO-5, and DERS assessments
- **Risk Analysis**: Patient risk scoring and population comparisons
- **Substance Use Tracking**: Analysis of substance use patterns and history
- **Modern UI**: Built with Next.js, Tailwind CSS, and shadcn/ui components

## Quick Start

### Prerequisites

- Node.js 18+ with pnpm installed
- Python 3.11+ for the MCP server
- OpenAI API key
- Supabase account and credentials (for the MCP server)

### 1. Environment Setup

Create a `.env.local` file in the project root:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_PATH=../ai-assited-healthcare/main.py

# Supabase Configuration (for MCP server)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# MCP Server Name and Version
MCP_SERVER_NAME=healthcare-dashboard
MCP_SERVER_VERSION=1.0.0
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set up MCP Server Environment

Navigate to your MCP server directory and create a `.env` file:

```bash
cd ../ai-assited-healthcare
```

Create `.env` file with your Supabase credentials:
```bash
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
MCP_SERVER_NAME=healthcare-dashboard
MCP_SERVER_VERSION=1.0.0
```

Return to the dashboard directory:
```bash
cd ../healthcare-dashboard
```

### 4. Run the Application

#### Option 1: Run both servers together (Recommended)
```bash
pnpm dev:full
```

#### Option 2: Run servers separately

Terminal 1 - Start MCP Server:
```bash
pnpm mcp:start
```

Terminal 2 - Start Next.js App:
```bash
pnpm dev
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start the Next.js development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm mcp:start` - Start the MCP server
- `pnpm dev:full` - Start both MCP server and Next.js app concurrently
- `pnpm setup` - Install dependencies and show setup reminder

## Chat Assistant Capabilities

The AI assistant can help you with:

### Patient Data Queries
- "List all patients"
- "Show me assessment summary stats for PHQ-9"
- "Get PTSD scores for patient PT001"
- "Analyze progress for patient PT002"

### Risk Assessment
- "Identify patients needing attention"
- "Calculate risk score for patient PT003"
- "Show me high-risk substance users"

### Analytics and Insights
- "Compare patient PT001 to population"
- "Analyze substance patterns across patients"
- "Get substance history for patient PT004"

### Assessment Understanding
- "What do these PHQ-9 scores mean?"
- "Explain GAD-7 thresholds"
- "How should I interpret DERS scores?"

## Assessment Thresholds Reference

- **PHQ-9**: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe
- **GAD-7**: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe  
- **WHO-5**: 0-13 poor wellbeing, 14-17 below average, 18+ good wellbeing
- **PTSD**: Higher scores indicate more severe symptoms
- **DERS**: Higher scores indicate greater emotion regulation difficulties

## Available Test Patient IDs

For testing purposes, the following patient IDs are available:
- PT001 - John Smith
- PT002 - Sarah Johnson
- PT003 - Michael Brown
- PT004 - Emily Davis
- PT005 - Robert Wilson

## MCP Server Tools

The chat assistant has access to these MCP server tools:

### Assessment Tools
- `get_patient_ptsd_scores`
- `get_patient_phq_scores`
- `get_patient_gad_scores`
- `get_patient_who_scores`
- `get_patient_ders_scores`
- `get_all_patient_assessments`
- `list_all_patients`
- `get_assessment_summary_stats`

### Analytics Tools
- `analyze_patient_progress`
- `calculate_composite_risk_score`
- `compare_patient_to_population`
- `identify_patients_needing_attention`

### Substance Use Tools
- `get_patient_substance_history`
- `analyze_substance_patterns_across_patients`
- `get_high_risk_substance_users`

## Project Structure

```
healthcare-dashboard/
├── src/
│   ├── app/
│   │   ├── api/chat/         # AI SDK chat API route
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main dashboard page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── chat-interface.tsx # AI chat component
│   │   ├── header.tsx        # Dashboard header
│   │   └── pages/            # Dashboard pages
│   └── lib/
│       ├── mcp-client.ts     # MCP server client utility
│       └── utils.ts          # Utility functions
├── scripts/
│   └── start-mcp-server.sh   # MCP server startup script
└── types/
    └── assessments.ts        # TypeScript types
```

## Troubleshooting

### MCP Server Connection Issues
1. Ensure the MCP server is running on port 3001
2. Check that Supabase credentials are correct in both `.env` files
3. Verify Python dependencies are installed in the MCP server directory

### Chat Assistant Not Responding
1. Verify OpenAI API key is set in `.env.local`
2. Check browser console for API errors
3. Ensure the `/api/chat` route is accessible

### Environment Variables
- Make sure `.env.local` exists in the Next.js app root
- Ensure `.env` exists in the MCP server directory
- Double-check all required variables are set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
