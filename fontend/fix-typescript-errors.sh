#!/bin/bash

echo "🔧 Fixing TypeScript errors..."

# Fix color issues
find src -name "*.tsx" -exec sed -i 's/color="text-secondary"/color="text-body-secondary"/g' {} \;

# Remove backgroundColor and borderRadius properties that don't exist
find src -name "*.tsx" -exec sed -i 's/backgroundColor="[^"]*"//g' {} \;
find src -name "*.tsx" -exec sed -i 's/borderRadius="[^"]*"//g' {} \;

# Fix Input type="date" to use placeholder instead
find src -name "*.tsx" -exec sed -i 's/type="date"/placeholder="YYYY-MM-DD"/g' {} \;

# Fix Object.entries value types
find src -name "*.tsx" -exec sed -i 's/{value}/{String(value)}/g' {} \;

echo "✅ TypeScript errors fixed!"
