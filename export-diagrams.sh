#!/bin/bash

# VPBank K-MULT Agent Studio - Architecture Diagram Export Script
# This script helps manage and export architecture diagrams

echo "🏦 VPBank K-MULT Agent Studio - Architecture Diagram Export"
echo "============================================================"

DIAGRAMS_DIR="./generated-diagrams"

# Check if diagrams directory exists
if [ ! -d "$DIAGRAMS_DIR" ]; then
    echo "❌ Diagrams directory not found: $DIAGRAMS_DIR"
    exit 1
fi

echo "📊 Available Architecture Diagrams:"
echo ""

# List PNG diagrams
echo "🖼️  PNG Diagrams:"
ls -la $DIAGRAMS_DIR/*.png 2>/dev/null | awk '{print "   " $9 " (" $5 " bytes)"}' || echo "   No PNG files found"

echo ""

# List DrawIO diagrams
echo "📐 Draw.io Diagrams:"
ls -la $DIAGRAMS_DIR/*.drawio 2>/dev/null | awk '{print "   " $9 " (" $5 " bytes)"}' || echo "   No .drawio files found"

echo ""
echo "🎯 Key Architecture Diagrams:"
echo "   1. vpbank-kmult-fullstack-architecture.png/.drawio - Complete full-stack system"
echo "   2. vpbank-kmult-strands-enhanced-architecture.png/.drawio - Strands multi-agent system"
echo "   3. vpbank-kmult-high-level-architecture.png/.drawio - High-level AWS ECS Fargate"
echo ""

echo "📋 Usage Instructions:"
echo "   • PNG files: Ready for presentations, documentation, README"
echo "   • .drawio files: Import into draw.io (https://app.diagrams.net) for editing"
echo "   • To edit: Open draw.io → File → Import → Select .drawio file"
echo "   • To export: draw.io → File → Export as → Choose format (PNG, PDF, SVG, etc.)"
echo ""

echo "💡 Draw.io Import Steps:"
echo "   1. Go to https://app.diagrams.net"
echo "   2. Click 'Create New Diagram'"
echo "   3. File → Import → Choose .drawio file"
echo "   4. Edit as needed"
echo "   5. File → Export as → Select desired format"
echo ""

echo "✅ Export completed successfully!"
