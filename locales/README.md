# Localization Guide

Este directorio contiene los archivos de localización para la extensión AI Webpage Analyzer. Cada idioma tiene su propio archivo JSON con todas las cadenas de texto utilizadas en los prompts de IA.

## Estructura de archivos

- `en.json` - Inglés (idioma por defecto)
- `es.json` - Español
- `README.md` - Esta guía

## Cómo añadir un nuevo idioma

1. **Crear el archivo de localización:**
   - Copia `en.json` y renómbralo con el código ISO del idioma (ej: `fr.json` para francés)
   - Traduce todos los valores (no las claves) al nuevo idioma

2. **Actualizar la página de opciones:**
   - Edita `options.html` y añade una nueva opción en el select `responseLanguage`:
   ```html
   <option value="fr">Français</option>
   ```

3. **Estructura del archivo JSON:**
   ```json
   {
     "summary": {
       "promptIntro": "Instrucción principal para resúmenes",
       "lengthInstructions": {
         "short": "instrucción para resumen corto",
         "medium": "instrucción para resumen mediano", 
         "long": "instrucción para resumen largo"
       },
       "labels": {
         "title": "Título",
         "url": "URL",
         "content": "Contenido Principal",
         "headings": "Encabezados",
         "noTitle": "Sin título",
         "unknown": "Desconocido",
         "noContent": "Sin contenido"
       },
       "instruction": "Instrucciones finales para el resumen"
     },
     "sentiment": {
       "instruction": "Instrucción principal para análisis de sentimientos",
       "textLabel": "Etiqueta del texto a analizar",
       "formatInstruction": "Instrucción del formato JSON",
       "categories": "categoría1/categoría2/categoría3",
       "explanationLabel": "Etiqueta de explicación",
       "detailInstruction": "Instrucciones detalladas",
       "fallbackMessages": {
         "positive": "Mensaje para sentimiento positivo",
         "negative": "Mensaje para sentimiento negativo", 
         "neutral": "Mensaje para sentimiento neutral",
         "noExplanation": "Mensaje cuando no hay explicación"
       },
       "categoryNames": {
         "joyful": "nombre_categoria_positiva",
         "neutral": "neutral",
         "toxic": "nombre_categoria_negativa"
       }
     },
     "test": {
       "prompt": "Prompt para probar la conexión API",
       "successMessage": "Mensaje de éxito"
     }
   }
   ```

## Consideraciones importantes

- **NO traduzcas las claves JSON**, solo los valores
- Mantén la estructura exacta del JSON
- Asegúrate de que las categorías de sentimiento coincidan con las usadas en `categoryNames`
- Incluye instrucciones específicas del idioma (ej: "Responde completamente en [idioma]")
- Prueba el nuevo idioma después de añadirlo

## Idiomas soportados actualmente

- ✅ Inglés (`en`) - Completo
- ✅ Español (`es`) - Completo

## Añadir soporte para un nuevo idioma (ejemplo francés)

1. Crear `locales/fr.json`:
```json
{
  "summary": {
    "promptIntro": "Veuillez fournir un résumé du contenu de la page web suivante",
    "lengthInstructions": {
      "short": "en 1-2 phrases concises",
      "medium": "en 3-4 phrases claires", 
      "long": "en 1-2 paragraphes détaillés"
    },
    // ... resto de la traducción
  }
  // ... resto del archivo
}
```

2. Actualizar `options.html`:
```html
<option value="fr">Français</option>
```

¡Eso es todo! El sistema cargará automáticamente el nuevo idioma cuando el usuario lo seleccione.