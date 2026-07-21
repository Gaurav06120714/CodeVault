const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('src', (err, files) => {
  if (err) throw err;
  files.forEach((file) => {
    // skip utils/api.ts
    if (file.includes('utils/api.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it has fetch with mutating method (multi-line)
    if (/fetch\([\s\S]*?method:\s*["'](POST|PUT|PATCH|DELETE)["']/i.test(content) || /fetch\([\s\S]*?method:\s*following\s*\?/i.test(content)) {
      console.log('Modifying', file);
      
      // Add import { apiFetch } from "@/utils/api"; if not exists
      if (!content.includes('apiFetch')) {
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLine + 1) + 'import { apiFetch } from "@/utils/api";\n' + content.slice(endOfLine + 1);
        } else {
          content = 'import { apiFetch } from "@/utils/api";\n' + content;
        }
      }
      
      content = content.replace(/\bfetch\(/g, 'apiFetch(');
      
      fs.writeFileSync(file, content, 'utf8');
    }
  });
});
