#!/bin/bash
OUT="project-dump.txt"
cd "$(dirname "$0")"

echo "=== CONNECTLY — PROJECT DUMP ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"
echo "" >> "$OUT"

# 1. Estructura de archivos
echo "========================================" >> "$OUT"
echo "ESTRUCTURA DE ARCHIVOS" >> "$OUT"
echo "========================================" >> "$OUT"
find . -type f \
  ! -path './.git/*' \
  ! -path './.next/*' \
  ! -path './node_modules/*' \
  ! -path './.DS_Store' \
  ! -name '*.lock' \
  ! -name 'tsconfig.tsbuildinfo' \
  | sort >> "$OUT"
echo "" >> "$OUT"

# 2. Git log
echo "========================================" >> "$OUT"
echo "GIT LOG (todos los commits)" >> "$OUT"
echo "========================================" >> "$OUT"
git log --oneline >> "$OUT"
echo "" >> "$OUT"

# 3. package.json
echo "========================================" >> "$OUT"
echo "PACKAGE.JSON" >> "$OUT"
echo "========================================" >> "$OUT"
cat package.json >> "$OUT"
echo "" >> "$OUT"

# 4. Todos los archivos de código fuente
for f in $(find . -type f \
  ! -path './.git/*' \
  ! -path './.next/*' \
  ! -path './node_modules/*' \
  ! -name '.DS_Store' \
  ! -name '*.lock' \
  ! -name 'tsconfig.tsbuildinfo' \
  ! -name 'dump-project.sh' \
  ! -name 'project-dump.txt' \
  | sort); do
  echo "========================================" >> "$OUT"
  echo "FILE: $f" >> "$OUT"
  echo "========================================" >> "$OUT"
  cat "$f" 2>/dev/null >> "$OUT"
  echo "" >> "$OUT"
done

echo "✅ Dump generado en: $(pwd)/$OUT"
wc -l "$OUT" | awk '{print "   " $1 " líneas totales"}'
