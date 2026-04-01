# npm init + .gitignore
git init
npm init -y
cat > .gitignore << 'GITIGNORE'
node_modules/
.env
.DS_Store
GITIGNORE
