/**
 * Script pour nettoyer le projet et libérer de l'espace
 * Ce script supprime les fichiers temporaires, les logs, et les données de cache
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const DIRS_TO_CLEAN = [
  '.cache',
  'node_modules/.cache',
  'node_modules/.vite'
];

const FILES_TO_CLEAN = [
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log'
];

const PATTERNS_TO_CLEAN = [
  '**/*.log',
  '**/debug.log',
  '**/*.tmp',
  '**/tmp.*',
  '**/*.bak'
];

// Fonction pour supprimer un répertoire récursivement
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Suppression du répertoire: ${dirPath}`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✓ Répertoire supprimé: ${dirPath}`);
      return true;
    } catch (err) {
      console.error(`✗ Erreur lors de la suppression du répertoire ${dirPath}:`, err);
      return false;
    }
  }
  return false;
}

// Fonction pour supprimer un fichier
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`Suppression du fichier: ${filePath}`);
    try {
      fs.unlinkSync(filePath);
      console.log(`✓ Fichier supprimé: ${filePath}`);
      return true;
    } catch (err) {
      console.error(`✗ Erreur lors de la suppression du fichier ${filePath}:`, err);
      return false;
    }
  }
  return false;
}

// Fonction pour trouver des fichiers correspondant à un pattern
function findFiles(pattern, dir = '.') {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Ignorer les répertoires node_modules et .git
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          files.push(...findFiles(pattern, fullPath));
        }
      } else if (entry.isFile() && entry.name.match(pattern)) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Erreur lors de la recherche dans ${dir}:`, err);
  }
  
  return files;
}

// Fonction pour nettoyer le cache npm
function cleanNpmCache() {
  try {
    console.log('Nettoyage du cache npm...');
    execSync('npm cache clean --force');
    console.log('✓ Cache npm nettoyé');
    return true;
  } catch (err) {
    console.error('✗ Erreur lors du nettoyage du cache npm:', err);
    return false;
  }
}

// Fonction pour supprimer les migrations SQL inutilisées
function cleanupMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('Répertoire de migrations non trouvé');
    return false;
  }
  
  console.log('Analyse des migrations SQL...');
  
  try {
    // Lire tous les fichiers de migration
    const files = fs.readdirSync(migrationsDir);
    
    // Trier les fichiers par date (en supposant que le format est YYYYMMDDHHMMSS_name.sql)
    const sortedFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const dateA = a.split('_')[0];
        const dateB = b.split('_')[0];
        return dateB.localeCompare(dateA);
      });
    
    // Garder les 10 migrations les plus récentes
    const filesToKeep = sortedFiles.slice(0, 10);
    const filesToDelete = sortedFiles.slice(10);
    
    console.log(`Gardant les ${filesToKeep.length} migrations les plus récentes`);
    console.log(`Suppression de ${filesToDelete.length} anciennes migrations`);
    
    // Ne pas supprimer les fichiers, juste les lister
    filesToDelete.forEach(file => {
      console.log(`Fichier de migration qui pourrait être supprimé: ${file}`);
    });
    
    return true;
  } catch (err) {
    console.error('Erreur lors du nettoyage des migrations:', err);
    return false;
  }
}

// Fonction pour nettoyer les versions.json
function cleanupVersionsJson() {
  const versionsPath = path.join(process.cwd(), 'versions.json');
  
  if (!fs.existsSync(versionsPath)) {
    console.log('Fichier versions.json non trouvé');
    return false;
  }
  
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
    
    console.log(`Nettoyage de versions.json terminé. ${removedCount} versions supprimées.`);
    console.log(`${Object.keys(versionsToKeep).length} versions conservées.`);
    return true;
  } catch (error) {
    console.error('Erreur lors du nettoyage des versions:', error);
    return false;
  }
}

// Fonction pour comparer des versions sémantiques
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

// Fonction pour nettoyer les logs Supabase
function cleanupSupabaseLogs() {
  const logsDir = path.join(process.cwd(), 'supabase', 'logs');
  
  if (fs.existsSync(logsDir)) {
    console.log('Nettoyage des logs Supabase...');
    return removeDirectory(logsDir);
  }
  
  return false;
}

// Fonction pour supprimer les fichiers de build
function cleanupBuildFiles() {
  const buildDirs = ['dist', 'build', '.output', '.nuxt'];
  let success = true;
  
  for (const dir of buildDirs) {
    if (fs.existsSync(dir)) {
      console.log(`Suppression des fichiers de build dans ${dir}...`);
      if (!removeDirectory(dir)) {
        success = false;
      }
    }
  }
  
  return success;
}

// Fonction pour nettoyer les fichiers temporaires
function cleanupTempFiles() {
  let success = true;
  
  // Nettoyer les répertoires spécifiés
  for (const dir of DIRS_TO_CLEAN) {
    if (!removeDirectory(dir)) {
      success = false;
    }
  }
  
  // Nettoyer les fichiers spécifiés
  for (const file of FILES_TO_CLEAN) {
    if (!removeFile(file)) {
      success = false;
    }
  }
  
  // Nettoyer les fichiers correspondant aux patterns
  for (const pattern of PATTERNS_TO_CLEAN) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const files = findFiles(regex);
    
    for (const file of files) {
      if (!removeFile(file)) {
        success = false;
      }
    }
  }
  
  return success;
}

// Fonction pour afficher l'espace disque
function showDiskUsage() {
  try {
    console.log('\nEspace disque utilisé par les principaux répertoires:');
    
    // Vérifier si la commande du est disponible
    try {
      const output = execSync('du -sh node_modules .git supabase dist 2>/dev/null || echo "Commande non disponible"', { encoding: 'utf8' });
      console.log(output);
    } catch (err) {
      console.log('Impossible d\'obtenir l\'utilisation du disque avec la commande du');
    }
    
    // Afficher la taille des plus gros fichiers
    try {
      console.log('\nLes 10 plus gros fichiers:');
      const output = execSync('find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec du -h {} \\; | sort -hr | head -n 10', { encoding: 'utf8' });
      console.log(output);
    } catch (err) {
      console.log('Impossible d\'obtenir la liste des plus gros fichiers');
    }
  } catch (err) {
    console.error('Erreur lors de l\'affichage de l\'utilisation du disque:', err);
  }
}

// Fonction principale
async function main() {
  console.log('=== Début du nettoyage du projet ===');
  
  // Afficher l'utilisation du disque avant le nettoyage
  console.log('\n=== Utilisation du disque avant nettoyage ===');
  showDiskUsage();
  
  // Nettoyer les fichiers temporaires
  console.log('\n=== Nettoyage des fichiers temporaires ===');
  cleanupTempFiles();
  
  // Nettoyer le cache npm
  console.log('\n=== Nettoyage du cache npm ===');
  cleanNpmCache();
  
  // Nettoyer les fichiers de build
  console.log('\n=== Nettoyage des fichiers de build ===');
  cleanupBuildFiles();
  
  // Nettoyer les logs Supabase
  console.log('\n=== Nettoyage des logs Supabase ===');
  cleanupSupabaseLogs();
  
  // Nettoyer les migrations SQL
  console.log('\n=== Analyse des migrations SQL ===');
  cleanupMigrations();
  
  // Nettoyer versions.json
  console.log('\n=== Nettoyage de versions.json ===');
  cleanupVersionsJson();
  
  // Afficher l'utilisation du disque après le nettoyage
  console.log('\n=== Utilisation du disque après nettoyage ===');
  showDiskUsage();
  
  console.log('\n=== Fin du nettoyage du projet ===');
}

// Exécuter la fonction principale
main().catch(err => {
  console.error('Erreur lors du nettoyage du projet:', err);
  process.exit(1);
});