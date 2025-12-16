from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
import socket
import asyncio
from datetime import datetime
import logging
import subprocess
import platform
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ESC/POS Printer API",
    description="API para envío de comandos ESC/POS a impresoras térmicas via TCP o USB",
    version="1.0.0"
)

class PrinterConfig(BaseModel):
    connection_type: Literal["network", "usb"] = Field(default="network", description="Tipo de conexión")
    ip: Optional[str] = Field(None, description="Dirección IP (solo para network)")
    port: int = Field(default=9100, description="Puerto TCP (solo para network)")
    timeout: int = Field(default=10, description="Timeout de conexión en segundos")
    printer_name: Optional[str] = Field(None, description="Nombre de la impresora USB")

class TicketPrintRequest(BaseModel):
    printer_config: PrinterConfig
    producto: str
    fecha: strhaa
    boleta: str
    cliente: str
    destino: str
    placas: str
    vehiculo: str
    chofer: str
    copias: int = Field(default=1, ge=1, le=100, description="Número de copias (1-100)")
    logo: Optional[str] = Field(None, description="Logo en formato base64 (opcional)")

class PrintResponse(BaseModel):
    success: bool
    message: str
    printer_ip: str
    timestamp: str

class ESCPOSCommands:
    """Comandos ESC/POS básicos"""
    INIT = b'\x1B\x40'  # Inicializar impresora
    ALIGN_LEFT = b'\x1B\x61\x00'
    ALIGN_CENTER = b'\x1B\x61\x01'
    ALIGN_RIGHT = b'\x1B\x61\x02'
    BOLD_ON = b'\x1B\x45\x01'
    BOLD_OFF = b'\x1B\x45\x00'
    UNDERLINE_ON = b'\x1B\x2D\x01'
    UNDERLINE_OFF = b'\x1B\x2D\x00'
    FONT_SMALL = b'\x1B\x4D\x01'
    FONT_NORMAL = b'\x1B\x4D\x00'
    LINE_FEED = b'\x0A'
    CUT_PAPER = b'\x1D\x56\x41\x00'  # Corte total
    DOUBLE_HEIGHT = b'\x1B\x21\x10'
    DOUBLE_WIDTH = b'\x1B\x21\x20'
    NORMAL_SIZE = b'\x1B\x21\x00'

class ESCPOSPrinterService:

    @staticmethod
    def get_usb_printers():
        """
        Lista las impresoras USB disponibles en el sistema
        """
        try:
            system = platform.system()
            
            if system == "Windows":
                try:
                    import win32print
                    printers = []
                    # Obtener todas las impresoras del sistema
                    printer_enum = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
                    for printer in printer_enum:
                        printers.append(printer[2])  # printer[2] es el nombre
                    return printers
                except ImportError:
                    logger.error("Módulo win32print no instalado. Ejecute: pip install pywin32")
                    return []
                    
            elif system == "Darwin":  # macOS
                result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True)
                printers = []
                for line in result.stdout.split('\n'):
                    if line.startswith('printer'):
                        printer_name = line.split()[1]
                        printers.append(printer_name)
                return printers
                
            elif system == "Linux":
                result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True)
                printers = []
                for line in result.stdout.split('\n'):
                    if line.startswith('printer'):
                        printer_name = line.split()[1]
                        printers.append(printer_name)
                return printers
                
            return []
            
        except Exception as e:
            logger.error(f"Error listando impresoras: {e}")
            return []

    @staticmethod
    async def send_to_usb_printer(printer_name: str, data: bytes) -> dict:
        """
        Envía datos directamente a impresora USB
        Soporta Windows, macOS y Linux
        """
        try:
            system = platform.system()
            
            if system == "Windows":
                try:
                    import win32print
                    
                    # Abrir la impresora
                    hPrinter = win32print.OpenPrinter(printer_name)
                    
                    try:
                        # Iniciar un trabajo de impresión
                        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Ticket", None, "RAW"))
                        
                        try:
                            win32print.StartPagePrinter(hPrinter)
                            win32print.WritePrinter(hPrinter, data)
                            win32print.EndPagePrinter(hPrinter)
                        finally:
                            win32print.EndDocPrinter(hPrinter)
                            
                        return {
                            "success": True,
                            "message": f"Ticket enviado a impresora USB '{printer_name}'",
                            "bytes_sent": len(data)
                        }
                        
                    finally:
                        win32print.ClosePrinter(hPrinter)
                        
                except ImportError:
                    return {
                        "success": False,
                        "message": "Módulo win32print no instalado. Ejecute: pip install pywin32"
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error al imprimir en Windows: {str(e)}"
                    }
            
            else:  # macOS y Linux
                process = subprocess.Popen(
                    ['lp', '-d', printer_name, '-o', 'raw'],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                stdout, stderr = process.communicate(input=data)
                
                if process.returncode == 0:
                    return {
                        "success": True,
                        "message": f"Ticket enviado a impresora USB '{printer_name}'",
                        "bytes_sent": len(data)
                    }
                else:
                    error_msg = stderr.decode('utf-8') if stderr else "Error desconocido"
                    return {
                        "success": False,
                        "message": f"Error al imprimir: {error_msg}"
                    }
                    
        except Exception as e:
            error_msg = f"Error al enviar a impresora USB: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}

    @staticmethod
    async def send_escpos_command(ip: str, port: int, escpos_data: bytes, timeout: int = 10) -> dict:
        """
        Envía comandos ESC/POS a la impresora via TCP
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            
            logger.info(f"Conectando a impresora {ip}:{port}")
            sock.connect((ip, port))
            
            sock.send(escpos_data)
            logger.info(f"Enviado {len(escpos_data)} bytes de comandos ESC/POS")
            
            sock.close()
            
            return {
                "success": True,
                "message": f"Ticket enviado exitosamente a {ip}:{port}",
                "bytes_sent": len(escpos_data)
            }
            
        except socket.timeout:
            error_msg = f"Timeout al conectar con impresora {ip}:{port}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}
            
        except socket.gaierror as e:
            error_msg = f"Error de resolución DNS para {ip}: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}
            
        except ConnectionRefusedError:
            error_msg = f"Conexión rechazada por impresora {ip}:{port}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}
            
        except Exception as e:
            error_msg = f"Error inesperado: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}
        
        finally:
            try:
                sock.close()
            except:
                pass
    
    def generate_ticket_escpos(self, producto: str, fecha: str, boleta: str, 
                               cliente: str, destino: str, placas: str, 
                               vehiculo: str, chofer: str, logo_base64: Optional[str] = None) -> bytes:
        """
        Genera un ticket en formato ESC/POS incluyendo el logo al inicio.
        Si se proporciona logo_base64, se usa ese. Si no, intenta cargar desde archivo.
        """
        cmd = ESCPOSCommands
        ticket = b''
        
        # Inicializar impresora
        ticket += cmd.INIT

        # Logo centrado
        logo_added = False
        
        # Intentar usar logo del request (base64)
        if logo_base64:
            try:
                # Decodificar base64
                logo_data = base64.b64decode(logo_base64)
                ticket += cmd.ALIGN_CENTER
                ticket += logo_data
                ticket += cmd.LINE_FEED
                logger.info(f"Logo cargado desde request: {len(logo_data)} bytes")
                logo_added = True
            except Exception as e:
                logger.warning(f"Error al decodificar logo del request: {e}")
        
        # Si no se pudo usar el logo del request, intentar cargar desde archivo
        if not logo_added:
            try:
                with open("logo_escpos.bin", "rb") as f:
                    logo_data = f.read()
                ticket += cmd.ALIGN_CENTER
                ticket += logo_data
                ticket += cmd.LINE_FEED
                logger.info(f"Logo cargado desde archivo: {len(logo_data)} bytes")
            except FileNotFoundError:
                logger.warning("No se encontró logo_escpos.bin, se omitirá el logo")

        # Encabezado
        ticket += cmd.ALIGN_CENTER
        ticket += cmd.BOLD_ON
        ticket += cmd.DOUBLE_HEIGHT
        ticket += "Aceites y Proteínas\n".encode('cp850', errors='replace')
        ticket += cmd.NORMAL_SIZE
        ticket += "S.A. de C.V.\n".encode('cp850', errors='replace')
        ticket += cmd.BOLD_OFF
        ticket += cmd.LINE_FEED

        # Línea separadora
        ticket += cmd.ALIGN_LEFT
        ticket += ("=" * 48 + "\n").encode('cp850', errors='replace')

        # Datos del ticket
        def info_line(label, value):
            return cmd.BOLD_ON + f"{label:<9}: ".encode('cp850', errors='replace') + cmd.BOLD_OFF + f"{value}\n".encode('cp850', errors='replace')

        ticket += info_line("PRODUCTO", producto)
        ticket += info_line("FECHA", fecha)
        ticket += info_line("BOLETA", boleta)
        ticket += ("=" * 48 + "\n").encode('cp850', errors='replace')
        ticket += info_line("CLIENTE", cliente)
        ticket += info_line("DESTINO", destino)
        ticket += info_line("PLACAS", placas)
        ticket += info_line("VEHICULO", vehiculo)
        ticket += info_line("CHOFER", chofer)

        # Línea separadora final
        ticket += ("=" * 48 + "\n").encode('cp850', errors='replace')

        # Espacio y corte
        ticket += cmd.LINE_FEED * 5
        ticket += cmd.CUT_PAPER

        return ticket

printer_service = ESCPOSPrinterService()

@app.post("/api/printer/print-ticket", response_model=PrintResponse)
async def print_ticket(request: TicketPrintRequest):
    """
    Imprime un ticket térmico con información de boleta
    """
    try:
        escpos_data = printer_service.generate_ticket_escpos(
            producto=request.producto,
            fecha=request.fecha,
            boleta=request.boleta,
            cliente=request.cliente,
            destino=request.destino,
            placas=request.placas,
            vehiculo=request.vehiculo,
            chofer=request.chofer,
            logo_base64=request.logo
        )
        
        if request.printer_config.connection_type == "usb":
            if not request.printer_config.printer_name:
                raise HTTPException(
                    status_code=400,
                    detail="Debe especificar 'printer_name' para conexión USB"
                )
            
            for i in range(request.copias):
                result = await printer_service.send_to_usb_printer(
                    printer_name=request.printer_config.printer_name,
                    data=escpos_data
                )
                if not result["success"]:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error en copia {i+1}: {result['message']}"
                    )
                if i < request.copias - 1:
                    await asyncio.sleep(0.5)
            
            return PrintResponse(
                success=True,
                message=f"Ticket impreso exitosamente ({request.copias} copia(s))",
                printer_ip=f"USB:{request.printer_config.printer_name}",
                timestamp=datetime.now().isoformat()
            )
        
        else:
            if not request.printer_config.ip:
                raise HTTPException(
                    status_code=400,
                    detail="Debe especificar 'ip' para conexión de red"
                )
            
            for i in range(request.copias):
                result = await printer_service.send_escpos_command(
                    ip=request.printer_config.ip,
                    port=request.printer_config.port,
                    escpos_data=escpos_data,
                    timeout=request.printer_config.timeout
                )
                if not result["success"]:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Error en copia {i+1}: {result['message']}"
                    )
                if i < request.copias - 1:
                    await asyncio.sleep(0.5)
            
            return PrintResponse(
                success=True,
                message=f"Ticket impreso exitosamente ({request.copias} copia(s))",
                printer_ip=request.printer_config.ip,
                timestamp=datetime.now().isoformat()
            )
        
    except Exception as e:
        logger.error(f"Error en print_ticket: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al imprimir ticket: {str(e)}"
        )

@app.get("/api/printer/list-usb")
async def list_usb_printers():
    """
    Lista las impresoras USB disponibles en el sistema
    """
    printers = printer_service.get_usb_printers()
    return {
        "printers": printers,
        "count": len(printers),
        "platform": platform.system(),
        "message": "Impresoras encontradas" if printers else "No se encontraron impresoras"
    }

@app.get("/")
async def root():
    return {
        "message": "ESC/POS Printer API",
        "version": "1.0.0",
        "platform": platform.system(),
        "endpoints": {
            "print_ticket": "/api/printer/print-ticket",
            "list_usb": "/api/printer/list-usb",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

