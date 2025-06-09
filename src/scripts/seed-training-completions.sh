#!/bin/bash

# Script to seed training completion data

# Navigate to the project root directory
cd "$(dirname "$0")/.."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Run the seed script
echo "Seeding training completion data..."
node src/scripts/seed-training-completions.js

# Check if the script executed successfully
if [ $? -eq 0 ]; then
    echo "Training completion data seeded successfully!"
else
    echo "Failed to seed training completion data."
    exit 1
fi

exit 0 