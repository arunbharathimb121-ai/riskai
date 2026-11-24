import io, csv, zipfile, xml.etree.ElementTree as ET, pymupdf as fitz
from dotenv import load_dotenv; load_dotenv(override=True)
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.documents import Document
from process import indexchunks, chunkdocs, loadllm
from mainpicture import scope, risks, blockers, docsgen, health, query

docs, chunks, retriever, llm = [], [], None, None
app = FastAPI(title="Risk Advisor")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def parsefile(raw: bytes, name: str) -> str:
    ext = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext == ".pdf":
        p = fitz.open(stream=raw, filetype="pdf")
        return f"DOCUMENT: {name}\n" + "\n".join(f"[P{i}]: {pg.get_text('text').strip()}" + "".join(f"\n{t.to_markdown()}" for t in (pg.find_tables() or [])) for i, pg in enumerate(p, 1))
    if ext == ".docx":
        try:
            from docx import Document as D; d = D(io.BytesIO(raw))
            return f"DOCUMENT: {name}\n" + "\n".join([p.text.strip() for p in d.paragraphs if p.text.strip()] + [" | ".join(c.text.strip() for c in r.cells) for t in d.tables for r in t.rows])
        except Exception:
            with zipfile.ZipFile(io.BytesIO(raw)) as z:
                t = ET.fromstring(z.read("word/document.xml"))
                return f"DOCUMENT: {name}\n" + " ".join(n.text for n in t.iter() if n.tag.endswith("t") and n.text)
    if ext == ".xlsx":
        try:
            import openpyxl; wb = openpyxl.load_workbook(io.BytesIO(raw), data_only=True)
            return f"DOCUMENT: {name}\n" + "\n".join(f"[{s}]: " + " | ".join(str(c) for c in r if c is not None) for s in wb.sheetnames for r in wb[s].iter_rows(values_only=True) if any(r))
        except Exception:
            with zipfile.ZipFile(io.BytesIO(raw)) as z:
                strs = [n.text or "" for n in ET.fromstring(z.read("xl/sharedStrings.xml")).iter() if n.tag.endswith("t")] if "xl/sharedStrings.xml" in z.namelist() else []
                out = [f"DOCUMENT: {name}"]
                for s in [n for n in z.namelist() if n.startswith("xl/worksheets/sheet")]:
                    out.extend(" | ".join(strs[int(c.find("{*}v").text)] if c.attrib.get("t") == "s" and c.find("{*}v") is not None and c.find("{*}v").text.isdigit() else (c.find("{*}v").text if c.find("{*}v") is not None else "") for c in row) for row in ET.fromstring(z.read(s)).iter("{*}row"))
                return "\n".join(out)
    if ext == ".csv":
        return f"DOCUMENT: {name}\n" + "\n".join(" | ".join(r) for r in csv.reader(io.StringIO(raw.decode("utf-8", "replace"))) if any(r))
    if ext in {".txt", ".md"}:
        return f"DOCUMENT: {name}\n" + raw.decode("utf-8", "replace").strip()
    raise ValueError(f"Unsupported format: {ext}")

def stats():
    return [{"name": s, "chunks": sum(1 for c in chunks if c.metadata.get("source") == s)} for s in {d.metadata.get("source") for d in docs}]

def needllm():
    global llm
    if not docs: raise HTTPException(400, "No documents uploaded.")
    if llm is None: llm = loadllm()
    return llm

def needretriever():
    global retriever, chunks
    if not docs: raise HTTPException(400, "No documents uploaded.")
    if retriever is None:
        chunks = chunkdocs(docs)
        retriever = indexchunks(chunks)
    return retriever

@app.get("/")
def home(): return {"service": "Risk Advisor", "documents": len(docs), "chunks": len(chunks)}

@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)):
    global docs, retriever, chunks
    initial_count, seen = len(docs), {d.metadata.get("source") for d in docs}
    for f in files:
        if not any(f.filename.lower().endswith(e) for e in [".pdf", ".docx", ".xlsx", ".csv", ".txt", ".md"]): continue
        try:
            txt = parsefile(await f.read(), f.filename)
            if f.filename in seen: docs = [d for d in docs if d.metadata.get("source") != f.filename]
            docs.append(Document(page_content=txt, metadata={"source": f.filename}))
        except Exception as e: print(f"Error {f.filename}: {e}")
    if not docs: raise HTTPException(400, "No valid documents found.")
    chunks = chunkdocs(docs)
    retriever = indexchunks(chunks)
    is_inc = initial_count > 0
    added = len(docs) - initial_count
    msg = f"Incremental upload: +{added} new document{'s' if added != 1 else ''} indexed." if is_inc else "Indexed successfully"
    return {"msg": msg, "files": stats(), "total_files": len(docs), "total_chunks": len(chunks), "is_incremental": is_inc}

@app.get("/dashboard")
async def get_dashboard():
    r, l = needretriever(), needllm()
    return {"health": health(r, l), "risks": risks(r, l), "scope": scope(r, l), "blockers": blockers(r, l), "total_files": len(docs), "total_chunks": len(chunks), "files": stats()}

@app.get("/chunks")
async def getchunks(): return {"total_files": len(docs), "total_chunks": len(chunks), "files": stats()}

@app.get("/scope")
async def getscope(): return {"scope": scope(needretriever(), needllm()), "documents": len(docs)}

@app.get("/risk")
async def getrisks(): return {"risks": risks(needretriever(), needllm()), "documents": len(docs)}

@app.get("/blockers")
async def getblockers(): return {"blockers": blockers(needretriever(), needllm()), "documents": len(docs)}

@app.get("/documentation")
async def getdocs(): return {"documentation": docsgen(needretriever(), needllm()), "documents": len(docs)}

@app.get("/health")
async def gethealth(): return {"health": health(needretriever(), needllm()), "documents": len(docs)}

@app.get("/question")
async def askquestion(q: str = ""):
    if not q.strip(): raise HTTPException(400, "Question is empty.")
    return {"question": q, "answer": query(needretriever(), needllm(), q)}

@app.delete("/reset")
async def reset():
    global docs, chunks, retriever, llm
    docs, chunks, retriever, llm = [], [], None, None
    return {"msg": "Project memory cleared successfully."}
