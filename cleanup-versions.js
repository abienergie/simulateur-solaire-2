/**
 * Script pour supprimer les anciennes versions de l'application
 * Ce script parcourt le fichier versions.json et supprime toutes les versions antérieures à 6.9.1
 */

import fs from 'fs';
import path from 'path';

// Lire le fichier versions.json
const versionsPath = path.join(process.cwd(), 'versions.json');
console.log(`Lecture du fichier versions.json depuis ${versionsPath}`);

try {
  // Lire le contenu du fichier
  const versionsContent = fs.readFileSync(versionsPath, 'utf8');
  const versionsData = JSON.parse(versionsContent);
  
  // Version minimale à conserver
  const minVersion = '6.9.1';
  
  // Filtrer les versions à conserver
  const versionsToKeep = {};
  let removedCount = 0;
  
  for (const [version, data] of Object.entries(versionsData)) {
    if (compareVersions(version, minVersion) >= 0) {
      versionsToKeep[version] = data;
    } else {
      removedCount++;
      console.log(`Suppression de la version ${version}`);
    }
  }
  
  // Écrire le nouveau fichier versions.json
  fs.writeFileSync(versionsPath, JSON.stringify(versionsToKeep, null, 2), 'utf8');
  
  console.log(`Nettoyage terminé. ${removedCount} versions supprimées.`);
  console.log(`${Object.keys(versionsToKeep).length} versions conservées.`);
} catch (error) {
  console.error('Erreur lors du nettoyage des versions:', error);
  process.exit(1);
}

/**
 * Compare deux versions sémantiques
 * @param {string} v1 Première version
 * @param {string} v2 Deuxième version
 * @returns {number} -1 si v1 < v2, 0 si v1 = v2, 1 si v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}