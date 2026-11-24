import fitz

pdf_path = "/mnt/c/Users/stand/Downloads/Project_Report_Cloud_Data_Warehouse_Plain_Text.pdf"
doc = fitz.open(pdf_path)
print("PAGES:", len(doc))
for i, page in enumerate(doc):
    print(f"--- PAGE {i+1} ---")
    print(page.get_text()[:400])
