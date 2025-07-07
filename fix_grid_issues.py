#!/usr/bin/env python3
import os
import re

# Files that need Grid fixes
files_to_fix = [
    "fontend/src/pages/Agents/AgentsPage.tsx",
    "fontend/src/pages/Home/HomePage.tsx", 
    "fontend/src/pages/Settings/SettingsPage.tsx",
    "fontend/src/components/Dashboard/Dashboard.tsx"
]

def fix_grid_imports(content):
    """Fix Grid imports to use Grid2"""
    # Replace Grid import with Grid2 as Grid
    content = re.sub(r'import\s*{([^}]*?)Grid([^}]*?)}\s*from\s*[\'"]@mui/material[\'"];', 
                     r'import {\1Grid2 as Grid\2} from "@mui/material";', content)
    return content

def fix_grid_usage(content):
    """Fix Grid item usage"""
    # Remove 'item' prop from Grid components
    content = re.sub(r'<Grid\s+item\s+', '<Grid ', content)
    return content

def fix_dashboard_percent_issue(content):
    """Fix the percent undefined issue in Dashboard"""
    if "Dashboard.tsx" in content:
        content = re.sub(
            r'label=\{\(\{\s*name,\s*percent\s*\}\)\s*=>\s*`\$\{name\}\s*\$\{\(percent\s*\*\s*100\)\.toFixed\(0\)\}%`\}',
            r'label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}',
            content
        )
    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply fixes
        content = fix_grid_imports(content)
        content = fix_grid_usage(content)
        content = fix_dashboard_percent_issue(content)
        
        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
        else:
            print(f"No changes needed: {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    base_dir = "/home/ubuntu/multi-agent-hackathon/cloned-repo"
    
    for file_path in files_to_fix:
        full_path = os.path.join(base_dir, file_path)
        if os.path.exists(full_path):
            process_file(full_path)
        else:
            print(f"File not found: {full_path}")

if __name__ == "__main__":
    main()
