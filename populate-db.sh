#!/bin/bash

# AFP Personnel Management System - Database Population Script
# This script sets up and populates the database with realistic test data

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            print_error "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
        print_success "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
}

# Function to check if MongoDB is running
check_mongodb() {
    if command_exists mongo || command_exists mongosh; then
        print_info "MongoDB CLI tools found"
        
        # Try to connect to MongoDB
        if mongo --eval "db.runCommand('ping')" >/dev/null 2>&1 || mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is running and accessible"
            return 0
        else
            print_warning "MongoDB is not running or not accessible"
            return 1
        fi
    else
        print_warning "MongoDB CLI tools not found"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_info "Checking and installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies..."
        npm install
    else
        print_info "Node.js dependencies already installed"
    fi
    
    # Check if required packages are installed
    if ! npm list mongodb >/dev/null 2>&1; then
        print_info "Installing MongoDB driver..."
        npm install mongodb
    fi
    
    if ! npm list bcryptjs >/dev/null 2>&1; then
        print_info "Installing bcryptjs..."
        npm install bcryptjs
    fi
    
    print_success "Dependencies are ready"
}

# Function to backup existing data
backup_existing_data() {
    if [ "$USE_JSON_FALLBACK" = "true" ]; then
        if [ -d "afp_personnel_db" ]; then
            BACKUP_DIR="afp_personnel_db_backup_$(date +%Y%m%d_%H%M%S)"
            print_info "Creating backup of existing JSON data: $BACKUP_DIR"
            cp -r afp_personnel_db "$BACKUP_DIR"
            print_success "Backup created: $BACKUP_DIR"
        fi
    else
        print_info "Creating MongoDB backup..."
        BACKUP_DIR="mongodb_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        if command_exists mongodump; then
            mongodump --db afp_personnel_db --out "$BACKUP_DIR" >/dev/null 2>&1 || {
                print_warning "MongoDB backup failed, but continuing..."
            }
        else
            print_warning "mongodump not found, skipping backup"
        fi
    fi
}

# Function to populate database
populate_database() {
    print_info "Starting database population..."
    
    # Set environment variables
    export NODE_ENV=${NODE_ENV:-development}
    export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/afp_personnel_db}
    export USE_JSON_FALLBACK=${USE_JSON_FALLBACK:-false}
    
    print_info "Configuration:"
    print_info "  - Node Environment: $NODE_ENV"
    print_info "  - MongoDB URI: $MONGODB_URI"
    print_info "  - Use JSON Fallback: $USE_JSON_FALLBACK"
    
    # Run the population script
    if [ -f "scripts/populate-database.js" ]; then
        node scripts/populate-database.js
        print_success "Database population completed!"
    else
        print_error "Population script not found: scripts/populate-database.js"
        exit 1
    fi
}

# Function to verify population
verify_population() {
    print_info "Verifying database population..."
    
    if [ "$USE_JSON_FALLBACK" = "true" ]; then
        if [ -d "afp_personnel_db" ]; then
            file_count=$(find afp_personnel_db -name "*.json" | wc -l)
            print_success "Found $file_count JSON database files"
            
            # Check some key files
            if [ -f "afp_personnel_db/afp_personnel_db.users.json" ]; then
                user_count=$(grep -o '"_id"' afp_personnel_db/afp_personnel_db.users.json | wc -l)
                print_info "Users populated: $user_count"
            fi
            
            if [ -f "afp_personnel_db/afp_personnel_db.trainings.json" ]; then
                training_count=$(grep -o '"_id"' afp_personnel_db/afp_personnel_db.trainings.json | wc -l)
                print_info "Trainings populated: $training_count"
            fi
        else
            print_error "JSON database directory not found"
            exit 1
        fi
    else
        # For MongoDB, we could add verification queries here
        print_info "MongoDB population verification would require additional queries"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --json-fallback    Use JSON files instead of MongoDB"
    echo "  --mongodb-uri URI  MongoDB connection string (default: mongodb://localhost:27017/afp_personnel_db)"
    echo "  --no-backup        Skip creating backup of existing data"
    echo "  --help             Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  MONGODB_URI        MongoDB connection string"
    echo "  USE_JSON_FALLBACK  Set to 'true' to use JSON files"
    echo "  NODE_ENV           Node environment (default: development)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Use MongoDB with default settings"
    echo "  $0 --json-fallback           # Use JSON files"
    echo "  $0 --mongodb-uri mongodb://user:pass@host:port/db"
    echo "  USE_JSON_FALLBACK=true $0    # Use environment variable"
}

# Main execution
main() {
    # Default values
    USE_JSON_FALLBACK=${USE_JSON_FALLBACK:-false}
    MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/afp_personnel_db}
    CREATE_BACKUP=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --json-fallback)
                USE_JSON_FALLBACK=true
                shift
                ;;
            --mongodb-uri)
                MONGODB_URI="$2"
                shift 2
                ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Export variables for the Node.js script
    export USE_JSON_FALLBACK
    export MONGODB_URI
    
    print_info "AFP Personnel Management System - Database Population"
    print_info "================================================="
    
    # Pre-flight checks
    check_node_version
    
    if [ "$USE_JSON_FALLBACK" = "false" ]; then
        if ! check_mongodb; then
            print_warning "MongoDB not accessible. Switching to JSON fallback mode."
            USE_JSON_FALLBACK=true
            export USE_JSON_FALLBACK
        fi
    fi
    
    install_dependencies
    
    # Create backup if requested
    if [ "$CREATE_BACKUP" = "true" ]; then
        backup_existing_data
    fi
    
    # Populate database
    populate_database
    
    # Verify population
    verify_population
    
    print_success "Database population completed successfully!"
    print_info "You can now start your application with: npm run dev"
    
    if [ "$USE_JSON_FALLBACK" = "true" ]; then
        print_info "Note: Using JSON file database. Data is stored in 'afp_personnel_db/' directory"
    fi
}

# Run main function with all arguments
main "$@"

