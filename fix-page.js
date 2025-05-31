const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'src', 'app', 'trainings', 'page.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic condition
const oldCondition = `if (!userId || (!attendee.userData?.firstName && !attendee.userData?.lastName && !attendee.userData?.fullName)) {
                                    return false;
                                  }`;
const newCondition = `if (!userId) {
                                    return false;
                                  }`;

content = content.replace(oldCondition, newCondition);

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fix applied successfully'); 