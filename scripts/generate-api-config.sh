#!/bin/bash

# Generate api-config.json from template if it doesn't exist
# This is used for local development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
CONFIG_FILE="$FRONTEND_DIR/public/api-config.json"
TEMPLATE_FILE="$FRONTEND_DIR/public/api-config.json.template"

# Only generate if the file doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Generating api-config.json from template..."
    
    if [ -f "$TEMPLATE_FILE" ]; then
        cp "$TEMPLATE_FILE" "$CONFIG_FILE"
        echo "Created $CONFIG_FILE from template"
        echo "Note: This file will be updated with the actual API endpoint during deployment"
    else
        # Create a default config if template doesn't exist
        cat > "$CONFIG_FILE" << EOF
{
  "apiEndpoint": "TO_BE_REPLACED",
  "isManaged": true
}
EOF
        echo "Created default $CONFIG_FILE"
    fi
else
    echo "api-config.json already exists, skipping generation"
fi