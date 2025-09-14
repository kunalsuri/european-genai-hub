#!/bin/bash

# 🚀 European GenAI Hub - Development Testing Script
# 🎯 Comprehensive codebase validation and browser testing
# 📅 Created: $(date +"%Y-%m-%d")
# 🔧 Usage: ./codebase-dev-run.sh

# Don't exit on errors - we want to continue testing even if some fail
set +e

# 🎨 Color definitions for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 📊 Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PID=""
SERVER_PORT=8080
TEST_RESULTS=()
FAILED_TESTS=0
TOTAL_TESTS=0

# 🎭 Helper functions for pretty output
print_header() {
    echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}  🚀 European GenAI Hub - Development Test Suite 🚀         ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_section() {
    echo -e "\n${CYAN}🔍 $1${NC}"
    echo -e "${CYAN}$(printf '─%.0s' {1..60})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    TEST_RESULTS+=("✅ $1")
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    TEST_RESULTS+=("❌ $1")
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 🧹 Cleanup and server management functions
cleanup() {
    if [[ -n "$SERVER_PID" ]]; then
        print_info "Stopping development server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
}

# 🔄 Kill any existing servers on our port
kill_existing_server() {
    print_info "Checking for existing servers on port $SERVER_PORT..."
    local existing_pid=$(lsof -ti:$SERVER_PORT 2>/dev/null || true)
    if [[ -n "$existing_pid" ]]; then
        print_info "Killing existing server (PID: $existing_pid)..."
        kill -9 $existing_pid 2>/dev/null || true
        sleep 1
        print_success "Existing server stopped"
    else
        print_info "No existing server found on port $SERVER_PORT"
    fi
}

# 🎯 Set up cleanup trap
trap cleanup EXIT

# 📋 File structure validation
validate_file_structure() {
    print_section "File Structure Validation"
    
    # 📁 Required directories
    local required_dirs=("css" "js" "data" "pages" "resources")
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            print_success "Directory exists: $dir/"
        else
            print_error "Missing directory: $dir/"
        fi
    done
    
    # 📄 Core HTML files
    local html_files=("index.html" "models.html" "models-europe.html" "models-uk.html" "models-switzerland.html")
    for file in "${html_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "HTML file exists: $file"
        else
            print_error "Missing HTML file: $file"
        fi
    done
    
    # 🎨 CSS files
    local css_files=("css/style.css" "css/models-shared.css")
    for file in "${css_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "CSS file exists: $file"
        else
            print_error "Missing CSS file: $file"
        fi
    done
    
    # ⚡ JavaScript files
    local js_files=("js/main.js" "js/init.js" "js/content-loader.js" "js/models-shared.js")
    for file in "${js_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "JavaScript file exists: $file"
        else
            print_error "Missing JavaScript file: $file"
        fi
    done
}

# 🔍 JSON data validation
validate_json_data() {
    print_section "JSON Data Validation"
    
    local json_files=("data/featured-initiatives.json" "data/institutions.json" "data/models.json" "data/projects.json" "data/research-areas.json" "data/resources.json")
    
    for file in "${json_files[@]}"; do
        if [[ -f "$file" ]]; then
            if python3 -m json.tool "$file" >/dev/null 2>&1; then
                print_success "Valid JSON: $file"
            else
                print_error "Invalid JSON syntax: $file"
            fi
        else
            print_error "Missing JSON file: $file"
        fi
    done
}

# 🔒 Security headers validation
validate_security_headers() {
    print_section "Security Headers Validation"
    
    local html_files=("index.html" "models.html" "models-europe.html" "models-uk.html" "models-switzerland.html")
    
    for file in "${html_files[@]}"; do
        if [[ -f "$file" ]]; then
            # Check for CSP header
            if grep -q "Content-Security-Policy" "$file"; then
                print_success "CSP header found in: $file"
            else
                print_error "Missing CSP header in: $file"
            fi
            
            # Check for other security headers
            local security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
            for header in "${security_headers[@]}"; do
                if grep -q "$header" "$file"; then
                    print_success "$header found in: $file"
                else
                    print_warning "$header missing in: $file"
                fi
            done
        fi
    done
}

# 🌐 Start development server
start_dev_server() {
    print_section "Development Server Setup"
    
    # Kill any existing server first
    kill_existing_server
    
    print_info "Starting fresh Python HTTP server on port $SERVER_PORT..."
    python3 -m http.server $SERVER_PORT >/dev/null 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_success "Development server started (PID: $SERVER_PID)"
        print_success "Server URL: http://localhost:$SERVER_PORT"
    else
        print_error "Failed to start development server"
        return 1
    fi
}

# 🔗 HTTP endpoint testing
test_http_endpoints() {
    print_section "HTTP Endpoint Testing"
    
    local base_url="http://localhost:$SERVER_PORT"
    local endpoints=("/" "/models.html" "/models-europe.html" "/models-uk.html" "/models-switzerland.html")
    
    for endpoint in "${endpoints[@]}"; do
        local url="$base_url$endpoint"
        if curl -s -f -o /dev/null "$url"; then
            print_success "HTTP 200: $endpoint"
        else
            print_error "HTTP error: $endpoint"
        fi
    done
    
    # Test static assets
    local assets=("/css/style.css" "/css/models-shared.css" "/js/main.js" "/js/models-shared.js")
    for asset in "${assets[@]}"; do
        local url="$base_url$asset"
        if curl -s -f -o /dev/null "$url"; then
            print_success "Asset loads: $asset"
        else
            print_error "Asset failed: $asset"
        fi
    done
}

# 🎯 HTML validation
validate_html_syntax() {
    print_section "HTML Syntax Validation"
    
    # Check if HTML Tidy is available
    if command -v tidy >/dev/null 2>&1; then
        local html_files=("index.html" "models.html" "models-europe.html" "models-uk.html" "models-switzerland.html")
        
        for file in "${html_files[@]}"; do
            if [[ -f "$file" ]]; then
                if tidy -q -e "$file" >/dev/null 2>&1; then
                    print_success "Valid HTML: $file"
                else
                    print_warning "HTML warnings in: $file (run 'tidy $file' for details)"
                fi
            fi
        done
    else
        print_warning "HTML Tidy not installed. Install with: brew install tidy-html5"
    fi
}

# 🚀 Browser automation testing
test_browser_functionality() {
    print_section "Browser Functionality Testing"
    
    local base_url="http://localhost:$SERVER_PORT"
    
    # Test if we can open browser (macOS)
    if command -v open >/dev/null 2>&1; then
        print_info "Opening browser for manual testing..."
        open "$base_url" 2>/dev/null || print_warning "Could not open browser automatically"
        print_success "Browser test initiated - please verify manually"
    else
        print_info "Manual browser test required: $base_url"
    fi
    
    # Basic curl tests for JavaScript and CSS loading
    if curl -s "$base_url" | grep -q "models-shared.css"; then
        print_success "CSS references found in HTML"
    else
        print_error "CSS references missing in HTML"
    fi
    
    if curl -s "$base_url/models.html" | grep -q "models-shared.js"; then
        print_success "JavaScript references found in models pages"
    else
        print_error "JavaScript references missing in models pages"
    fi
}

# 📊 Performance checks
check_performance() {
    print_section "Performance Analysis"
    
    local base_url="http://localhost:$SERVER_PORT"
    
    # Check file sizes
    local large_files=()
    while IFS= read -r -d '' file; do
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        if [[ $size -gt 1048576 ]]; then  # > 1MB
            large_files+=("$file ($(($size / 1024))KB)")
        fi
    done < <(find . -name "*.html" -o -name "*.css" -o -name "*.js" -print0)
    
    if [[ ${#large_files[@]} -eq 0 ]]; then
        print_success "All files under 1MB - good for performance"
    else
        for file in "${large_files[@]}"; do
            print_warning "Large file detected: $file"
        done
    fi
    
    # Test response times
    local start_time=$(date +%s%N)
    curl -s -o /dev/null "$base_url"
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    if [[ $response_time -lt 500 ]]; then
        print_success "Fast response time: ${response_time}ms"
    elif [[ $response_time -lt 1000 ]]; then
        print_warning "Moderate response time: ${response_time}ms"
    else
        print_error "Slow response time: ${response_time}ms"
    fi
}

# 📊 Generate test report
generate_report() {
    print_section "Test Summary Report"
    
    echo -e "\n${WHITE}📊 Test Results Summary:${NC}"
    echo -e "${GREEN}✅ Passed: $((TOTAL_TESTS - FAILED_TESTS))${NC}"
    echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"
    echo -e "${BLUE}📈 Total:  $TOTAL_TESTS${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "\n${GREEN}🎉 All tests passed! Your codebase is ready for deployment! 🚀${NC}"
    else
        echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
        echo -e "\n${WHITE}Failed Tests:${NC}"
        for result in "${TEST_RESULTS[@]}"; do
            if [[ $result == ❌* ]]; then
                echo -e "  $result"
            fi
        done
    fi
    
    echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    🔗 CLICKABLE LINKS 🔗                     ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${CYAN}🌐 Main Site:${NC}        ${WHITE}http://localhost:$SERVER_PORT${NC}"
    echo -e "${CYAN}🌍 EU Region:${NC}        ${WHITE}http://localhost:$SERVER_PORT/#eu-region${NC}"
    echo -e "${CYAN}🇬🇧 UK Region:${NC}        ${WHITE}http://localhost:$SERVER_PORT/#uk-region${NC}"
    echo -e "${CYAN}🇨🇭 Swiss Region:${NC}     ${WHITE}http://localhost:$SERVER_PORT/#swiss-region${NC}"
    
    # Try to open browser automatically
    echo -e "\n${BLUE}🚀 Opening browser automatically...${NC}"
    if command -v open >/dev/null 2>&1; then
        open "http://localhost:$SERVER_PORT" 2>/dev/null && print_success "Browser opened!" || print_warning "Could not open browser automatically"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:$SERVER_PORT" 2>/dev/null && print_success "Browser opened!" || print_warning "Could not open browser automatically"
    else
        print_info "Please manually open: http://localhost:$SERVER_PORT"
    fi
}

# 🎬 Main execution flow
main() {
    clear
    print_header
    
    print_info "Starting comprehensive codebase validation..."
    print_info "Working directory: $SCRIPT_DIR"
    
    # Run all validation steps
    validate_file_structure
    validate_json_data
    validate_security_headers
    validate_html_syntax
    start_dev_server
    
    if [[ -n "$SERVER_PID" ]] || lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        test_http_endpoints
        test_browser_functionality
        check_performance
    else
        print_error "Cannot run web tests - server not running"
    fi
    
    generate_report
    
    # Keep server running for manual testing
    if [[ -n "$SERVER_PID" ]] && kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "\n${GREEN}🔄 Development server is running and ready!${NC}"
        echo -e "${BLUE}📱 Test your application in the browser now!${NC}"
        echo -e "${YELLOW}💡 Press Ctrl+C to stop the server when done.${NC}"
        
        # Wait for user interrupt
        while true; do
            sleep 1
        done
    else
        echo -e "\n${RED}❌ Server not running. Please check the errors above.${NC}"
        exit 1
    fi
}

# 🚀 Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
