# 🏥 AI-Assisted Healthcare Dashboard - Doctor's Helper

A comprehensive healthcare analytics platform that leverages AI to provide insights into patient assessment, biopsychosocial analysis, and emotional health monitoring. This system combines advanced AI tools with intuitive interfaces to support healthcare professionals in making informed decisions.

## ✨ Features

### 🔬 Core Analytics
- **Biopsychosocial Assessment**: Comprehensive patient evaluation across biological, psychological, and social dimensions
- **PHP Emotional Analytics**: Personal Health Plan emotional state analysis and tracking
- **Risk Analysis**: AI-powered risk assessment for patient outcomes
- **Assessment Scoring**: Standardized scoring systems for various health metrics
- **Spider Chart Visualization**: Multi-dimensional health data visualization

### 🤖 AI-Powered Tools
- **Motivation Analysis**: Therapeutic motivation assessment using advanced NLP
- **Substance Use Evaluation**: Comprehensive substance use disorder assessment
- **Real-time Chat Interface**: OpenAI-powered conversational AI for healthcare insights
- **MCP (Model Context Protocol) Integration**: Advanced AI tool orchestration

### 📊 Data Management
- **Supabase Integration**: Secure, scalable database management
- **Patient Management**: Comprehensive patient data handling
- **Real-time Analytics**: Live data processing and visualization
- **Assessment Storage**: Persistent storage of all assessment data

## 🛠 Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern UI component library
- **Recharts**: Data visualization library

### Backend
- **Python 3.11+**: Core backend language
- **FastAPI**: Modern, fast API framework
- **Supabase**: PostgreSQL database with real-time features
- **OpenAI API**: GPT-4 integration for AI capabilities

### AI & Analytics
- **MCP (Model Context Protocol)**: AI tool orchestration
- **Custom Assessment Tools**: Specialized healthcare evaluation modules
- **Motivation Analysis Engine**: NLP-powered therapeutic assessment
- **Risk Assessment Algorithms**: Predictive health analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SirazSium84/Doctor-s-Helper.git
   cd Doctor-s-Helper
   ```

2. **Set up the MCP Server**
   ```bash
   cd ai-assited-healthcare-mcp
   pip install -e .
   ```

3. **Set up the Frontend**
   ```bash
   cd healthcare-dashboard
   pnpm install
   ```

4. **Environment Configuration**
   
   Create `.env.local` in `healthcare-dashboard/`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. **Database Setup**
   ```bash
   # Run the SQL schema in your Supabase dashboard
   cat healthcare-dashboard/src/lib/supabase-schema.sql
   ```

### Running the Application

1. **Start the MCP Server**
   ```bash
   cd ai-assited-healthcare-mcp
   python main.py
   ```

2. **Start the Frontend**
   ```bash
   cd healthcare-dashboard
   pnpm dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - MCP Server: http://localhost:8000

## 📁 Project Structure

```
Doctor-s-Helper/
├── ai-assited-healthcare-mcp/          # MCP Server & AI Tools
│   ├── main.py                         # MCP server entry point
│   ├── assessment_tools.py             # Assessment analysis tools
│   ├── motivation_tools.py             # Motivation analysis engine
│   ├── substance_tools.py              # Substance use evaluation
│   ├── analytics_tools.py              # General analytics tools
│   └── resources.py                    # Resource management
│
├── healthcare-dashboard/               # Next.js Frontend
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── api/                   # API routes
│   │   │   │   ├── assessments/       # Assessment endpoints
│   │   │   │   ├── chat/              # Chat API
│   │   │   │   ├── motivation-themes/ # Motivation analysis
│   │   │   │   └── php-analysis/      # PHP emotional analytics
│   │   │   └── page.tsx               # Main dashboard
│   │   ├── components/                # React components
│   │   │   ├── pages/                 # Page components
│   │   │   └── ui/                    # UI components
│   │   ├── lib/                       # Utilities and services
│   │   │   ├── mcp-client.ts          # MCP client integration
│   │   │   ├── supabase-service.ts    # Database service
│   │   │   └── api-service.ts         # API utilities
│   │   └── types/                     # TypeScript definitions
│   └── package.json
│
└── Server_Agent_Plan.md               # Development planning document
```

## 🔌 API Endpoints

### Assessment APIs
- `POST /api/assessments` - Create new assessment
- `GET /api/assessments` - Retrieve assessments
- `PUT /api/assessments/:id` - Update assessment

### Analysis APIs
- `POST /api/motivation-themes` - Motivation analysis
- `POST /api/php-analysis` - PHP emotional analytics
- `POST /api/chat` - AI chat interface

### Patient Management
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient

## 🧠 AI Tools & Capabilities

### Assessment Tools
- **Biopsychosocial Evaluation**: Comprehensive multi-dimensional assessment
- **Risk Stratification**: Predictive modeling for patient outcomes
- **Progress Tracking**: Longitudinal health monitoring

### Motivation Analysis
- **Therapeutic Motivation Assessment**: Evidence-based motivation evaluation
- **Behavioral Pattern Recognition**: AI-powered pattern analysis
- **Intervention Recommendations**: Personalized treatment suggestions

### Emotional Analytics
- **Mood Tracking**: Real-time emotional state monitoring
- **Sentiment Analysis**: Natural language processing for emotional content
- **Trend Analysis**: Long-term emotional health patterns

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

## 📋 Roadmap

- [ ] Enhanced AI diagnostic support
- [ ] Mobile application development
- [ ] Integration with EHR systems
- [ ] Advanced predictive analytics
- [ ] Multi-language support
- [ ] Telehealth integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Supabase for database infrastructure
- Next.js team for the amazing framework
- Healthcare professionals who provided domain expertise

## 📞 Support

For support, email siraz.sium@example.com or create an issue in this repository.

---

**⚠️ Disclaimer**: This software is for educational and research purposes. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers. 