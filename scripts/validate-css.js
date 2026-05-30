const fs = require('fs');
const path = require('path');

// CSS patterns that commonly cause visibility issues
const problematicPatterns = [
  // White text on white backgrounds (static, not hover)
  { pattern: /text-white.*bg-white(?!.*hover)|bg-white.*text-white(?!.*hover)/, severity: 'error', message: 'White text on white background - invisible text' },
  
  // Light gray text on light backgrounds
  { pattern: /text-gray-400.*bg-gray-50|bg-gray-50.*text-gray-400/, severity: 'warning', message: 'Light gray text on light background - poor contrast' },
  { pattern: /text-gray-500.*bg-gray-50|bg-gray-50.*text-gray-500/, severity: 'warning', message: 'Gray text on light background - poor contrast' },
  
  // Hover states that make text invisible (only if no proper contrast)
  { pattern: /hover:bg-.*-50.*text-.*-500(?!.*hover:text-)|text-.*-500.*hover:bg-.*-50(?!.*hover:text-)/, severity: 'warning', message: 'Hover state may cause poor contrast' },
  
  // Missing border on outline buttons (only if no border color specified)
  { pattern: /variant.*outline.*(?!.*border-(?!.*-50))/, severity: 'warning', message: 'Outline button missing border color' },
  
  // Transparent backgrounds without proper text contrast
  { pattern: /bg-transparent.*text-white(?!.*shadow|.*border)/, severity: 'warning', message: 'Transparent background with white text - may be invisible' },
];

// Colors that should always have proper contrast
const contrastRules = [
  { text: 'text-white', requires: ['bg-gray-900', 'bg-indigo-600', 'bg-purple-600', 'bg-red-600', 'bg-green-600', 'bg-blue-600'] },
  { text: 'text-gray-500', requires: ['bg-white', 'bg-gray-100', 'bg-gray-200'] },
  { text: 'text-gray-400', requires: ['bg-white', 'bg-gray-100'] },
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  problematicPatterns.forEach(rule => {
    const matches = content.match(new RegExp(rule.pattern, 'g'));
    if (matches) {
      matches.forEach(match => {
        issues.push({
          file: filePath,
          severity: rule.severity,
          message: rule.message,
          match: match.trim(),
          line: getLineNumber(content, match)
        });
      });
    }
  });
  
  return issues;
}

function getLineNumber(content, match) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(match)) {
      return i + 1;
    }
  }
  return 0;
}

function scanDirectory(dir) {
  const issues = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      issues.push(...scanDirectory(fullPath));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      issues.push(...scanFile(fullPath));
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Scanning for CSS visibility issues...\n');
  
  const issues = scanDirectory('.');
  
  if (issues.length === 0) {
    console.log('✅ No CSS visibility issues found!');
    return;
  }
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      console.log(`    Found: ${issue.match}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (should fix):');
    warnings.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      console.log(`    Found: ${issue.match}\n`);
    });
  }
  
  console.log(`\n📊 Summary: ${errors.length} errors, ${warnings.length} warnings`);
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, problematicPatterns };
