from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
import os
import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.utils import ImageReader
import asyncio
from datetime import datetime

app = FastAPI(title="Generador de PDF de Certificados", version="1.0.0")

class Cabezera1(BaseModel):
    boleta_no: str
    fecha: str
    lote: str

class Cabezera2(BaseModel):
    productor: str
    producto: str
    procedencia: str
    vehiculo: str
    placas: str
    chofer: str

class AnalisisItem(BaseModel):
    tipo: str
    porcentaje: Optional[float] = None
    castigo: Optional[float] = None

class PesosInfo1(BaseModel):
    peso_bruto: float
    peso_tara: float
    peso_neto: float
    fechaneto: str
    fechabruto: str
    fechatara: str
    horabruto: str
    horatara: str

class PesosInfo2(BaseModel):
    deduccion: float
    peso_neto_analizado: float

class CertificadoRequest(BaseModel):
    boleta_no: str
    fecha: str
    lote: str
    productor: str
    producto: str
    procedencia: str
    vehiculo: str
    placas: str
    chofer: str
    analisis: Optional[List[AnalisisItem]] = []
    pesos_info1: PesosInfo1
    pesos_info2: PesosInfo2
    observaciones: Optional[str] = ""

# Colores principales del diseño
#Hoja 1
rojo_color = (0.8,0,0.3)
verde_color = (0.6, 0.85, 0.6)
azul_color = (0.48,0.67,0.87)
rosa_color = (0.89,0.63,0.75)

#ENTRADAS
texto_hoja_1 = ["PRODUCTOR","FLETE"]
texto_hoja_2 = ["CONTABILIDAD","ARCHIVO"]
#SALIDAS
# texto_hoja_1 = ["CLIENTE","CHOFER"]
# texto_hoja_2 = ["CONTABILIDAD","ARCHIVO"]

# Funciones del código original (copiadas tal como están)

async def draw_logo(c: canvas.Canvas, logo_color: int):
    logo_path = "C:/API/pdf-entradas/imagenes/logo.png" #if logo_color == 1 else "C:/API/pdf-entradas/imagenes/logo_gray.png"
    # logo_path_second = "C:/API/pdf-entradas/imagenes/logo_gray.png"
    logo_width = 78
    logo_height = 60

    # Dibujar logo en la parte superior e inferior   
    c.drawImage(logo_path, 25, letter[1] - 80, width=logo_width, height=logo_height)
    c.drawImage(logo_path, 25, (letter[1] / 2) - 80, width=logo_width, height=logo_height)

async def draw_background(c: canvas.Canvas, logo_color: int):
    background_path = "C:/API/pdf-entradas/imagenes/logo.png" #if logo_color == 1 else "C:/API/pdf-entradas/imagenes/logo_gray.png"
    # background_path_second = "C:/API/pdf-entradas/imagenes/logo_gray.png" 
    background_width = 240
    background_height = 200

    # Dibujar fondo en la parte superior e inferior
    c.setFillAlpha(0.1)
    c.drawImage(background_path, 340, 420, width=background_width, height=background_height, mask='auto')
    c.setFillColorRGB(0.7, 0.7, 0.7)
    c.drawImage(background_path, 340, (letter[1] / 2) - 370, width=background_width, height=background_height, mask='auto')
    c.setFillColorRGB(0, 0, 0)
    c.setFillAlpha(1)

async def draw_infoCompany(c: canvas.Canvas, data: Cabezera1, page_color: int):
    w, h = letter
    # Parte superior

    c.setFont("Helvetica-Bold", 17)
    c.drawString(w / 5, h - 35, "ACEITES Y PROTEINAS, S.A. DE C.V.")

    color_top = rojo_color if page_color == 1 else azul_color
    color_bottom = verde_color if page_color == 1 else rosa_color
    # Número de boleta

    boleta_data = [
        ["Boleta No:"],
        [data.boleta_no]
        ]

    boleta_table = Table(boleta_data, colWidths=[100], rowHeights=[18, 20])

    boleta_style = [
        ('BACKGROUND', (0, 0), (0, 0), color_top),        # Fondo celda 1
        ('BACKGROUND', (0, 1), (0, 1), colors.white),        # Fondo celda 2
        ('TEXTCOLOR', (0, 0), (0, 0), colors.white),         # Color texto celda 1
        ('TEXTCOLOR', (0, 1), (0, 1), colors.black),          # Color texto celda 2
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),               # Alineación horizontal
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),              # Alineación vertical
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),      # Fuente celda 1
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),           # Fuente celda 2
        ('FONTSIZE', (0, 0), (0, 0), 10),                    # Tamaño fuente celda 1
        ('FONTSIZE', (0, 1), (0, 1), 10),                    # Tamaño fuente celda 2
        ('GRID', (0, 0), (-1, -1), 1, color_top),         # Bordes
    ]

    boleta_table.setStyle(TableStyle(boleta_style))
    boleta_table.wrapOn(c, w, h)
    boleta_table.drawOn(c, w - (w / 4.5), h - 65)

    # Información de la empresa

    c.setFont("Helvetica", 8)
    c.setFillColor((0,0,0))
    c.drawString(w / 5, h - 50, "CAMINO A BACHOCO S/N LOCALIDAD BACHIGUALATO. C.P. 80130, CULIACAN, SINALOA.")
    c.drawString(w / 5, h - 62.5, "TEL: 667-600-003, 667-600-005, 667-600-021 CORREO: contacto@aceitesyproteinas.com ")

    c.setFont("Helvetica-Bold", 11)
    c.drawString(w / 5, h - 85, "CERTIFICADO DE PESO Y CALIDAD")

    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 40, h - 85, "Fecha: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 75, h - 85, data.fecha)

    c.setFillColor((0,0,0))
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 180, h - 380, "Lote: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 205, h - 380, data.lote)

    # Parte inferior

    c.setFillColor((0,0,0))
    c.setFont("Helvetica-Bold", 17)
    c.drawString(w / 5, (h / 2) - 35, "ACEITES Y PROTEINAS, S.A. DE C.V.")

    # Número de boleta

    boleta_data = [
        ["Boleta No:"],
        [data.boleta_no]
        ]

    boleta_table = Table(boleta_data, colWidths=[100], rowHeights=[18, 20])

    boleta_style = [
        ('BACKGROUND', (0, 0), (0, 0), color_bottom),        # Fondo celda 1
        ('BACKGROUND', (0, 1), (0, 1), colors.white),        # Fondo celda 2
        ('TEXTCOLOR', (0, 0), (0, 0), colors.white),         # Color texto celda 1
        ('TEXTCOLOR', (0, 1), (0, 1), colors.black),          # Color texto celda 2
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),               # Alineación horizontal
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),              # Alineación vertical
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),      # Fuente celda 1
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),           # Fuente celda 2
        ('FONTSIZE', (0, 0), (0, 0), 10),                    # Tamaño fuente celda 1
        ('FONTSIZE', (0, 1), (0, 1), 10),                    # Tamaño fuente celda 2
        ('GRID', (0, 0), (-1, -1), 1, color_bottom),         # Bordes
    ]

    boleta_table.setStyle(TableStyle(boleta_style))
    boleta_table.wrapOn(c, w, h)
    boleta_table.drawOn(c, w - (w / 4.5), (h / 2) - 65)

    # Información de la empresa

    c.setFont("Helvetica", 8)
    c.setFillColor((0,0,0))
    c.drawString(w / 5, (h / 2) - 50, "CAMINO A BACHOCO S/N LOCALIDAD BACHIGUALATO. C.P. 80130, CULIACAN, SINALOA.")
    c.drawString(w / 5, (h / 2) - 62.5, "TEL: 667-600-003, 667-600-005, 667-600-021 CORREO: contacto@aceitesyproteinas.com ")

    c.setFont("Helvetica-Bold", 11)
    c.drawString(w / 5, (h / 2) - 85, "CERTIFICADO DE PESO Y CALIDAD")

    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 40, (h / 2) - 85, "Fecha: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 75, (h / 2) - 85, data.fecha)

    c.setFillColor((0,0,0))
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 180, (h / 2) - 380, "Lote: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 205, (h / 2) - 380, data.lote)

async def draw_infoShipment(c: canvas.Canvas, data: Cabezera2, page_color: int):
    w, h = letter
    color = rojo_color if page_color == 1 else (0,0,0)
    # Parte superior

    # Estilo para las info data

    info_style_top = ParagraphStyle(
        name="",
        alignment=TA_LEFT,
        leading=10,
        leftIndent=0,
        rightIndent=0,
        textColor=(0,0,0),
        fontName="Helvetica",
        fontSize=9
    )

    info_style_bottom = ParagraphStyle(
        name="",
        alignment=TA_LEFT,
        leading=10,
        leftIndent=0,
        rightIndent=0,
        textColor=(0,0,0),
        fontName="Helvetica",
        fontSize=9
    )

    def drawInfoStringTop(x: float, text : str, style : any):
        obs_paragraph_top = Paragraph(text, style)
        obs_width = 130
        obs_max_height = 1  # Altura máxima disponible
        
        w_para, h_para = obs_paragraph_top.wrap(obs_width, obs_max_height)

        y_param_top = h - 102
        if(h_para != info_style_top.leading):
            y_param_top = h - 102 - (h_para / 2)
        
        return obs_paragraph_top.drawOn(c, x, y_param_top)
    
    def drawInfoStringBottom(x: float, text : str, style : any):
        obs_paragraph_top = Paragraph(text, style)
        obs_width = 130
        obs_max_height = 1  # Altura máxima disponible
        
        w_para, h_para = obs_paragraph_top.wrap(obs_width, obs_max_height)

        y_param_top = (h / 2) - 102
        if(h_para != info_style_top.leading):
            y_param_top = (h / 2) - 102 - (h_para / 2)
        
        return obs_paragraph_top.drawOn(c, x, y_param_top)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString(30, h - 102, "Productor: ")
    drawInfoStringTop(80, data.productor, info_style_top)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString((w / 2) - 80, h - 102, "Producto: ")
    drawInfoStringTop((w / 2) - 30, data.producto, info_style_top)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString(w - (w / 3), h - 102, "Procedencia: ")
    drawInfoStringTop(w - (w / 4.25), data.procedencia, info_style_top)

    c.setFillColor((0,0,0))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(30, h - 129, "Vehiculo: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString(75, h - 129, data.vehiculo)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString((w / 2) - 80, h - 129, "Placas: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) - 45, h - 129, data.placas)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString(w - (w / 3), h - 129, "Chofer: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString(w - (w / 3.6), h - 129, data.chofer)

    c.setFillAlpha(0.2)
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(color)
    c.drawString((w / 2) - 250, h - 370, "ENTRADAS")
    c.setFillAlpha(1)

    # Parte inferior

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString(30, (h / 2) - 102, "Productor: ")
    drawInfoStringBottom(80, data.productor, info_style_bottom)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString((w / 2) - 80, (h / 2) - 102, "Producto: ")
    drawInfoStringBottom((w / 2) - 30, data.producto, info_style_bottom)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString(w - (w / 3), (h / 2) - 102, "Procedencia: ")
    drawInfoStringBottom(w - (w / 4.25), data.procedencia, info_style_bottom)

    c.setFillColor((0,0,0))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(30, (h / 2) - 129, "Vehiculo: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString(75, (h / 2) - 129, data.vehiculo)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString((w / 2) - 80, (h / 2) - 129, "Placas: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) - 45, (h / 2) - 129, data.placas)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor((0,0,0))
    c.drawString(w - (w / 3), (h / 2) - 129, "Chofer: ")
    c.setFillColor((0,0,0))
    c.setFont("Helvetica", 9)
    c.drawString(w - (w / 3.6), (h / 2) - 129, data.chofer)

    c.setFillAlpha(0.2)
    c.setFillColor((0,0,0))
    c.setFont("Helvetica-Bold", 30)
    c.drawString((w / 2) - 250, (h / 2) - 370, "ENTRADAS")
    c.setFillAlpha(1)

async def draw_analisisTable(c: canvas.Canvas, data: CertificadoRequest, page_color: int):
    w, h = letter
    color_top = rojo_color if page_color == 1 else azul_color
    color_bottom = verde_color if page_color == 1 else rosa_color

    # Obtener lista de análisis

    analisis_items = data.analisis or []

    # Construir filas de la tabla

    analisis_data = [['ANALISIS', '%', 'CASTIGOS (KG)']]
    for item in analisis_items:
        tipo = (item.tipo or "").upper()
        porcentaje = f"{item.porcentaje}" if item.porcentaje is not None else "-"
        castigo = f"{item.castigo}" if item.castigo is not None else "-"
        analisis_data.append([tipo, porcentaje, castigo])

    # Calcular posición Y según número de items

    num_items = len(analisis_items)
    if num_items <= 3:
        y_pos_top = h - 185
        y_pos_bottom = (h / 2) - 185
    else:
        extra = min((num_items - 3) * 25, 135)
        y_pos_top = h - 185 - extra
        y_pos_bottom = (h / 2) - 185 - extra

    # TABLA SUPERIOR (color principal)

    analisis_table_top = Table(analisis_data, colWidths=[90, 50, 70], rowHeights=13)
    
    table_style_top = [
        ('BACKGROUND', (0, 0), (-1, 0), color_top),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 1, color_top),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]

    # Marcar filas sin datos en gris claro

    for i in range(1, len(analisis_data)):
        if analisis_data[i][1] == "-" and analisis_data[i][2] == "-":
            table_style_top.append(('BACKGROUND', (0, i), (-1, i), colors.lightgrey))

    analisis_table_top.setStyle(TableStyle(table_style_top))
    analisis_table_top.wrapOn(c, w, h)
    analisis_table_top.drawOn(c, 30, y_pos_top)

    # TABLA INFERIOR (color secundario) - CREAR NUEVA TABLA

    analisis_table_bottom = Table(analisis_data, colWidths=[90, 50, 70], rowHeights=13)
    
    table_style_bottom = [
        ('BACKGROUND', (0, 0), (-1, 0), color_bottom),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 1, color_bottom),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]

    for i in range(1, len(analisis_data)):
        if analisis_data[i][1] == "-" and analisis_data[i][2] == "-":
            table_style_bottom.append(('BACKGROUND', (0, i), (-1, i), colors.lightgrey))

    analisis_table_bottom.setStyle(TableStyle(table_style_bottom))
    analisis_table_bottom.wrapOn(c, w, h)
    analisis_table_bottom.drawOn(c, 30, y_pos_bottom)

async def draw_pesosTable(c: canvas.Canvas, data: PesosInfo1, page_color: int):
    w, h = letter
    color_top = rojo_color if page_color == 1 else azul_color
    color_bottom = verde_color if page_color == 1 else rosa_color
    header_height = 17
    value_height = 27

    main_value_style = ParagraphStyle(
        name='MainValue',
        alignment=TA_CENTER,
        fontSize=9,
        fontName='Helvetica-Bold',
        leading=6,
        spaceAfter=1
    )

    subtext_style = ParagraphStyle(
        name='Subtext',
        alignment=TA_CENTER,
        fontSize=6,
        fontName='Helvetica',
        leading=10
    )

    def create_value_cell(main_text, sub_text):
        main_para = Paragraph(f"{main_text}", main_value_style)
        sub_para = Paragraph(sub_text, subtext_style)
        inner_table = Table([[main_para], [sub_para]], colWidths=[120])
        return inner_table

    # Preparar datos de la tabla

    pesos_data = [
        ["PESO BRUTO (KG)"],
        [create_value_cell(f"{data.peso_bruto:.3f}", data.fechabruto + " " + data.horabruto)],
        ["PESO TARA (KG)"],
        [create_value_cell(f"{data.peso_tara:.3f}", data.fechatara + " " + data.horatara)],
        ["PESO NETO (KG)"],
        [create_value_cell(f"{data.peso_neto:.3f}", data.fechaneto)]
    ]

    row_heights = [
        header_height, value_height,
        header_height, value_height,
        header_height, value_height,
    ]

    # TABLA SUPERIOR (color principal)

    pesos_table_top = Table(pesos_data, colWidths=[120], rowHeights=row_heights)

    table_style_top = [
        ('BACKGROUND', (0, 0), (0, 0), color_top),
        ('BACKGROUND', (0, 2), (0, 2), color_top),
        ('BACKGROUND', (0, 4), (0, 4), color_top),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.whitesmoke),
        ('TEXTCOLOR', (0, 2), (0, 2), colors.whitesmoke),
        ('TEXTCOLOR', (0, 4), (0, 4), colors.whitesmoke),
        ('BACKGROUND', (0, 1), (0, 1), colors.white),
        ('BACKGROUND', (0, 3), (0, 3), colors.white),
        ('BACKGROUND', (0, 5), (0, 5), colors.white),
        ('ALIGN', (0, 1), (0, 1), 'CENTER'),
        ('ALIGN', (0, 3), (0, 3), 'CENTER'),
        ('ALIGN', (0, 5), (0, 5), 'CENTER'),
        ('VALIGN', (0, 1), (0, 1), 'MIDDLE'),
        ('VALIGN', (0, 3), (0, 3), 'MIDDLE'),
        ('VALIGN', (0, 5), (0, 5), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, color_top),
    ]

    pesos_table_top.setStyle(TableStyle(table_style_top))
    pesos_table_top.wrapOn(c, w, h)
    pesos_table_top.drawOn(c, (w / 2) - 20, h - 280)

    # TABLA INFERIOR (color secundario) - CREAR NUEVA TABLA

    # Recrear las celdas para evitar problemas de reutilización

    pesos_data_bottom = [
        ["PESO BRUTO (KG)"],
        [create_value_cell(f"{data.peso_bruto:.3f}", data.fechabruto + " " + data.horabruto)],
        ["PESO TARA (KG)"],
        [create_value_cell(f"{data.peso_tara:.3f}", data.fechatara + " " + data.horatara)],
        ["PESO NETO (KG)"],
        [create_value_cell(f"{data.peso_neto:.3f}", data.fechaneto)]
    ]
    
    pesos_table_bottom = Table(pesos_data_bottom, colWidths=[120], rowHeights=row_heights)
    
    table_style_bottom = [
        ('BACKGROUND', (0, 0), (0, 0), color_bottom),
        ('BACKGROUND', (0, 2), (0, 2), color_bottom),
        ('BACKGROUND', (0, 4), (0, 4), color_bottom),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.whitesmoke),
        ('TEXTCOLOR', (0, 2), (0, 2), colors.whitesmoke),
        ('TEXTCOLOR', (0, 4), (0, 4), colors.whitesmoke),
        ('BACKGROUND', (0, 1), (0, 1), colors.white),
        ('BACKGROUND', (0, 3), (0, 3), colors.white),
        ('BACKGROUND', (0, 5), (0, 5), colors.white),
        ('ALIGN', (0, 1), (0, 1), 'CENTER'),
        ('ALIGN', (0, 3), (0, 3), 'CENTER'),
        ('ALIGN', (0, 5), (0, 5), 'CENTER'),
        ('VALIGN', (0, 1), (0, 1), 'MIDDLE'),
        ('VALIGN', (0, 3), (0, 3), 'MIDDLE'),
        ('VALIGN', (0, 5), (0, 5), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, color_bottom),
    ]
    
    pesos_table_bottom.setStyle(TableStyle(table_style_bottom))
    pesos_table_bottom.wrapOn(c, w, h)
    pesos_table_bottom.drawOn(c, (w / 2) - 20, (h / 2) - 280)

async def draw_deductionTable(c: canvas.Canvas, data: PesosInfo2, page_color: int):
    w, h = letter
    color_top = rojo_color if page_color == 1 else azul_color
    color_bottom = verde_color if page_color == 1 else rosa_color
    header_height = 17
    value_height = 20

    main_value_style = ParagraphStyle(
        name='MainValue',
        alignment=TA_CENTER,
        fontSize=9,
        fontName='Helvetica-Bold',
        leading=6,
        spaceAfter=1
    )

    def create_value_cell(main_text):
        main_para = Paragraph(f"{main_text}", main_value_style)
        inner_table = Table([[main_para]], colWidths=[130])
        return inner_table

    pesos_data = [
        ["DEDUCCIÓN (KG)"],
        [create_value_cell(f"{data.deduccion:.3f}")],
        ["PESO NETO ANALIZADO (KG)"],
        [create_value_cell(f"{data.peso_neto_analizado:.3f}")]
    ]

    row_heights = [
        header_height, value_height,
        header_height, value_height
    ]

    pesos_table_top = Table(pesos_data, colWidths=[130], rowHeights=row_heights)

    table_style_top = [
        ('BACKGROUND', (0, 0), (0, 0), color_top),
        ('BACKGROUND', (0, 2), (0, 2), color_top),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.whitesmoke),
        ('TEXTCOLOR', (0, 2), (0, 2), colors.whitesmoke),
        ('BACKGROUND', (0, 1), (0, 1), colors.white),
        ('BACKGROUND', (0, 3), (0, 3), colors.white),
        ('ALIGN', (0, 1), (0, 1), 'CENTER'),
        ('ALIGN', (0, 3), (0, 3), 'CENTER'),
        ('VALIGN', (0, 1), (0, 1), 'MIDDLE'),
        ('VALIGN', (0, 3), (0, 3), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, color_top),
    ]

    pesos_table_top.setStyle(TableStyle(table_style_top))
    pesos_table_top.wrapOn(c, w, h)
    pesos_table_top.drawOn(c, (w - 180), h - 250)

    # Parte inferior

    pesos_data_second = [
        ["DEDUCCIÓN (KG)"],
        [create_value_cell(f"{data.deduccion:.3f}")],
        ["PESO NETO ANALIZADO (KG)"],
        [create_value_cell(f"{data.peso_neto_analizado:.3f}")]
    ]
    pesos_table_second = Table(pesos_data_second, colWidths=[130], rowHeights=row_heights)
    table_style_second = [
        ('BACKGROUND', (0, 0), (0, 0), color_bottom),
        ('BACKGROUND', (0, 2), (0, 2), color_bottom),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.whitesmoke),
        ('TEXTCOLOR', (0, 2), (0, 2), colors.whitesmoke),
        ('BACKGROUND', (0, 1), (0, 1), colors.white),
        ('BACKGROUND', (0, 3), (0, 3), colors.white),
        ('ALIGN', (0, 1), (0, 1), 'CENTER'),
        ('ALIGN', (0, 3), (0, 3), 'CENTER'),
        ('VALIGN', (0, 1), (0, 1), 'MIDDLE'),
        ('VALIGN', (0, 3), (0, 3), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, color_bottom),
    ]

    pesos_table_second.setStyle(TableStyle(table_style_second))
    pesos_table_second.wrapOn(c, w, h)
    pesos_table_second.drawOn(c, (w - 180), (h / 2) - 250)
    

async def draw_signs(c: canvas.Canvas, observaciones: str = "", page_num: int = 1):
    w, h = letter
    
    # Estilo para las observaciones

    observaciones_style = ParagraphStyle(
        name='Observaciones',
        alignment=TA_LEFT,
        fontSize=8,
        fontName='Helvetica',
        leading=10,
        leftIndent=0,
        rightIndent=0
    )
    
    # PARTE SUPERIOR

    c.setFont("Helvetica", 9)
    c.setFillColor((0,0,0))
    c.drawString((w / 2) - 20, h - 310, "_____________________")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 10, h - 323, "PESADOR")
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 140, h - 310, "_____________________")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 165, h - 323, "ANALIZADOR")
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 60, h - 357, "_____________________")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 95, h - 370, "CHOFER")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) - 270, h - 338, "Observaciones:")
    
    # Dibujar observaciones (parte superior)

    if observaciones:
        obs_paragraph_top = Paragraph(observaciones, observaciones_style)
        obs_width = 270
        obs_max_height = 40  # Altura máxima disponible
        
        # Calcular altura real necesaria

        w_para, h_para = obs_paragraph_top.wrap(obs_width, obs_max_height)
        
        # Posición Y: justo debajo de "Observaciones:" menos la altura real del párrafo

        y_position_top = h - 348 - h_para
        
        obs_paragraph_top.drawOn(c, (w / 2) - 270, y_position_top)

    # PARTE INFERIOR

    c.setFont("Helvetica", 9)
    c.setFillColor((0,0,0))
    c.drawString((w / 2) - 20, (h / 2) - 310, "_____________________")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 10, (h / 2) - 323, "PESADOR")
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 140, (h / 2) - 310, "_____________________")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 165, (h / 2) - 323, "ANALIZADOR")
    c.setFont("Helvetica", 9)
    c.drawString((w / 2) + 60, (h / 2)- 357, "_____________________")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) + 95, (h / 2) - 370, "CHOFER")
    c.setFont("Helvetica-Bold", 9)
    c.drawString((w / 2) - 270, (h / 2) - 338, "Observaciones:")
    
    # Dibujar observaciones (parte inferior)

    if observaciones:
        obs_paragraph_bottom = Paragraph(observaciones, observaciones_style)
        
        # Calcular altura real necesaria

        w_para, h_para = obs_paragraph_bottom.wrap(obs_width, obs_max_height)
        
        # Posición Y: justo debajo de "Observaciones:" menos la altura real del párrafo

        y_position_bottom = (h / 2) - 348 - h_para
        
        obs_paragraph_bottom.drawOn(c, (w / 2) - 270, y_position_bottom)
    
    # Texto giratorio

    c.saveState()
    c.translate(200, 50)
    c.setFillColor((0.5,0.5,0.5))
    c.setFont("Helvetica-Bold", 7)
    c.rotate(90)
    c.drawString(390, -405, "SR. PRODUCTOR: PARA SU COMODIDAD CONTAMOS CON 3 RAMPAS PARA DESCARGA")
    c.drawString((h/2) - 400, - 405, "SR. PRODUCTOR: PARA SU COMODIDAD CONTAMOS CON 3 RAMPAS PARA DESCARGA")
    c.setFillColor((0,0,0))
    c.restoreState()

    texto = texto_hoja_1 if page_num == 1 else texto_hoja_2
    c.saveState()
    c.translate(20, h / 2)
    c.setFillColor((0.5,0.5,0.5))
    c.setFont("Helvetica", 8)
    c.rotate(90)
    c.drawString((h / 2) / 2, 1, texto[0])
    c.drawString(- ((h / 2) / 2), 1, texto[1])
    c.setFillColor((0,0,0))
    c.restoreState()

async def create_pdf_page(c: canvas.Canvas, data: CertificadoRequest, page_color: int):
    w, h = letter
    await draw_logo(c, page_color)
    await draw_background(c, page_color)
    await draw_infoCompany(c, Cabezera1(boleta_no=data.boleta_no, fecha=data.fecha, lote=data.lote), page_color)
    await draw_infoShipment(c, Cabezera2(
        productor=data.productor,
        producto=data.producto,
        procedencia=data.procedencia,
        vehiculo=data.vehiculo,
        placas=data.placas,
        chofer=data.chofer
    ), page_color)
    await draw_analisisTable(c, data, page_color)
    await draw_pesosTable(c, data.pesos_info1, page_color)
    await draw_deductionTable(c, data.pesos_info2, page_color)
    await draw_signs(c, data.observaciones, page_color)  # Pasar observaciones aquí

    c.line(-w, (h / 2), w, (h / 2))
    c.showPage()

async def second_page(data: CertificadoRequest, filename: str):
    """Función equivalente a second_page del código original"""
    c = canvas.Canvas(filename, pagesize=letter)
    await create_pdf_page(c, data, page_color=1)
    await create_pdf_page(c, data, page_color=2)
    c.save()

@app.post("/generate-certificate")
async def generate_certificate(certificado: CertificadoRequest):
    """
    Endpoint para generar el certificado PDF
    Recibe todos los datos necesarios y devuelve el archivo PDF
    """
    # Validación: máximo 14 tipos de análisis
    num_tipos = len(certificado.analisis or [])
    if num_tipos > 14:
        raise HTTPException(
            status_code=400,
            detail=f"Se permiten máximo 14 tipos de análisis. Se recibieron: {num_tipos}"
        )
    
    try:
        # Crear un archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            temp_filename = tmp_file.name
        
        # Generar el PDF usando la función second_page (equivalente a second_table)
        await second_page(certificado, temp_filename)
        
        # Nombre del archivo final
        fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
        final_filename = f"Boleta_Entrada_{certificado.boleta_no}-{fecha_actual}.pdf"
        
        # Retornar el archivo PDF
        return FileResponse(
            path=temp_filename,
            filename=final_filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={final_filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        # Limpiar el archivo temporal si existe
        if 'temp_filename' in locals() and os.path.exists(temp_filename):
            os.unlink(temp_filename)
        raise HTTPException(status_code=500, detail=f"Error generando el PDF: {str(e)}")

@app.get("/")
async def root():
    """Endpoint de salud para verificar que la API está funcionando"""
    return {"message": "API para Generación de Certificados PDF está funcionando"}

@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud"""
    return {"status": "healthy", "service": "PDF Certificate Generator"}

# Ejemplo de uso del endpoint
@app.get("/example-request")
async def example_request():
    """
    Devuelve un ejemplo de la estructura de datos que debe enviarse al endpoint
    """
    return {
            "boleta_no": "1234567",
            "fecha": "01/01/2024",
            "lote": "12-34567891-234",
            "productor": "Productor de prueba",
            "producto": "Producto de prueba",
            "procedencia": "Procedencia de prueba",
            "vehiculo": "Vehiculo de prueba",
            "placas": "ABC-1234",
            "chofer": "Chofer de prueba",
            "observaciones": "Producto en buen estado, sin daños visibles.",
            "analisis": [
                {"tipo": "HUMEDAD", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "IMPUREZA", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "DAÑO", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "QUEBRADO", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "PESO ESPECIFICO", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "GRANO VERDE", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "YODO", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "CROMATOGRAFIA", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "MANCHADO", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "VIEJO", "porcentaje": 10.0, "castigo": 12.0},
                {"tipo": "OTROS GRANOS", "porcentaje": 10.0, "castigo": 12.0}
            ],
            "pesos_info1": {
                "peso_bruto": 1000.0,
                "peso_tara": 200.0,
                "peso_neto": 800.0,
                "fechabruto": "01/01/2025",
                "fechatara": "02/01/2025",
                "fechaneto": "03/01/2025",
                "horabruto": "10:00:00",
                "horatara": "12:00:00"
            },
            "pesos_info2": {
                "deduccion": 50.0,
                "peso_neto_analizado": 750.0
            }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

