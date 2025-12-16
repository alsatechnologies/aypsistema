/**
 * Convierte una imagen a base64
 * @param imagePath - Ruta relativa de la imagen desde la carpeta public
 * @returns Promise con el string base64 de la imagen
 */
export async function imageToBase64(imagePath: string): Promise<string | null> {
  try {
    // En producción, la ruta debe ser relativa desde la raíz pública
    const response = await fetch(imagePath);
    
    if (!response.ok) {
      console.error(`Error al cargar imagen: ${response.statusText}`);
      return null;
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remover el prefijo "data:image/...;base64," si existe
        const base64 = base64String.includes(',') 
          ? base64String.split(',')[1] 
          : base64String;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al convertir imagen a base64:', error);
    return null;
  }
}

/**
 * Carga un archivo binario ESC/POS y lo convierte a base64
 * @param filePath - Ruta relativa del archivo binario desde la carpeta public
 * @returns Promise con el string base64 del archivo binario
 */
export async function loadEscposLogo(filePath: string): Promise<string | null> {
  try {
    const response = await fetch(filePath);
    
    if (!response.ok) {
      console.error(`Error al cargar logo ESC/POS: ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convertir a base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error al cargar logo ESC/POS:', error);
    return null;
  }
}

/**
 * Obtiene el logo de la empresa en formato base64 para ESC/POS
 * Prioriza archivos binarios ESC/POS, luego intenta con imágenes PNG
 * @returns Promise con el string base64 del logo
 */
export async function getCompanyLogo(): Promise<string | null> {
  // Primero intentar cargar logo ESC/POS binario (si existe)
  const escposLogoPath = '/logo_escpos.bin';
  const escposLogo = await loadEscposLogo(escposLogoPath);
  if (escposLogo) {
    console.log('Logo ESC/POS cargado desde archivo binario');
    return escposLogo;
  }

  // Si no hay logo ESC/POS, intentar cargar imágenes PNG
  // NOTA: Estas imágenes necesitarían ser convertidas a ESC/POS en el servidor
  // Por ahora, solo las enviamos y la API debería manejarlas
  const logoPaths = [
    '/lovable-uploads/logo ap 2.0.png',
    '/lovable-uploads/logo_ap.png',
    '/lovable-uploads/3c1c4838-e91d-4e30-b0a0-fe9cf1466719.png'
  ];

  for (const path of logoPaths) {
    const base64 = await imageToBase64(path);
    if (base64) {
      console.log(`Logo cargado desde imagen: ${path}`);
      return base64;
    }
  }

  console.warn('No se pudo cargar ningún logo');
  return null;
}

