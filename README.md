# 🏥 AI-Assisted Healthcare Dashboard - Doctor's Helper

A comprehensive, production-ready healthcare analytics platform that leverages AI to provide deep insights into patient assessment, biopsychosocial analysis, and emotional health monitoring. This system combines advanced AI tools with intuitive interfaces to support healthcare professionals in making data-driven, informed decisions.

## ✨ Key Features

### 🔬 Advanced Clinical Analytics
- **Comprehensive Assessment Scoring**: Automated scoring for PTSD, PHQ-9, GAD-7, WHO-5, and DERS assessments
- **Biopsychosocial Assessment**: Multi-dimensional patient evaluation across biological, psychological, and social domains
- **PHP Emotional Analytics**: Personal Health Plan emotional state analysis with trend tracking
- **Risk Stratification**: AI-powered composite risk scoring and patient prioritization
- **Progress Tracking**: Longitudinal analysis of patient outcomes over time
- **Spider Chart Visualization**: Multi-dimensional health data representation

### 🤖 AI-Powered Clinical Tools
- **Motivation Theme Analysis**: Advanced NLP-powered therapeutic motivation assessment and extraction
- **Substance Use Analytics**: Comprehensive substance use disorder evaluation and pattern recognition
- **Population Comparison**: Z-score analysis comparing individual patients to population baselines
- **Real-time Chat Interface**: OpenAI GPT-4 powered conversational AI for clinical insights
- **MCP (Model Context Protocol) Integration**: Sophisticated AI tool orchestration and management
- **Clinical Recommendations**: Evidence-based treatment suggestions and intervention planning

### 📊 Enterprise Data Management
- **Supabase Integration**: Secure, HIPAA-compliant PostgreSQL database with real-time capabilities
- **Patient Management System**: Comprehensive patient data lifecycle management
- **Assessment Storage**: Persistent, encrypted storage of all clinical assessment data
- **Cache Management**: Intelligent caching with debugging capabilities for optimal performance
- **API Rate Limiting**: Production-ready API with proper rate limiting and error handling

### 📈 Business Intelligence & Analytics
- **Summary Statistics**: Comprehensive assessment analytics across patient populations  
- **High-Risk Patient Identification**: Automated flagging of patients requiring immediate attention
- **Trend Analysis**: Time-series analysis of patient progress and population health metrics
- **PDF Report Generation**: Professional clinical reports with enhanced styling

## 🛠 Technology Stack

### Frontend (Next.js 15 Application)
- **Next.js 15.3.5**: Latest React framework with App Router and Turbopack
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Full type safety and modern JavaScript features
- **Tailwind CSS 4**: Utility-first CSS with modern styling
- **Shadcn/ui**: Enterprise-grade UI component library
- **Recharts 3**: Advanced data visualization and charting
- **Zustand**: Lightweight state management
- **React PDF**: Client-side PDF generation for reports

### Backend (Python MCP Server)
- **Python 3.11+**: Modern Python with enhanced performance
- **FastMCP 2.10.2**: Model Context Protocol server implementation
- **FastAPI**: High-performance async API framework
- **Supabase 2.16.0**: Real-time PostgreSQL database
- **Pandas 2.3.1**: Advanced data analysis and manipulation
- **Pydantic 2.0**: Data validation and serialization
- **Structlog**: Structured logging for production monitoring

### AI & Analytics Infrastructure
- **OpenAI GPT-4**: Advanced language model integration for clinical insights
- **Vectorize**: High-performance vector database for semantic search and clinical recommendations
- **MCP (Model Context Protocol)**: Standardized AI tool orchestration and management
- **Custom Assessment Engines**: Specialized healthcare evaluation algorithms
- **NLP Motivation Analysis**: Advanced natural language processing for therapeutic insights
- **Predictive Risk Modeling**: Machine learning-based patient outcome prediction
- **Semantic Search**: Context-aware retrieval of clinical guidelines and treatment protocols

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+ and pnpm**: For frontend development and package management
- **Python 3.11+**: For backend MCP server (required for async features)
- **Supabase account**: PostgreSQL database with real-time capabilities
- **OpenAI API key**: For GPT-4 integration and AI-powered features
- **Vectorize account**: Vector database for clinical recommendations and semantic search
- **Git**: For version control and deployment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SirazSium84/Doctor-s-Helper.git
   cd Doctor-s-Helper
   ```

2. **Set up the MCP Server (Backend)**
   ```bash
   cd ai-assited-healthcare-mcp
   
   # Install in development mode with all dependencies
   pip install -e .
   
   # Or install from pyproject.toml
   pip install -r requirements.txt
   ```

3. **Set up the Frontend Dashboard**
   ```bash
   cd healthcare-dashboard
   
   # Install dependencies with pnpm (recommended for performance)
   pnpm install
   
   # Alternative with npm
   # npm install
   ```

4. **Environment Configuration**
   
   Create `.env.local` in `healthcare-dashboard/`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Vectorize Configuration (for clinical recommendations)
   VECTORIZE_API_KEY=your_vectorize_api_key
   VECTORIZE_ENDPOINT_URL=your_vectorize_endpoint
   VECTORIZE_INDEX_NAME=clinical-recommendations
   
   # Optional: Additional API Keys
   PINECONE_API_KEY=your_pinecone_api_key
   ```

5. **Database Setup**
   ```bash
   # Import the database schema into your Supabase project
   cat healthcare-dashboard/src/lib/supabase-schema.sql
   
   # Apply the schema through Supabase dashboard SQL editor
   # or via Supabase CLI
   ```

6. **Configure MCP Server Environment**
   ```bash
   # Create .env in ai-assited-healthcare-mcp/
   cd ai-assited-healthcare-mcp
   cat > .env << EOF
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   VECTORIZE_API_KEY=your_vectorize_api_key
   VECTORIZE_ENDPOINT_URL=your_vectorize_endpoint
   EOF
   ```

### Vector Database Setup (Vectorize)

The system uses **Vectorize** as a vector database for storing and retrieving clinical recommendations based on semantic similarity:

```bash
# Initialize the vector database for clinical recommendations
cd healthcare-dashboard/src/lib

# The vectorize-recommendations.ts file handles:
# - Embedding clinical guidelines and treatment protocols
# - Semantic search for evidence-based recommendations
# - Context-aware suggestion retrieval based on patient profiles
# - Integration with assessment scores for personalized recommendations
```

**Vectorize Integration Features:**
- **Clinical Knowledge Base**: Stores embedded clinical guidelines, treatment protocols, and evidence-based practices
- **Semantic Search**: Finds relevant recommendations based on patient symptoms, assessment scores, and clinical context
- **Personalized Suggestions**: Retrieves contextually appropriate interventions based on patient risk profiles
- **Real-time Recommendations**: Provides instant access to relevant clinical guidance during patient assessments

### Running the Application

#### Development Mode

1. **Start the MCP Server**
   ```bash
   cd ai-assited-healthcare-mcp
   python main.py
   
   # Server will start on http://localhost:8000
   # Health check available at http://localhost:8000/health
   ```

2. **Start the Frontend Dashboard**
   ```bash
   cd healthcare-dashboard
   pnpm dev
   
   # With Turbopack for faster development
   pnpm dev --turbopack
   ```

3. **Access the application**
   - **Frontend Dashboard**: http://localhost:3000
   - **MCP Server API**: http://localhost:8000
   - **MCP Health Check**: http://localhost:8000/health

#### Production Mode

1. **Build and start the frontend**
   ```bash
   cd healthcare-dashboard
   pnpm build
   pnpm start
   ```

2. **Run MCP server in production**
   ```bash
   cd ai-assited-healthcare-mcp
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

#### Quick Start Script
```bash
# Use the provided convenience script
./scripts/start-both-servers.sh
```

## 📁 Project Structure

```
Doctor-s-Helper/
├── ai-assited-healthcare-mcp/              # MCP Server & AI Tools
│   ├── main.py                             # MCP server entry point & FastMCP setup
│   ├── assessment_tools.py                 # PTSD, PHQ-9, GAD-7, WHO-5, DERS scoring
│   ├── motivation_tools.py                 # NLP-powered motivation theme analysis
│   ├── substance_tools.py                  # Substance use disorder evaluation
│   ├── analytics_tools.py                  # Risk scoring & population analytics
│   ├── resources.py                        # Clinical resource management
│   ├── config.py                           # Server configuration & database settings
│   ├── models.py                           # Data models and validation schemas
│   ├── health_check.py                     # Health monitoring and diagnostics
│   ├── logging_config.py                   # Structured logging configuration
│   ├── pagination_caching.py              # Performance optimization utilities
│   ├── enhanced_assessment_tools.py        # Advanced assessment capabilities
│   ├── test_real_patient.py               # Integration testing with sample data
│   ├── pyproject.toml                      # Python dependencies & project config
│   ├── pytest.ini                         # Testing configuration
│   ├── Dockerfile                          # Container deployment
│   ├── docker-compose.yml                 # Multi-service orchestration
│   ├── nginx.conf                          # Reverse proxy configuration
│   ├── scripts/
│   │   └── start-mcp-server.sh            # Server startup automation
│   └── tests/                             # Comprehensive test suite
│       ├── unit/                          # Unit tests
│       ├── integration/                   # Integration tests
│       └── e2e/                           # End-to-end tests
│
├── healthcare-dashboard/                   # Next.js 15 Frontend Application
│   ├── src/
│   │   ├── app/                           # App Router pages & layouts
│   │   │   ├── api/                       # API route handlers
│   │   │   │   ├── assessments/           # Assessment CRUD operations
│   │   │   │   ├── chat/                  # OpenAI GPT-4 chat integration
│   │   │   │   ├── motivation-themes/     # Motivation analysis endpoints
│   │   │   │   ├── php-analysis/          # PHP emotional analytics
│   │   │   │   ├── patients/              # Patient management API
│   │   │   │   ├── mcp/                   # MCP server communication
│   │   │   │   └── debug/                 # Development debugging tools
│   │   │   ├── globals.css                # Global styling & Tailwind imports
│   │   │   ├── layout.tsx                 # Root layout with providers
│   │   │   └── page.tsx                   # Main dashboard homepage
│   │   ├── components/                    # React component library
│   │   │   ├── pages/                     # Page-specific components
│   │   │   │   ├── welcome-page.tsx       # Landing page component
│   │   │   │   ├── assessment-scores-page.tsx  # Assessment dashboard
│   │   │   │   ├── biopsychosocial-page.tsx    # Biopsychosocial analysis
│   │   │   │   ├── php-emotional-analytics-page.tsx  # Emotional analytics
│   │   │   │   ├── risk-analysis-page.tsx      # Risk assessment dashboard
│   │   │   │   └── spider-chart-page.tsx       # Multi-dimensional visualization
│   │   │   ├── ui/                        # Shadcn/ui components
│   │   │   │   ├── button.tsx, card.tsx, input.tsx, etc.
│   │   │   ├── header.tsx                 # Application header
│   │   │   ├── navigation-tabs.tsx        # Tab navigation system
│   │   │   ├── patient-selector.tsx       # Patient selection interface
│   │   │   ├── openai-chat.tsx           # AI chat interface
│   │   │   ├── enhanced-chat-renderer.tsx # Advanced chat rendering
│   │   │   ├── cache-debug-panel.tsx     # Development debugging panel
│   │   │   └── PatientSummaryPDFButton.tsx # PDF report generation
│   │   ├── lib/                           # Utilities & service integrations
│   │   │   ├── mcp-client.ts             # MCP server communication
│   │   │   ├── supabase-service.ts       # Database operations
│   │   │   ├── supabase.ts               # Supabase client setup
│   │   │   ├── comprehensive-data-service.ts  # Advanced data processing
│   │   │   ├── vectorize-client.ts       # Vector database integration
│   │   │   ├── vectorize-recommendations.ts   # Clinical recommendations
│   │   │   ├── clinical-recommendations.ts    # Treatment suggestions
│   │   │   ├── assessment-utils.ts       # Assessment processing utilities
│   │   │   ├── utils.ts                  # General utility functions
│   │   │   └── supabase-schema.sql       # Database schema definition
│   │   ├── store/                        # State management
│   │   │   └── dashboard-store.ts        # Zustand store for dashboard state
│   │   └── types/                        # TypeScript type definitions
│   │       └── assessments.ts            # Assessment data types
│   ├── public/                           # Static assets
│   ├── scripts/                          # Deployment & automation scripts
│   │   ├── setup-supabase-integration.sh # Database setup automation
│   │   ├── start-both-servers.sh         # Development server startup
│   │   └── start-mcp-server.sh           # MCP server launcher
│   ├── package.json                      # Node.js dependencies & scripts
│   ├── next.config.ts                    # Next.js configuration
│   ├── tailwind.config.ts                # Tailwind CSS configuration
│   ├── tsconfig.json                     # TypeScript configuration
│   └── components.json                   # Shadcn/ui component configuration
│
├── PROJECT_SUMMARY.md                     # Comprehensive project overview
├── BACKEND_STRUCTURE.md                   # Backend architecture guide
├── FRONTEND_STRUCTURE.md                  # Frontend architecture guide
├── Server_Agent_Plan.md                   # Development planning & roadmap
└── README.md                             # This file
```

## 🔌 API Endpoints

### Assessment APIs
- `POST /api/assessments` - Create new patient assessment
- `GET /api/assessments` - Retrieve assessment data with filtering
- `PUT /api/assessments/:id` - Update existing assessment
- `GET /api/assessments/summary-stats` - Get assessment summary statistics
- `GET /api/assessments/scores/:type` - Get specific assessment type scores

### Analysis & Analytics APIs
- `POST /api/motivation-themes` - Extract and analyze motivation themes
- `POST /api/php-analysis` - PHP emotional analytics and processing
- `POST /api/chat` - OpenAI GPT-4 powered chat interface
- `GET /api/analytics/risk-analysis` - Composite risk scoring
- `GET /api/analytics/population-comparison` - Patient vs population analysis
- `GET /api/analytics/progress-tracking` - Longitudinal patient progress

### Patient Management APIs
- `GET /api/patients` - List all patients with pagination
- `POST /api/patients` - Create new patient record
- `PUT /api/patients/:id` - Update patient information
- `GET /api/patients/:id/assessments` - Get patient assessment history
- `GET /api/patients/high-risk` - Identify high-risk patients

### MCP Server Integration
- `POST /api/mcp` - Direct MCP server tool invocation
- `GET /api/mcp/tools` - List available MCP tools
- `POST /api/mcp/assessment-tools` - Access assessment-specific tools
- `POST /api/mcp/analytics-tools` - Access analytics and risk tools

### Vector Database & Recommendations
- `POST /api/recommendations/clinical` - Get clinical recommendations via Vectorize
- `POST /api/recommendations/search` - Semantic search for treatment protocols
- `GET /api/recommendations/similar-cases` - Find similar patient cases

## 🧠 AI Tools & Capabilities

### Clinical Assessment Tools (MCP Server)
- **Multi-Assessment Scoring**: Automated calculation for PTSD, PHQ-9, GAD-7, WHO-5, and DERS
- **Severity Classification**: Evidence-based severity level determination
- **Assessment Summaries**: Statistical analysis across patient populations
- **Progress Tracking**: Longitudinal assessment score analysis over time
- **Z-Score Analysis**: Individual patient comparison to population baselines

### Advanced Analytics Engine
- **Composite Risk Scoring**: Multi-dimensional risk assessment combining all assessment types
- **High-Risk Patient Identification**: Automated flagging of patients requiring immediate attention
- **Population Analytics**: Cohort analysis and trend identification
- **Predictive Modeling**: Risk stratification using machine learning algorithms
- **Clinical Decision Support**: Evidence-based treatment recommendations

### Motivation & Behavioral Analysis
- **NLP-Powered Theme Extraction**: Advanced natural language processing for therapeutic insights
- **Motivation Pattern Recognition**: AI-powered behavioral pattern analysis
- **Therapeutic Goal Assessment**: Motivation-based treatment planning
- **Text Analysis**: Semantic analysis of patient responses and clinical notes
- **Behavioral Trend Analysis**: Long-term motivation and engagement patterns

### Substance Use Analytics
- **Substance Use Pattern Analysis**: Comprehensive evaluation of usage patterns
- **Risk Assessment**: Substance-related risk scoring and alerts
- **Treatment History Analysis**: Longitudinal substance use treatment tracking
- **Correlation Analysis**: Relationship between substance use and mental health assessments

### Vector-Based Clinical Recommendations
- **Semantic Search**: Context-aware retrieval of clinical guidelines using Vectorize
- **Treatment Protocol Matching**: Evidence-based treatment recommendations
- **Similar Case Analysis**: Finding patients with similar clinical profiles
- **Personalized Interventions**: Tailored treatment suggestions based on patient data  
- **Clinical Knowledge Base**: Embedded medical literature and best practices

## 🔐 Security & Privacy

- **HIPAA Compliance**: Healthcare data protection standards
- **Encrypted Storage**: All patient data encrypted at rest
- **Secure API**: Authentication and authorization protocols
- **Audit Logging**: Comprehensive access and change tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript/Python coding standards
- Add tests for new features
- Update documentation for API changes
- Ensure HIPAA compliance for healthcare features

## 🚢 Deployment

### Docker Deployment

The application includes full Docker support for easy deployment:

```bash
# Build and run with Docker Compose
cd ai-assited-healthcare-mcp
docker-compose up --build

# Individual container builds
docker build -t healthcare-mcp-server .
docker run -p 8000:8000 healthcare-mcp-server
```

### Production Considerations

- **Environment Variables**: Ensure all required environment variables are set
- **Database Migrations**: Run Supabase schema migrations before deployment
- **SSL Certificates**: Configure HTTPS for production deployments
- **Rate Limiting**: Configure nginx for API rate limiting and load balancing
- **Monitoring**: Set up health checks and logging aggregation
- **Backup Strategy**: Implement regular database backups

### Performance Optimization

- **Caching**: Intelligent caching implemented for frequently accessed data
- **Database Indexing**: Optimized database indexes for assessment queries
- **API Pagination**: Implemented pagination for large datasets
- **Vector Database**: Vectorize integration for fast semantic search
- **CDN Integration**: Static asset optimization for global distribution

## 📋 Roadmap & Future Enhancements

### Short Term (Next 3 months)
- [ ] Enhanced mobile responsiveness and progressive web app features
- [ ] Advanced clinical reporting with customizable templates
- [ ] Integration with additional assessment tools (Beck inventories, etc.)
- [ ] Multi-tenant support for healthcare organizations
- [ ] Enhanced data visualization with interactive charts

### Medium Term (6 months)
- [ ] EHR system integration (Epic, Cerner, Allscripts)
- [ ] Machine learning model training on historical patient data
- [ ] Telehealth integration with video conferencing
- [ ] Advanced predictive analytics for treatment outcomes
- [ ] Mobile application for iOS and Android

### Long Term (12+ months)
- [ ] Multi-language support for international deployment
- [ ] Advanced AI diagnostic support with medical imaging
- [ ] Federated learning across healthcare networks
- [ ] Real-time patient monitoring integration
- [ ] Clinical research data export and analysis tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Supabase for database infrastructure
- Next.js team for the amazing framework
- Healthcare professionals who provided domain expertise

## 📞 Support

For support, email szsium@gmail.com or create an issue in this repository.

---

**⚠️ Disclaimer**: This software is for educational and research purposes. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers. 
