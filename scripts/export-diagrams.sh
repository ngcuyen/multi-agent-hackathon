#!/bin/bash

# VPBank K-MULT Agent Studio - Architecture Diagram Export Script
# This script helps manage and export architecture diagrams

echo "🏦 VPBank K-MULT Agent Studio - Architecture Diagram Export"
echo "============================================================"

DIAGRAMS_DIR="./docs/architecture"

# Check if diagrams directory exists
if [ ! -d "$DIAGRAMS_DIR" ]; then
    echo "❌ Diagrams directory not found: $DIAGRAMS_DIR"
    exit 1
fi

echo "📊 Current Architecture Diagrams (v3.0 - Latest):"
echo ""

# List PNG diagrams (current only)
echo "🖼️  PNG Diagrams:"
ls -la $DIAGRAMS_DIR/vpbank-kmult-*.png 2>/dev/null | awk '{print "   " $9 " (" $5 " bytes)"}' || echo "   No PNG files found"

echo ""

# List DrawIO diagrams (current only)
echo "📐 Draw.io Diagrams:"
ls -la $DIAGRAMS_DIR/vpbank-kmult-*.drawio 2>/dev/null | awk '{print "   " $9 " (" $5 " bytes)"}' || echo "   No .drawio files found"

echo ""
echo "🎯 Current Architecture Diagrams (3 Latest):"
echo "   1. vpbank-kmult-fullstack-architecture.png/.drawio - Complete full-stack system"
echo "   2. vpbank-kmult-strands-enhanced-architecture.png/.drawio - Strands multi-agent system"
echo "   3. vpbank-kmult-high-level-architecture.png/.drawio - High-level AWS ECS Fargate"
echo ""

echo "📋 Legacy Architectures:"
LEGACY_COUNT=$(ls -1 $DIAGRAMS_DIR/legacy-architectures/ 2>/dev/null | wc -l)
echo "   • $LEGACY_COUNT archived diagrams in docs/architecture/legacy-architectures/"
echo "   • Previous versions (v1.x, v2.x) available for reference"
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

echo "🎯 Architecture Selection Guide:"
echo "   • Executive Presentation: Use Full-Stack Architecture"
echo "   • Technical Deep Dive: Use Strands-Enhanced Architecture"
echo "   • Infrastructure Planning: Use High-Level AWS Architecture"
echo "   • Complete Reference: docs/architecture/README.md"
echo ""

echo "🏗️ Project Structure:"
echo "   • Architecture diagrams: docs/architecture/"
echo "   • Source code: src/"
echo "   • Configuration: config/"
echo "   • Scripts: scripts/"
echo "   • Tests: tests/"
echo "   • Deployments: deployments/"
echo ""

echo "✅ Export completed successfully!"
echo "📐 For detailed architecture guide: cat docs/architecture/README.md"
