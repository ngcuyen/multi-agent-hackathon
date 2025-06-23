# AI Movie API - Complete Architecture Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Agents System](#agents-system)
4. [Workflow System](#workflow-system)
5. Prompts System #prompts-system
6. Services Layer #services-layer
7. Routes Layer #routes-layer
8. [Helpers Layer](#helpers-layer)
9. [Middleware Layer](#middleware-layer)
10. [Database & State Management](#database--state-management)
11. [Complete Flow Examples](#complete-flow-examples)
12. Configuration & Deployment #configuration--deployment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 Project Overview

AI Movie API là một hệ thống AI-powered API được xây dựng với FastAPI, tích hợp LangGraph cho agent workflows và hỗ trợ text
summarization với multiple AI models.

### **Key Features:**

• **Text Summarization:** Direct API và Agent-based processing
• **Document Processing:** PDF extraction và analysis
• **Conversation Management:** LangGraph-powered agent workflows
• **Multi-AI Support:** Claude 3.7, OpenAI GPT-3.5, Extractive fallback
• **Real-time Streaming:** WebSocket-based response streaming
• **Scalable Architecture:** Microservices-oriented design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🏗️ Architecture Overview

### **High-Level Architecture**

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Client Apps │ │ Load Balancer │ │ FastAPI App │
│ │◄──►│ │◄──►│ │
│ Web/Mobile/API │ │ (Optional) │ │ Main Server │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│
┌────────────────────────────────┼────────────────────────────────┐
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Routes Layer │ │ Services Layer │ │ Agents System │
│ │ │ │ │ │
│ • text_routes │ │ • TextService │ │ • Workflows │
│ • conv_routes │ │ • ConvService │ │ • Nodes │
│ • public_routes │ │ • AI Services │ │ • State Mgmt │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│ │ │
└────────────────────────────────┼────────────────────────────────┘
│
┌────────────────────────────────┼────────────────────────────────┐
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Helpers Layer │ │ AI Models │ │ Database │
│ │ │ │ │ │
│ • S3 Processing │ │ • Claude 3.7 │ │ • MongoDB │
│ • PDF Extract │ │ • OpenAI GPT │ │ • Collections │
│ • File Utils │ │ • Extractive │ │ • State Store │
└─────────────────┘ └─────────────────┘ └─────────────────┘

### **Request Flow Overview**

Client Request → Middleware → Routes → Services → AI Models → Database → Response
↓
Agent Workflow (Optional)
↓
LangGraph Processing
↓
Node Execution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🤖 Agents System

### **Agent Architecture**

agents/
├── state.py # Base state definitions
├── graph.py # LangGraph builder utilities
├── workflow.py # Base workflow class
├── conversation_agent/ # Main conversation agent
│ ├── state.py # Conversation-specific state
│ ├── workflow.py # Conversation workflow logic
│ ├── nodes/ # Processing nodes
│ │ ├── text_summary_node.py # Document analysis & summarization
│ │ ├── chat_knowledgebase_node.py # Knowledge base Q&A
│ │ └── chat_node.py # Legacy routing node
│ └── prompts/ # AI prompt templates
│ ├── system_prompts.py # System-level instructions
│ └── user_prompts.py # User interaction templates
└── tools/ # Agent tools (extensible)

### **Agent Nodes Detailed**

#### **🎯 text_summary_node.py**

Purpose: Handle document analysis and text summarization requests

Key Functions:
python
async def text_summary_node(state: ConversationState, config: RunnableConfig, writer: StreamWriter):
"""
Main processing function for text summarization

    Flow:
    1. Extract text from user message or S3 reference
    2. Validate and clean input text
    3. Call TextSummaryService for processing
    4. Stream AI-generated response
    5. Save conversation to database
    6. Update conversation state
    """

Triggers:
• S3 references: s3://bucket/path, bucket: name, file: path
• Summary keywords: tóm tắt, summarize, phân tích tài liệu
• File extensions: .pdf, .csv, .json

Processing Logic:
python

# 1. Input Detection

def should_route_to_text_summary(message_content: str) -> Tuple[bool, str]: # High Priority: S3 references
s3_patterns = [
r's3://[^/\s]+/[^\s]+',
r'bucket:\s*[^,\s]+.*?file:\s*[^\s,]+',
r'bucket_name:\s*[^,\s]+._?file_key:\s_[^\s,]+'
]

    # Medium Priority: Summary keywords
    summary_keywords = [
        'tóm tắt', 'summarize', 'summary',
        'phân tích tài liệu', 'analyze document'
    ]

# 2. Text Extraction

def extract_s3_parameters(message: str) -> Dict[str, str]: # Parse S3 references from user message # Support multiple formats

# 3. Document Processing

async def process_s3_document(bucket: str, file_key: str) -> str: # Download and extract text from S3 documents

#### **🎯 chat_knowledgebase_node.py**

Purpose: Handle general Q&A using knowledge base integration

Key Functions:
python
async def chat_knowledgebase_node(state: ConversationState, config: RunnableConfig, writer: StreamWriter):
"""
Main processing function for knowledge base queries

    Flow:
    1. Retrieve conversation history from database
    2. Format messages for AI model consumption
    3. Query AWS Bedrock knowledge base (if configured)
    4. Generate contextual AI response
    5. Stream response to client
    6. Save interaction to database
    """

Features:
• **Conversation History:** Maintains context across interactions
• **Knowledge Base Integration:** AWS Bedrock knowledge base queries
• **Streaming Responses:** Real-time response delivery
• **Error Handling:** Graceful fallbacks for service failures

#### **🎯 chat_node.py (Legacy)**

Purpose: Intermediate routing node (being phased out)

Status: Deprecated in favor of direct routing in workflow.py for better performance

### **Agent State Management**

#### **Base State Structure**

python
class BaseState(BaseModel):
type: str # Message type identifier
messages: list[str] # Conversation message history
node_name: str # Current processing node name

#### **Conversation State**

python
class ConversationState(BaseState):
conversation_id: str # Unique conversation identifier
user_id: str # User identifier
next_node: str # Next node to process

    # Runtime additions during processing
    routing_info: dict         # Routing decision metadata
    error_info: dict          # Error tracking information
    processing_info: dict     # Node processing details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔄 Workflow System

### **Workflow Architecture**

#### **Base Workflow Class**

python
class BaseWorkflow:
def **init**(self, state):
self.state = state
self.graph_builder = get_graph(state=state)

    def add_node(self, node_name: str, agent_node: Any):
        """Add processing node to workflow"""

    def add_edge(self, source_node: str, target_node: str):
        """Add direct edge between nodes"""

    def add_conditional_edges(self, source: str, path: Any):
        """Add conditional routing logic"""

    def get_graph(self):
        """Return compiled workflow graph"""

#### **Conversation Workflow**

python
def get_conversation_workflow(state, checkpointer):
"""
Create optimized conversation graph with direct routing

    Architecture:
    START → [Routing Logic] → [Node Selection] → [Processing] → END

    Nodes:
    - text_summary_node: Document analysis and summarization
    - chat_knowledgebase_node: General Q&A with knowledge base

    Routing: Direct from START (no intermediate nodes)
    """

    conversation_workflow = BaseWorkflow(state)

    # Add processing nodes
    conversation_workflow.add_node("text_summary_node", text_summary_node)
    conversation_workflow.add_node("chat_knowledgebase_node", chat_knowledgebase_node)

    # Direct routing from START
    conversation_workflow.add_conditional_edges(
        START,
        route_from_start,
        {
            "text_summary_node": "text_summary_node",
            "chat_knowledgebase_node": "chat_knowledgebase_node"
        }
    )

    # Both nodes end workflow
    conversation_workflow.add_edge("text_summary_node", END)
    conversation_workflow.add_edge("chat_knowledgebase_node", END)

    return conversation_workflow.get_graph().compile(checkpointer=checkpointer)

### **Smart Routing Logic**

#### **Routing Decision Tree**

python
def determine_initial_routing(state: ConversationState) -> str:
"""
Intelligent routing based on message content analysis

    Priority System:
    1. High Priority: S3 references (direct file processing)
    2. Medium Priority: Summary keywords (text analysis)
    3. Low Priority: File extensions (format hints)
    4. Default: General conversation
    """

    user_message = str(state.messages[-1]).lower()

    # Priority 1: S3 References (Highest)
    s3_patterns = [
        r's3://[^/\s]+/[^\s]+',                    # s3://bucket/path/file
        r'bucket:\s*[^,\s]+.*?file:\s*[^\s,]+',   # bucket: name, file: path
        r'bucket_name:\s*[^,\s]+.*?file_key:\s*[^\s,]+' # structured format
    ]

    for pattern in s3_patterns:
        if re.search(pattern, user_message, re.IGNORECASE):
            return "text_summary_node"

    # Priority 2: Summary Keywords (Medium)
    summary_keywords = [
        'tóm tắt', 'summarize', 'summary',
        'phân tích tài liệu', 'analyze document', 'document analysis',
        'đọc file', 'read file', 'extract text'
    ]

    for keyword in summary_keywords:
        if keyword in user_message:
            return "text_summary_node"

    # Priority 3: File Extensions (Low)
    file_keywords = ['pdf', '.pdf', 'csv', '.csv', 'json', '.json']
    for keyword in file_keywords:
        if keyword in user_message:
            return "text_summary_node"

    # Default: General conversation
    return "chat_knowledgebase_node"

#### **Routing Examples**

| User Input                                 | Detected Pattern | Target Node             | Reason                      |
| ------------------------------------------ | ---------------- | ----------------------- | --------------------------- |
| "Tóm tắt file s3://my-bucket/document.pdf" | S3 pattern       | text_summary_node       | High priority S3 reference  |
| "bucket: reports, file: analysis.csv"      | S3 structured    | text_summary_node       | High priority S3 reference  |
| "Hãy tóm tắt tài liệu này"                 | Summary keyword  | text_summary_node       | Medium priority keyword     |
| "Phân tích file PDF"                       | Summary + file   | text_summary_node       | Medium priority combination |
| "Xin chào, bạn khỏe không?"                | No pattern       | chat_knowledgebase_node | Default routing             |

### **State Validation & Error Handling**

#### **State Validation**

python
def validate_state_transition(state: ConversationState, target_node: str) -> bool:
"""
Validate state transitions to ensure workflow integrity

    Checks:
    1. Required fields presence (conversation_id, messages)
    2. Valid target node
    3. Node-specific requirements
    4. State consistency
    """

    # Validate required fields
    if not hasattr(state, 'conversation_id') or not state.conversation_id:
        return False

    if not hasattr(state, 'messages') or not state.messages:
        return False

    # Validate target node
    valid_nodes = ["text_summary_node", "chat_knowledgebase_node"]
    if target_node not in valid_nodes:
        return False

    return True

#### **Error Handling**

python
def handle_node_error(state: ConversationState, error: Exception, node_name: str) -> ConversationState:
"""
Centralized error handling for workflow nodes

    Features:
    1. Error logging and tracking
    2. State preservation
    3. Fallback response generation
    4. Recovery mechanisms
    """

    error_message = f"Error in {node_name}: {str(error)}"
    logger.error(f"[WORKFLOW] {error_message}")

    # Set error state
    if not hasattr(state, 'error_info'):
        state.error_info = {}

    state.error_info.update({
        'last_error': {
            'node': node_name,
            'error': str(error),
            'timestamp': int(time.time()),
            'conversation_id': getattr(state, 'conversation_id', 'unknown')
        }
    })

    # Set fallback response
    if node_name == "text_summary_node":
        state.next_node = "Xin lỗi, có lỗi xảy ra khi xử lý tài liệu. Vui lòng thử lại sau."
    else:
        state.next_node = "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau."

    return state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎭 Prompts System

### **Prompt Architecture**

prompts/
├── system_prompts.py # System-level AI instructions
└── user_prompts.py # User interaction templates

### **System Prompts**

#### **Document Analysis Prompt**

python
system_prompt_document_analysis_node = """
You are an expert document analyst and summarization specialist. Your role is to:

1. **Document Analysis:**

   - Analyze documents accurately and comprehensively
   - Extract key insights, themes, and important information
   - Identify document structure and content organization

2. **Summarization:**

   - Create concise, accurate summaries
   - Maintain original meaning and context
   - Adapt summary style based on requirements

3. **Language Support:**

   - Provide responses in Vietnamese unless specified otherwise
   - Maintain professional and clear communication
   - Use appropriate technical terminology

4. **Quality Standards:**

   - Ensure factual accuracy
   - Maintain objectivity and neutrality
   - Provide structured, well-organized responses

5. **Format Handling:**
   - Process various document formats (PDF, text, etc.)
   - Handle different content types (technical, business, academic)
   - Adapt to different summary requirements (general, bullet points, executive summary)
     """

#### **Chat Assistant Prompt**

python
system_prompt_chat_node = """
You are a helpful and knowledgeable AI assistant. Your role is to:

1. **Conversation Management:**

   - Maintain context throughout conversations
   - Provide relevant and helpful responses
   - Ask clarifying questions when needed

2. **Knowledge Base Integration:**

   - Utilize available knowledge base information
   - Provide accurate and up-to-date information
   - Reference sources when appropriate

3. **Communication Style:**

   - Respond in Vietnamese unless requested otherwise
   - Use clear, professional, and friendly tone
   - Adapt complexity based on user needs

4. **Problem Solving:**

   - Help users find solutions to their questions
   - Provide step-by-step guidance when appropriate
   - Offer alternative approaches when needed

5. **Limitations:**
   - Acknowledge when you don't know something
   - Suggest alternative resources when appropriate
   - Maintain honesty and transparency
     """

### **User Prompts**

#### **Document Analysis Template**

python
user_prompt_document_analysis_node = """
Please analyze the following document and provide a comprehensive response:

**Document Information:**

- Source: {document_source}
- Type: {document_type}
- Language: {language}

**Analysis Requirements:**

- Summary Type: {analysis_type}
- Maximum Length: {max_length} words
- Focus Areas: {focus_areas}

**Document Content:**
{document_content}

**Instructions:**

1. Provide a {analysis_type} summary of the document
2. Extract key insights and important information
3. Maintain accuracy and objectivity
4. Format response clearly and professionally
5. Respond in {language}

**Expected Output:**

- Main summary ({analysis_type} format)
- Key insights and findings
- Important details and context
- Structured presentation
  """

#### **Chat Interaction Template**

python
user_prompt_chat_node = """
**Conversation Context:**

- User ID: {user_id}
- Conversation ID: {conversation_id}
- Previous Messages: {message_count}

**Current Query:**
{user_message}

**Available Context:**
{conversation_history}

**Knowledge Base Information:**
{knowledge_base_context}

**Instructions:**

1. Provide a helpful and accurate response
2. Use conversation context appropriately
3. Incorporate knowledge base information when relevant
4. Maintain conversational flow
5. Respond in Vietnamese unless specified otherwise

**Response Guidelines:**

- Be helpful and informative
- Ask clarifying questions if needed
- Provide examples when appropriate
- Maintain professional tone
  """

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚙️ Services Layer

### **Service Architecture**

services/
├── text_service.py # Text processing & summarization
├── conversation_service.py # Conversation management
├── openai_service.py # OpenAI integration
└── bedrock_service.py # AWS Bedrock integration

### **TextSummaryService (Core Service)**

#### **Service Overview**

python
class TextSummaryService:
"""
Core service for text processing and summarization

    Features:
    - Multi-AI model support (Claude 3.7, OpenAI, Extractive)
    - Document processing (PDF, DOCX, TXT)
    - URL content extraction
    - Configurable summarization types
    - Error handling and fallbacks
    """

    def __init__(self):
        """
        Initialize service with AI models using shared configuration
        """
        # Get configuration from environment
        model_name = CONVERSATION_CHAT_MODEL_NAME or "claude-37-sonnet"
        temperature = float(CONVERSATION_CHAT_TEMPERATURE or "0.6")
        top_p = float(CONVERSATION_CHAT_TOP_P or "0.6")
        max_tokens = int(LLM_MAX_TOKENS or "8192")

        # Initialize Bedrock service (Claude 3.7 - Primary)
        if model_name in MODEL_MAPPING:
            bedrock_model_id = MODEL_MAPPING[model_name]
            self.bedrock_service = BedrockService(
                model_id=bedrock_model_id,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens
            )

        # Initialize OpenAI service (Fallback)
        self.openai_service = OpenAIService(
            model_id="gpt-3.5-turbo",
            temperature=temperature,
            top_p=top_p
        )

#### **Core Methods**

Text Summarization:
python
async def summarize_text(
self,
text: str,
summary_type: str = "general",
max_length: int = 200,
language: str = "vietnamese"
) -> Dict[str, Any]:
"""
Summarize text using AI models with fallback chain

    Process:
    1. Validate and clean input text
    2. Generate appropriate prompt based on type and language
    3. Try AI models in priority order (Claude 3.7 → OpenAI → Extractive)
    4. Clean and process AI response
    5. Calculate metrics and return structured result

    Args:
        text: Input text to summarize
        summary_type: Type of summary (general, bullet_points, key_insights, etc.)
        max_length: Maximum length in words
        language: Output language (vietnamese, english)

    Returns:
        Dict containing summary, metrics, and metadata
    """

Document Processing:
python
async def extract_text_from_document(
self,
file_content: bytes,
file_extension: str,
filename: str
) -> str:
"""
Extract text from various document formats

    Supported Formats:
    - PDF: PyPDF2 with pdfplumber fallback
    - DOCX: python-docx library
    - TXT: Direct UTF-8 decoding

    Process:
    1. Determine file type from extension
    2. Use appropriate extraction method
    3. Apply fallback methods if primary fails
    4. Clean and validate extracted text
    5. Return processed text content
    """

URL Content Extraction:
python
async def extract_text_from_url(self, url: str) -> str:
"""
Extract text content from web URLs

    Process:
    1. Fetch URL content with aiohttp
    2. Parse HTML with BeautifulSoup
    3. Remove scripts, styles, and navigation elements
    4. Extract clean text content
    5. Validate and return processed text
    """

#### **AI Model Integration**

Model Priority Chain:
python
async def \_get_ai_summary(self, prompt: str) -> str:
"""
Get summary from available AI services with response cleaning
Priority: Bedrock (Claude 3.7) → OpenAI → Extractive
"""

    # Try Bedrock (Claude 3.7) first
    if self.bedrock_service:
        try:
            logger.info("🤖 Using Bedrock Claude 3.7 for summarization")
            response = await self.bedrock_service.ai_ainvoke(prompt)
            summary = self._clean_ai_response(response.content.strip(), prompt)
            logger.info(f"✅ Bedrock summary generated: {len(summary)} chars")
            return summary
        except Exception as e:
            logger.warning(f"Bedrock service failed: {e}")

    # Try OpenAI as fallback
    if self.openai_service:
        try:
            logger.info("🤖 Using OpenAI GPT-3.5-turbo as fallback")
            response = await self.openai_service.ai_ainvoke(prompt)
            summary = self._clean_ai_response(response.content.strip(), prompt)
            logger.info(f"✅ OpenAI summary generated: {len(summary)} chars")
            return summary
        except Exception as e:
            logger.warning(f"OpenAI service failed: {e}")

    # Fallback to extractive summarization
    logger.info("🤖 Using extractive summarization as last resort")
    return self._simple_extractive_summary(prompt)

Response Cleaning:
python
def \_clean_ai_response(self, response: str, original_prompt: str) -> str:
"""
Clean AI response to extract only the summary content

    Issues Addressed:
    1. Prompt echoing (AI returning the full prompt)
    2. Instruction repetition
    3. Formatting inconsistencies
    4. Length validation

    Process:
    1. Detect prompt echo patterns
    2. Remove instruction echoes using regex
    3. Clean whitespace and formatting
    4. Validate response length and quality
    5. Apply extractive fallback if needed
    """

### **ConversationService**

#### **Service Overview**

python
class ConversationService:
"""
Manage conversation workflows and agent processing

    Features:
    - LangGraph workflow orchestration
    - Conversation state management
    - Database persistence
    - Streaming response handling
    - Error recovery mechanisms
    """

#### **Core Methods**

python
async def process_conversation(
self,
user_id: str,
message: str,
conversation_id: Optional[str] = None
) -> Dict[str, Any]:
"""
Process conversation through agent workflow system

    Process:
    1. Create or retrieve conversation
    2. Initialize conversation state
    3. Set up LangGraph workflow with checkpointer
    4. Process message through agent system
    5. Handle streaming responses
    6. Save conversation state and messages
    7. Return structured response
    """

### **AI Service Integrations**

#### **BedrockService**

python
class BedrockService:
"""
AWS Bedrock integration for Claude models

    Features:
    - Claude 3.7 Sonnet support via inference profiles
    - Configurable parameters (temperature, top_p, max_tokens)
    - Error handling and retry logic
    - Response streaming support
    """

    def __init__(self, model_id: str, temperature: float, top_p: float, max_tokens: int):
        self.model_id = model_id  # e.g., "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
        self.client = BEDROCK_RT
        self.temperature = temperature
        self.top_p = top_p
        self.max_tokens = max_tokens

#### **OpenAIService**

python
class OpenAIService:
"""
OpenAI API integration for GPT models

    Features:
    - GPT-3.5-turbo and GPT-4 support
    - Configurable parameters
    - Rate limiting and error handling
    - Response streaming support
    """

    def __init__(self, model_id: str, temperature: float, top_p: float):
        self.model_id = model_id  # e.g., "gpt-3.5-turbo"
        self.temperature = temperature
        self.top_p = top_p

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🛣️ Routes Layer

### **Route Architecture**

routes/
├── v1_routes.py # Main router aggregator
├── v1_public_routes.py # Public API routes
└── v1/ # Version 1 endpoints
├── text_routes.py # Text summarization APIs
└── conversation_routes.py # Conversation APIs

### **Text Routes (Direct API)**

#### **Route Overview**

python

# text_routes.py

router = APIRouter()

# Available endpoints:

# POST /summary/text - Direct text summarization

# POST /summary/document - Document upload and summarization

# POST /summary/url - URL content summarization

# GET /summary/types - Available summary types

# GET /summary/health - Service health check

#### **Text Summarization Endpoint**

python
@router.post("/summary/text", response_model=dict)
async def summarize_text(request: SummaryRequest):
"""
Direct text summarization (bypass agent workflow)

    Features:
    - Multiple summary types (general, bullet_points, key_insights, etc.)
    - Configurable length and language
    - Fast processing without agent overhead
    - Comprehensive error handling

    Request Format:
    {
        "text": "Text to summarize...",
        "summary_type": "general",
        "max_length": 200,
        "language": "vietnamese"
    }

    Response Format:
    {
        "status": "success",
        "data": {
            "summary": "Generated summary...",
            "original_length": 1000,
            "summary_length": 150,
            "compression_ratio": 6.67,
            "word_count": {"original": 200, "summary": 30}
        },
        "message": "Tóm tắt văn bản thành công"
    }
    """

#### **Document Summarization Endpoint**

python
@router.post("/summary/document", response_model=dict)
async def summarize_document(
file: UploadFile = File(..., description="Document file to summarize"),
summary_type: str = Form(default="general"),
max_length: int = Form(default=200),
language: str = Form(default="vietnamese")
):
"""
Document upload and summarization (currently PDF only)

    Features:
    - PDF text extraction with multiple methods
    - File validation (size, type, content)
    - Enhanced error handling
    - Document metadata in response

    Process:
    1. Validate uploaded file (type, size)
    2. Extract text using PDF processing libraries
    3. Validate extracted text content
    4. Generate summary using TextSummaryService
    5. Return summary with document metadata
    """

#### **Summary Types Endpoint**

python
@router.get("/summary/types", response_model=dict)
async def get_summary_types():
"""
Get available summary types and system capabilities

    Returns:
    - Available summary types with descriptions
    - Supported languages
    - Supported file formats
    - System limits and constraints
    """

### **Conversation Routes (Agent System)**

#### **Route Overview**

python

# conversation_routes.py

router = APIRouter()

# Available endpoints:

# POST / - Create/continue conversation through agent workflow

# GET /{conversation_id} - Get conversation history

# DELETE /{conversation_id} - Delete conversation

#### **Main Conversation Endpoint**

python
@router.post("/", response_model=dict)
async def create_conversation(request: ConversationRequest):
"""
Process conversation through agent workflow system

    Features:
    - LangGraph-powered agent processing
    - Intelligent routing to appropriate nodes
    - Conversation state persistence
    - Streaming response support
    - Error recovery mechanisms

    Request Format:
    {
        "user_id": "user123",
        "message": "Tóm tắt văn bản: ...",
        "conversation_id": "optional-existing-id"
    }

    Process:
