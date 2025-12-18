"""
Script para convertir una imagen PNG a comandos ESC/POS binarios
para impresoras térmicas.

Uso:
    1. Coloca este archivo junto con tu logo.png
    2. Ejecuta: python convert_logo_escpos.py
    3. Se generará logo_escpos.bin

Requisitos:
    pip install Pillow
"""

from PIL import Image
import struct
import os

def image_to_escpos(image_path, output_path, max_width=384):
    """
    Convierte una imagen PNG a comandos ESC/POS binarios
    
    Args:
        image_path: Ruta a la imagen PNG
        output_path: Ruta donde guardar el archivo .bin
        max_width: Ancho máximo en pixels (384 para impresoras de 80mm)
    """
    
    # Verificar que existe la imagen
    if not os.path.exists(image_path):
        print(f"❌ Error: No se encontró la imagen '{image_path}'")
        return False
    
    try:
        # Abrir imagen
        img = Image.open(image_path)
        print(f"📷 Imagen cargada: {img.width}x{img.height} pixels, modo: {img.mode}")
        
        # Convertir a escala de grises
        img = img.convert('L')
        
        # Redimensionar si es necesario (mantener proporción)
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)
            print(f"📐 Redimensionado a: {img.width}x{img.height} pixels")
        
        # Asegurar que el ancho sea múltiplo de 8 (requerido por ESC/POS)
        width = (img.width // 8) * 8
        if width != img.width:
            img = img.crop((0, 0, width, img.height))
            print(f"✂️ Recortado a: {width}x{img.height} pixels (múltiplo de 8)")
        
        # Convertir a binario (1 bit por pixel)
        # Pixels oscuros = 1 (imprimir), claros = 0 (no imprimir)
        threshold = 128
        img = img.point(lambda x: 1 if x < threshold else 0, '1')
        
        # Generar comandos ESC/POS
        escpos_data = b''
        
        width_bytes = width // 8
        height = img.height
        
        # Comando GS v 0 (imprimir imagen raster)
        # Formato: GS v 0 m xL xH yL yH [datos]
        # m = 0 (modo normal)
        escpos_data += b'\x1D\x76\x30\x00'  # GS v 0 m
        escpos_data += struct.pack('<H', width_bytes)  # xL xH (ancho en bytes)
        escpos_data += struct.pack('<H', height)  # yL yH (alto en pixels)
        
        # Obtener datos de pixels
        pixels = list(img.getdata())
        
        # Convertir pixels a bytes (8 pixels por byte)
        for y in range(height):
            for x in range(0, width, 8):
                byte = 0
                for bit in range(8):
                    if x + bit < width:
                        pixel_index = y * width + x + bit
                        if pixels[pixel_index] == 1:
                            byte |= (1 << (7 - bit))
                escpos_data += bytes([byte])
        
        # Guardar archivo binario
        with open(output_path, 'wb') as f:
            f.write(escpos_data)
        
        print(f"\n✅ Logo convertido exitosamente!")
        print(f"   📄 Archivo: {output_path}")
        print(f"   📊 Tamaño: {len(escpos_data)} bytes")
        print(f"   📐 Dimensiones: {width}x{height} pixels")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al convertir imagen: {e}")
        return False


if __name__ == "__main__":
    # Configuración
    INPUT_IMAGE = "logo.png"
    OUTPUT_FILE = "logo_escpos.bin"
    MAX_WIDTH = 300  # Ancho máximo en pixels (ajustar según tu impresora)
    
    print("=" * 50)
    print("🖨️  Conversor de Logo a ESC/POS")
    print("=" * 50)
    print()
    
    success = image_to_escpos(INPUT_IMAGE, OUTPUT_FILE, MAX_WIDTH)
    
    if success:
        print()
        print("🎉 ¡Listo! Ahora puedes usar logo_escpos.bin en tu API de tickets")
    else:
        print()
        print("💡 Asegúrate de tener 'logo.png' en la misma carpeta")
        print("   y que Pillow esté instalado: pip install Pillow")

