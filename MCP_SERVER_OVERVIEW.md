# 🏥 Healthcare MCP Server - Complete Overview

## 📊 **Available Tools (20+ Total)**

Your MCP server provides comprehensive healthcare analytics tools across 5 main categories:

### 🔬 **Assessment Tools** (8 tools)
*Comprehensive patient assessment analysis and scoring*

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `get_patient_ptsd_scores` | PTSD (PCL-5) assessment analysis | `patient_id`, `limit` | Scores, severity, trends |
| `get_patient_phq_scores` | PHQ-9 depression assessment | `patient_id`, `limit` | Depression scores, severity |
| `get_patient_gad_scores` | GAD-7 anxiety assessment | `patient_id`, `limit` | Anxiety scores, severity |
| `get_patient_who_scores` | WHO-5 wellbeing assessment | `patient_id`, `limit` | Wellbeing scores, level |
| `get_patient_ders_scores` | DERS emotion regulation | `patient_id`, `limit` | Emotion regulation scores |
| `get_all_patient_assessments` | Comprehensive assessment retrieval | `patient_id`, `assessment_types`, `date_range` | All assessments |
| `list_all_patients` | Patient directory | None | All patient IDs |
| `get_assessment_summary_stats` | Population statistics | None | Statistical summaries |

### 🧠 **Motivation Analysis** (1 tool)
*Therapeutic motivation theme extraction using NLP*

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `get_motivation_themes` | Extract motivation themes | `patient_id` | 12 theme categories with quotes |

**Theme Categories:**
- Recovery, Family, Health, Employment, Education
- Financial, Social, Mental Health, Independence
- Spiritual, Future, Support

### 📈 **Analytics Tools** (4 tools)
*Advanced patient progress and risk analysis*

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `analyze_patient_progress` | Progress tracking over time | `patient_id`, `assessment_type` | Trends, improvements |
| `calculate_composite_risk_score` | Multi-domain risk assessment | `patient_id` | Risk scores, recommendations |
| `compare_patient_to_population` | Statistical comparisons | `patient_id`, `assessment_type` | Z-scores, percentiles |
| `identify_patients_needing_attention` | High-risk patient identification | None | High-risk patient list |

### 💊 **Substance Use Tools** (5 tools)
*Comprehensive substance use analysis*

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `get_patient_substance_history` | Substance use profiles | `patient_id` | Active/inactive substances |
| `analyze_substance_patterns_across_patients` | Population analysis | None | Usage patterns, statistics |
| `get_high_risk_substance_users` | High-risk identification | None | High-risk patient list |
| `compare_substance_use_by_assessment_scores` | Correlation analysis | `assessment_type` | Substance-assessment correlations |
| `get_substance_use_timeline` | Historical tracking | `patient_id` | Timeline data |

### 📚 **Resource Tools** (2+ tools)
*Dynamic patient resources and recommendations*

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| Patient Resources | Patient-specific recommendations | `patient_id` | Tailored resources |
| Assessment Resources | Evidence-based interventions | `assessment_type` | Intervention suggestions |

---

## 🌐 **Deployment Options**

### 🚀 **Railway (Recommended)**
**Best for:** Quick deployment, generous free tier
- ✅ **Free tier:** $5/month credit
- ✅ **Auto-scaling:** Based on traffic
- ✅ **Easy setup:** GitHub integration
- ✅ **Health monitoring:** Built-in health checks

**Deployment time:** ~5 minutes
**Cost:** Free to start, pay-as-you-use

### 🎨 **Render**
**Best for:** Free hosting, automatic deployments
- ✅ **Free tier:** Free web services
- ✅ **Auto-deploy:** From GitHub
- ✅ **Custom domains:** Available
- ✅ **SSL:** Automatic

**Deployment time:** ~10 minutes
**Cost:** Free, then $7/month+

### ☁️ **Google Cloud Run**
**Best for:** Scalability, cost optimization
- ✅ **Serverless:** Pay-per-use
- ✅ **Auto-scaling:** Zero to many instances
- ✅ **Global:** Multi-region deployment
- ✅ **Cost-effective:** For variable traffic

**Deployment time:** ~15 minutes
**Cost:** Generous free tier, then pay-per-use

### 🐳 **DigitalOcean App Platform**
**Best for:** Reliability, good performance
- ✅ **Predictable pricing:** $5/month+
- ✅ **Auto-scaling:** Available
- ✅ **Monitoring:** Built-in
- ✅ **Backups:** Automatic

**Deployment time:** ~10 minutes
**Cost:** $5/month credit, then $5/month+

### 🏗️ **Heroku**
**Best for:** Classic Python hosting
- ✅ **Mature platform:** Well-established
- ✅ **Add-ons:** Rich ecosystem
- ✅ **CLI tools:** Excellent developer experience
- ❌ **Free tier:** Discontinued

**Deployment time:** ~10 minutes
**Cost:** $7/month+

---

## 🔧 **Quick Deployment Guide**

### **Option 1: Railway (Easiest)**

1. **Prepare your repository:**
   ```bash
   # Files are already created:
   # ✅ railway.json
   # ✅ Procfile  
   # ✅ requirements.txt
   # ✅ main.py (with health check)
   ```

2. **Deploy:**
   ```bash
   # Use the deployment script
   ./deploy-railway.sh
   
   # Or manually:
   cd ai-assited-healthcare-mcp
   railway up
   ```

3. **Set environment variables in Railway dashboard:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MCP_SERVER_NAME=healthcare-dashboard
   MCP_SERVER_VERSION=1.0.0
   MCP_PORT=8000
   MCP_HOST=0.0.0.0
   ```

4. **Get your URL:**
   ```
   https://your-app-name.railway.app/mcp/
   ```

### **Option 2: Manual Deployment**

1. **Choose your platform** from the options above
2. **Follow the detailed guide** in `DEPLOYMENT_GUIDE.md`
3. **Set environment variables** for your chosen platform
4. **Deploy and test** your MCP server

---

## 🧪 **Testing Your Deployment**

### **Health Check:**
```bash
curl https://your-app-url.railway.app/health
# Expected: {"status": "healthy", "server": "healthcare-dashboard", "version": "1.0.0"}
```

### **List Available Tools:**
```bash
curl -X POST https://your-app-url.railway.app/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

### **Test a Specific Tool:**
```bash
curl -X POST https://your-app-url.railway.app/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_all_patients",
      "arguments": {}
    },
    "id": 1
  }'
```

---

## 🔗 **Frontend Integration**

After deployment, update your Next.js app:

```bash
# .env.local
MCP_SERVER_URL=https://your-app-url.railway.app
```

The frontend will automatically connect to your deployed MCP server.

---

## 📊 **Tool Usage Examples**

### **Get Patient PTSD Scores:**
```json
{
  "name": "get_patient_ptsd_scores",
  "arguments": {
    "patient_id": "patient_001",
    "limit": 5
  }
}
```

### **Analyze Patient Progress:**
```json
{
  "name": "analyze_patient_progress", 
  "arguments": {
    "patient_id": "patient_001",
    "assessment_type": "all"
  }
}
```

### **Get Motivation Themes:**
```json
{
  "name": "get_motivation_themes",
  "arguments": {
    "patient_id": "patient_001"
  }
}
```

### **Calculate Risk Score:**
```json
{
  "name": "calculate_composite_risk_score",
  "arguments": {
    "patient_id": "patient_001"
  }
}
```

---

## 🎯 **Key Features**

### **AI-Powered Analysis:**
- ✅ **Natural language processing** for motivation themes
- ✅ **Statistical analysis** and trend detection
- ✅ **Risk assessment** algorithms
- ✅ **Population comparisons** and benchmarking

### **Healthcare-Specific:**
- ✅ **Standardized assessments** (PTSD, PHQ-9, GAD-7, WHO-5, DERS)
- ✅ **Substance use analysis** with risk stratification
- ✅ **Progress tracking** over time
- ✅ **Evidence-based recommendations**

### **Production-Ready:**
- ✅ **Health monitoring** endpoints
- ✅ **Error handling** and logging
- ✅ **Scalable architecture**
- ✅ **Security best practices**

---

## 🚀 **Next Steps**

1. **Choose your deployment platform** (Railway recommended)
2. **Set up environment variables** with your Supabase credentials
3. **Deploy using the provided scripts** or manual instructions
4. **Test your deployment** with the health check and tool tests
5. **Update your frontend** to use the new MCP server URL
6. **Monitor and scale** as needed

Your Healthcare MCP Server is ready to provide AI-powered insights for healthcare professionals! 🏥✨