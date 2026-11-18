"""
TrendShop - Gerador Autoral de Carrosséis e Vídeos 9:16
Máquina de Vendas 24h - Passo 1
Gera 3 imagens PNG para o Carrossel do Facebook e 1 vídeo MP4 vertical para Reels/Shorts/TikTok.
Uso: python gerar_midias.py [ID_PRODUTO] (ex: python gerar_midias.py 13)
"""

import sys
import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from moviepy import VideoClip

# Configurações de Dimensões e Cores
W_CARROSSEL, H_CARROSSEL = 1080, 1350  # Aspecto 4:5 vertical
W_VIDEO, H_VIDEO = 1080, 1920          # Aspecto 9:16 vertical
FPS_VIDEO = 30
DURACAO_POR_FOTO = 2.5                 # 5 fotos * 2.5s = 12.5s total

# Paleta Neon Dark TrendShop
COR_BG = (20, 9, 42)           # #14092A
COR_SURFACE = (14, 5, 32)      # #0E0520
COR_CARD = (27, 14, 56)        # #1B0E38
COR_CYAN = (0, 229, 255)       # #00E5FF
COR_PINK = (255, 42, 133)      # #FF2A85
COR_GREEN = (16, 185, 129)     # #10B981
COR_AMBER = (245, 158, 11)     # #F59E0B
COR_WHITE = (255, 255, 255)
COR_MUTED = (148, 163, 184)    # #94A3B8

def carregar_fonte(nome, tamanho):
    """Carrega fonte TrueType do Windows com fallback seguro."""
    windir = os.environ.get("WINDIR", "C:\\Windows")
    caminho = os.path.join(windir, "Fonts", nome)
    if os.path.exists(caminho):
        try:
            return ImageFont.truetype(caminho, tamanho)
        except Exception:
            pass
    try:
        return ImageFont.truetype("arialbd.ttf" if "bd" in nome else "arial.ttf", tamanho)
    except Exception:
        return ImageFont.load_default()

def quebrar_texto(draw, texto, fonte, largura_max):
    """Quebra texto em múltiplas linhas para não estourar a largura máxima."""
    palavras = texto.split()
    linhas = []
    linha_atual = []

    for palavra in palavras:
        linha_teste = " ".join(linha_atual + [palavra])
        bbox = draw.textbbox((0, 0), linha_teste, font=fonte)
        largura = bbox[2] - bbox[0]
        if largura <= largura_max:
            linha_atual.append(palavra)
        else:
            if linha_atual:
                linhas.append(" ".join(linha_atual))
                linha_atual = [palavra]
            else:
                linhas.append(palavra)
                linha_atual = []

    if linha_atual:
        linhas.append(" ".join(linha_atual))

    return linhas

def desenhar_fundo_neon(w, h):
    """Cria o canvas Neon Dark com gradiente sutil e partículas de glow."""
    base = Image.new("RGB", (w, h), COR_BG)
    draw = ImageDraw.Draw(base)

    # Brilhos sutis nos cantos
    # Glow ciano no topo esquerdo
    for r in range(120, 10, -10):
        alpha = int(12 * (1 - r / 120))
        draw.ellipse([(-60 - r, -60 - r), (180 + r, 180 + r)], fill=(COR_CYAN[0], COR_CYAN[1], COR_CYAN[2]))

    # Glow magenta no canto inferior direito
    for r in range(140, 10, -10):
        draw.ellipse([(w - 180 - r, h - 180 - r), (w + 60 + r, h + 60 + r)], fill=(COR_PINK[0], COR_PINK[1], COR_PINK[2]))

    # Suaviza para efeito de neon ambiente
    base = base.filter(ImageFilter.GaussianBlur(radius=60))
    return base

def ajustar_imagem_proporcional(caminho_img, largura_alvo, altura_alvo):
    """Carrega e redimensiona mantendo proporção (cover / fit) com alta qualidade."""
    if not os.path.exists(caminho_img):
        # Fallback se não existir
        img = Image.new("RGB", (largura_alvo, altura_alvo), (40, 20, 80))
        return img

    img = Image.open(caminho_img).convert("RGB")
    # Redimensiona mantendo aspecto e corta excesso (cover)
    img_ratio = img.width / img.height
    alvo_ratio = largura_alvo / altura_alvo

    if img_ratio > alvo_ratio:
        nova_altura = altura_alvo
        nova_largura = int(nova_altura * img_ratio)
    else:
        nova_largura = largura_alvo
        nova_altura = int(nova_largura / img_ratio)

    img_res = img.resize((nova_largura, nova_altura), Image.Resampling.LANCZOS)
    left = (nova_largura - largura_alvo) // 2
    top = (nova_altura - altura_alvo) // 2
    img_crop = img_res.crop((left, top, left + largura_alvo, top + altura_alvo))
    return img_crop

def criar_slide_1_capa(prod, caminho_saida):
    """Slide 1: Capa com Gancho de Curiosidade, Foto Principal e Desconto."""
    canvas = desenhar_fundo_neon(W_CARROSSEL, H_CARROSSEL)
    draw = ImageDraw.Draw(canvas)

    f_topo = carregar_fonte("segoeuib.ttf", 26)
    f_gancho = carregar_fonte("segoeuib.ttf", 44)
    f_titulo = carregar_fonte("segoeuib.ttf", 34)
    f_badge = carregar_fonte("segoeuib.ttf", 30)
    f_rodape = carregar_fonte("segoeuib.ttf", 24)

    # Topo: Faixa TrendShop Achados
    draw.rounded_rectangle([60, 45, W_CARROSSEL - 60, 105], radius=16, fill=COR_CARD, outline=COR_CYAN, width=2)
    draw.text((85, 62), "TRENDSHOP ACHADOS", fill=COR_CYAN, font=f_topo)
    draw.text((W_CARROSSEL - 410, 62), "CURADORIA OFICIAL SHOPEE", fill=COR_MUTED, font=f_topo)

    # Gancho de Abertura
    draw.text((60, 130), "ACHADO SECRETO DA SHOPEE", fill=COR_PINK, font=f_gancho)

    # Foto Principal Centralizada
    foto_path = f"assets/img/{prod['numero']}-1.jpg"
    foto = ajustar_imagem_proporcional(foto_path, 840, 620)

    # Moldura com borda neon ciano
    x_foto, y_foto = 120, 210
    draw.rounded_rectangle([x_foto - 6, y_foto - 6, x_foto + 840 + 6, y_foto + 620 + 6], radius=24, outline=COR_CYAN, width=4)
    canvas.paste(foto, (x_foto, y_foto))

    # Badge de Desconto sobre a foto
    desconto_txt = f"-{prod.get('desconto_percentual', 0)}% OFF"
    draw.rounded_rectangle([x_foto + 20, y_foto + 20, x_foto + 240, y_foto + 80], radius=16, fill=COR_PINK)
    draw.text((x_foto + 40, y_foto + 32), desconto_txt, fill=COR_WHITE, font=f_badge)

    # Título do Produto
    linhas_titulo = quebrar_texto(draw, prod["titulo"], f_titulo, 960)
    y_txt = 870
    for linha in linhas_titulo[:3]:
        draw.text((60, y_txt), linha, fill=COR_WHITE, font=f_titulo)
        y_txt += 46

    # Box de Avaliação e Categoria
    draw.rounded_rectangle([60, 1030, W_CARROSSEL - 60, 1140], radius=18, fill=COR_SURFACE, outline=COR_CARD, width=2)
    draw.text((90, 1055), f"Categoria: {prod.get('departamento', 'Achados')}", fill=COR_CYAN, font=f_topo)
    draw.text((90, 1090), f"Avaliação: {prod.get('avaliacao', '4.9')} ★  |  Mais de {prod.get('vendidos', '10 mil')} pedidos", fill=COR_AMBER, font=f_topo)

    # Rodapé Indicador
    draw.rounded_rectangle([60, 1220, W_CARROSSEL - 60, 1290], radius=14, fill=COR_CARD, outline=COR_PINK, width=1)
    draw.text((90, 1242), "Arraste para o lado para ver como funciona >>", fill=COR_WHITE, font=f_rodape)
    draw.text((W_CARROSSEL - 150, 1242), "1 / 3", fill=COR_PINK, font=f_rodape)

    canvas.save(caminho_saida, "PNG")

def criar_slide_2_beneficios(prod, caminho_saida):
    """Slide 2: Benefícios reais estruturados em 3 tópicos de alto impacto."""
    canvas = desenhar_fundo_neon(W_CARROSSEL, H_CARROSSEL)
    draw = ImageDraw.Draw(canvas)

    f_topo = carregar_fonte("segoeuib.ttf", 26)
    f_sub = carregar_fonte("segoeuib.ttf", 40)
    f_num = carregar_fonte("segoeuib.ttf", 30)
    f_ben = carregar_fonte("segoeuib.ttf", 26)
    f_rodape = carregar_fonte("segoeuib.ttf", 24)

    # Topo
    draw.rounded_rectangle([60, 45, W_CARROSSEL - 60, 105], radius=16, fill=COR_CARD, outline=COR_CYAN, width=2)
    draw.text((85, 62), "TRENDSHOP ACHADOS", fill=COR_CYAN, font=f_topo)
    draw.text((W_CARROSSEL - 460, 62), "POR QUE ESSE PRODUTO É VIRAL?", fill=COR_MUTED, font=f_topo)

    # Subtítulo
    draw.text((60, 130), "3 MOTIVOS PARA VOCÊ TER O SEU:", fill=COR_CYAN, font=f_sub)

    # Foto em uso ou detalhe
    foto_path = f"assets/img/{prod['numero']}-2.jpg"
    foto = ajustar_imagem_proporcional(foto_path, 960, 380)
    draw.rounded_rectangle([60 - 4, 195 - 4, 60 + 960 + 4, 195 + 380 + 4], radius=20, outline=COR_PINK, width=3)
    canvas.paste(foto, (60, 195))

    # 3 Boxes de Benefícios
    beneficios = prod.get("beneficios", [
        "Alta durabilidade e acabamento premium com excelente custo-benefício.",
        "Praticidade diária que poupa seu tempo e esforço com máxima eficiência.",
        "Produto testado e aprovado com garantia oficial de 90 dias Shopee."
    ])

    y_box = 610
    for idx, ben in enumerate(beneficios[:3]):
        draw.rounded_rectangle([60, y_box, W_CARROSSEL - 60, y_box + 170], radius=18, fill=COR_CARD, outline=COR_CYAN, width=2)
        
        # Marcador numérico
        draw.rounded_rectangle([80, y_box + 20, 140, y_box + 80], radius=12, fill=COR_CYAN)
        draw.text((96, y_box + 30), f"0{idx + 1}", fill=COR_BG, font=f_num)

        # Texto do benefício com quebra
        linhas = quebrar_texto(draw, ben, f_ben, 820)
        y_ben_txt = y_box + 22
        for linha in linhas[:3]:
            draw.text((160, y_ben_txt), linha, fill=COR_WHITE, font=f_ben)
            y_ben_txt += 36

        y_box += 195

    # Rodapé
    draw.rounded_rectangle([60, 1220, W_CARROSSEL - 60, 1290], radius=14, fill=COR_CARD, outline=COR_CYAN, width=1)
    draw.text((90, 1242), "Veja a oferta e o desconto no último slide >>", fill=COR_WHITE, font=f_rodape)
    draw.text((W_CARROSSEL - 150, 1242), "2 / 3", fill=COR_CYAN, font=f_rodape)

    canvas.save(caminho_saida, "PNG")

def criar_slide_3_oferta(prod, caminho_saida):
    """Slide 3: Preço Oficial, Comparativo De/Por e Chamada para Ação."""
    canvas = desenhar_fundo_neon(W_CARROSSEL, H_CARROSSEL)
    draw = ImageDraw.Draw(canvas)

    f_topo = carregar_fonte("segoeuib.ttf", 26)
    f_sub = carregar_fonte("segoeuib.ttf", 40)
    f_preco_orig = carregar_fonte("segoeuib.ttf", 34)
    f_preco_promo = carregar_fonte("segoeuib.ttf", 64)
    f_cta = carregar_fonte("segoeuib.ttf", 36)
    f_selo = carregar_fonte("segoeuib.ttf", 24)
    f_rodape = carregar_fonte("segoeuib.ttf", 24)

    # Topo
    draw.rounded_rectangle([60, 45, W_CARROSSEL - 60, 105], radius=16, fill=COR_CARD, outline=COR_GREEN, width=2)
    draw.text((85, 62), "TRENDSHOP ACHADOS", fill=COR_GREEN, font=f_topo)
    draw.text((W_CARROSSEL - 450, 62), "CONDIÇÃO EXCLUSIVA HOJE", fill=COR_WHITE, font=f_topo)

    # Título da Oferta
    draw.text((60, 130), "VALOR REAL & DESCONTO SHOPEE", fill=COR_GREEN, font=f_sub)

    # Foto em destaque menor
    foto_path = f"assets/img/{prod['numero']}-3.jpg"
    foto = ajustar_imagem_proporcional(foto_path, 960, 420)
    draw.rounded_rectangle([60 - 4, 195 - 4, 60 + 960 + 4, 195 + 420 + 4], radius=20, outline=COR_GREEN, width=3)
    canvas.paste(foto, (60, 195))

    # Box de Preço
    preco_orig = f"De R$ {float(prod.get('preco_original', 0)):.2f}".replace('.', ',')
    preco_promo = f"R$ {float(prod.get('preco_promocional', 0)):.2f}".replace('.', ',')
    desconto = f"-{prod.get('desconto_percentual', 0)}% OFF"

    y_preco = 645
    draw.rounded_rectangle([60, y_preco, W_CARROSSEL - 60, y_preco + 280], radius=24, fill=COR_CARD, outline=COR_GREEN, width=3)
    
    # Preço Original Riscado
    draw.text((100, y_preco + 30), preco_orig, fill=COR_MUTED, font=f_preco_orig)
    bbox_orig = draw.textbbox((100, y_preco + 30), preco_orig, font=f_preco_orig)
    draw.line([(bbox_orig[0] - 5, bbox_orig[1] + 20), (bbox_orig[2] + 5, bbox_orig[1] + 20)], fill=COR_PINK, width=4)

    # Preço Promocional Gigante
    draw.text((100, y_preco + 80), f"Por APENAS {preco_promo}", fill=COR_GREEN, font=f_preco_promo)

    # Desconto Badge
    draw.rounded_rectangle([W_CARROSSEL - 330, y_preco + 25, W_CARROSSEL - 100, y_preco + 85], radius=16, fill=COR_PINK)
    draw.text((W_CARROSSEL - 305, y_preco + 38), desconto, fill=COR_WHITE, font=f_topo)

    # Sub-itens de confiança
    draw.text((100, y_preco + 170), "✔ Frete Grátis Disponível Shopee", fill=COR_CYAN, font=f_selo)
    draw.text((100, y_preco + 210), "✔ Garantia de Devolução 90 Dias Shopee Brasil", fill=COR_WHITE, font=f_selo)
    draw.text((W_CARROSSEL - 430, y_preco + 170), "✔ Envio Direto e Imediato", fill=COR_CYAN, font=f_selo)

    # Botão Simulado CTA
    y_cta = 960
    draw.rounded_rectangle([60, y_cta, W_CARROSSEL - 60, y_cta + 110], radius=22, fill=COR_PINK)
    draw.text((160, y_cta + 35), "CLIQUE NO LINK DA LEGENDA PARA COMPRAR", fill=COR_WHITE, font=f_cta)

    # Aviso de Segurança
    draw.text((60, 1100), "Link oficial verificado pela Curadoria TrendShop. Oferta sujeita a estoque.", fill=COR_MUTED, font=f_selo)

    # Rodapé
    draw.rounded_rectangle([60, 1220, W_CARROSSEL - 60, 1290], radius=14, fill=COR_CARD, outline=COR_GREEN, width=1)
    draw.text((90, 1242), "Curadoria Oficial TrendShop Brasil", fill=COR_WHITE, font=f_rodape)
    draw.text((W_CARROSSEL - 150, 1242), "3 / 3", fill=COR_GREEN, font=f_rodape)

    canvas.save(caminho_saida, "PNG")

def gerar_video_9x16(prod, caminho_saida):
    """
    Gera vídeo MP4 vertical 1080x1920 a 30fps.
    Anima as 5 fotos do produto com zoom suave, faixa superior, preço e legendas queimadas.
    """
    numero = prod["numero"]
    fotos_paths = [f"assets/img/{numero}-{i}.jpg" for i in range(1, 6)]

    # Pré-carrega as 5 fotos redimensionadas para base (1080 x 1200)
    fotos_base = []
    for fp in fotos_paths:
        if os.path.exists(fp):
            im = Image.open(fp).convert("RGB")
        else:
            im = Image.new("RGB", (1080, 1200), COR_CARD)
        fotos_base.append(im)

    # Textos das legendas queimadas
    bens = prod.get("beneficios", [
        "Qualidade comprovada e material resistente",
        "Praticidade absoluta para o seu dia a dia",
        "Excelente economia e garantia oficial Shopee"
    ])

    legendas_por_foto = [
        ("ACHADO VIRAL SHOPEE", prod["titulo"][:60]),
        ("BENEFÍCIO #1", bens[0] if len(bens) > 0 else ""),
        ("BENEFÍCIO #2", bens[1] if len(bens) > 1 else ""),
        ("BENEFÍCIO #3", bens[2] if len(bens) > 2 else ""),
        ("OFERTA EXCLUSIVA", f"Apenas R$ {float(prod.get('preco_promocional', 0)):.2f}! Link na Bio & Comentários")
    ]

    # Fontes preparadas
    f_faixa = carregar_fonte("segoeuib.ttf", 36)
    f_subfaixa = carregar_fonte("segoeuib.ttf", 22)
    f_preco = carregar_fonte("segoeuib.ttf", 46)
    f_desc = carregar_fonte("segoeuib.ttf", 28)
    f_leg_tag = carregar_fonte("segoeuib.ttf", 28)
    f_leg_txt = carregar_fonte("segoeuib.ttf", 34)

    duracao_total = len(fotos_base) * DURACAO_POR_FOTO

    def make_frame(t):
        # Determina qual foto exibir e progresso dentro dela
        idx_foto = min(int(t // DURACAO_POR_FOTO), len(fotos_base) - 1)
        tempo_na_foto = t - (idx_foto * DURACAO_POR_FOTO)
        frac = tempo_na_foto / DURACAO_POR_FOTO

        # Zoom suave de 1.00 para 1.08
        zoom = 1.0 + (0.08 * frac)

        foto_orig = fotos_base[idx_foto]
        w_orig, h_orig = foto_orig.size
        # Área de corte central com zoom
        crop_w = int(w_orig / zoom)
        crop_h = int(h_orig / zoom)
        left = (w_orig - crop_w) // 2
        top = (h_orig - crop_h) // 2
        foto_zoom = foto_orig.crop((left, top, left + crop_w, top + crop_h))

        # Redimensiona para a área central do vídeo (1080 x 1280)
        foto_display = foto_zoom.resize((1080, 1280), Image.Resampling.BILINEAR)

        # Cria canvas do frame 1080 x 1920
        frame = Image.new("RGB", (W_VIDEO, H_VIDEO), COR_BG)
        # Cola a foto centralizada verticalmente
        frame.paste(foto_display, (0, 260))

        draw = ImageDraw.Draw(frame)

        # 1. FAIXA SUPERIOR FIXA: TRENDSHOP ACHADOS
        draw.rectangle([0, 0, W_VIDEO, 220], fill=COR_SURFACE)
        draw.line([(0, 220), (W_VIDEO, 220)], fill=COR_CYAN, width=4)
        draw.text((60, 60), "TRENDSHOP ACHADOS", fill=COR_CYAN, font=f_faixa)
        draw.text((60, 115), "CURADORIA OFICIAL SHOPEE BRASIL", fill=COR_MUTED, font=f_subfaixa)

        # Badge de Preço Promocional no canto superior direito
        preco_txt = f"R$ {float(prod.get('preco_promocional', 0)):.2f}".replace('.', ',')
        draw.rounded_rectangle([W_VIDEO - 360, 50, W_VIDEO - 40, 170], radius=16, fill=COR_CARD, outline=COR_GREEN, width=2)
        draw.text((W_VIDEO - 340, 65), preco_txt, fill=COR_GREEN, font=f_preco)
        draw.text((W_VIDEO - 340, 125), f"-{prod.get('desconto_percentual', 0)}% OFF HOJE", fill=COR_PINK, font=f_desc)

        # 2. LEGENDA QUEIMADA (TERÇO INFERIOR: y=1560 a y=1840)
        tag_leg, txt_leg = legendas_por_foto[idx_foto]
        draw.rounded_rectangle([40, 1560, W_VIDEO - 40, 1850], radius=24, fill=COR_CARD, outline=COR_CYAN, width=3)
        
        # Tag da cena / benefício
        draw.rounded_rectangle([70, 1585, 380, 1635], radius=10, fill=COR_PINK)
        draw.text((85, 1595), tag_leg, fill=COR_WHITE, font=f_leg_tag)

        # Texto quebrado da legenda
        linhas_leg = quebrar_texto(draw, txt_leg, f_leg_txt, 980)
        y_leg = 1660
        for l in linhas_leg[:3]:
            draw.text((70, y_leg), l, fill=COR_WHITE, font=f_leg_txt)
            y_leg += 46

        # Indicador de tempo/progresso
        draw.line([(40, 1845), (40 + int((t / duracao_total) * (W_VIDEO - 80)), 1845)], fill=COR_CYAN, width=6)

        return np.array(frame)

    clip = VideoClip(make_frame, duration=duracao_total)
    clip.write_videofile(
        caminho_saida,
        fps=FPS_VIDEO,
        codec="libx264",
        preset="fast",
        audio=False,
        logger=None
    )
    clip.close()

def main():
    # Obtém ID do argumento da CLI (default = 13)
    id_arg = "13"
    if len(sys.argv) > 1:
        id_arg = str(sys.argv[1]).strip()

    # Carrega data/produtos.json
    caminho_json = os.path.join(os.path.dirname(__file__), "data", "produtos.json")
    if not os.path.exists(caminho_json):
        print(f"[ERRO] Arquivo não encontrado: {caminho_json}")
        sys.exit(1)

    with open(caminho_json, "r", encoding="utf-8") as f:
        produtos = json.load(f)

    # Localiza o produto pelo ID ou número
    id_num = None
    try:
        id_num = int(id_arg)
    except ValueError:
        pass

    prod = None
    for p in produtos:
        if id_num is not None and p.get("id") == id_num:
            prod = p
            break
        if str(p.get("numero", "")) == id_arg or str(p.get("numero", "")).zfill(2) == id_arg.zfill(2):
            prod = p
            break

    if not prod:
        print(f"[ERRO] Produto com ID {id_arg} não encontrado no catálogo.")
        sys.exit(1)

    id_pasta = prod.get("numero") or str(prod.get("id", "13")).zfill(2)
    pasta_saida = os.path.join(os.path.dirname(__file__), "producao_redes", f"ID_{id_pasta}")
    os.makedirs(pasta_saida, exist_ok=True)

    print(f"============================================================")
    print(f"🚀 TRENDSHOP - MÁQUINA DE VENDAS 24H (GERADOR DE MÍDIAS)")
    print(f"📦 Produto Selecionado: {prod['titulo']}")
    print(f"🆔 ID: {prod['id']} | Número: {prod['numero']}")
    print(f"📂 Diretório de Saída: {pasta_saida}")
    print(f"============================================================")

    # 1. Slide 1 (Capa)
    p_slide1 = os.path.join(pasta_saida, "slide_1_capa.png")
    print(f"⏳ [1/4] Gerando Carrossel Slide 1: {p_slide1}...")
    criar_slide_1_capa(prod, p_slide1)
    print(f"✔ Slide 1 (Capa/Gancho) gerado com sucesso!")

    # 2. Slide 2 (Benefícios)
    p_slide2 = os.path.join(pasta_saida, "slide_2_beneficios.png")
    print(f"⏳ [2/4] Gerando Carrossel Slide 2: {p_slide2}...")
    criar_slide_2_beneficios(prod, p_slide2)
    print(f"✔ Slide 2 (Benefícios) gerado com sucesso!")

    # 3. Slide 3 (Oferta)
    p_slide3 = os.path.join(pasta_saida, "slide_3_oferta.png")
    print(f"⏳ [3/4] Gerando Carrossel Slide 3: {p_slide3}...")
    criar_slide_3_oferta(prod, p_slide3)
    print(f"✔ Slide 3 (Oferta/Preço Real) gerado com sucesso!")

    # 4. Vídeo Vertical 9:16
    p_video = os.path.join(pasta_saida, "video_9x16.mp4")
    print(f"⏳ [4/4] Renderizando Vídeo Vertical 9:16 (1080x1920 30fps): {p_video}...")
    gerar_video_9x16(prod, p_video)
    print(f"✔ Vídeo 9:16 renderizado com sucesso!")

    print(f"============================================================")
    print(f"🎉 GERAÇÃO CONCLUÍDA COM SUCESSO EM: {pasta_saida}")
    print(f"📸 slide_1_capa.png (1080x1350)")
    print(f"📸 slide_2_beneficios.png (1080x1350)")
    print(f"📸 slide_3_oferta.png (1080x1350)")
    print(f"🎬 video_9x16.mp4 (1080x1920, 30fps)")
    print(f"============================================================")

if __name__ == "__main__":
    main()
