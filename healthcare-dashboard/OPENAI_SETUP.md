# 🧠 AI Healthcare Analytics Assistant

Your healthcare dashboard features an **intelligent AI-powered chat assistant** that combines conversational AI with real-time clinical data access.

## 🎯 **AI Healthcare Analytics Features:**

- 🧠 **Conversational Intelligence** - Natural language understanding of clinical queries
- 🔬 **Real-time Data Analysis** - Live access to your Supabase healthcare database
- 📊 **Clinical Interpretation** - AI explains assessment scores and clinical significance
- 💡 **Evidence-based Recommendations** - Treatment suggestions based on patient data
- 🎯 **Risk Assessment** - Comprehensive patient risk profiling with composite scoring

## 🔑 **Setup OpenAI Integration:**

### Step 1: Get OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-...`)

### Step 2: Add to Environment File
Create or update `.env.local` in your project root:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Existing MCP and Supabase configs...
MCP_SERVER_URL=http://localhost:8000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Step 3: Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
pnpm dev
```

## 🎯 **How to Use the AI Assistant:**

### **Clinical Analysis Examples:**
- `"Analyze the complete risk profile for patient 0156b2ff0c18 and explain what the scores mean"`
- `"Which patients need immediate clinical attention and why?"`
- `"Explain the clinical significance of these PTSD assessment results and suggest treatment approaches"`
- `"What substance use patterns do you see in our population and what interventions are recommended?"`
- `"Provide a comprehensive treatment plan for high-risk patients"`
- `"How many patients do we have and what's their overall risk distribution?"`

## 💰 **Cost Information:**

- **OpenAI API**: ~$0.005-0.015 per query (GPT-4o pricing)
- **Data Access**: Free (uses your existing MCP infrastructure)

## 🛠 **Available AI Tools:**

The AI assistant has access to these real-time healthcare tools:

| Tool | Purpose |
|------|---------|
| `get_patient_count` | Total patients in system |
| `analyze_patient_risk` | Individual risk assessment |
| `get_patient_assessments` | Full assessment data |
| `identify_high_risk_patients` | Population risk analysis |
| `analyze_substance_use` | Substance abuse patterns |
| `get_patient_specific_scores` | Individual assessment scores |

## 🔧 **Files Created:**

- `src/app/api/chat/route.ts` - OpenAI API endpoint with healthcare tools
- `src/components/openai-chat.tsx` - AI-powered chat component  
- `src/components/pages/welcome-page.tsx` - Updated with AI assistant

## 🏥 **Key Benefits:**

✅ **Clinical Intelligence**: AI trained to understand healthcare terminology and provide relevant insights  
✅ **Real Patient Data**: Direct access to your actual clinical database through MCP tools  
✅ **Evidence-based Analysis**: AI provides treatment recommendations based on clinical best practices  
✅ **Conversational Interface**: Natural language queries for complex clinical analysis  
✅ **Real-time Insights**: Live data analysis with comprehensive risk assessment capabilities

Your healthcare dashboard now offers sophisticated AI-powered clinical analysis with real patient data! 🎉 