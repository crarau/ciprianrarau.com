#!/bin/bash

# Process Mermaid Diagrams Script
# Converts all mermaid diagrams in blog posts to images

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Processing Mermaid Diagrams${NC}"
echo -e "${BLUE}================================${NC}\n"

# Change to the ciprianrarau-site directory if not already there
if [[ ! -f "package.json" ]]; then
  if [[ -d "ciprianrarau-site" ]]; then
    cd ciprianrarau-site
    echo -e "${YELLOW}📁 Changed to ciprianrarau-site directory${NC}\n"
  else
    # We might already be in the right directory
    if [[ ! -f "scripts/process-mermaid-diagrams.cjs" ]]; then
      echo -e "${RED}❌ Error: Could not find process-mermaid-diagrams.cjs${NC}"
      echo -e "${RED}   Make sure you're running this from the project root${NC}"
      exit 1
    fi
  fi
fi

# Check if Node.js script exists
if [[ ! -f "scripts/process-mermaid-diagrams.cjs" ]]; then
  echo -e "${RED}❌ Error: process-mermaid-diagrams.cjs not found${NC}"
  exit 1
fi

# Parse command line arguments
ARGS=""
for arg in "$@"; do
  case $arg in
    --force)
      ARGS="$ARGS --force"
      echo -e "${YELLOW}⚡ Force regeneration mode enabled${NC}"
      ;;
    --help|-h)
      echo -e "${BLUE}Usage: $0 [options]${NC}"
      echo -e "${BLUE}Options:${NC}"
      echo -e "${BLUE}  --force    Force regeneration of all diagrams${NC}"
      echo -e "${BLUE}  --help     Show this help message${NC}"
      exit 0
      ;;
  esac
done

# Run the Node.js script
echo -e "${GREEN}🔄 Running mermaid diagram processor...${NC}\n"
node scripts/process-mermaid-diagrams.cjs $ARGS

echo -e "\n${GREEN}✅ Mermaid diagram processing complete!${NC}"
echo -e "${BLUE}💡 Tip: You can also run this with: npm run process-mermaid${NC}"