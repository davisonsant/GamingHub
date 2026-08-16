; ==============================================================================
; GamingHub - NSIS Custom Installer Script
; ==============================================================================
; Why this script is necessary:
; When upgrading or installing, the standard NSIS installer from electron-builder
; performs a check to see if the application ("GamingHub.exe") is currently running.
; 
; Even after the main Electron process exits gracefully (via app.exit(0) in our
; server-side auto-updater route), Chromium's auxiliary processes (such as the
; GPU process, network/utility processes, and especially the crashpad-handler process)
; can remain alive in the background. The crashpad-handler is designed by Chromium
; to persist specifically to report post-exit issues.
;
; Since all of these helpers share the same executable filename ("GamingHub.exe"),
; the NSIS installer's default check finds them and shows a blocking popup:
; "Não é possível fechar o GamingHub. Feche a janela do GamingHub e clique em Repetir para continuar."
;
; By intercepting the installer startup with the 'customInit' macro, we can
; forcefully terminate any remaining processes matching our executable name
; (using taskkill /F /IM ... /T) and pause briefly to let Windows release file locks.
; This guarantees a smooth, silent, and error-free update process.
; ==============================================================================

!macro customInit
  DetailPrint "Encerando processos auxiliares do GamingHub..."
  
  ; nsExec::Exec runs the command silently without flashing a command prompt window
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  
  ; Sleep for 1 second to ensure that the OS releases all file handles/locks completely
  Sleep 1000
!macroend
