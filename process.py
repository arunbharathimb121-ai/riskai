import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.vectorstores import FAISS

embed, brain = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5"), None

def makellm():
    b = os.getenv("LLM_BACKEND", "").lower()
    if os.getenv("GEMINI_API_KEY") and (b == "gemini" or not os.getenv("GROQ_API_KEY")):
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(google_api_key=os.getenv("GEMINI_API_KEY"), model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"), temperature=0.0)
    if os.getenv("GROQ_API_KEY"):
        from langchain_groq import ChatGroq
        return ChatGroq(api_key=os.getenv("GROQ_API_KEY"), model=os.getenv("GROQ_MODEL", "llama3-70b-8192"), temperature=0.0, max_tokens=int(os.getenv("MAX_TOKENS", 1200)))

def chunkdocs(docs):
    return RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120).split_documents(docs)

def indexchunks(chunks):
    return FAISS.from_documents(chunks, embed).as_retriever(search_kwargs={"k": min(8, len(chunks))})

def loadllm():
    global brain
    if brain is None: brain = makellm()
    return brain
