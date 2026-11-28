@echo off
rem Liga o site neste computador e abre no navegador. Para desligar, feche a janela do site na barra de tarefas.
cd /d "%~dp0"
start "Site WO - feche esta janela para desligar" /min ".venv\Scripts\python.exe" app.py
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000/#personagem3d"
