#!/usr/bin/env node

/**
 * Pre-commit Environment Variable Checker
 * Helps prevent accidental commits of sensitive data
 */

const fs = require('fs');
const path = require('path');

const SENSITIVE_PATTERNS = [
  /REACT_APP_AZURE_OPENAI_KEY\s*=\s*["']?(?!your-|<|{|\$)[a-zA-Z0-9]{20,}/,
  /api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/i,
  /password\s*[:=]\s*["']?[^\s"']{8,}/i,
  /secret\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/i,
  /token\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/i,
  /BEGIN [A-Z]+ PRIVATE KEY/,
];

const FILES_TO_CHECK = [
  'src/services/chatService.ts',
  'src/config/',
];

console.log('🔍 Checking for sensitive data in source files...\n');

let foundIssues = false;

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const stats = fs.statSync(filePath);
  
  if (stats.isDirectory()) {
    const files = fs.readdirSync(filePath);
    files.forEach(file => {
      checkFile(path.join(filePath, file));
    });
    return;
  }

  if (!filePath.endsWith('.ts') && !filePath.endsWith('.js') && !filePath.endsWith('.tsx')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    SENSITIVE_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        console.log(`⚠️  WARNING: Possible sensitive data found!`);
        console.log(`   File: ${filePath}`);
        console.log(`   Line ${index + 1}: ${line.trim().substring(0, 80)}...`);
        console.log('');
        foundIssues = true;
      }
    });
  });
}

FILES_TO_CHECK.forEach(checkFile);

if (foundIssues) {
  console.log('❌ SECURITY ALERT: Potential sensitive data detected!');
  console.log('');
  console.log('Please review the warnings above and ensure:');
  console.log('1. No actual API keys are hardcoded');
  console.log('2. All sensitive values use environment variables');
  console.log('3. Default values are safe placeholders');
  console.log('');
  console.log('If these are false positives, you can proceed.');
  console.log('Otherwise, fix the issues before committing.');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ No sensitive data detected in source files.');
  console.log('');
  process.exit(0);
}

