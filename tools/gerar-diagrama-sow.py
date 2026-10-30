"""Gera o PNG de arquitetura do SOW (inglês, sem funding nem referências internas).
Uso: uv run --python 3.12 --with matplotlib python tools/gerar-diagrama-sow.py [saida.png]
"""
import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

saida = sys.argv[1] if len(sys.argv) > 1 else "sow/diagrama-arquitetura-sow.png"
fig, ax = plt.subplots(figsize=(13, 6.6), dpi=200)
ax.set_xlim(0, 100); ax.set_ylim(-1, 50); ax.axis("off")

AZUL, VERDE, ROXO, ROSA, CINZA = "#1f4e9c", "#3b8a3e", "#6b3fc4", "#c2185b", "#455a64"


def caixa(x, y, w, h, texto, cor, tam=7.2, negrito_primeira=True, fundo="white", borda=1.4, dash=False, topo=False):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.8", fc=fundo, ec=cor, lw=borda,
                                ls="--" if dash else "-"))
    linhas = texto.split("\n")
    if topo:
        ax.text(x + 1, y + h - 1.2, texto, fontsize=tam, color=cor, va="top", ha="left", fontweight="bold")
        return
    ax.text(x + w / 2, y + h / 2, "\n".join(linhas), fontsize=tam, ha="center", va="center", color="#222",
            linespacing=1.35)


def seta(pontos, rotulo=None, rx=None, ry=None):
    if len(pontos) > 2:
        xs, ys = zip(*pontos[:-1])
        ax.plot(xs, ys, color=CINZA, lw=1.3, solid_capstyle="butt")
    ax.annotate("", xy=pontos[-1], xytext=pontos[-2],
                arrowprops=dict(arrowstyle="-|>", color=CINZA, lw=1.3, shrinkA=0, shrinkB=0))
    if rotulo:
        ax.text(rx, ry, rotulo, fontsize=6.8, color=CINZA, ha="center", va="center",
                bbox=dict(fc="white", ec="none", pad=0.8))


ax.text(1, 48.3, "3corações PoC · Weekly SKU recommendation (NBO and basket) on AWS", fontsize=11, fontweight="bold",
        color="#222", va="center")

# Snowflake
caixa(1, 8, 20, 36, "Customer Snowflake", AZUL, tam=8, dash=True, topo=True, fundo="#f5f8ff")
caixa(2.5, 28, 17, 11, "1. Project cut\norders, customers, products\n(1 branch, 1-2 families,\n12 months; stock; SAP code)", AZUL)
caixa(2.5, 12, 17, 11, "7. Recommendation tables\nA/B groups, exposure,\nmeasurement and\noffline evaluation", AZUL)

# AWS
caixa(25, 3, 73, 41, "3corações AWS account · us-east-1", "#222", tam=8, topo=True, fundo="#fcfcfc")
caixa(27, 24, 12, 10, "2. Amazon S3\ninput + manifest file\n(30-day lifecycle,\nKMS encryption)", VERDE)
caixa(43, 12.5, 36, 28, "AWS Step Functions · orchestration", ROSA, tam=7.5, topo=True, fundo="#fff8fb", dash=True)
caixa(45, 27, 13, 9, "3. AWS Glue\ndata preparation\n(filters: stock, recent\npurchases, eligibility)", ROXO)
caixa(61, 31.5, 16, 6, "4a. Amazon Personalize\nNBO + item affinity", "#00897b")
caixa(61, 23.5, 16, 6, "4b. Amazon Personalize\nbasket (SIMS recipe)", "#00897b")
caixa(61, 14, 16, 7.5, "5. AWS Glue\nsupport, confidence, lift;\njoin, final filter,\nsuccess file", ROXO)
caixa(83, 24, 13, 10, "6. Amazon S3\noutput\n(30-day lifecycle,\nKMS encryption)", VERDE)
caixa(27, 4.5, 69, 5, "Security and governance: IAM Identity Center (named access) · AWS KMS · AWS CloudTrail · Amazon CloudWatch · "
      "AWS Budgets · VPC endpoints for S3", "#7b1fa2", tam=6.6, fundo="#faf5fc")

# setas
seta([(19.5, 33.5), (27, 30)], "export", 23.2, 32.8)
seta([(39, 29), (45, 31.5)], None)
ax.text(33, 20.3, "manifest ->\nEventBridge ->\nStep Functions", fontsize=5.6, color=CINZA, ha="center", va="center")
seta([(58, 33), (61, 34.5)])
seta([(58, 29), (61, 26.5)])
seta([(69, 23.5), (69, 21.5)])
seta([(77, 34.5), (78.2, 34.5), (78.2, 19), (77, 19)])
seta([(77, 17), (81, 17), (81, 29), (83, 29)])
# retorno para o Snowflake
seta([(89.5, 24), (89.5, 11), (23, 11), (23, 17.5), (19.5, 17.5)], "load back to Snowflake (after success file)", 56, 11)

# avaliação
ax.text(1, 0.6, "Offline evaluation vs. a popularity and basket-rules benchmark in Snowflake; A/B campaigns run by 3corações on its own channels.",
        fontsize=7, color=CINZA, style="italic", va="center")

fig.savefig(saida, bbox_inches="tight", facecolor="white")
print("ok", saida)
