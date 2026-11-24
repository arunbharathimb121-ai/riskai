import time
from langchain_core.messages import SystemMessage, HumanMessage

def ask(llm, sys: str, user: str) -> str:
    for attempt in range(3):
        try:
            res = llm.invoke([SystemMessage(content=sys), HumanMessage(content=user)])
            return getattr(res, "content", str(res)).strip()
        except Exception as e:
            if any(k in str(e).lower() for k in ["rate limit", "429", "tpm"]) and attempt < 2:
                time.sleep((attempt + 1) * 3)
                continue
            raise e

def get_context(target, hint: str = "") -> str:
    docs = target.invoke(hint) if hasattr(target, "invoke") else (target if isinstance(target, list) else [])
    return "\n\n".join(f"[{d.metadata.get('source', 'Doc')}]:\n" + "\n".join(l.strip() for l in d.page_content.splitlines() if l.strip()) for d in docs)

def run_agent(target, llm, hint: str, role: str, instruction: str) -> str:
    ctx = get_context(target, hint)
    sys = (
        f"You are the {role}.\n"
        "Instructions:\n"
        "- Base all answers strictly on the uploaded project documents.\n"
        "- Generate clean markdown tables only. No introductory text or conversational filler.\n"
        "- Keep cells concise and telegraphic.\n\n"
        f"{instruction}"
    )
    return ask(llm, sys, f"Context:\n{ctx}\n\nTask: Generate tables:")

def scope(target, llm) -> str:
    return run_agent(target, llm, "sprint breakdown milestones goals user stories backlog epics scope descoped",
        "Scope Auditor",
        "### 1. Sprint & Delivery Health\n"
        "| Sprint | Milestone Goal | Points | Exposure | Status |\n"
        "(Note any descoped items below table).\n\n"
        "### 2. Key Epics & Backlog Scope\n"
        "| Epic | Key Story | MoSCoW | Risk | Control |")

def risks(target, llm) -> str:
    return run_agent(target, llm, "delivery forecast risk register likelihood impact score probability milestones sprint schedule defects completion",
        "Risk Detection and Delivery Forecasting Agent",
        "### 1. Milestone & Timeline Forecast\n"
        "| Milestone / Sprint | Planned Date | Forecast Date | Variance | Status | Completion % |\n"
        "List ALL project sprints or major milestones from the documents (e.g. Sprints 1 through 6). Do not stop at 2 rows.\n\n"
        "### 2. Delivery & Critical Path Snapshot\n"
        "| Metric | Planned | Actual | Variance | Status |\n\n"
        "### 3. Risk Register\n"
        "| ID | Threat | Category | L (1-5) | I (1-5) | Score (L×I) | Severity | Owner | Status |\n"
        "List all risks found in the documents. Score = L × I (range 1-25). Severity: Critical 20-25 | High 15-19 | Medium 8-14 | Low 1-6.\n\n"
        "### 4. High & Open Risk Explanations\n"
        "Brief bullet points for each high or open risk: Root cause, Exposure, and Action.")

def blockers(target, llm) -> str:
    return run_agent(target, llm, "active blockers impediments action items dependencies resolution owner due date",
        "Blocker and Action Item Identification Agent",
        "### 1. Key Blockers & Impediments\n"
        "| ID | Blocker | Impact | Defense | Owner | Status |\n\n"
        "### 2. Action Items\n"
        "| ID | Action Item | Owner | Due Date | Status |")

def docsgen(target, llm) -> str:
    return run_agent(target, llm, "user stories acceptance criteria defects QA summary risk register action items",
        "Documentation Generation Agent",
        "### 1. User Stories\n"
        "| US ID | Title | As a [role] I want [goal] so that [benefit] | Acceptance Criteria | Priority | Status |\n\n"
        "### 2. Risk Register Summary\n"
        "| ID | Risk | Category | L | I | Score | Mitigation | Owner | Status |\n\n"
        "### 3. Action Items\n"
        "| ID | Action | Owner | Due Date | Status |")

def health(target, llm) -> str:
    return run_agent(target, llm, "risk register probability impact score schedule quality test pass defect blockers health",
        "Project Health Scoring Module",
        "### Factor-Wise Health Scorecard\n"
        "| Factor | Score (0-100) | Weight | Weighted Score | Key Exposure |\n"
        "| Schedule | [score] | 25% | [score*0.25] | [exposure] |\n"
        "| Risk & Defect | [score] | 25% | [score*0.25] | [exposure] |\n"
        "| Scope Clarity | [score] | 20% | [score*0.20] | [exposure] |\n"
        "| Blockers | [score] | 15% | [score*0.15] | [exposure] |\n"
        "| Quality | [score] | 15% | [score*0.15] | [exposure] |\n"
        "| **Overall Health Score** | **[Exact Sum]/100** | **100%** | **RAG: [GREEN (≥80) / AMBER (60-79) / RED (<60)]** | **Top Threat: [Primary threat]** |\n\n"
        "### Current Highest Open Risk\n"
        "| Highest Risk ID | Risk Threat | Score (L×I) | Severity |\n"
        "Scan all open risks in the documents. Find the ONE open risk with the highest Score (L×I). Output exactly one row:\n"
        "| [ID] | [Threat] | [Max Score]/25 | [Critical (≥20) / High (15-19) / Medium (8-14) / Low (1-6)] |")

def query(retriever, llm, q: str) -> str:
    ctx = get_context(retriever, q)
    sys = (
        "You are the Conversational Project Intelligence Assistant.\n"
        "Answer questions grounded strictly in the uploaded project documents.\n"
        "Concise answers with compact tables or bullets. Cite document sources."
    )
    return ask(llm, sys, f"Context:\n{ctx}\n\nQuestion: {q}")
