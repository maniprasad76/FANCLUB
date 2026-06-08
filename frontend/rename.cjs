const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
        .replace(/Cinema/g, 'Fandom')
        .replace(/cinema/g, 'fandom')
        .replace(/CINEMA/g, 'FANDOM');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
            // After processing directory contents, check if directory itself needs renaming
            if (file.includes('Cinema') || file.includes('cinema')) {
                const newName = file.replace(/Cinema/g, 'Fandom').replace(/cinema/g, 'fandom');
                const newPath = path.join(dir, newName);
                fs.renameSync(fullPath, newPath);
                console.log(`Renamed directory ${fullPath} to ${newPath}`);
            }
        } else {
            // It's a file
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
                replaceInFile(fullPath);
            }
            // Check if file needs renaming
            if (file.includes('Cinema') || file.includes('cinema')) {
                const newName = file.replace(/Cinema/g, 'Fandom').replace(/cinema/g, 'fandom');
                const newPath = path.join(dir, newName);
                fs.renameSync(fullPath, newPath);
                console.log(`Renamed file ${fullPath} to ${newPath}`);
            }
        }
    }
}

processDirectory(directory);
console.log('Done!');
