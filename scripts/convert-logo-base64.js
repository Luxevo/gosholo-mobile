const fs = require('fs');
const path = require('path');

// Chemin vers votre logo
const logoPath = path.join(__dirname, '../assets/images/dark_green.png');

try {
  // Lire l'image
  const imageBuffer = fs.readFileSync(logoPath);
  
  // Convertir en base64
  const base64Image = imageBuffer.toString('base64');
  
  // Créer la data URI
  const dataUri = `data:image/png;base64,${base64Image}`;
  
  // Sauvegarder dans un fichier
  const outputPath = path.join(__dirname, '../components/LogoBase64.ts');
  const content = `// Auto-generated logo in base64 format
export const LOGO_BASE64 = "${dataUri}";
`;
  
  fs.writeFileSync(outputPath, content);
  
  console.log('✅ Logo converti avec succès !');
  console.log(`📁 Fichier créé : ${outputPath}`);
  console.log(`📏 Taille : ${base64Image.length} caractères`);
} catch (error) {
  console.error('❌ Erreur lors de la conversion :', error.message);
}

