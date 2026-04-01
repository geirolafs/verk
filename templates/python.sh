# Python with venv + .gitignore
git init
python3 -m venv .venv
cat > .gitignore << 'GITIGNORE'
.venv/
__pycache__/
*.pyc
.env
.DS_Store
GITIGNORE
