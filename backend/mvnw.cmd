@echo off
setlocal

set "DIR=%~dp0"
set "MAVEN_VERSION=3.9.9"
set "MAVEN_HOME=%DIR%.mvn\apache-maven-%MAVEN_VERSION%"

if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    goto runMvn
)

echo Maven wrapper not found locally. Downloading Apache Maven %MAVEN_VERSION%...
set "MAVEN_ZIP=%DIR%.mvn\apache-maven-%MAVEN_VERSION%-bin.zip"
if not exist "%DIR%.mvn" mkdir "%DIR%.mvn"

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip', '%MAVEN_ZIP%')"
if %ERRORLEVEL% neq 0 (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip', '%MAVEN_ZIP%')"
)

powershell -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%DIR%.mvn' -Force"
del "%MAVEN_ZIP%"

:runMvn
"%MAVEN_HOME%\bin\mvn.cmd" %*
