const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/admin/AdminDashboardPage.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const newLines = [];
let inConflictBlock = false;
let foundHeadStart = false; // To track the start of the conflict we want to keep

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // We know there's a stray <<<<<<< HEAD at ~551 (which might be blank now)
    // and one at ~742 which we want to keep the CONTENT of (up to =======) but remove the marker.

    if (line.includes('<<<<<<< HEAD')) {
        // This is a conflict start marker.
        // If it's the one at ~742, we just skip the marker line.
        // Same for ~551 if it still exists.
        continue;
    }

    if (line.includes('=======')) {
        // This starts the INCOMING block which we want to DISCARD.
        inConflictBlock = true;
        continue;
    }

    if (line.includes('>>>>>>>')) {
        // This ends the INCOMING block.
        inConflictBlock = false;
        continue;
    }

    if (!inConflictBlock) {
        newLines.push(line);
    }
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Fixed AdminDashboardPage.jsx');
