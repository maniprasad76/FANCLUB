const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/manip/Desktop/FAN';
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md', '.json', '.env'];
const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.vite'];

function walkAndReplace(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                walkAndReplace(fullPath);
            }
        } else if (extensions.includes(path.extname(fullPath))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Replace exact matches (case-sensitive)
            content = content.replace(/FAN/g, 'FAN');
            content = content.replace(/Fan/g, 'Fan');
            content = content.replace(/fan/g, 'fan');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

console.log('Starting global find-and-replace...');
walkAndReplace(directory);
console.log('Finished.');
