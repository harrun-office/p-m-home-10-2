const fs = require('fs');
const path = require('path');

// Use absolute path or relative to Cwd
const filePath = 'client/src/pages/admin/AdminDashboardPage.jsx';
console.log(`Reading file from: ${path.resolve(filePath)}`);

try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`File read. Size: ${content.length} bytes.`);

    const lines = content.split(/\r?\n/); // Split handling \r\n or \n
    console.log(`Total lines: ${lines.length}`);

    const newLines = [];
    let inConflictBlock = false;
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for markers. Use includes to be safe against trailing whitespace.
        if (line.includes('<<<<<<< HEAD')) {
            console.log(`Found HEAD start at line ${i + 1}. Removing.`);
            removedCount++;
            continue;
        }

        if (line.includes('=======')) {
            console.log(`Found DIVIDER at line ${i + 1}. Starting discard.`);
            inConflictBlock = true;
            continue;
        }

        if (line.includes('>>>>>>>')) {
            console.log(`Found BLOCK END at line ${i + 1}. Ending discard.`);
            inConflictBlock = false;
            continue;
        }

        if (!inConflictBlock) {
            newLines.push(line);
        } else {
            // We are inside the discard block
            // console.log(`Discarding line ${i + 1}`);
        }
    }

    const newContent = newLines.join('\n'); // Write with \n (or \r\n if preferred, but \n is fine)
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed AdminDashboardPage.jsx. Removed ${removedCount} HEAD markers. New line count: ${newLines.length}`);

} catch (err) {
    console.error('Error:', err);
}
