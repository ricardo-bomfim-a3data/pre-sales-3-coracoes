"""Pós-processa o SOW: preenche os papéis da seção 7.1 (sem horas, rates nem câmbio, que não foram fornecidos).
Uso: uv run --python 3.12 --with python-docx python tools/sow-pos-equipe.py <conteudo.json> <sow.docx>
"""
import importlib.util, json, sys, glob, os
from docx import Document

skill = glob.glob(os.path.expanduser("~/.claude/skills/synced/*/sow-a3data-template/scripts/fill_sow.py"))[0]
spec = importlib.util.spec_from_file_location("fill_sow", skill)
fs = importlib.util.module_from_spec(spec); spec.loader.exec_module(fs)

c = json.load(open(sys.argv[1], encoding="utf-8"))
doc = Document(sys.argv[2])
tt = fs.find_table(doc, "Resource / Role")
body = fs.resize_body_rows(tt, len(c["team_roles"]), trailing=1)
for row, m in zip(body, c["team_roles"]):
    fs.set_cell(row.cells[0], m["role"])
    for cell in row.cells[1:]:
        fs.set_cell(cell, "")
p = fs.find_par(doc, "1 USD = BRL", startswith=True)
if p:
    fs.set_par_text(p, "1 USD = BRL ____ (reference exchange rate). Team total: US$ ____ (R$ ____).")
img = c.get("calculator_print_image")
pp = fs.find_par(doc, "<Print of ARR of calculator>")
if pp and img:
    from pathlib import Path
    from docx.shared import Inches
    fs.set_par_text(pp, "")
    base = Path(sys.argv[1]).resolve().parent
    path = Path(img) if Path(img).is_absolute() else base / img
    pp.runs[0].add_picture(str(path), width=Inches(c.get("calculator_print_width_in", 5.8)))
doc.save(sys.argv[2])
print("equipe ok")
